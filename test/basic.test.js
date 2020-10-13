import { join } from 'path'
import rimraf from 'rimraf'
import { getLocalDependencies } from '../utility.js'

const CWD = process.cwd()
const cwdSpy = jest.spyOn(process, 'cwd')

beforeEach(() => {
    rimraf.sync(join(CWD, 'test/fixure/my-app/node_modules'))
    rimraf.sync(join(CWD, 'test/fixure/my-app/package-lock.json'))

    rimraf.sync(join(CWD, 'test/fixure/my-plugin/node_modules'))
    rimraf.sync(join(CWD, 'test/fixure/my-plugin/package-lock.json'))
})

test('Correctly reads local dependencies from app.', () => {
    const fixturePath = join(CWD, 'test/fixture/my-app')
    cwdSpy.mockReturnValue(fixturePath)

    const localDependencies = getLocalDependencies()

    expect(localDependencies).toEqual(['../my-plugin'])
})
