import storeActions from '../../services/store' // We will call `storeActions` methods directly to check the results of `useTraitValue`
import MESSAGES from '../../config/messages'
import getTrait from '../getTrait'

// Sets some random Trait values
const randomValues = ['test', 1, { key: 2 }, false, null, new Map()]

describe('The hook `useTraitValue`', () => {
  beforeAll(() => spyOn(console, 'error'))
  beforeEach(() => storeActions.create())
  afterEach(() => storeActions.destroy())

  it(`should throw an error, if no path is specified`, () => {
    expect(() => {
      // @ts-ignore
      getTrait()
    }).toThrow(MESSAGES.ERRORS.PATH_NO_STRING)
  })

  it(`should throw an error, if path is an empty a string`, () => {
    expect(() => {
      getTrait('')
    }).toThrow(MESSAGES.ERRORS.PATH_EMPTY_STRING)
  })

  it(`should return the current Trait value`, () => {
    randomValues.forEach((testValue, index) => {
      storeActions.setTrait(`testTraitPath${index}`, testValue)
      expect(getTrait(`testTraitPath${index}`)).toEqual(
        storeActions.getTrait(`testTraitPath${index}`)
      )
    })
  })

  it(`should return the current value of a nested Trait`, () => {
    randomValues.forEach((testValue, index) => {
      storeActions.setTrait(
        `testTraitPath${index}.testNestedTraitPath${index * 2}`,
        testValue
      )
      expect(
        getTrait(`testTraitPath${index}.testNestedTraitPath${index * 2}`)
      ).toEqual(
        storeActions.getTrait(
          `testTraitPath${index}.testNestedTraitPath${index * 2}`
        )
      )
    })
  })
})
