import storeActions, { SetterHelpers } from '../../services/store' // We will call `storeActions` methods directly to check the results of `setTrait`
import setTrait from '../setTrait'

describe('The action `setTrait`', () => {
  beforeAll(() => spyOn(console, 'error'))
  beforeEach(() => storeActions.create())
  afterEach(() => storeActions.destroy())

  it(`should throw an error, if no path is specified`, () => {
    expect(() => {
      // @ts-ignore
      setTrait({ testValue: 'testValue' })
    }).toThrowError()
  })

  it(`should throw an error, if path is an empty a string`, () => {
    expect(() => {
      setTrait('', 'testValue')
    }).toThrowError()
  })

  it(`should set the Trait value`, () => {
    const testValue = 'testValue'
    setTrait('testTraitPath', testValue)
    expect(storeActions.getTrait('testTraitPath')).toEqual(testValue)
  })

  it(`should update the Trait value, if traitValue is an updater`, () => {
    const testValue = 'testValue'
    storeActions.setTrait('testTraitPath', testValue)
    setTrait('testTraitPath', ({ value }: SetterHelpers<string>) =>
      value.toUpperCase()
    )
    expect(storeActions.getTrait('testTraitPath')).toEqual(
      testValue.toUpperCase()
    )
  })

  it(`should automatically create the wrapping objects if the the dot notation is used`, () => {
    const testValue = 'testValue'
    setTrait('testTraitPath.testKey', testValue)
    expect(storeActions.getTrait('testTraitPath')).toEqual({
      testKey: testValue
    })
  })

  it('should create a selector, if traitValue is a callback', () => {
    // Some test values
    const testValue1 = 5
    const testValue2 = 10
    const multiplier = 2
    storeActions.setTrait('baseTraitPath1', testValue1)
    storeActions.setTrait('baseTraitPath2.baseTraitPath3', testValue1)

    // We'll create two selectors, one based on Trait `baseTraitPath1` and another one based on Trait `baseTraitPath2.baseTraitPath3`
    // Selector based on Trait `baseMoodKey1`
    setTrait(
      'testTraitPath1',
      ({ get }: SetterHelpers<number>) =>
        (get('baseTraitPath1') as number) * multiplier
    )
    // Since `testTraitPath1` is a selector, it is expected to return its value based on the one of `baseTraitPath1`
    expect(storeActions.getTrait('testTraitPath1')).toEqual(
      testValue1 * multiplier
    )
    // If `baseTraitPath1` value changes, `testTraitPath1` is expected to update accordingly
    storeActions.setTrait('baseTraitPath1', testValue2)
    expect(storeActions.getTrait('testTraitPath1')).toEqual(
      testValue2 * multiplier
    )

    // Selector based on Trait `baseTraitPath2.baseTraitPath3`
    setTrait(
      'testMoodKey2',
      ({ get }: SetterHelpers<number>) =>
        (get('baseTraitPath2.baseTraitPath3') as number) * multiplier
    )
    // Since `testMoodKey2` is a selector, it is expected to return its value based on the one of `baseTraitPath2//baseTraitPath3`
    expect(storeActions.getTrait('testMoodKey2')).toEqual(
      testValue1 * multiplier
    )
    // If `baseTraitPath2` value changes, `testMoodKey2` is expected to update accordingly
    storeActions.setTrait('baseTraitPath2.baseTraitPath3', testValue2)
    expect(storeActions.getTrait('testMoodKey2')).toEqual(
      testValue2 * multiplier
    )
  })
})
