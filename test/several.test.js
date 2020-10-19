import { existsSync } from 'fs'
import { join } from 'path'
import { writeFile, readFile } from './utility/file.js'
import { prepare } from './utility/prepare.js'
import {
  watchLocalDependencies,
  installAppDependencies,
  installWithoutSave,
} from '../utility.js'

const [pluginRelativePaths] = prepare('several')

test('Successfully installs several plugins and their dependencies.', async () => {
  installAppDependencies()
  await installWithoutSave([
    pluginRelativePaths.first,
    pluginRelativePaths.second,
  ])

  expect(existsSync(join(global.PATH, 'my-app/node_modules'))).toEqual(true)
  expect(existsSync(join(global.PATH, 'my-app/package-lock.json'))).toEqual(
    true
  )
  // Plugins installed.
  expect(
    existsSync(join(global.PATH, 'my-app/node_modules/my-plugin'))
  ).toEqual(true)
  expect(
    existsSync(join(global.PATH, 'my-app/node_modules/my-second-plugin'))
  ).toEqual(true)
  // Dependencies installed.
  expect(existsSync(join(global.PATH, 'my-app/node_modules/react'))).toEqual(
    true
  )
  expect(existsSync(join(global.PATH, 'my-app/node_modules/webpack'))).toEqual(
    true
  )
  expect(existsSync(join(global.PATH, 'my-app/node_modules/chalk'))).toEqual(
    true
  )
  expect(existsSync(join(global.PATH, 'my-app/node_modules/axios'))).toEqual(
    true
  )
})

test('Installation skipped and all plugins installed.', async () => {
  installAppDependencies()

  let timeBefore = performance.now()

  await installWithoutSave([
    pluginRelativePaths.first,
    pluginRelativePaths.second,
  ])

  const timeFirstInstall = performance.now() - timeBefore

  const fileContents = `please don't override me.`

  // We only modify the destination and not the source (which is hashed).
  writeFile('node_modules/my-plugin/index.js', fileContents)
  writeFile('node_modules/my-second-plugin/index.js', fileContents)

  timeBefore = performance.now()

  await installWithoutSave([
    pluginRelativePaths.first,
    pluginRelativePaths.second,
  ])

  const timeSecondInstall = performance.now() - timeBefore

  // Second install is much faster as nothing needs to be installed.
  expect(timeFirstInstall).toBeGreaterThan(timeSecondInstall * 4)

  // Install was skipped, so destination files still overwritten.
  expect(readFile('node_modules/my-plugin/index.js')).toEqual(fileContents)
  expect(readFile('node_modules/my-second-plugin/index.js')).toEqual(
    fileContents
  )

  const changedContents = `I've changed.`

  writeFile(join(global.PATH, 'my-plugin/index.js'), changedContents)

  timeBefore = performance.now()

  await installWithoutSave([
    pluginRelativePaths.first,
    pluginRelativePaths.second,
  ])

  const timeThirdInstall = performance.now() - timeBefore

  // Full install again and so takes much longer than skipped.
  expect(timeThirdInstall).toBeGreaterThan(timeSecondInstall * 4)

  // Plugins reinstalled therefore overriden contents gone.
  expect(readFile('node_modules/my-plugin/index.js')).not.toEqual(fileContents)
  expect(readFile('node_modules/my-second-plugin/index.js')).not.toEqual(
    fileContents
  )

  // Full install nothing was pruned.
  expect(
    existsSync(join(global.PATH, 'my-app/node_modules/my-plugin'))
  ).toEqual(true)
  expect(
    existsSync(join(global.PATH, 'my-app/node_modules/my-second-plugin'))
  ).toEqual(true)
  expect(existsSync(join(global.PATH, 'my-app/node_modules/react'))).toEqual(
    true
  )
  expect(existsSync(join(global.PATH, 'my-app/node_modules/webpack'))).toEqual(
    true
  )
  expect(existsSync(join(global.PATH, 'my-app/node_modules/chalk'))).toEqual(
    true
  )
  expect(existsSync(join(global.PATH, 'my-app/node_modules/axios'))).toEqual(
    true
  )
})
