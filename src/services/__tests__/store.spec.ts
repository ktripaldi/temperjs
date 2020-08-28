import storeActions, { format, SetterHelpers } from '../store'
import { Loadable, LoadableState } from '../../utils/rxSubject'
import MESSAGES from '../../config/messages'

interface MockStorageService {
  set?: (key: string, value: unknown) => void
  get?: (key: string) => unknown
  clear?: (key: string) => unknown
}

const testStoredValue = 'testStoredValue'

function mockStorageService(options?: {
  get?: boolean
  set?: boolean
  clear?: boolean
}): MockStorageService {
  return {
    get:
      options?.get !== false
        ? jest.fn().mockReturnValue(testStoredValue)
        : undefined,
    set: options?.set !== false ? jest.fn() : undefined,
    clear: options?.clear !== false ? jest.fn() : undefined
  }
}

const randomValues = ['test', 1, { key: 1 }, [1, 2, 3], false, null]

describe('The Store', () => {
  afterEach(() => storeActions.destroy())

  it(`should throw an error, if you try to set or get a Trait with no path`, () => {
    storeActions.create()
    expect(() => {
      // @ts-ignore
      storeActions.setTrait<unknown>()
    }).toThrow(MESSAGES.ERRORS.PATH_NO_STRING)
    expect(() => {
      // @ts-ignore
      storeActions.getTrait()
    }).toThrow(MESSAGES.ERRORS.PATH_NO_STRING)
  })

  it(`should throw an error, if you try to set or get a Trait with an empty path`, () => {
    storeActions.create()
    expect(() => {
      const testValue = 'testValue'
      storeActions.setTrait<typeof testValue>('', testValue)
    }).toThrow(MESSAGES.ERRORS.PATH_EMPTY_STRING)
    expect(() => {
      storeActions.getTrait('')
    }).toThrow(MESSAGES.ERRORS.PATH_EMPTY_STRING)
  })

  it(`should throw an error, if you try to set or get a Trait without creating the store`, () => {
    const testValue = 'testValue'
    expect(() =>
      storeActions.setTrait<typeof testValue>('testPath', testValue)
    ).toThrow(MESSAGES.ERRORS.NO_STORE_FOUND)
    expect(() => storeActions.getTrait('testPath')).toThrow(
      MESSAGES.ERRORS.NO_STORE_FOUND
    )
  })

  it(`should create a new Trait and set its value, if the Trait does not exist`, () => {
    storeActions.create()
    const testValue = 'testValue'
    // Root Trait
    storeActions.setTrait<typeof testValue>('testPath', testValue)
    expect(storeActions.getTrait('testPath')).toEqual(testValue)
    // Sub Trait
    storeActions.setTrait<typeof testValue>('testPath1.testPath2', testValue)
    expect(storeActions.getTrait('testPath1.testPath2')).toEqual(testValue)
  })

  it(`should create a new Trait by passing a callback`, () => {
    storeActions.create()
    const testValue = 5
    const testCallback = () => Math.pow(testValue, 2)
    storeActions.setTrait<number>('testPath', testCallback)
    expect(storeActions.getTrait('testPath')).toEqual(Math.pow(testValue, 2))
  })

  it(`should create a new Trait by passing an async callback`, () => {
    storeActions.create()
    const testValue = 5
    const testPromise = new Promise(resolve => resolve(testValue))
    const testCallback = async (): Promise<number> =>
      Math.pow((await testPromise) as number, 2)
    storeActions.setTrait<Promise<number>>('testPath', testCallback)
    expect(storeActions.getTrait('testPath') instanceof Promise).toBeTruthy()
  })

  it(`should log when a Trait is set, if you have the debug enabled`, () => {
    const consoleSpy = jest.spyOn(console, 'log')
    storeActions.create({ debug: true })
    const testValue = 'testValue'
    // Root Trait
    storeActions.setTrait<typeof testValue>('testPath', testValue)
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.TRAIT_CREATED, 'testPath'),
      testValue
    )
    // Sub Trait
    storeActions.setTrait<typeof testValue>('testPath1.testPath2', testValue)
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.TRAIT_CREATED, 'testPath'),
      testValue
    )
    consoleSpy.mockClear()
  })

  it(`should update the Trait value, if the Trait already exists`, () => {
    storeActions.create()
    // With an immutable value
    const testValue1 = 'testValue1'
    storeActions.setTrait<typeof testValue1>('testPath1', testValue1)
    const testValue2 = 'testValue2'
    storeActions.setTrait<typeof testValue2>('testPath1', testValue2)
    expect(storeActions.getTrait('testPath1')).toEqual(testValue2)
    // With a mutable value
    const testValue3 = { key1: { key2: 'testValue3' } }
    storeActions.setTrait<typeof testValue3>('testPath2', testValue3)
    const testValue4 = { key1: { key2: 'testValue4' } }
    storeActions.setTrait<typeof testValue4>('testPath2', testValue4)
    expect(storeActions.getTrait('testPath2')).toEqual(testValue4)
  })

  it(`should log when a Trait is updated, if you have the debug enabled`, () => {
    const consoleSpy = jest.spyOn(console, 'log')
    storeActions.create({ debug: true })
    // With an immutable value
    const testValue1 = 'testValue1'
    storeActions.setTrait<typeof testValue1>('testPath1', testValue1)
    const testValue2 = 'testValue2'
    storeActions.setTrait<typeof testValue2>('testPath1', testValue2)
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.TRAIT_UPDATED, 'testPath1'),
      testValue2
    )
    // With a mutable value
    const testValue3 = { key1: { key2: 'testValue3' } }
    storeActions.setTrait<typeof testValue3>('testPath2', testValue3)
    const testValue4 = { key1: { key2: 'testValue4' } }
    storeActions.setTrait<typeof testValue4>('testPath2', testValue4)
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.TRAIT_UPDATED, 'testPath2'),
      testValue4
    )
    consoleSpy.mockClear()
  })

  it(`should do nothing, if you try to update an existing Trait with the same value`, () => {
    storeActions.create()
    storeActions.setTrait<number>('basePath1', 1)
    randomValues.forEach((testValue, index) => {
      storeActions.setTrait<typeof testValue>(`testPath${index}`, testValue)
      const traitValue1 = storeActions.getTrait(`testPath${index}`)
      // I need to pass a copy of the same value, so I'll duplicate the array of randomValues and keep the same index
      const testValueCopy = randomValues.slice()[index]
      storeActions.setTrait<typeof testValueCopy>(
        `testPath${index}`,
        testValueCopy
      )
      const traitValue2 = storeActions.getTrait(`testPath${index}`)
      expect(traitValue1).toEqual(traitValue2)
    })
  })

  it(`should throw an error, if you try to change the type of an existing Trait`, () => {
    storeActions.create()
    const baseValue = 'testValue'
    const differentTypeValue = false
    storeActions.setTrait<typeof baseValue>('testPath', baseValue)
    expect(() => {
      storeActions.setTrait<typeof differentTypeValue>(
        'testPath',
        differentTypeValue
      )
    }).toThrow(
      format(
        MESSAGES.ERRORS.TRAIT_WRONG_TYPE,
        'testPath',
        typeof baseValue,
        typeof differentTypeValue
      )
    )
  })

  it(`should let you set to 'undefined' the value of an existing Trait`, () => {
    storeActions.create()
    const testValue = 'testValue'
    storeActions.setTrait<typeof testValue>('testPath', testValue)
    storeActions.setTrait<undefined>('testPath', undefined)
    expect(storeActions.getTrait('testPath')).toEqual(undefined)
  })

  it(`should update the Trait value, if TraitValue is an updater`, () => {
    storeActions.create()
    const testValue = 'testValue'
    storeActions.setTrait<typeof testValue>('testPath', testValue)
    storeActions.setTrait<string>(
      'testPath',
      ({ value }: SetterHelpers<string>) => value.toUpperCase()
    )
    expect(storeActions.getTrait('testPath')).toEqual(testValue.toUpperCase())
  })

  it(`should return a Loadable Trait, if you subscribe with the option 'getLoadable' set to true`, () => {
    storeActions.create()
    const testPromiseValue = new Promise(resolve => {
      resolve('testValue')
    })
    const callback = jest.fn()
    storeActions.subscribeToTrait<Loadable<string>>('testPath', callback, {
      getLoadable: true
    })
    storeActions.setTrait('testPath', testPromiseValue)
    expect(callback).toHaveBeenLastCalledWith({
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
    const callback = jest.fn()
    storeActions.subscribeToTrait<Loadable<string>>('testPath', callback, {
      getLoadable: true
    })
    storeActions.setTrait('testPath', testPromiseValue)
    setTimeout(() => {
      expect(callback).toHaveBeenLastCalledWith({
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
    const callback = jest.fn()
    storeActions.subscribeToTrait<Loadable<string>>('testPath', callback, {
      getLoadable: true
    })
    storeActions.setTrait('testPath', testPromiseValue)
    setTimeout(() => {
      expect(callback).toHaveBeenLastCalledWith({
        state: LoadableState.HAS_ERROR,
        value: testError
      })
      done()
    }, 100)
  })

  it(`should let you set an alternative path separator`, () => {
    storeActions.create({ pathSeparator: '>' })
    const testValue = 'testValue'
    storeActions.setTrait<typeof testValue>('testPath1>testPath2', testValue)
    expect(storeActions.getTrait('testPath1')).toEqual({
      testPath2: testValue
    })
    expect(storeActions.getTrait('testPath1>testPath2')).toEqual(testValue)
  })

  it(`should create a selector and dispatch its updates, if TraitValue is a callback that refers another Trait`, () => {
    storeActions.create()
    // Some test values
    const testValue1 = 5
    const testValue2 = 10
    const testValue3 = 15
    const multiplier = 2
    storeActions.setTrait<typeof testValue1>('basePath1', testValue1)
    storeActions.setTrait<typeof testValue1>('basePath2.basePath3', testValue1)

    // We'll create two selectors, one based on Trait `basePath1` and another one based on Trait `basePath2//basePath`
    // Selector based on Trait `basePath1`
    storeActions.setTrait<number>(
      'testPath1',
      ({ get }: SetterHelpers<number>) =>
        (get('basePath1') as number) * multiplier
    )
    // Since `testPath1` is a selector, it is expected to return its value based on the one of `basePath1`
    expect(storeActions.getTrait('testPath1')).toEqual(testValue1 * multiplier)
    const callback1 = jest.fn()
    storeActions.subscribeToTrait<number>('testPath1', callback1)
    // If `basePath1` value changes, `testPath1` is expected to update accordingly
    storeActions.setTrait<typeof testValue2>('basePath1', testValue2)
    // We can verify this checking the last call to the subscribed callback
    expect(callback1).toHaveBeenLastCalledWith(testValue2 * multiplier)
    // Or retrieving the updated value directly from the store
    expect(storeActions.getTrait('testPath1')).toEqual(testValue2 * multiplier)

    // Selector based on Trait `basePath2//basePath`
    storeActions.setTrait<number>(
      'testPath2',
      ({ get }: SetterHelpers<number>) =>
        (get('basePath2.basePath3') as number) * multiplier
    )
    // Since `testPath2` is a selector, it is expected to return its value based on the one of `basePath2//basePath`
    expect(storeActions.getTrait('testPath2')).toEqual(testValue1 * multiplier)
    const callback2 = jest.fn()
    storeActions.subscribeToTrait<number>('testPath2', callback2)
    // If `basePath2.basePath3` value changes, `testPath2` is expected to update accordingly
    storeActions.setTrait<typeof testValue2>('basePath2.basePath3', testValue2)
    // We can verify this checking the last call to the subscribed callback
    expect(callback2).toHaveBeenLastCalledWith(testValue2 * multiplier)
    // Or retrieving the updated value directly from the store
    expect(storeActions.getTrait('testPath2')).toEqual(testValue2 * multiplier)

    // Selector based on Selector `testPath2`
    storeActions.setTrait<number>(
      'testPath3',
      ({ get }: SetterHelpers<number>) =>
        Math.pow(get('testPath2') as number, 2)
    )
    // Since `testPath3` is a selector, it is expected to return its value based on the one of `testPath3`
    expect(storeActions.getTrait('testPath3')).toEqual(
      Math.pow(testValue2 * multiplier, 2)
    )
    const callback3 = jest.fn()
    storeActions.subscribeToTrait<number>('testPath3', callback3)
    // If `basePath2.basePath3` value changes, `testPath2`, hence `testPath3` too, are expected to update accordingly
    storeActions.setTrait<typeof testValue3>('basePath2.basePath3', testValue3)
    // We can verify this checking the last call to the subscribed callback
    expect(callback3).toHaveBeenLastCalledWith(
      Math.pow(testValue3 * multiplier, 2)
    )
    // Or retrieving the updated value directly from the store
    expect(storeActions.getTrait('testPath3')).toEqual(
      Math.pow(testValue3 * multiplier, 2)
    )
  })

  it(`should cache the value of a selector and update it only if a dependency changes`, () => {
    storeActions.create()
    const selectorCallback = jest.fn()
    selectorCallback.mockResolvedValue(10)
    storeActions.setTrait<string>('basePath', 'testValue1')
    storeActions.setTrait<number>(
      'selectorPath',
      ({ get }: SetterHelpers<number>) => selectorCallback(get('basePath'))
    )
    selectorCallback.mockClear()
    // If I ask for a selector value or subscribe to it, I should get the cached value
    storeActions.getTrait('selectorPath')
    storeActions.subscribeToTrait('selectorPath', () => {})
    expect(selectorCallback).toHaveBeenCalledTimes(0)
    // If any of the selector dependencies changes, the selector should be recomputed
    storeActions.setTrait<string>('basePath', 'testValue2')
    expect(selectorCallback).toHaveBeenCalledTimes(1)
  })

  it(`should let you update a selector and the previous dependencies should should no longer have effect`, () => {
    storeActions.create()
    const selectorCallback = jest.fn()
    storeActions.setTrait<string>('basePath1', 'testValue1')
    storeActions.setTrait<string>('basePath2', 'testValue2')
    storeActions.setTrait<number>(
      'selectorPath',
      ({ get }: SetterHelpers<number>) => selectorCallback(get('basePath1'))
    )
    storeActions.setTrait<number>(
      'selectorPath',
      ({ get }: SetterHelpers<number>) => selectorCallback(get('basePath2'))
    )
    selectorCallback.mockClear()
    // If you update the old dependency, the selector shouldn't update anymore
    storeActions.setTrait<string>('basePath1', 'testValue3')
    expect(selectorCallback).toHaveBeenCalledTimes(0)
    // On the contrary, if you update the new dependency, the selector should update
    storeActions.setTrait<string>('basePath2', 'testValue4')
    expect(selectorCallback).toHaveBeenCalledTimes(1)
  })

  it(`should log when a selector is updated, if you have the debug enabled`, () => {
    const consoleSpy = jest.spyOn(console, 'log')
    storeActions.create({ debug: true })
    // Some test values
    const testValue1 = 5
    const testValue2 = 10
    const multiplier = 2
    storeActions.setTrait<typeof testValue1>('basePath', testValue1)
    storeActions.setTrait<number>(
      'selectorPath',
      ({ get }: SetterHelpers<number>) =>
        (get('basePath') as number) * multiplier
    )
    storeActions.subscribeToTrait('selectorPath', () => {})
    storeActions.setTrait<typeof testValue2>('basePath', testValue2)
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.SELECTOR_UPDATED, 'selectorPath', 'basePath'),
      testValue2 * multiplier
    )
    consoleSpy.mockClear()
  })

  it(`should throw an error, if you try to create a selector based on a Trait that doesn't exist`, () => {
    storeActions.create()
    expect(() =>
      storeActions.setTrait<unknown>(
        'testWrongSelector',
        ({ get }: SetterHelpers<unknown>) => get('testNoPath')
      )
    ).toThrow(format(MESSAGES.ERRORS.TRAIT_DOES_NOT_EXIST, 'testNoPath'))
  })

  it(`should throw an error, if you try to subscribe to a Trait with with no path`, () => {
    storeActions.create()
    const testValue = 'testValue'
    storeActions.setTrait<typeof testValue>('testPath', 'testValue')
    expect(() => {
      // @ts-ignore
      storeActions.subscribeToTrait<unknown>(() => {})
    }).toThrow(MESSAGES.ERRORS.PATH_NO_STRING)
  })

  it(`should throw an error, if you try to subscribe to a Trait with an empty path`, () => {
    storeActions.create()
    expect(() => {
      storeActions.subscribeToTrait<unknown>('', () => {})
    }).toThrow(MESSAGES.ERRORS.PATH_EMPTY_STRING)
  })

  it(`should throw an error, if you try to subscribe to a Trait with no callback`, () => {
    storeActions.create()
    expect(() => {
      // @ts-ignore
      storeActions.subscribeToTrait<unknown>('testPath')
    }).toThrow(MESSAGES.ERRORS.SUBSCRIPTION_NO_CALLBACK)
  })

  it(`should throw an error, if you try to subscribe to a Trait without creating the store`, () => {
    expect(() =>
      storeActions.subscribeToTrait<unknown>('testPath', () => {})
    ).toThrow(MESSAGES.ERRORS.NO_STORE_FOUND)
  })

  it(`should let you subscribe to a Trait`, () => {
    storeActions.create()
    // With an immutable value
    const testValue1 = 'testValue'
    storeActions.setTrait<typeof testValue1>('testPath1', testValue1)
    const callback1 = jest.fn()
    storeActions.subscribeToTrait<typeof testValue1>('testPath1', callback1)
    const testValue2 = 'testValue2'
    storeActions.setTrait<typeof testValue2>('testPath1', testValue2)
    expect(callback1).toHaveBeenLastCalledWith(testValue2)
    // With a mutable value
    const testValue3 = { key1: { key2: 'testValue3' } }
    storeActions.setTrait<typeof testValue3>('testPath2', testValue3)
    const callback2 = jest.fn()
    storeActions.subscribeToTrait<typeof testValue3>('testPath2', callback2)
    const testValue4 = { key1: { key2: 'testValue4' } }
    storeActions.setTrait<typeof testValue4>('testPath2', testValue4)
    expect(callback2).toHaveBeenLastCalledWith(testValue4)
  })

  it(`should let you subscribe to a non existing Trait`, () => {
    storeActions.create()
    const callback = jest.fn()
    storeActions.subscribeToTrait<unknown>('testPath', callback)
    const testValue = 'testValue2'
    storeActions.setTrait<typeof testValue>('testPath', testValue)
    expect(callback).toHaveBeenLastCalledWith(testValue)
  })

  it(`should let you set a storage service`, () => {
    const storageService = mockStorageService()
    // @ts-ignore
    storeActions.create({ storageService })
    // When a Trait is set or updated, it should call the storage service to save the new value
    const testValue1 = 'testValue1'
    storeActions.setTrait<typeof testValue1>('testPath', testValue1)
    expect(storageService.set).toHaveBeenCalled()
    const testValue2 = 'testValue2'
    storeActions.setTrait<typeof testValue2>('testPath', testValue2)
    expect(storageService.set).toHaveBeenCalled()
    // If a Trait doesn't exist, it should call the storage service to check if there's saved version
    const nonExistingTrait = storeActions.getTrait('testNoPath')
    expect(storageService.get).toHaveBeenCalled()
    expect(nonExistingTrait).toEqual(testStoredValue)
    // When a trait is set to undefined, it should call the storage service to clear the value
    storeActions.setTrait<undefined>('testPath', undefined)
    expect(storageService.clear).toHaveBeenCalled()
  })

  it(`should throw an error, if you set a storage service without a 'get' method and try to get a Trait that doesn't exist`, () => {
    const storageService = mockStorageService({ get: false })
    // @ts-ignore Here we create a new store with the storage service
    storeActions.create({ storageService })
    expect(() => storeActions.getTrait('testPath')).toThrow(
      MESSAGES.ERRORS.STORAGE_MISS_GET
    )
  })

  it(`should throw an error, if you set a storage service without a 'set' method and try to set a Trait`, () => {
    const storageService = mockStorageService({ set: false })
    // @ts-ignore
    storeActions.create({ storageService })
    expect(() => {
      const testValue = 'testValue'
      storeActions.setTrait<typeof testValue>('testPath', testValue)
    }).toThrow(MESSAGES.ERRORS.STORAGE_MISS_SET)
  })

  it(`should throw an error, if you set a storage service without a 'set' method and try to clear a Trait`, () => {
    const storageService = mockStorageService({ clear: false })
    // @ts-ignore
    storeActions.create({ storageService })
    expect(() =>
      storeActions.setTrait<undefined>('testPath', undefined)
    ).toThrow(MESSAGES.ERRORS.STORAGE_MISS_CLEAR)
  })

  it(`should log when a Trait is retrieved from the storage, if you have the debug enabled and a storage service set`, () => {
    const consoleSpy = jest.spyOn(console, 'log')
    const storageService = mockStorageService()
    // @ts-ignore
    storeActions.create({ storageService, debug: true })
    // The storage service should be called when you ask for a Trait that doesn't exist
    storeActions.getTrait('testPath')
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.STORAGE_IMPORTED, 'testPath'),
      testStoredValue
    )
    // or when you subscribe to a Trait that doesn't exist
    storeActions.subscribeToTrait('testPath', () => {})
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.STORAGE_IMPORTED, 'testPath'),
      testStoredValue
    )
    consoleSpy.mockClear()
  })

  it(`should log when a Trait is saved to the storage, if you have the debug enabled and a storage service set`, () => {
    const consoleSpy = jest.spyOn(console, 'log')
    const storageService = mockStorageService()
    // @ts-ignore
    storeActions.create({ storageService, debug: true })
    const testValue = 'testValue'
    storeActions.setTrait<typeof testValue>('testPath', testValue)
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.STORAGE_SAVED, 'testPath'),
      testValue
    )
    consoleSpy.mockClear()
  })

  it(`should log when a Trait is removed from the storage, if you have the debug enabled and a storage service set`, () => {
    const consoleSpy = jest.spyOn(console, 'log')
    const storageService = mockStorageService()
    // @ts-ignore
    storeActions.create({ storageService, debug: true })
    storeActions.setTrait<undefined>('testPath', undefined)
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.STORAGE_REMOVED, 'testPath'),
      ''
    )
    consoleSpy.mockClear()
  })
})
