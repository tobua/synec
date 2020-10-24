import { validate } from 'schema-utils'
import {
  getLocalDependencies,
  installWithoutSave,
  watchLocalDependencies,
  runScripts,
} from './utility.js'
import { context, setOptions } from './utility/context.js'

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
      description:
        'Run build or watch script before installing plugin, default true.',
      type: 'boolean',
    },
  },
}

export const LocalDependenciesPlugin = class {
  constructor(options = context.options) {
    validate(schema, options, { name: pluginName })
    this.options = options
    setOptions(this.options)
  }

  // eslint-disable-next-line class-methods-use-this
  apply(compiler) {
    if (compiler.options.mode === 'production' && !context.options.production) {
      return
    }

    const localDependencies = getLocalDependencies()

    if (!localDependencies) {
      return
    }

    // Initial install of local dependencies.
    compiler.hooks.environment.tap(pluginName, async () => {
      if (context.options.script) {
        runScripts(localDependencies, context.options.watch)
      }
      await installWithoutSave(localDependencies)

      if (!context.options.watch) {
        return
      }

      watchLocalDependencies(localDependencies)
    })
  }
}
