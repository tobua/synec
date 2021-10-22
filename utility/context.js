import { join } from 'path'
import { readFileSync } from 'fs'
import mem from 'mem'
import { log } from './log.js'

const state = {
  pkg: null,
  plugin: {
    // Plugin<{ pkg }>
  },
  options: {
    watch: false,
    production: true,
    script: true,
  },
  // Don't remove any files until watch is adding files or timeout has passed.
  watchRemoveProtected: false,
}

// From https://stackoverflow.com/a/43849204/3185545
const resolvePath = (path, defaultValue) =>
  path.split('.').reduce((o, p) => (o ? o[p] : defaultValue), state)

const setPath = (path, value) =>
  path.split('.').reduce(
    // eslint-disable-next-line no-return-assign,no-plusplus,no-param-reassign
    (o, p, i) => (o[p] = path.split('.').length === ++i ? value : o[p] || {}),
    state
  )

const readPackageJson = (packagePath = '') => {
  const packageJsonPath = join(process.cwd(), packagePath, 'package.json')

  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  } catch (error) {
    log(`Unable to load package.json from ${packageJsonPath}`, 'error')
    return {}
  }
}

// Memoized to avoid multiple lookups to the same package.
export const getPackageJson =
  typeof jest === 'undefined' ? mem(readPackageJson) : readPackageJson

const getState = (path, generator) => {
  const cached = resolvePath(path)
  // No caching for tests.
  if (cached && typeof jest === 'undefined') {
    return cached
  }

  const value = generator()

  setPath(path, value)

  return value
}

// Optional current access chain, for proxying deeper values.
const proxy = (current) =>
  new Proxy(
    {},
    {
      get: (_, property) => {
        if (current === 'plugin') {
          return proxy(`plugin[${property}]`)
        }

        if (current.startsWith('plugin') && current.endsWith(']')) {
          return proxy(`${current}.${property}`)
        }

        if (property === 'watchRemoveProtected') {
          return state.watchRemoveProtected
        }

        if (property === 'pkg' || current.endsWith('pkg')) {
          const pluginName = current.match(/.*\[(.*)\].*/)

          if (pluginName && pluginName[1]) {
            return getState(current, () => getPackageJson(pluginName[1]))[
              property
            ]
          }

          return getState('pkg', getPackageJson)
        }

        if (property === 'plugin') {
          return proxy('plugin')
        }

        if (property === 'options') {
          return state.options
        }

        return false
      },
      set: (_, property, value) => {
        if (current === 'options') {
          state.options[property] = value
          return true
        }

        if (property === 'watchRemoveProtected') {
          state.watchRemoveProtected = value
          return true
        }

        if (property === 'options') {
          return proxy('options')
        }

        state[property] = value

        return value
      },
    }
  )

export const context = proxy('')

export const getOptionsFromArgv = () => {
  // Set options.
  const scripts = process.argv

  if (scripts.includes('--watch')) {
    context.options.watch = true
  }

  if (scripts.includes('--no-script')) {
    context.options.script = false
  }

  if (scripts.includes('--no-production')) {
    context.options.production = false
  }
}

export const setOptions = (options) => {
  if (typeof options.watch !== 'undefined') {
    context.options.watch = !!options.watch
  }

  if (typeof options.script !== 'undefined') {
    context.options.script = !!options.script
  }

  if (typeof options.production !== 'undefined') {
    context.options.production = !!options.script
  }
}
