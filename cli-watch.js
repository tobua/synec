#!/usr/bin/env node

setInterval(() => {
  console.log('synec: Watcher still running...')
}, 2000)

// Stop watcher when last process stopped.
process.on(['SIGINT', 'SIGTERM'], () => process.exit())
