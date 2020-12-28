import { storeActions } from 'temperjs-store' // We will call `storeActions` methods directly to check the results of `setTrait`
import setTrait from '../setTrait'

describe('The action setTrait', () => {
  beforeAll(() => spyOn(console, 'error'))
  beforeEach(() => storeActions.create())
  afterEach(() => storeActions.destroy())

  it(`should produce the same effect of storeActions.setTrait`, () => {
    const testValue = 'testValue'
    setTrait<typeof testValue>('testPath1', testValue)
    storeActions.setTrait<typeof testValue>('testPath2', testValue)
    expect(storeActions.getTrait('testPath1')).toEqual(
      storeActions.getTrait('testPath2')
    )
  })
})
