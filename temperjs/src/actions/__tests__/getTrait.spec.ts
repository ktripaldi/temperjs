import { storeActions } from 'temperjs-store' // We will call `storeActions` methods directly to check the results of `getTrait`
import getTrait from '../getTrait'

describe('The action getTrait', () => {
  it(`should return the same value of storeActions.getTrait`, () => {
    storeActions.create()
    storeActions.setTrait<number>('testPath', 1)
    expect(getTrait('testPath')).toEqual(storeActions.getTrait('testPath'))
  })
})
