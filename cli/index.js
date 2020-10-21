#!/usr/bin/env node

import childProcess from 'child_process'
import {
  getLocalDependencies,
  installWithoutSave,
  installAppDependencies,
  runScripts,
} from '../utility.js'
import { context } from '../utility/context.js'

if (process.env.NODE_ENV === 'production' && !context.options.production) {
  process.exit(0)
}

const localDependencies = getLocalDependencies()

if (!localDependencies) {
  process.exit(0)
}

installAppDependencies()

if (context.options.script) {
  runScripts(localDependencies, context.options.watch)
}

await installWithoutSave(localDependencies)

if (!context.options.watch) {
  process.exit(0)
}

// Start background process that will still watch but exit to next command.
childProcess.spawn(process.argv[0], ['node_modules/synec/cli/watch.js'], {
  stdio: 'inherit',
})

process.exit(0)
