import { existsSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'
import { writeFile, readFile } from './utility/file.js'
import { watchLocalDependencies, installAppDependencies, installWithoutSave } from '../utility.js'

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

const wait = time => new Promise((done) => setTimeout(done, time * 1000))

test('Watcher copies over changed file.', async () => {
    setCwd('test/fixture/my-app')

    installAppDependencies()
    await installWithoutSave([myPluginRelativePath])

    // Watcher will stay running during the below statements.
    const stopWatching = watchLocalDependencies([myPluginRelativePath])

    const indexPath = 'node_modules/my-plugin/index.js'
    const indexSourcePath = '../my-plugin/index.js'

    expect(existsSync(join(process.cwd(), indexPath))).toEqual(true)

    const initialContents = readFile(indexPath)

    const newContents = `console.log('changed')`

    writeFile(indexSourcePath, newContents)

    expect(readFile(indexSourcePath)).toEqual(newContents)

    // Wait for some time so watcher thread can complete it's task.
    // Requires quite some time to actually copy the files.
    await wait(20)

    expect(readFile(indexPath)).toEqual(newContents)
    expect(readFile(indexPath)).not.toEqual(initialContents)

    stopWatching()

    // Restore initial plugin state.
    writeFile(indexSourcePath, initialContents)
})
