import { act, renderHook } from '@testing-library/react-hooks'
import storeActions from '../../services/store' // We will call `storeActions` methods directly to check the results of `useTraitsValue`
import { LoadableState, SetterHelpers } from '../..'
import useTraitValue from '../useTraitValue'

// Sets some random Trait values
const randomValues = ['test', 1, { key: 2 }, false, null, new Map()]

describe('The hook `useTraitValue`', () => {
  beforeEach(() => storeActions.create())
  afterEach(() => storeActions.destroy())

  it(`should return the current value of a Trait, at the first usage`, () => {
    randomValues.forEach((testValue, index) => {
      storeActions.setTrait<typeof testValue>(`testPath${index}`, testValue)
      const { result } = renderHook(() => useTraitValue(`testPath${index}`))
      expect(result.current).toEqual(storeActions.getTrait(`testPath${index}`))
    })
  })

  it(`should return the updated value of a Trait, when the Trait value changes`, () => {
    storeActions.setTrait('testPath', 'testValue')
    const testValue = 'testValue2'
    const { result } = renderHook(() => useTraitValue('testPath'))
    act(() => {
      storeActions.setTrait<typeof testValue>('testPath', testValue)
    })
    expect(result.current).toEqual(testValue)
  })

  it(`should return the updated value of a Trait (shallow copy), when a sub Trait value changes`, () => {
    const testValue = { key1: { key2: 'testValue' } }
    storeActions.setTrait<typeof testValue>('testPath', testValue)
    const testValue2 = 'testValue2'
    const { result } = renderHook(() => useTraitValue('testPath'))
    act(() => {
      storeActions.setTrait<typeof testValue2>('testPath.key1.key2', testValue2)
    })
    expect(result.current).toEqual({ key1: { key2: testValue2 } })
    expect(result.current).not.toBe(testValue)
  })

  it(`should return the updated value of a Trait, if the Trait is a selector and the base Trait value changes`, () => {
    const testValue1 = 'testValue1'
    const testValue2 = 'testValue2'
    storeActions.setTrait<typeof testValue1>('testPath1', testValue1)
    storeActions.setTrait<string>(
      'testPath2',
      ({ get }: SetterHelpers<string>) =>
        (get('testPath1') as string).toUpperCase()
    )
    const { result } = renderHook(() => useTraitValue('testPath2'))
    act(() => {
      storeActions.setTrait('testPath1', testValue2)
    })
    expect(result.current).toEqual(testValue2.toUpperCase())
  })

  it(`should let you subscribe to a Trait specifying a default value`, () => {
    storeActions.create()
    const testDefaultValue = 'testValue'
    // If the Trait is undefined, we should get the default value
    const { result: result1 } = renderHook(() =>
      useTraitValue('testPath1', { default: testDefaultValue })
    )
    expect(result1.current).toEqual(testDefaultValue)
    // In the case we also want the default value to be become the actual value of the Trait
    expect(storeActions.getTrait('testPath1')).toEqual(testDefaultValue)

    // If the Trait already exists and has a value, we should get the actual value
    const testValue = 'testValue'
    storeActions.setTrait('testPath2', testValue)
    const { result: result2 } = renderHook(() =>
      useTraitValue('testPath2', { default: testDefaultValue })
    )
    expect(result2.current).toEqual(testValue)
    // In the case we don't want the actual value of the Trait to change
    expect(storeActions.getTrait('testPath2')).toEqual(testValue)
  })

  it(`should return a Loadable Trait, if you subscribe with the option 'loadable' set to true`, () => {
    storeActions.create()
    const testPromiseValue = new Promise(resolve => {
      resolve('testValue')
    })
    storeActions.setTrait('testPath', testPromiseValue)
    const { result } = renderHook(() =>
      useTraitValue('testPath', { loadable: true })
    )
    expect(result.current).toEqual({
      state: LoadableState.LOADING,
      value: testPromiseValue
    })
  })

  it(`should return a resolved value, if the Loadable Trait unwraps correctly`, done => {
    storeActions.create()
    const testValue = 'testValue'
    const testPromiseValue = new Promise(resolve => {
      resolve(testValue)
    })
    storeActions.setTrait('testPath', testPromiseValue)
    const { result } = renderHook(() =>
      useTraitValue('testPath', { loadable: true })
    )
    setTimeout(() => {
      expect(result.current).toEqual({
        state: LoadableState.HAS_VALUE,
        value: testValue
      })
      done()
    }, 100)
  })

  it(`should return an error, if the Loadable Trait fails to unwrap`, done => {
    storeActions.create()
    const testError = Error('Promise has been rejected')
    const testPromiseValue = new Promise((_, reject) => {
      reject(testError)
    })
    storeActions.setTrait('testPath', testPromiseValue)
    const { result } = renderHook(() =>
      useTraitValue('testPath', { loadable: true })
    )
    setTimeout(() => {
      expect(result.current).toEqual({
        state: LoadableState.HAS_ERROR,
        value: testError
      })
      done()
    }, 100)
  })
})
