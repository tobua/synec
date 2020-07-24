import validateOptions from 'schema-utils'
import {
  getLocalDependencies,
  installWithoutSave,
  watchLocalDependencies,
} from './utility.js'

const pluginName = 'LocalDependenciesPlugin'

const schema = {
  title: `${pluginName} options`,
  type: 'object',
  properties: {
    production: {
      description: 'Enables the plugin also in production mode, default false.',
      type: 'boolean',
    },
    watch: {
      description:
        'Watches packages for changes and updates on changes, default true.',
      type: 'boolean',
    },
  },
}

export const LocalDependenciesPlugin = class {
  constructor(options = { production: false, watch: true }) {
    validateOptions(schema, options, { name: pluginName })
    this.options = options
  }

  apply(compiler) {
    if (compiler.options.mode === 'production' && !this.options.production) {
      return
    }

    const localDependencies = getLocalDependencies()

    if (!localDependencies) {
      return
    }

    // Initial install of local dependencies.
    compiler.hooks.environment.tap(pluginName, () => {
      installWithoutSave(localDependencies)
    })

    if (!this.options.watch) {
      return
    }

    watchLocalDependencies(localDependencies)

    compiler.hooks.watchRun.tapAsync(pluginName, (_compiler, done) => {
      console.log('tap watchrun WATCH RUN')
      done()
    })
  }
}
