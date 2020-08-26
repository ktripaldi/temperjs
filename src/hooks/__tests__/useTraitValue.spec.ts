import { act, renderHook } from '@testing-library/react-hooks'
import storeActions, { SetterHelpers } from '../../services/store' // We will call `storeActions` methods directly to check the results of `useTraitsValue`
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
    storeActions.setTrait('testPath1', testValue2)
    expect(result.current).toEqual(testValue2.toUpperCase())
  })
})
