import { join, normalize } from 'path'
import {
  readFileSync,
  readdirSync,
  unlinkSync,
  copyFileSync,
  existsSync,
  writeFileSync,
} from 'fs'
import childProcess from 'child_process'
import chokidar from 'chokidar'
import parseIgnore from 'parse-gitignore'
import { create } from 'logua'
import checkDependencies from 'check-dependencies'
import { hashElement } from 'folder-hash'

export const log = create('synec', 'yellow')

const getPackageJson = (packagePath = '') => {
  const packageJsonPath = join(process.cwd(), packagePath, 'package.json')

  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  } catch (error) {
    return log(`Unable to load package.json from ${packageJsonPath}`, 'error')
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
  } else if (Object.keys(localDependencies).length < 1) {
    return false
  }

  // We only need the paths to the packages
  if (Array.isArray(localDependencies)) {
    return localDependencies
  }

  // Convert object to path array
  return Object.keys(localDependencies).map((name) => localDependencies[name])
}

const appDependenciesInstalled = () => {
  const hasNodeModules = existsSync(join(process.cwd(), 'node_modules'))
  const hasLockFile = existsSync(join(process.cwd(), 'package-lock.json'))

  if (!hasNodeModules || !hasLockFile) {
    log('Dependencies not installed: installing')
    return false
  }

  const { depsWereOk } = checkDependencies.sync({
    packageDir: process.cwd(),
    verbose: false,
  })

  if (!depsWereOk) {
    log('Dependencies out-of-date: reinstalling')
  }

  return depsWereOk
}

export const installAppDependencies = () => {
  if (appDependenciesInstalled()) {
    return
  }

  childProcess.execSync(`npm install`, {
    cwd: process.cwd(),
    // Silences console output.
    stdio: 'ignore',
  })
}

const generateHash = async (packagePath) => {
  const { name } = JSON.parse(
    readFileSync(join(process.cwd(), packagePath, 'package.json'))
  )

  const hashFilePath = join(process.cwd(), 'node_modules', name, '.synec-hash')

  const { hash } = await hashElement(join(process.cwd(), packagePath), {
    folders: {
      exclude: ['node_modules', 'test', '.*'],
    },
    files: {
      include: ['*.js', '**/*.js'],
    },
  })

  writeFileSync(hashFilePath, hash)
}

const packageNeedsUpdate = async (packagePath) => {
  const { name } = JSON.parse(
    readFileSync(join(process.cwd(), packagePath, 'package.json'))
  )

  if (!existsSync(join(process.cwd(), 'node_modules', name))) {
    return true
  }

  const hashFilePath = join(process.cwd(), 'node_modules', name, '.synec-hash')

  const { hash } = await hashElement(join(process.cwd(), packagePath), {
    folders: {
      exclude: ['node_modules', 'test', '.*'],
    },
    files: {
      include: ['*.js', '**/*.js'],
    },
  })

  let cachedHash

  if (existsSync(hashFilePath)) {
    cachedHash = readFileSync(hashFilePath, 'utf8')
  }

  return !cachedHash || cachedHash !== hash
}

const installTarballs = async (pathsToUpdate) => {
  const tarballs = pathsToUpdate
    .map((path) => `$(npm pack ${path} | tail -1)`)
    .join(' ')

  // Will prune unlisted tarballs or dependencies https://github.com/npm/npm/issues/16853
  childProcess.execSync(`npm install --no-save ${tarballs}`, {
    cwd: process.cwd(),
    // Silences console output.
    stdio: 'ignore',
  })

  // TODO ctrl c, bzw SIGTERM ignored during install.

  readdirSync(process.cwd())
    .filter((filePath) => filePath.endsWith('.tgz'))
    .map((filePath) => unlinkSync(join(process.cwd(), filePath)))

  return Promise.all(pathsToUpdate.map(generateHash))
}

export const installWithoutSave = async (packagePaths) => {
  // Without newline at first, so that this line will be overridden on success.
  process.stdout.write('Installing localDependencies...')

  let pathsToUpdate = await Promise.all(packagePaths.map(packageNeedsUpdate))
  pathsToUpdate = packagePaths.filter((_, index) => pathsToUpdate[index])

  // If one package is out of date we have to install the others again as well
  // otherwise they'll be pruned from node_modules.
  if (pathsToUpdate.length !== 0) {
    await installTarballs(packagePaths)
  }

  // Removes previous log.
  process.stdout.clearLine()
  process.stdout.cursorTo(0)

  log('localDependencies installed')
}

const loadAndParseNpmIgnore = (packagePath) => {
  try {
    return parseIgnore(
      readFileSync(join(process.cwd(), packagePath, '.npmignore'), 'utf8')
    )
  } catch (_) {
    // Ignored
    return null
  }
}

export const getWatchPaths = (packagePath) => {
  // npm dotdir-regex / dotfile-regex
  const dotDirRegex = /(?:^|[\\/])(\.(?!\.)[^\\/]+)[\\/]/
  const dotFileRegex = /(?:^|[\\/])(\.(?!\.)[^\\/]+)$/
  const alwaysIgnored = [/node_modules/, dotDirRegex, dotFileRegex]
  const { files, main, name } = getPackageJson(packagePath)
  const npmIgnore = loadAndParseNpmIgnore(packagePath)

  const filesMissing = !files || !Array.isArray(files) || files.length < 1
  const npmIgnoreMissing =
    !npmIgnore || !Array.isArray(npmIgnore) || npmIgnore.length < 1

  if (filesMissing && npmIgnoreMissing) {
    log(
      '"files" entry in package.json or .npmignore file missing. Add it to prevent publishing unnecessary files to npm',
      'warning'
    )
    return ['.', alwaysIgnored, name]
  }

  // package.json and main are always included by npm.
  // README/CHANGELOG files not required for this plugin to work properly.
  let filesToInclude = ['package.json']

  if (main) {
    try {
      filesToInclude.push(normalize(main))
    } catch (_) {
      // Ignore
    }
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

  return [filesToInclude, filesToIgnore, name]
}

export const watchLocalDependencies = (packagePaths) => {
  const destinationPackages = new Map()
  const watchers = packagePaths.map((packagePath) => {
    const [includedPaths, ignoredPaths, name] = getWatchPaths(packagePath)
    const absolutePackagePath = join(process.cwd(), packagePath)
    const absoluteDestinationPath = join(process.cwd(), `node_modules/${name}`)

    // Used to access destination from different watchers later.
    destinationPackages.set(absolutePackagePath, absoluteDestinationPath)

    return chokidar.watch(includedPaths, {
      // Watching node_modules is unnecessary, dot-stuff should be ignored anyways.
      ignored: ignoredPaths,
      // Files already there have been copied by installation.
      ignoreInitial: true,
      // The packagePath will be the CWD to watch from.
      cwd: absolutePackagePath,
    })
  })

  const copyFile = (from, to, filePath) => {
    log(`Copying ${filePath}`, {
      group: 'copy-synec',
      message: (count) => `Copying ${count} files`,
    })
    try {
      copyFileSync(join(from, filePath), join(to, filePath))
    } catch (_) {
      log(`Copying ${filePath} failed`, 'warning')
    }
  }

  const removeFile = (to, filePath) => {
    log(`Removing ${filePath}`, {
      group: 'remove-synec',
      message: (count) => `Removing ${count} files`,
    })
    try {
      unlinkSync(join(to, filePath))
    } catch (_) {
      log(`Removing ${filePath} failed`, 'warning')
    }
  }

  watchers.forEach((watcher) => {
    const from = watcher.options.cwd
    const to = destinationPackages.get(watcher.options.cwd)
    const copyHandler = copyFile.bind(null, from, to)
    const removeHandler = removeFile.bind(null, to)
    watcher
      .on('add', copyHandler)
      .on('change', copyHandler)
      .on('unlink', removeHandler)
  })

  // Stop watching paths.
  return () => watchers.forEach((watcher) => watcher.close())
}
