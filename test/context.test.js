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
  expect(context.options.watch).toEqual(false)
  expect(context.options.production).toEqual(true)
  expect(context.options.script).toEqual(true)
})

test('Options can be set.', () => {
  expect(context.options.watch).toEqual(false)

  context.options.watch = true

  expect(context.options.watch).toEqual(true)
})

test('Setters for options work properly.', () => {
  expect(context.watchRemoveProtected).toBeFalsy()
  context.watchRemoveProtected = true
  expect(context.watchRemoveProtected).toBeTruthy()
})
