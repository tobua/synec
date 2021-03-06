import { validate } from 'schema-utils'
import {
  getLocalDependencies,
  installWithoutSave,
  watchLocalDependencies,
  runScripts,
} from './utility.js'
import { context, setOptions } from './utility/context.js'
import { log } from './utility/log.js'

const pluginName = 'LocalDependenciesPlugin'

const schema = {
  title: `${pluginName} options`,
  type: 'object',
  properties: {
    watch: {
      description:
        'Watches packages for changes and updates on changes, default false.',
      type: 'boolean',
    },
    script: {
      description:
        'Run build or watch script before installing plugin, default true.',
      type: 'boolean',
    },
    production: {
      description: 'Enables the plugin also in production mode, default true.',
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
    const localDependencies = getLocalDependencies()

    if (!localDependencies) {
      return
    }

    if (compiler.options.mode === 'production' && !context.options.production) {
      log('Not installing localDependencies in webpack production mode.')
      return
    }

    if (compiler.options.mode === 'production') {
      // Not watching in production build mode.
      context.options.watch = false
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

    // node_modules are cached by default, disable to make sure updated plugins get reflected.
    compiler.hooks.afterEnvironment.tap(pluginName, () => {
      // eslint-disable-next-line no-param-reassign
      compiler.options.cache = !(
        context.options.watch && context.options.script
      )
    })
  }
}
