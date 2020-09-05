#!/usr/bin/env node

import childProcess from 'child_process'
import { getLocalDependencies, installWithoutSave } from '../utility.js'
import { getOptions } from './options.js'

const options = getOptions()

if (process.env.NODE_ENV === 'production' && !options.production) {
  process.exit()
}

const localDependencies = getLocalDependencies()

if (!localDependencies) {
  process.exit()
}

installWithoutSave(localDependencies)

if (!options.watch) {
  process.exit()
}

// Start background process that will still watch but exit to next command.
childProcess.spawn(process.argv[0], ['node_modules/synec/cli/watch.js'], {
  stdio: 'inherit',
})

process.exit()
