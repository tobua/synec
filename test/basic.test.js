import { existsSync, readdirSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'
import { writeFile, readFile } from './utility/file.js'
import { getLocalDependencies, getWatchPaths, installWithoutSave } from '../utility.js'

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

test(`Plugin including it's dependencies is installed.`, async () => {
    setCwd('test/fixture/my-app')
    await installWithoutSave([myPluginRelativePath])

    // npm install done.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules'))).toEqual(true)
    // TODO expect(existsSync(join(CWD, 'test/fixture/my-app/package-lock.json'))).toEqual(true)
    // Plugin installed.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/my-plugin'))).toEqual(true)
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/my-plugin/index.js'))).toEqual(true)
    // Plugin dependencies installed.
    expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/webpack'))).toEqual(true)
    // App dependencies installed.
    // TODO expect(existsSync(join(CWD, 'test/fixture/my-app/node_modules/react'))).toEqual(true)

    // Tarballs are removed.
    expect(readdirSync(process.cwd()).filter((filePath) => filePath.endsWith('.tgz')).length).toEqual(0)
})
