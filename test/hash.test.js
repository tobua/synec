import { existsSync } from 'fs'
import { join } from 'path'
import { prepare } from './utility/prepare.js'
import { writeFile, readFile } from './utility/file.js'
import { installWithoutSave } from '../utility.js'

const [pluginRelativePaths] = prepare('hash')

test(`Plugin only reinstalled if hash is outdated.`, async () => {
  const initialSourceContent = readFile('../my-plugin/index.js')

  // First install generates hash.
  await installWithoutSave([pluginRelativePaths.first])

  // Hash file has been generated.
  expect(
    existsSync(join(process.cwd(), 'node_modules/my-plugin/.synec-hash'))
  ).toEqual(true)

  const fileContents = `please don't override me.`

  // We only modify the destination and not the source (which is hashed).
  writeFile('node_modules/my-plugin/index.js', fileContents)

  // No install required this time.
  await installWithoutSave([pluginRelativePaths.first])

  expect(readFile('node_modules/my-plugin/index.js')).toEqual(fileContents)

  const changedSourceContents = 'update is required.'

  // We modify the source and then check if it's installed.
  writeFile('../my-plugin/index.js', changedSourceContents)

  // This time an install is required.
  await installWithoutSave([pluginRelativePaths.first])

  expect(readFile('node_modules/my-plugin/index.js')).toEqual(
    changedSourceContents
  )

  // Restore initial state.
  writeFile('../my-plugin/index.js', initialSourceContent)
})
