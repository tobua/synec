#!/usr/bin/env node

import childProcess from 'child_process'

// Entry in package.json "localDependencies"

// Build project dist

// Copy over project "files"

// Install missing dependencies

// Watch for changes in "files"

// Watch for changes to "dependencies" in package.json

console.log('synec: Installing local dependencies...')

// Start background process that will still watch but exit to next command.
childProcess.spawn(process.argv[0], ['node_modules/synec/cli-watch.js'], {
  detached: true,
  stdio: 'inherit',
})

process.exit()
