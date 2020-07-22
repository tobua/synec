import { join } from 'path'
import { readFileSync, unlinkSync } from 'fs'
import childProcess from 'child_process'
import pacote from 'pacote'
import semver from 'semver'
// import chokidar from 'chokidar'

export const getLocalDependencies = () => {
  const { localDependencies } = JSON.parse(
    readFileSync(join(process.cwd(), 'package.json'), 'utf8')
  )

  if (!localDependencies || Object.keys(localDependencies).length < 1) {
    return false
  }

  return localDependencies
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

export const installDependenciesWithoutSave = (packagePaths) => {
  const tarballs = packagePaths
    .map((path) => `$(npm pack ${path} | tail -1)`)
    .join(' ')

  // NOTE console output silenced
  childProcess.execSync(`npm install --no-save ${tarballs}`, { stdio: 'pipe' })
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
