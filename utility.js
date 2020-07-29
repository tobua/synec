import { join, normalize } from 'path'
import { readFileSync, readdirSync, unlinkSync, copyFileSync } from 'fs'
import childProcess from 'child_process'
import chokidar from 'chokidar'
import parseIgnore from 'parse-gitignore'

const getPackageJson = (packagePath = '') => {
  const packageJsonPath = join(process.cwd(), packagePath, 'package.json')

  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  } catch (error) {
    console.log(
      `synec: Error unable to load package.json from ${packageJsonPath}.`
    )
  }
}

export const getLocalDependencies = () => {
  const { localDependencies } = getPackageJson()

  if (!localDependencies) {
    return false
  }

  // Only Objects and Arrays
  if (typeof localDependencies !== 'object') {
    return false
  }

  // Array or object needs at least one entry
  if (Array.isArray(localDependencies)) {
    if (localDependencies.length < 1) {
      return false
    }
  } else {
    if (Object.keys(localDependencies).length < 1) {
      return false
    }
  }

  // We only need the paths to the packages
  if (Array.isArray(localDependencies)) {
    return localDependencies
  }

  // Convert object to path array
  return Object.keys(localDependencies).map((name) => localDependencies[name])
}

export const installWithoutSave = async (packagePaths) => {
  // Without newline at first, so that this line will be overridden on success.
  process.stdout.write('synec: Installing localDependencies...')

  const tarballs = packagePaths
    .map((path) => `$(npm pack ${path} | tail -1)`)
    .join(' ')

  childProcess.execSync(`npm install --no-save ${tarballs}`, {
    // Silences console output.
    stdio: 'ignore',
  })

  // TODO ctrl c, bzw SIGTERM ignored during install.

  readdirSync(process.cwd())
    .filter((filePath) => filePath.endsWith('.tgz'))
    .map((filePath) => unlinkSync(filePath))

  // Removes previous log.
  process.stdout.clearLine()
  process.stdout.cursorTo(0)

  console.log('synec: localDependencies installed!')
}

const loadAndParseNpmIgnore = (packagePath) => {
  try {
    return parseIgnore(
      readFileSync(join(process.cwd(), packagePath, '.npmignore'), 'utf8')
    )
  } catch (_) {}
}

const getWatchPaths = (packagePath) => {
  // npm dotdir-regex / dotfile-regex
  const dotDirRegex = /(?:^|[\\\/])(\.(?!\.)[^\\\/]+)[\\\/]/
  const dotFileRegex = /(?:^|[\\\/])(\.(?!\.)[^\\\/]+)$/
  const alwaysIgnored = [/node_modules/, dotDirRegex, dotFileRegex]
  const { files, main } = getPackageJson(packagePath)
  const npmIgnore = loadAndParseNpmIgnore(packagePath)

  const filesMissing = !files || !Array.isArray(files) || files.length < 1
  const npmIgnoreMissing =
    !npmIgnore || !Array.isArray(npmIgnore) || npmIgnore.length < 1

  if (filesMissing && npmIgnoreMissing) {
    console.log(
      'synec: Warning "files" entry in package.json or .npmignore file missing. Add it to prevent publishing unnecessary files to npm.'
    )
    return ['.', alwaysIgnored]
  }

  // package.json and main are always included by npm.
  let filesToInclude = ['package.json']

  if (main) {
    try {
      filesToInclude.push(normalize(main))
    } catch (_) {}
  }

  let filesToIgnore = []

  // Preferring files over npmignore.
  if (!filesMissing) {
    filesToInclude = filesToInclude.concat(files)
  } else {
    filesToInclude = ['.']
    filesToIgnore = filesToIgnore.concat(npmIgnore)
  }

  filesToIgnore = filesToIgnore.concat(alwaysIgnored)

  return [filesToInclude, filesToIgnore]
}

export const watchLocalDependencies = (packagePaths) => {
  const watchers = packagePaths.map((packagePath) => {
    const [includedPaths, ignoredPaths] = getWatchPaths(packagePath)

    return chokidar.watch(includedPaths, {
      // Watching node_modules is unnecessary, dot-stuff should be ignored anyways.
      ignored: ignoredPaths,
      // Files already there have been copied by installation.
      ignoreInitial: true,
      // The packagePath will be the CWD to watch from.
      cwd: packagePath,
    })
  })

  const copyFile = (filePath) => {
    console.log(`synec: copying ${filePath}`)
    const destinationPath = filePath.replace(/^\.\./, 'node_modules')
    try {
      copyFileSync(filePath, destinationPath)
    } catch (_) {}
  }

  const removeFile = (filePath) => {
    console.log(`synec: removing ${filePath}`)
    try {
      unlinkSync(filePath)
    } catch (_) {}
  }

  watchers.forEach((watcher) =>
    watcher.on('add', copyFile).on('change', copyFile).on('unlink', removeFile)
  )
}

/*

Previous unsuccessful approaches, kept as reference for upcoming features:

export const installLocalDependency = async (name, packagePath) => {
  console.log(`synec: Installing ${name} from ${packagePath}.`)

  const tarballPath = join(process.cwd(), `${name}.tgz`)
  const destinationPackagePath = join(process.cwd(), 'node_modules', name)

  await pacote.tarball.file(packagePath, tarballPath)
  await pacote.extract(tarballPath, destinationPackagePath)
  unlinkSync(tarballPath)
  console.log('unlinked')
}

export const installDependenciesIfMissing = async (name, packagePath) => {
  const manifest = await pacote.manifest(packagePath)
  console.log(`synec: Installing dependencies for ${name}.`)

  const dependencies = manifest.dependencies || {}
  const peerDependencies = manifest.peerDependencies || {}

  const requiredDependencies = Object.assign(dependencies, peerDependencies)

  for (const name of Object.keys(requiredDependencies)) {
    const version = requiredDependencies[name]
    const isInstalled = await isDependencyInstalledLocally(name, version)

    if (!isInstalled) {
      console.log('now installing', name)
      childProcess.execSync(`npm install --no-save ${name}@${version}`)
      console.log('installation done', name)
    } else {
      console.log('already installed', name)
    }
  }
}

export const isDependencyInstalledLocally = async (packageName, version) => {
  const packagePath = join(process.cwd(), 'node_modules', packageName)
  let manifest

  try {
    manifest = await pacote.manifest(packagePath)
  } catch (error) {
    return false
  }

  return semver.satisfies(manifest.version, version)
}

*/
