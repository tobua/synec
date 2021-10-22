import { existsSync } from 'fs'
import { join } from 'path'
import { readFile } from './utility/file.js'
import { prepare } from './utility/prepare.js'
import { wait, killWatchers } from './utility/helper.js'
import {
  installAppDependencies,
  installWithoutSave,
  runScripts,
} from '../utility.js'

const [pluginRelativePaths] = prepare('scripts')

test('Runs the build script if available.', async () => {
  installAppDependencies()
  runScripts([
    pluginRelativePaths.first,
    pluginRelativePaths.second,
    pluginRelativePaths.build,
  ])

  const buildPluginPath = join(process.cwd(), pluginRelativePaths.build)

  // DevDependencies required for build are installed
  expect(existsSync(join(buildPluginPath, 'node_modules/typescript'))).toEqual(
    true
  )
  expect(existsSync(join(buildPluginPath, 'node_modules/esbuild'))).toEqual(
    true
  )

  expect(existsSync(join(buildPluginPath, 'dist/index.js'))).toEqual(true)
  // build command using esbuild is not generating any type definitions.
  expect(existsSync(join(buildPluginPath, 'dist/index.d.ts'))).toEqual(false)

  const builtFileContents = readFile(join(buildPluginPath, 'dist/index.js'))

  // TypeScript definitions have been removed.
  expect(builtFileContents).not.toContain('number')

  await installWithoutSave([
    pluginRelativePaths.first,
    pluginRelativePaths.second,
    pluginRelativePaths.build,
  ])

  // Built file and not source file is installed.
  expect(
    existsSync(
      join(process.cwd(), 'node_modules/my-built-plugin/dist/index.js')
    )
  ).toEqual(true)
  expect(
    existsSync(join(process.cwd(), 'node_modules/my-built-plugin/index.ts'))
  ).toEqual(false)
})

test('Watch script is run in background and generates assets.', async () => {
  installAppDependencies()
  const watchers = runScripts(
    [
      pluginRelativePaths.first,
      pluginRelativePaths.second,
      pluginRelativePaths.build,
    ],
    // Watch option is active.
    true
  )

  // Wait as script runs in watch mode with separate process.
  await wait(30)

  killWatchers(watchers)

  const buildPluginPath = join(process.cwd(), pluginRelativePaths.build)

  expect(existsSync(join(buildPluginPath, 'dist/index.js'))).toEqual(true)
  // watch command will also generate type definitions.
  expect(existsSync(join(buildPluginPath, 'dist/index.d.ts'))).toEqual(true)
})
