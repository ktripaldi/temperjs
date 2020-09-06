import storeActions, { format } from '../store'
import { SetterHelpers, StoreOptions } from '../..'
import MESSAGES from '../../config/messages'

function createStore(options?: StoreOptions) {
  storeActions.create(options)
  // Set some supporting Traits
  storeActions.setTrait('@baseNumberTrait', 5)
  storeActions.setTrait('@baseStringTrait', 'Test')
  storeActions.setTrait(
    '@baseSelectorTrait',
    ({ get }: SetterHelpers<unknown>): boolean =>
      (get('@baseNumberTrait') as number) < 10
  )
}

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
        ? jest.fn().mockImplementation(key => {
            if (key.indexOf('@') === -1) return testStoredValue
          })
        : undefined,
    set: options?.set !== false ? jest.fn() : undefined,
    clear: options?.clear !== false ? jest.fn() : undefined
  }
}

function randomNumber(): number {
  return Math.floor(Math.random() * 100)
}

function randomString(): string {
  return Math.random().toString(36)
}

const traitTrees = [
  'testPath1',
  'testPath2.testPath3',
  'testPath4.testPath5.testPath6',
  'testPath7.testPath8.testPath9.testPath10'
]

const testSelectors: unknown[] = [
  ({ get }: SetterHelpers<number>): number =>
    Math.pow(get('@baseNumberTrait') as number, 2) * Math.PI,
  ({ get }: SetterHelpers<string>): string =>
    (get('@baseStringTrait') as string).toUpperCase(),
  ({ get }: SetterHelpers<boolean>): string =>
    (get('@baseSelectorTrait') as boolean)
      ? (get('@baseStringTrait') as string).toUpperCase()
      : (get('@baseStringTrait') as string).toLowerCase()
]

function getRandomValues(nth: number): unknown[] {
  const fixedRandomNumber = randomNumber()
  return [
    randomString(),
    randomNumber(),
    { key: 1, key2: { key3: randomString(), key4: randomNumber() } },
    [randomNumber(), randomNumber(), randomNumber()],
    new Map([
      ['key1', randomString()],
      ['key2', randomString()]
    ]),
    new Set([randomNumber(), randomNumber(), randomNumber()]),
    () => Math.pow(fixedRandomNumber, 2),
    async () => Math.pow(fixedRandomNumber, 3),
    new Promise(resolve => resolve(fixedRandomNumber)),
    nth % 2 === 0, // This is a boolean
    undefined
  ]
}

const updaterTestValues = [
  ({ value }: SetterHelpers<string>): string => (value as string).toUpperCase(),
  ({ value }: SetterHelpers<number>): number => (value as number) * 10,
  ({ value }: SetterHelpers<any>): unknown => {
    if (value?.key?.key4) value.key2.key4 = 10
    return value
  },
  ({ value }: SetterHelpers<number[]>): number[] => {
    ;(value as number[]).push(10)
    return value as number[]
  },
  ({ value }: SetterHelpers<Map<string, string>>): Map<string, string> => {
    ;(value as Map<string, string>).delete('key1')
    return value as Map<string, string>
  },
  ({ value }: SetterHelpers<Set<number>>): Set<number> => {
    ;(value as Set<number>).add(25)
    return value as Set<number>
  },
  ({ value }: SetterHelpers<number>): number => Math.pow(value as number, 4),
  async ({ value }: SetterHelpers<Promise<number>>): Promise<number> =>
    Math.pow((await value) as number, 5),
  async ({ value }: SetterHelpers<Promise<number>>): Promise<number> =>
    ((await value) as number) * 10,
  ({ value }: SetterHelpers<boolean>): boolean => !(value as boolean),
  (): number => 15,
  ({ value }: SetterHelpers<number>): number => {
    return (value as number) / 4
  },
  ({ value }: SetterHelpers<string>): string => (value as string).toUpperCase()
]

function getExpectedValue(traitPath: string, testValue: unknown) {
  return typeof testValue === 'function'
    ? testValue({
        value: storeActions.getTrait(traitPath),
        get: (path: string): unknown => storeActions.getTrait(path)
      })
    : testValue
}

function getValueType(traitPath: string, testValue: unknown) {
  return typeof testValue === 'function'
    ? typeof testValue({
        value: storeActions.getTrait(traitPath),
        get: (path: string): unknown => storeActions.getTrait(path)
      })
    : typeof testValue
}

function getDifferentTypeTestValue(
  testValue: unknown,
  testValues: unknown[]
): unknown {
  let differentTypeTestValue: unknown
  testValues.some(value => {
    // Any trait can receive both `undefined` or an updater callback
    if (
      typeof value !== 'function' &&
      typeof value !== 'undefined' &&
      typeof value !== typeof testValue
    ) {
      differentTypeTestValue = value
      return
    }
  })
  return differentTypeTestValue
}

describe('The Store', () => {
  afterEach(() => storeActions.destroy())

  it(`should throw an error, if you try to set or get a Trait with no path`, () => {
    createStore()
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
    createStore()
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
    createStore()
    traitTrees.forEach((trait, nth) => {
      getRandomValues(nth).forEach((testValue, index) => {
        const expectedValue = getExpectedValue(`${trait}-${index}`, testValue)
        storeActions.setTrait<typeof testValue>(`${trait}-${index}`, testValue)
        expect(storeActions.getTrait(`${trait}-${index}`)).toEqual(
          expectedValue
        )
      })
    })
  })

  it(`should log when a Trait is set, if you have the debug enabled`, () => {
    const consoleSpy = jest.spyOn(console, 'log')
    createStore({ debug: true })
    const testValue = 'testValue'
    storeActions.setTrait<typeof testValue>('testPath', testValue)
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.TRAIT_CREATED, 'testPath'),
      testValue
    )
    consoleSpy.mockClear()
  })

  it(`should update the Trait value, if the Trait already exists`, () => {
    createStore()
    const randomValues1 = getRandomValues(0)
    const randomValues2 = getRandomValues(1)
    traitTrees.forEach(trait => {
      randomValues1.forEach((testValue, index) => {
        const expectedValue = getExpectedValue(
          `${trait}-${index}`,
          randomValues2[index]
        )
        storeActions.setTrait<typeof testValue>(`${trait}-${index}`, testValue)
        storeActions.setTrait<typeof testValue>(
          `${trait}-${index}`,
          randomValues2[index]
        )
        expect(storeActions.getTrait(`${trait}-${index}`)).toEqual(
          expectedValue
        )
      })
    })
  })

  it(`should log when a Trait is updated, if you have the debug enabled`, () => {
    const consoleSpy = jest.spyOn(console, 'log')
    createStore({ debug: true })
    const testValue1 = 'testValue1'
    storeActions.setTrait<typeof testValue1>('testPath', testValue1)
    const testValue2 = 'testValue2'
    storeActions.setTrait<typeof testValue2>('testPath', testValue2)
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.TRAIT_UPDATED, 'testPath'),
      testValue2
    )
    consoleSpy.mockClear()
  })

  it(`should do nothing, if you try to update an existing Trait with the same value`, () => {
    createStore()
    traitTrees.forEach((trait, nth) => {
      const randomValues = getRandomValues(nth)
      randomValues.forEach((testValue, index) => {
        storeActions.setTrait<typeof testValue>(`${trait}-${index}`, testValue)
        const traitValue1 = storeActions.getTrait(`${trait}-${index}`)
        // We need to pass a copy of the same value, so we'll duplicate the array of randomValues and keep the same index
        const testValueCopy = randomValues.slice()[index]
        storeActions.setTrait<typeof testValueCopy>(
          `${trait}-${index}`,
          testValueCopy
        )
        const traitValue2 = storeActions.getTrait(`${trait}-${index}`)
        expect(traitValue1).toEqual(traitValue2)
      })
    })
  })

  it(`should throw an error, if you try to change the type of an existing Trait`, () => {
    createStore()
    traitTrees.forEach((trait, nth) => {
      getRandomValues(nth).forEach((testValue, index, randomValues) => {
        const differentTypeTestValue = getDifferentTypeTestValue(
          testValue,
          randomValues
        )
        storeActions.setTrait<typeof testValue>(`${trait}-${index}`, testValue)
        const previousValueType = getValueType(`${trait}-${index}`, testValue)
        // If a Trait is `undefined` it can receive updates of any type
        if (typeof testValue !== 'undefined')
          expect(() => {
            storeActions.setTrait<typeof differentTypeTestValue>(
              `${trait}-${index}`,
              differentTypeTestValue
            )
          }).toThrow(
            format(
              MESSAGES.ERRORS.TRAIT_WRONG_TYPE,
              `${trait}-${index}`,
              previousValueType,
              typeof differentTypeTestValue
            )
          )
      })
    })
  })

  it(`should let you set to 'undefined' the value of an existing Trait`, () => {
    createStore()
    traitTrees.forEach((trait, nth) => {
      getRandomValues(nth).forEach((testValue, index) => {
        storeActions.setTrait<typeof testValue>(`${trait}-${index}`, testValue)
        storeActions.setTrait<undefined>(`${trait}-${index}`, undefined)
        expect(storeActions.getTrait(`${trait}-${index}`)).toEqual(undefined)
      })
    })
  })

  it(`should update the Trait value, if TraitValue is an updater`, () => {
    createStore()
    traitTrees.forEach((trait, nth) => {
      getRandomValues(nth).forEach((testValue, index) => {
        storeActions.setTrait<typeof testValue>(`${trait}-${index}`, testValue)
        const expectedValue = getExpectedValue(
          `${trait}-${index}`,
          updaterTestValues[index]
        )
        storeActions.setTrait<typeof testValue>(
          `${trait}-${index}`,
          updaterTestValues[index]
        )
        expect(storeActions.getTrait(`${trait}-${index}`)).toEqual(
          expectedValue
        )
      })
    })
  })

  it(`should let you set an alternative path separator`, () => {
    const pathSeparator = '>'
    createStore({ pathSeparator })
    const testValue = 'testValue'
    traitTrees.forEach(trait => {
      const newPath = trait.replace('.', pathSeparator)
      storeActions.setTrait<typeof testValue>(newPath, testValue)
      expect(storeActions.getTrait(newPath)).toEqual(testValue)
    })
  })

  it(`should create a selector and dispatch its updates, if TraitValue is a callback that refers another Trait`, () => {
    traitTrees.forEach(trait => {
      createStore()
      testSelectors.forEach((testValue, index) => {
        const callback = jest.fn()
        // We set our selector which is expected to return its value based on the base Trait
        storeActions.setTrait<typeof testValue>(`${trait}-${index}`, testValue)
        storeActions.subscribeToTrait<unknown>(`${trait}-${index}`, callback)
        // If the base Trait value changes, selector is expected to update accordingly
        storeActions.setTrait<number>('@baseNumberTrait', randomNumber())
        storeActions.setTrait<string>('@baseStringTrait', randomString())
        const expectedValue = getExpectedValue(`${trait}-${index}`, testValue)
        // We can verify this checking the last call to the subscribed callback
        expect(callback).toHaveBeenLastCalledWith(expectedValue)
        // Or retrieving the updated value directly from the store
        expect(storeActions.getTrait(`${trait}-${index}`)).toEqual(
          expectedValue
        )
        callback.mockReset()
      })
      storeActions.destroy()
    })
  })

  it(`should cache the value of a selector and update it only if a dependency changes`, () => {
    createStore()
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

  it(`should throw an error, if you try to update a selector`, () => {
    createStore()
    storeActions.setTrait<string>('basePath', 'testValue')
    storeActions.setTrait<string>(
      'selectorPath',
      ({ get }: SetterHelpers<string>) =>
        (get('basePath') as string).toUpperCase()
    )
    expect(() => {
      storeActions.setTrait<string>('selectorPath', 'testValue')
    }).toThrow(format(MESSAGES.ERRORS.SELECTOR_FROZEN, 'selectorPath'))
  })

  it(`should log when a selector is updated, if you have the debug enabled`, () => {
    const consoleSpy = jest.spyOn(console, 'log')
    createStore({ debug: true })
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
      format(MESSAGES.LOGS.TRAIT_UPDATED, 'selectorPath'),
      testValue2 * multiplier
    )
    consoleSpy.mockClear()
  })

  it(`should throw an error, if you try to subscribe to a Trait with with no path`, () => {
    createStore()
    const testValue = 'testValue'
    storeActions.setTrait<typeof testValue>('testPath', 'testValue')
    expect(() => {
      // @ts-ignore
      storeActions.subscribeToTrait<unknown>(() => {})
    }).toThrow(MESSAGES.ERRORS.PATH_NO_STRING)
  })

  it(`should throw an error, if you try to subscribe to a Trait with an empty path`, () => {
    createStore()
    expect(() => {
      storeActions.subscribeToTrait<unknown>('', () => {})
    }).toThrow(MESSAGES.ERRORS.PATH_EMPTY_STRING)
  })

  it(`should throw an error, if you try to subscribe to a Trait with no callback`, () => {
    createStore()
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

  it(`should let you subscribe to a Trait`, async () => {
    createStore()
    const testCallback = jest.fn()
    traitTrees.forEach(trait => {
      const randomValues1 = getRandomValues(0)
      const randomValues2 = getRandomValues(1)
      randomValues1.forEach((testValue, index) => {
        const expectedValue = getExpectedValue(
          `${trait}-${index}`,
          randomValues2[index]
        )
        storeActions.setTrait<typeof testValue>(`${trait}-${index}`, testValue)
        console.log(testValue)
        storeActions.subscribeToTrait<typeof testValue>(
          `${trait}-${index}`,
          testCallback
        )
        storeActions.setTrait<typeof testValue>(
          `${trait}-${index}`,
          randomValues2[index]
        )
        console.log(randomValues2[index])
        expect(testCallback).toHaveBeenLastCalledWith(expectedValue)
        testCallback.mockClear()
      })
    })
    testCallback.mockReset()
  })

  it(`should let you subscribe to a non existing Trait`, () => {
    createStore()
    const callback = jest.fn()
    traitTrees.forEach(trait => {
      storeActions.subscribeToTrait<unknown>(trait, callback)
      const testValue = 'testValue2'
      storeActions.setTrait<typeof testValue>(trait, testValue)
      expect(callback).toHaveBeenLastCalledWith(testValue)
    })
  })

  it(`should let you set a storage service`, () => {
    const storageService = mockStorageService()
    // @ts-ignore
    createStore({ storageService })
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
    // @ts-ignore
    createStore({ storageService })
    expect(() => storeActions.getTrait<unknown>('testNoPath')).toThrow(
      MESSAGES.ERRORS.STORAGE_MISS_GET
    )
  })

  it(`should throw an error, if you set a storage service without a 'set' method and try to set a Trait`, () => {
    const storageService = mockStorageService({ set: false })
    expect(() => {
      // @ts-ignore We actually don't need to set any Trait for this test because the supporting Traits are set at each test
      createStore({ storageService })
    }).toThrow(MESSAGES.ERRORS.STORAGE_MISS_SET)
  })

  it(`should throw an error, if you set a storage service without a 'clear' method and try to clear a Trait`, () => {
    const storageService = mockStorageService({ clear: false })
    // @ts-ignore
    createStore({ storageService })
    expect(() =>
      storeActions.setTrait<undefined>('testPath', undefined)
    ).toThrow(MESSAGES.ERRORS.STORAGE_MISS_CLEAR)
  })

  it(`should log when a Trait is retrieved from the storage, if you have the debug enabled and a storage service set`, () => {
    const consoleSpy = jest.spyOn(console, 'log')
    const storageService = mockStorageService()
    // @ts-ignore
    createStore({ storageService, debug: true })
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
    createStore({ storageService, debug: true })
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
    createStore({ storageService, debug: true })
    storeActions.setTrait<undefined>('testPath', undefined)
    expect(consoleSpy).toHaveBeenCalledWith(
      format(MESSAGES.LOGS.STORAGE_REMOVED, 'testPath'),
      ''
    )
    consoleSpy.mockClear()
  })
})
