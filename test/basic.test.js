import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'
import childProcess from 'child_process'
import { writeFile, readFile } from './utility/file.js'
import { getLocalDependencies, getWatchPaths, installWithoutSave, installAppDependencies } from '../utility.js'

// Waiting up to 5 minutes for async tests, npm install might take some time.
jest.setTimeout(300000)

const CWD = process.cwd()
const cwdSpy = jest.spyOn(process, 'cwd')
const setCwd = (_path) => cwdSpy.mockReturnValue(join(CWD, _path))

const myPluginRelativePath = '../my-plugin'

const cleanUp = () => { 
    rimraf.sync(join(CWD, 'test/fixture/my-app/node_modules'))
    rimraf.sync(join(CWD, 'test/fixture/my-app/package-lock.json'))

    rimraf.sync(join(CWD, 'test/fixture/my-plugin/node_modules'))
    rimraf.sync(join(CWD, 'test/fixture/my-plugin/package-lock.json'))
}

beforeAll(cleanUp)
afterEach(cleanUp)

test('Correctly reads local dependencies from app.', () => {
    setCwd('test/fixture/my-app')
    const localDependencies = getLocalDependencies()

    expect(localDependencies).toEqual([myPluginRelativePath])
})

test('Properly loads the watch paths for the plugin.', () => {
    setCwd('test/fixture/my-app')
    const [filesToInclude, filesToIgnore, name] = getWatchPaths(myPluginRelativePath)

    expect(name).toEqual('my-plugin')
    expect(filesToInclude).toContain('index.js')
    expect(filesToInclude).toContain('package.json')
    // .npmignore ignored if files entry available
    expect(filesToIgnore).not.toContain('build.js')
    // Default node_modules
    expect(filesToIgnore.map(String)).toContain(String(/node_modules/))
})

test('Fallback to .npmignore if files entry is missing.', () => {
    setCwd('test/fixture/my-plugin')

    // Remove files entry.
    const pkg = readFile('package.json', { json: true })
    const filesEntry = pkg.files
    delete pkg.files
    writeFile('package.json', pkg, { json: true })

    setCwd('test/fixture/my-app')

    const [, filesToIgnore] = getWatchPaths(myPluginRelativePath)

    expect(filesToIgnore).toContain('build.js')

    setCwd('test/fixture/my-plugin')

    // Restore files entry.
    writeFile('package.json', { ...pkg, files: filesEntry }, { json: true })
})

test('App dependencies are installed if missing when using npx.', () => {
    setCwd('test/fixture/my-app')

    installAppDependencies()

    // npm install done.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules'))).toEqual(true)
    expect(existsSync(join(CWD, 'test/fixture/my-app/package-lock.json'))).toEqual(true)
    // Dependencies installed.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/react'))).toEqual(true)
})

test(`Reinstalls if dependencies are out-of-date.`, () => {
    setCwd('test/fixture/my-app')
    installAppDependencies()

    // Dependencies installed.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/react'))).toEqual(true)

    const initialReactVersion = readFile('node_modules/react/package.json', { json: true }).version

    // Installing an old react version.
    childProcess.execSync(`npm install --no-save react@15`, {
        cwd: process.cwd(),
        stdio: 'ignore',
    })

    const downgradedReactVersion = readFile('node_modules/react/package.json', { json: true }).version

    expect(initialReactVersion).not.toEqual(downgradedReactVersion)

    installAppDependencies()

    const upgradedReactVersion = readFile('node_modules/react/package.json', { json: true }).version

    expect(upgradedReactVersion).toEqual(initialReactVersion)
})

test(`Plugin including it's dependencies is installed.`, async () => {
    setCwd('test/fixture/my-app')
    await installWithoutSave([myPluginRelativePath])

    // Plugin installed.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/my-plugin'))).toEqual(true)
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/my-plugin/index.js'))).toEqual(true)
    // Plugin dependencies installed.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/webpack'))).toEqual(true)

    // Tarballs are removed.
    expect(readdirSync(process.cwd()).filter((filePath) => filePath.endsWith('.tgz')).length).toEqual(0)
})

test('Everything is installed.', async () => {
    setCwd('test/fixture/my-app')
    installAppDependencies()
    await installWithoutSave([myPluginRelativePath])

    // npm install done.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules'))).toEqual(true)
    expect(existsSync(join(CWD, 'test/fixture/my-app/package-lock.json'))).toEqual(true)
    // Plugin installed.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/my-plugin'))).toEqual(true)
    // Dependencies installed.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/react'))).toEqual(true)
    // Plugin dependencies installed.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/webpack'))).toEqual(true)
})
