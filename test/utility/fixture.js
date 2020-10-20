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
          files: ['index.js'],
        },
      },
      {
        name: '.npmignore',
        contents: `build.js\n`,
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
          files: ['index.js'],
        },
      },
      {
        name: 'index.js',
        contents: `console.log('initial contents')`,
      },
    ],
  },
  {
    name: 'my-built-plugin',
    files: [
      {
        name: 'package.json',
        json: true,
        contents: {
          name: 'my-built-plugin',
          version: '1.0.0',
          main: 'dist/index.js',
          type: 'module',
          devDependencies: {
            typescript: '^4.0.3',
            esbuild: '^0.7.17',
          },
          scripts: {
            build: 'node build.js',
            watch: 'tsc --watch',
          },
          files: ['dist'],
        },
      },
      {
        name: 'build.js',
        contents: `import esbuild from 'esbuild'

esbuild.build({
  entryPoints: ['./index.ts'],
  outfile: './dist/index.js',
  minify: true,
  bundle: true,
}).catch(() => process.exit(1))`,
      },
      {
        name: 'index.ts',
        contents: `export const hello = (input: number) => \`whoo \${input * 2}\``,
      },
      {
        name: 'tsconfig.json',
        json: true,
        contents: {
          compilerOptions: {
            outDir: 'dist',
            declaration: true,
          },
          include: ['index.ts'],
          exclude: ['node_modules'],
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
  rimraf.sync(join(BASE, '*/node_modules'))
  rimraf.sync(join(BASE, '*/package-lock.json'))
}
