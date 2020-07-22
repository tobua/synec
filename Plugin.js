import validateOptions from 'schema-utils'
import {
  getLocalDependencies,
  installDependenciesWithoutSave,
  installLocalDependency,
  installDependenciesIfMissing,
} from './utility.js'

// https://github.com/sindresorhus/is-installed-globally/blob/master/index.js
// https://www.npmjs.com/package/is-installed-locally

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

    console.log('plugin')

    // Initial install of local dependencies.
    compiler.hooks.environment.tap(pluginName, () => {
      const dependencyPaths = Object.keys(localDependencies).map(
        (name) => localDependencies[name]
      )

      //   const dependencyPaths = []
      //   for (const name in localDependencies) {
      //     const packagePath = localDependencies[name]
      //     dependencyPaths.push(packagePath)
      //     // await installLocalDependency(name, packagePath)
      //     // await installDependenciesIfMissing(name, packagePath)
      //   }

      installDependenciesWithoutSave(dependencyPaths)
    })

    if (!this.options.watch) {
      return
    }

    compiler.hooks.watchRun.tapAsync(pluginName, (_compiler, done) => {
      console.log('tap watchrun WATCH RUN')
      done()
    })
  }
}
