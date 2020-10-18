import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import childProcess from 'child_process'
import { writeFile, readFile } from './utility/file.js'
import { prepare } from './utility/prepare.js'
import {
  getLocalDependencies,
  getWatchPaths,
  installWithoutSave,
  installAppDependencies,
} from '../utility.js'

const [pluginRelativePaths, setCwd] = prepare('basic')

test('Correctly reads local dependencies from app.', () => {
  const localDependencies = getLocalDependencies()

  expect(localDependencies).toEqual([pluginRelativePaths.first])
})

test('Properly loads the watch paths for the plugin.', () => {
  const [filesToInclude, filesToIgnore, name] = getWatchPaths(
    pluginRelativePaths.first
  )

  expect(name).toEqual('my-plugin')
  expect(filesToInclude).toContain('index.js')
  expect(filesToInclude).toContain('package.json')
  // .npmignore ignored if files entry available
  expect(filesToIgnore).not.toContain('build.js')
  // Default node_modules
  expect(filesToIgnore.map(String)).toContain(String(/node_modules/))
})

test('Fallback to .npmignore if files entry is missing.', () => {
  setCwd(join(global.PATH, 'my-plugin'))

  // Remove files entry.
  const pkg = readFile('package.json', { json: true })
  const filesEntry = pkg.files
  delete pkg.files
  writeFile('package.json', pkg, { json: true })

  setCwd(join(global.PATH, 'my-app'))

  const [, filesToIgnore] = getWatchPaths(pluginRelativePaths.first)

  expect(filesToIgnore).toContain('build.js')

  setCwd(join(global.PATH, 'my-plugin'))

  // Restore files entry.
  writeFile('package.json', { ...pkg, files: filesEntry }, { json: true })
})

test('App dependencies are installed if missing when using npx.', () => {
  installAppDependencies()

  // npm install done.
  expect(existsSync(join(global.PATH, 'my-app/node_modules'))).toEqual(true)
  expect(existsSync(join(global.PATH, 'my-app/package-lock.json'))).toEqual(
    true
  )
  // Dependencies installed.
  expect(existsSync(join(global.PATH, 'my-app/node_modules/react'))).toEqual(
    true
  )
})

test(`Reinstalls if dependencies are out-of-date.`, () => {
  installAppDependencies()

  // Dependencies installed.
  expect(existsSync(join(global.PATH, 'my-app/node_modules/react'))).toEqual(
    true
  )

  const initialReactVersion = readFile('node_modules/react/package.json', {
    json: true,
  }).version

  // Installing an old react version.
  childProcess.execSync(`npm install --no-save react@15`, {
    cwd: process.cwd(),
    stdio: 'ignore',
  })

  const downgradedReactVersion = readFile('node_modules/react/package.json', {
    json: true,
  }).version

  expect(initialReactVersion).not.toEqual(downgradedReactVersion)

  installAppDependencies()

  const upgradedReactVersion = readFile('node_modules/react/package.json', {
    json: true,
  }).version

  expect(upgradedReactVersion).toEqual(initialReactVersion)
})

test(`Plugin including it's dependencies is installed.`, async () => {
  await installWithoutSave([pluginRelativePaths.first])

  // Plugin installed.
  expect(
    existsSync(join(global.PATH, 'my-app/node_modules/my-plugin'))
  ).toEqual(true)
  expect(
    existsSync(join(global.PATH, 'my-app/node_modules/my-plugin/index.js'))
  ).toEqual(true)
  // Plugin dependencies installed.
  expect(existsSync(join(global.PATH, 'my-app/node_modules/webpack'))).toEqual(
    true
  )

  // Tarballs are removed.
  expect(
    readdirSync(process.cwd()).filter((filePath) => filePath.endsWith('.tgz'))
      .length
  ).toEqual(0)
})

test('Everything is installed.', async () => {
  installAppDependencies()
  await installWithoutSave([pluginRelativePaths.first])

  // npm install done.
  expect(existsSync(join(global.PATH, 'my-app/node_modules'))).toEqual(true)
  expect(existsSync(join(global.PATH, 'my-app/package-lock.json'))).toEqual(
    true
  )
  // Plugin installed.
  expect(
    existsSync(join(global.PATH, 'my-app/node_modules/my-plugin'))
  ).toEqual(true)
  // Dependencies installed.
  expect(existsSync(join(global.PATH, 'my-app/node_modules/react'))).toEqual(
    true
  )
  // Plugin dependencies installed.
  expect(existsSync(join(global.PATH, 'my-app/node_modules/webpack'))).toEqual(
    true
  )
})
