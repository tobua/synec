/* eslint-env jest */
import { join } from 'path'
import { setup, reset } from './fixture.js'

export const prepare = (suiteName) => {
  // Waiting up to 5 minutes for async tests, npm install might take some time.
  jest.setTimeout(300000)

  const currentDirectorySpy = jest.spyOn(process, 'cwd')
  const setCwd = (_path) => currentDirectorySpy.mockReturnValue(_path)

  beforeAll(() => {
    // global.PATH can later be used in tests.
    global.PATH = setup(suiteName)
  })

  beforeEach(() => {
    setCwd(join(global.PATH, 'my-app'))
  })

  afterEach(() => reset(global.PATH))

  return [
    {
      first: '../my-plugin',
      second: 'my-second-plugin',
    },
    setCwd,
  ]
}
