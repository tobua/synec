import { join } from 'path'
import { readFileSync, readdirSync, unlinkSync, copyFileSync } from 'fs'
import childProcess from 'child_process'
import pacote from 'pacote'
import semver from 'semver'
import ora from 'ora'
import chokidar from 'chokidar'

export const getLocalDependencies = () => {
  const { localDependencies } = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf8')
  )

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

export const installWithoutSave = (packagePaths) => {
  const spinner = ora('synec: Installing localDependencies').start()
  spinner.color = 'blue'

  const tarballs = packagePaths
    .map((path) => `$(npm pack ${path} | tail -1)`)
    .join(' ')

  // NOTE console output silenced
  childProcess.execSync(`npm install --no-save ${tarballs}`, { stdio: 'pipe' })

  readdirSync(process.cwd())
    .filter((filePath) => filePath.endsWith('.tgz'))
    .map((filePath) => unlinkSync(filePath))

  spinner.stop()
}

export const watchLocalDependencies = (packagePaths) => {
  const watcher = chokidar.watch(packagePaths, {
    // Watching node_modules is unnecessary, dotfiles contain git etc.
    ignored: /node_modules|^\/?(?:\w+\/)*(\.\w+)/,
    // Files already there have been copied by installation.
    ignoreInitial: true,
  })

  const copyFile = (filePath) => {
    console.log(`synec: copying ${filePath}`)
    const destinationPath = filePath.replace(/^\.\./, 'node_modules')
    copyFileSync(filePath, destinationPath)
  }

  const removeFile = (filePath) => {
    console.log(`synec: removing ${filePath}`)
    unlinkSync(filePath)
  }

  watcher.on('add', copyFile).on('change', copyFile).on('unlink', removeFile)
}

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
