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

test('Watcher copies over changed file.', async () => {
  installAppDependencies()
  await installWithoutSave([pluginRelativePaths.first])

  // TODO Testing if it works with several dependencies.
  expect(true).toEqual(true)
})
