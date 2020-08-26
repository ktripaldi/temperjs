import { act, renderHook } from '@testing-library/react-hooks'
import storeActions from '../../services/store' // We will call `storeActions` methods directly to check the results of `useTrait`
import MESSAGES from '../../config/messages'
import useTrait from '../useTrait'

describe('useTrait', () => {
  beforeAll(() => {
    storeActions.create()
    spyOn(console, 'error')
  })

  it(`should throw an error, if no path is specified`, () => {
    // @ts-ignore
    const { result } = renderHook(() => useTrait())
    expect(result.error.message).toEqual(MESSAGES.ERRORS.PATH_NO_STRING)
  })

  it(`should throw an error, if path is an empty a string`, () => {
    const { result } = renderHook(() => useTrait(''))
    expect(result.error.message).toEqual(MESSAGES.ERRORS.PATH_EMPTY_STRING)
  })

  it(`should return an array of two elements, the Trait value and an updater function`, () => {
    const testValue1 = 'testValue1'
    storeActions.setTrait<typeof testValue1>('testTraitPath', testValue1)
    const { result } = renderHook(() => useTrait('testTraitPath'))
    const [traitValue, traitUpdater] = result.current
    expect(traitValue).toEqual(testValue1)
    expect(typeof traitUpdater).toBe('function')
    const testValue2 = 'testValue2'
    act(() => traitUpdater(testValue2))
    const updatedTraitValue = result.current[0]
    expect(updatedTraitValue).toEqual(testValue2)
  })
})
