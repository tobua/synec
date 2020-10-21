import validateOptions from 'schema-utils'
import {
  getLocalDependencies,
  installWithoutSave,
  watchLocalDependencies,
  runScripts,
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
    script: {
      description: 'Run build or watch script before installing plugin, default true.',
      type: 'boolean'
    }
  },
}

export const LocalDependenciesPlugin = class {
  constructor(options = { production: false, watch: true, script: true }) {
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
    compiler.hooks.environment.tap(pluginName, async () => {
      if (this.options.script) {
        runScripts(localDependencies, this.options.watch)
      }
      await installWithoutSave(localDependencies)

      if (!this.options.watch) {
        return
      }

      watchLocalDependencies(localDependencies)
    })
  }
}
