import { join } from 'path'
import { readFileSync } from 'fs'
import validateOptions from 'schema-utils'
import pacote from 'pacote'
// import chokidar from 'chokidar'

const schema = {
  title: 'LocalDependenciesPlugin options',
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
    validateOptions(schema, options, { name: 'LocalDependenciesPlugin' })
    this.production = options.production
    this.watch = options.watch
  }

  apply(compiler) {
    if (compiler.options.mode === 'production' && !this.production) {
      return
    }

    const { localDependencies } = JSON.parse(
      readFileSync(join(process.cwd(), 'package.json'), 'utf8')
    )

    if (!localDependencies || Object.keys(localDependencies).length < 1) {
      return
    }

    Object.keys(localDependencies).forEach((name) => {
      const packagePath = localDependencies[name]
      console.log(`synec: Installing ${name} from ${packagePath}`)

      console.log(join(process.cwd(), 'node_modules', name))
      pacote
        .extract(packagePath, join(process.cwd(), 'node_modules', name))
        .then(({ from, resolved, integrity }) => {
          console.log('extracted!', from, resolved, integrity)
        })
    })

    compiler.hooks.watchRun.tapAsync(
      'LocalDependenciesPlugin',
      (_compiler, done) => {
        console.log('WATCH RUN')

        return done()
      }
    )
  }
}
