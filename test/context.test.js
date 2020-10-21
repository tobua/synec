import { join } from 'path'
import { writeFile, readFile } from './utility/file.js'
import { prepare } from './utility/prepare.js'
import { context } from '../utility/context.js'

const [pluginRelativePaths] = prepare('context')

test('Reads package contents of main app.', () => {
  expect(context.pkg.name).toEqual('my-app')

  const appPackageJsonPath = join(global.PATH, 'my-app/package.json')
  const contents = readFile(appPackageJsonPath, { json: true })

  contents.name = 'my-changed-app'
  writeFile(appPackageJsonPath, contents, { json: true })

  // Always refreshes the contents in test environment.
  expect(context.pkg.name).toEqual('my-changed-app')
})

test('Reads package contents of referenced plugins.', () => {
  expect(context.plugin[pluginRelativePaths.first].pkg.name).toEqual(
    'my-plugin'
  )
  expect(context.plugin[pluginRelativePaths.second].pkg.name).toEqual(
    'my-second-plugin'
  )
})

test('Default options are set properly.', () => {
  expect(context.options.watch).toEqual(true)
  expect(context.options.production).toEqual(false)
  expect(context.options.script).toEqual(true)
})