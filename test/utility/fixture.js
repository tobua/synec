import { mkdirSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'
import { writeFile } from './file.js'

// Access directory, before it's modified for tests.
const CWD = process.cwd()

const structure = [
  {
    name: 'my-app',
    files: [
      {
        name: 'package.json',
        json: true,
        contents: {
          name: 'my-app',
          type: 'module',
          dependencies: {
            react: '^16.13.1',
          },
          localDependencies: {
            'my-plugin': '../my-plugin',
          },
        },
      },
    ],
  },
  {
    name: 'my-plugin',
    files: [
      {
        name: 'package.json',
        json: true,
        contents: {
          name: 'my-plugin',
          version: '1.0.0',
          type: 'module',
          dependencies: {
            webpack: '^5.0.0',
          },
          scripts: {
            build: "echo 'build'",
            watch: "echo 'watch'",
          },
          files: ['index.js'],
        },
      },
      {
        name: '.npmignore',
        contents: `build.js\n`,
      },
      {
        name: 'build.js',
        contents: ``,
      },
      {
        name: 'excluded.js',
        contents: `console.log(\`please don't publish me\`)\n`,
      },
      {
        name: 'imported.js',
        contents: `export default () => console.log('imported file')`,
      },
      {
        name: 'index.js',
        contents: `import hello from './imported.js'

console.log('hello my-plugin')

hello()
`,
      },
      {
        name: 'watch.js',
        contents: ``,
      },
    ],
  },
  {
    name: 'my-second-plugin',
    files: [
      {
        name: 'package.json',
        json: true,
        contents: {
          name: 'my-second-plugin',
          version: '1.0.0',
          type: 'module',
          dependencies: {
            chalk: '^4.1.0',
            axios: '^0.20.0',
          },
          scripts: {
            build: "echo 'build'",
            watch: "echo 'watch'",
          },
          files: ['index.js'],
        },
      },
    ],
  },
]

// Create file structure required to test the plugins.
export const setup = (suiteName) => {
  const BASE = join(CWD, 'test/fixture', suiteName)

  // Cleanup in case leftovers from previous runs exist.
  rimraf.sync(BASE)

  // Create test/fixture directory to put files.
  mkdirSync(BASE, { recursive: true })

  structure.forEach((directory) => {
    mkdirSync(join(BASE, directory.name), { recursive: true })

    directory.files.forEach((file) => {
      writeFile(join(BASE, directory.name, file.name), file.contents, {
        json: file.json,
      })
    })
  })

  return BASE
}

// Remove temporary files inside fixtures created during tests.
export const reset = (BASE) => {
  rimraf.sync(join(BASE, 'my-app/node_modules'))
  rimraf.sync(join(BASE, 'my-app/package-lock.json'))

  rimraf.sync(join(BASE, 'my-plugin/node_modules'))
  rimraf.sync(join(BASE, 'my-plugin/package-lock.json'))
}
