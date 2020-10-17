import { existsSync } from 'fs'
import { join } from 'path'
import rimraf from 'rimraf'
import { writeFile, readFile } from './utility/file.js'
import { installWithoutSave } from '../utility.js'

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

test(`Plugin only reinstalled if hash is outdated.`, async () => {
    setCwd('test/fixture/my-app')
    const initialSourceContent = readFile('../my-plugin/index.js')

    // First install generates hash.
    await installWithoutSave([myPluginRelativePath])

    // Hash file has been generated.
    expect(existsSync(join(process.cwd(), 'node_modules/my-plugin/.synec-hash'))).toEqual(true)

    const fileContents = `please don't override me.`

    // We only modify the destination and not the source (which is hashed).
    writeFile('node_modules/my-plugin/index.js', fileContents)

    // No install required this time.
    await installWithoutSave([myPluginRelativePath])

    expect(readFile('node_modules/my-plugin/index.js')).toEqual(fileContents)

    const changedSourceContents = 'update is required.'

    // We modify the source and then check if it's installed.
    writeFile('../my-plugin/index.js', changedSourceContents)

    // This time an install is required.
    await installWithoutSave([myPluginRelativePath])

    expect(readFile('node_modules/my-plugin/index.js')).toEqual(changedSourceContents)

    // Restore initial state.
    writeFile('../my-plugin/index.js', initialSourceContent)
})
