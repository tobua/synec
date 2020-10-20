import { existsSync } from 'fs'
import { join } from 'path'
import { writeFile, readFile } from './utility/file.js'
import { prepare } from './utility/prepare.js'
import { wait } from './utility/wait.js'
import {
  watchLocalDependencies,
  installAppDependencies,
  installWithoutSave,
} from '../utility.js'

const [pluginRelativePaths] = prepare('watch')

test('Watcher copies over changed file.', async () => {
  installAppDependencies()
  await installWithoutSave([pluginRelativePaths.first])

  // Watcher will stay running during the below statements.
  const stopWatching = watchLocalDependencies([pluginRelativePaths.first])

  const indexPath = 'node_modules/my-plugin/index.js'
  const indexSourcePath = '../my-plugin/index.js'

  expect(existsSync(join(process.cwd(), indexPath))).toEqual(true)

  const initialContents = readFile(indexPath)

  const newContents = `console.log('changed')`

  writeFile(indexSourcePath, newContents)

  expect(readFile(indexSourcePath)).toEqual(newContents)

  // Wait for some time so watcher thread can complete it's task.
  // Requires quite some time to actually copy the files.
  await wait(20)

  expect(readFile(indexPath)).toEqual(newContents)
  expect(readFile(indexPath)).not.toEqual(initialContents)

  stopWatching()

  // Restore initial plugin state.
  writeFile(indexSourcePath, initialContents)
})
