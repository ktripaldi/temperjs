import { renderHook } from '@testing-library/react-hooks'
import storeActions from '../../services/store' // We will call `storeActions` methods directly to check the results of `useTrait`
import useTrait from '../useTrait'
import useTraitValue from '../useTraitValue'

describe('useTrait', () => {
  it(`should return an array of two elements, the result of useTraitValue and a reference to setTrait`, () => {
    storeActions.create()
    const testValue = 'testValue'
    const { result: result1 } = renderHook(() => useTrait('testPath'))
    const { result: result2 } = renderHook(() => useTraitValue('testPath'))
    expect(Array.isArray(result1.current)).toBeTruthy()
    expect(result1.current.length).toEqual(2)
    expect(result1.current[0]).toEqual(result2.current)
    expect(typeof result1.current[1] === 'function').toBeTruthy()
    console.log(result1.current[1](testValue))
    result1.current[1](testValue) // This should the same as calling setTrait('testPath', ...)
    expect(storeActions.getTrait('testPath')).toEqual(testValue)
  })
})
