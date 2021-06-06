import { existsSync } from 'fs'
import { join } from 'path'
import { writeFile, readFile } from './utility/file.js'
import { prepare } from './utility/prepare.js'
import { installWithoutSave } from '../utility.js'

const [pluginRelativePaths] = prepare('validation')

// Mock console.
console.warn = jest.fn()

test(`Warning if version field is missing, plugin not installed but other plugins are.`, async () => {
  const pkg = readFile('../my-plugin/package.json', { json: true })
  delete pkg.version
  writeFile('../my-plugin/package.json', pkg, { json: true })

  await installWithoutSave([
    pluginRelativePaths.first,
    pluginRelativePaths.second,
  ])

  expect(
    !existsSync(join(global.PATH, 'my-app/node_modules/my-plugin'))
  ).toEqual(true)

  expect(
    existsSync(join(global.PATH, 'my-app/node_modules/my-second-plugin'))
  ).toEqual(true)

  // Warning is printed.
  expect(console.warn.mock.calls.length).toBe(1)
  expect(console.warn.mock.calls[0][0].includes('Warning')).toBe(true)
  expect(console.warn.mock.calls[0][0].includes('my-plugin')).toBe(true)
})
