import { join } from 'path'
import { readFileSync } from 'fs'
import { log } from './log.js'

const state = {
  pkg: null,
  plugin: {
    // Plugin<{ pkg }>
  },
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

const getPackageJson = (packagePath = '') => {
  const packageJsonPath = join(process.cwd(), packagePath, 'package.json')

  try {
    return JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  } catch (error) {
    log(`Unable to load package.json from ${packageJsonPath}`, 'error')
    return null
  }
}

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

        return false
      },
    }
  )

export const context = proxy('')
