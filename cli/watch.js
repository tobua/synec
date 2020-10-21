#!/usr/bin/env node

import { getLocalDependencies, watchLocalDependencies } from '../utility.js'

const localDependencies = getLocalDependencies()

if (!localDependencies) {
  process.exit(0)
}

watchLocalDependencies(localDependencies)
