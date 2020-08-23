import storeActions from '../store'

const randomValues = [
  'test',
  1,
  { key: 1 },
  [1, 2, 3],
  false,
  null,
  ({ get }: { get: (path: string) => number }) => get('baseTraitPath1') * 2
]

describe('The Store', () => {
  beforeAll(() => spyOn(console, 'error'))
  beforeEach(() => {
    storeActions.create()
    // Sets some supporting Traits
    storeActions.setTrait('baseTraitPath1', 1)
  })
  afterEach(() => storeActions.destroy())

  it('should throw an error, if you try to set a Trait with no path', () => {
    expect(() => {
      // @ts-ignore
      storeActions.setTrait()
    }).toThrowError()
  })

  it('should throw an error, if you try to set a Trait with an empty path', () => {
    expect(() => {
      storeActions.setTrait('', 'testValue')
    }).toThrowError()
  })

  it('should create a new Trait and set its value, if the Trait does not exist', () => {
    const testValue = 'testValue'
    // Root Trait
    storeActions.setTrait('testPath', testValue)
    expect(storeActions.getTrait('testPath')).toEqual(testValue)
    // Sub Trait
    storeActions.setTrait('testPath1.testPath2', testValue)
    expect(storeActions.getTrait('testPath1.testPath2')).toEqual(testValue)
  })

  it('should update the Trait value, if the Trait already exists', () => {
    // With an immutable value
    storeActions.setTrait('testTraitPath1', 'testValue1')
    const testValue1 = 'testValue2'
    storeActions.setTrait('testTraitPath1', testValue1)
    expect(storeActions.getTrait('testTraitPath1')).toEqual(testValue1)
    // With a mutable value
    storeActions.setTrait('testTraitPath2', { key1: { key2: 'testValue3' } })
    const testValue2 = { key1: { key2: 'testValue4' } }
    storeActions.setTrait('testTraitPath2', testValue2)
    expect(storeActions.getTrait('testTraitPath2')).toEqual(testValue2)
  })

  it('should do nothing, if you try to update an existing Trait with the same value', () => {
    randomValues.forEach((testValue, index) => {
      storeActions.setTrait(`testTraitPath${index}`, testValue)
      const traitValue1 = storeActions.getTrait(`testTraitPath${index}`)
      // I need to pass a copy of the same value, so I'll duplicate the array of randomValues and keep the same index
      storeActions.setTrait(
        `testTraitPath${index}`,
        randomValues.slice()[index]
      )
      const traitValue2 = storeActions.getTrait(`testTraitPath${index}`)
      expect(traitValue1).toEqual(traitValue2)
    })
  })

  it('should throw an error, if you try to change the type of an existing Trait', () => {
    storeActions.setTrait('testTraitPath', 'testValue')
    expect(() => {
      storeActions.setTrait('testTraitPath', false)
    }).toThrowError()
  })

  it('should let you set to `undefined` the value of an existing Trait', () => {
    storeActions.setTrait('testTraitPath', 'testValue1')
    storeActions.setTrait('testTraitPath', undefined)
    expect(storeActions.getTrait('testTraitPath')).toEqual(undefined)
  })

  it('should update the Trait value, if TraitValue is an updater', () => {
    const testValue = 'testValue'
    storeActions.setTrait('testTraitPath', testValue)
    storeActions.setTrait('testTraitPath', ({ value }: { value: string }) =>
      value.toUpperCase()
    )
    expect(storeActions.getTrait('testTraitPath')).toEqual(
      testValue.toUpperCase()
    )
  })

  it('should let you set an alternative path separator', () => {
    // A default store is created before each test, so we need to destroy it first
    storeActions.destroy()
    // Here we create a new store with the custom path separator
    storeActions.create({ pathSeparator: '>' })
    const testValue = 'testValue'
    storeActions.setTrait(
      'testTraitPathSeparator1>testTraitPathSeparator2',
      testValue
    )
    expect(storeActions.getTrait('testTraitPathSeparator1')).toEqual({
      testTraitPathSeparator2: testValue
    })
    expect(
      storeActions.getTrait('testTraitPathSeparator1>testTraitPathSeparator2')
    ).toEqual(testValue)
  })

  it('should create a selector, if TraitValue is a callback', () => {
    // Some test values
    const testValue1 = 5
    const testValue2 = 10
    const multiplier = 2
    storeActions.setTrait('baseTraitPath1', testValue1)
    storeActions.setTrait('baseTraitPath2.baseTraitPath3', testValue1)

    // We'll create two selectors, one based on Trait `baseTraitPath1` and another one based on Trait `baseTraitPath2//baseTraitPath`
    // Selector based on Trait `baseTraitPath1`
    storeActions.setTrait(
      'testTraitPath1',
      ({ get }: { get: (path: string) => number }) =>
        get('baseTraitPath1') * multiplier
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

    // Selector based on Trait `baseTraitPath2//baseTraitPath`
    storeActions.setTrait(
      'testTraitPath2',
      ({ get }: { get: (path: string) => number }) =>
        get('baseTraitPath2.baseTraitPath3') * multiplier
    )
    // Since `testTraitPath2` is a selector, it is expected to return its value based on the one of `baseTraitPath2//baseTraitPath`
    expect(storeActions.getTrait('testTraitPath2')).toEqual(
      testValue1 * multiplier
    )
    // If `baseTraitPath1` value changes, `testTraitPath2` is expected to update accordingly
    storeActions.setTrait('baseTraitPath2.baseTraitPath3', testValue2)
    expect(storeActions.getTrait('testTraitPath2')).toEqual(
      testValue2 * multiplier
    )
  })

  it('should throw an error, if you try to subscribe to a Trait with an empty path', () => {
    storeActions.setTrait('testTraitPath', 'testValue')
    expect(() => {
      storeActions.subscribeToTrait('', () => false)
    }).toThrowError()
  })

  it('should throw an error, if you try to subscribe to a Trait with no callback', () => {
    storeActions.setTrait('testTraitPath', 'testValue')
    expect(() => {
      // @ts-ignore
      storeActions.subscribeToTrait('testTraitPath')
    }).toThrowError()
  })

  it('should let you subscribe to a Trait', () => {
    // With an immutable value
    storeActions.setTrait('testTraitPath1', 'testValue')
    let testState1
    const callback1 = (value: unknown) => (testState1 = value)
    storeActions.subscribeToTrait('testTraitPath1', callback1)
    const testValue1 = 'testValue2'
    storeActions.setTrait('testTraitPath1', testValue1)
    expect(testState1).toEqual(testValue1)
    // With a mutable value
    storeActions.setTrait('testTraitPath2', { key1: { key2: 'testValue3' } })
    let testState2
    const callback2 = (value: unknown) => (testState2 = value)
    storeActions.subscribeToTrait('testTraitPath2', callback2)
    const testValue2 = { key1: { key2: 'testValue4' } }
    storeActions.setTrait('testTraitPath2', testValue2)
    expect(testState2).toEqual(testValue2)
  })

  it('should let you subscribe to a non existing Trait', () => {
    let testState
    const callback = (value: unknown) => (testState = value)
    storeActions.subscribeToTrait('testTraitPath', callback)
    const testValue = 'testValue2'
    storeActions.setTrait('testTraitPath', testValue)
    expect(testState).toEqual(testValue)
  })

  it('should let you set a storage service', () => {
    // A default store is created before each test, so we need to destroy it first
    storeActions.destroy()
    const testStoredValue = 'testStoredValue'
    const storageService = {
      get: jest.fn().mockReturnValue(testStoredValue),
      set: jest.fn(),
      clear: jest.fn()
    }
    // Here we create a new store with the storage service
    storeActions.create({ storageService })
    // When a Trait is set or updated, it should call the storage service to save the new value
    const testValue1 = 'testValue1'
    storeActions.setTrait('testTraitPath', testValue1)
    expect(storageService.set).toHaveBeenCalled()
    const testValue2 = 'testValue2'
    storeActions.setTrait('testTraitPath', testValue2)
    expect(storageService.set).toHaveBeenCalled()
    // If a Trait doesn't exist, it should call the storage service to check if there's saved version
    const nonExistingTrait = storeActions.getTrait('testNonExistingTrait')
    expect(storageService.get).toHaveBeenCalled()
    expect(nonExistingTrait).toEqual(testStoredValue)
    // When a trait is set to undefined, it should call the storage service to clear the value
    storeActions.setTrait('testTraitPath', undefined)
    expect(storageService.clear).toHaveBeenCalled()
  })
})
