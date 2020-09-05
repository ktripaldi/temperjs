import MESSAGES from '../config/messages'
import createSubject from './rxSubject'
import {
  Trait,
  TraitSetterValue,
  RegisterTraitOptions,
  Subscription,
  StoreOptions,
  ResolveTraitOptions,
  Store,
  StoreActions
} from '../config/interfaces'
import {
  has,
  get,
  set,
  isPlainObject,
  isEqual,
  isObjectLike,
  merge,
  clone
} from 'lodash'

function deepMerge(prev: unknown, next: unknown): unknown {
  if (isPlainObject(prev) && isPlainObject(next)) {
    return merge(prev, next)
  }
  return next
}

function cloneValue(value: unknown): unknown {
  const clonedValue = isObjectLike(value) ? clone(value) : value
  if (
    isPlainObject(clonedValue) &&
    Object.keys(clonedValue as object).length === 0
  )
    return value
  return clonedValue
}

// Formats a log or error message
export function format(message: string, ...replacements: string[]): string {
  let formattedString: string = message
  for (let replacement in replacements) {
    formattedString = formattedString.replace(
      new RegExp('\\{' + replacement + '\\}', 'g'),
      replacements[replacement]
    )
  }
  return formattedString
}

// Logs a message in debug is enabled
function log(logMessage: string, logValue: unknown | string = ''): void {
  if (store.debug) console.log(`${logMessage}`, logValue) // tslint:disable-line:no-console
}

// Returns a correlation id
function makeCorrelationId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// this is where the store object is saved
declare global {
  var store: Store
}

// Returns the actions exported from the store
function getStoreActions(): StoreActions {
  // Retrieves the value of a Trait from an external service storage, if configured
  function tryImportingFromStorage(path: string): boolean {
    if (store.storageService) {
      // We want to import only root Traits, child Traits will be automatically computed
      const storageKey = getPathRoot(path)
      if (store.storageService.get) {
        if (!traitExists(storageKey)) {
          const rootTrait = store.storageService.get(storageKey)
          if (rootTrait) {
            // This will set the Trait and its sub Traits, if any
            registerTrait(storageKey, rootTrait, { ignorePrevious: true })
            // If log is enabled, we log the operation
            log(format(MESSAGES.LOGS.STORAGE_IMPORTED, storageKey), rootTrait)
            return true
          }
        }
        // If the `storageService` lacks a `get` method, we'll throw an error
      } else throw new Error(MESSAGES.ERRORS.STORAGE_MISS_GET)
    }
    return false
  }

  // Saves the value of a Trait to an external service storage, if configured
  function trySavingToStorage(storageKey: string, storageValue: unknown): void {
    if (store.storageService) {
      if (typeof storageValue !== 'undefined') {
        // We don't need to store functions
        if (storageValue !== 'function') {
          if (store.storageService.set) {
            store.storageService.set(storageKey, storageValue)
            // If log is enabled, we log the operation
            log(format(MESSAGES.LOGS.STORAGE_SAVED, storageKey), storageValue)
            // If the `storageService` lacks a `set` method, we'll throw an error
          } else throw new Error(MESSAGES.ERRORS.STORAGE_MISS_SET)
        }
        // If the Trait value is `undefined`, we want to remove it from storage
      } else {
        if (store.storageService.clear) {
          store.storageService.clear(storageKey)
          // If log is enabled, we log the operation
          log(format(MESSAGES.LOGS.STORAGE_REMOVED, storageKey))
          // If the `storageService` hasn't a `clear` method, we'll throw an error
        } else throw new Error(MESSAGES.ERRORS.STORAGE_MISS_CLEAR)
      }
    }
  }

  // Check if a Trait exists
  function traitExists(path: string): boolean {
    return store.paths.has(path)
  }

  // Returns the root key of a given path
  function getPathRoot(path: string): string {
    return path.split(store.pathSeparator)[0]
  }

  // Check if a Trait is a selector
  function isSelector(path: string): boolean {
    return store.selectors.has(path)
  }

  // Returns the selector value (by setting it, if it doesn't exist)
  function getSelector(
    path: string
  ): { value: unknown; tiedTraits: Set<string>; correlationId: string } {
    return (
      store.selectors.get(path) ??
      store.selectors
        .set(path, {
          value: undefined,
          tiedTraits: new Set(),
          correlationId: ''
        })
        .get(path)!
    )
  }

  // Executes a callback for every child Trait
  function loopThroughPath(
    path: string,
    callback: (key: string) => void
  ): void {
    const pathParts = path.split(store.pathSeparator)
    let incrementalPath: string
    pathParts.forEach(key => {
      incrementalPath = incrementalPath
        ? `${incrementalPath}${store.pathSeparator}${key}`
        : key
      callback(incrementalPath)
    })
  }

  // Updates all selectors
  function updateSelectors(path: string): void {
    const tiedTraits = getTiedTraits(path)
    tiedTraits.forEach(tiedPath => {
      const tiedTraitValue = (getSelector(tiedPath).value as Function)({
        get(resPath: string): unknown {
          return resolveTrait(resPath)
        }
      })
      registerTrait(tiedPath, tiedTraitValue)
      updateSelectors(tiedPath)
    })
  }

  // Notifies subscribers that the Trait has changed its value
  function broadcastChange(path: string): void {
    loopThroughPath(path, key => {
      const subject = store.subjects.get(key)
      if (subject?.hasObservers()) {
        subject?.sink.next(cloneValue(get(store.traits, key)))
      }
    })
  }

  // Returns the value of a Trait
  function readTrait(path: string): unknown {
    if (has(store.traits, path) || tryImportingFromStorage(path)) {
      return get(store.traits, path)
    }
    return undefined
  }

  // Returns the list of all Traits that depend on a given Trait
  function getTiedTraits(path: string): Set<string> {
    let tiedTraits: Set<string> = new Set()
    loopThroughPath(path, key =>
      store.tiedTraits.get(key)?.forEach(tiedTraits.add, tiedTraits)
    )
    return tiedTraits
  }

  // Returns the value of the simple version of a Trait by path
  function resolveTrait<T>(
    path: string,
    options?: ResolveTraitOptions
  ): Trait<T> | undefined {
    // If `options.tiedPath` is set, we need to register that Trait as a selector
    if (typeof options?.tiedPath !== 'undefined') {
      const selector = getSelector(options.tiedPath)
      if (selector.correlationId === options.correlationId)
        selector.tiedTraits.add(path)
      // If the `correlationId` changes, it means the selector has been updated
      // so we need to remove the data we previously registered
      else {
        if (options?.correlationId) {
          selector.tiedTraits.forEach(item =>
            store.tiedTraits.get(item)?.delete(options.tiedPath!)
          )
          selector.tiedTraits.clear()
          selector.tiedTraits.add(path)
          selector.correlationId = options.correlationId
        }
      }
      store.tiedTraits.set(path, getTiedTraits(path).add(options.tiedPath))
    }
    return readTrait(path) as Trait<T>
  }

  // Verifies that the path is a non empty string
  function checkPath(path?: string): void {
    // `path` must be a populated string because that's how the user refers to the Trait
    // If the provided `path` is not a string, we'll throw an error
    if (typeof path !== 'string') {
      throw new Error(MESSAGES.ERRORS.PATH_NO_STRING)
    }
    // If the provided `path` is an empty string, we'll throw an error
    if (path === '') {
      throw new Error(MESSAGES.ERRORS.PATH_EMPTY_STRING)
    }
  }

  /***************************************/
  /* Exported actions start here         */
  /***************************************/

  // Creates the global store object
  function create(options?: StoreOptions) {
    if (!global.store)
      global.store = {
        paths: new Set(),
        pathSeparator: options?.pathSeparator ?? '.',
        traits: {},
        subjects: new Map(),
        tiedTraits: new Map(),
        selectors: new Map(),
        storageService: options?.storageService ?? undefined,
        debug: options?.debug ?? false
      }
  }

  // Returns the value of a Trait
  function getTrait<T>(path: string): Trait<T> | undefined {
    // If the store has not been created yet, we'll throw an error
    if (!global.store) throw new Error(MESSAGES.ERRORS.NO_STORE_FOUND)
    // If the provided `path` is not a populated string, we'll throw an error
    checkPath(path)
    return resolveTrait<T>(path)
  }

  function setTrait<T>(path: string, traitValue: TraitSetterValue<T>): void {
    // If the store has not been created yet, we'll throw an error
    if (!global.store) throw new Error(MESSAGES.ERRORS.NO_STORE_FOUND)
    // If the provided `path` is not a populated string, we'll throw an error
    checkPath(path)
    // Selectors cannot be updated
    if (isSelector(path)) {
      throw new Error(format(MESSAGES.ERRORS.SELECTOR_FROZEN, path))
    }
    registerTrait(path, traitValue)
  }

  // Registers the Trait
  function registerTrait<T>(
    path: string,
    traitValue: TraitSetterValue<T>,
    options?: RegisterTraitOptions
  ): void {
    let currentValue = options?.ignorePrevious ? undefined : resolveTrait(path)
    // If `traitValue` is a function, we need to call it so we can evaluate the result.
    // To do so, we need to inject an object containing the current Trait value and a method to get any other Trait
    let newValue =
      typeof traitValue === 'function'
        ? (traitValue as Function)({
            value: currentValue,
            get(resPath: string): unknown {
              return resolveTrait(resPath, {
                tiedPath: path,
                correlationId: makeCorrelationId()
              })
            }
          })
        : traitValue

    // Traits are type safe. Once set, they cannot change type.
    // If `traitValue` is a function, it must return always the same type
    // If the provided value has different type from the previous one, we'll throw an error
    if (
      typeof currentValue !== 'undefined' &&
      typeof newValue !== 'undefined' &&
      typeof currentValue !== typeof newValue
    ) {
      throw new Error(
        format(
          MESSAGES.ERRORS.TRAIT_WRONG_TYPE,
          path,
          typeof currentValue,
          typeof newValue
        )
      )
    }
    // If the Trait value doesn't change, we won't need to do anything
    if (typeof currentValue !== 'undefined' && isEqual(currentValue, newValue))
      return

    // We store the actual function for future reference
    if (isSelector(path) && typeof traitValue === 'function') {
      getSelector(path).value = traitValue
    }

    // Object Traits are sealed to avoid that nested traits are deleted later
    if (isPlainObject(newValue)) Object.seal(newValue)

    const valueToStore = deepMerge(currentValue, newValue)
    const isNewInsertion = !has(store.traits, path)

    // We set the Trait value
    set(store.traits, path, valueToStore)
    // We need to notify all subscribers about the update
    broadcastChange(path)
    // If we have selectors that depend on this Trait, we need to dispatch the updated value for each one of them
    updateSelectors(path)
    // If log is enabled, we log the operation
    if (isNewInsertion)
      log(format(MESSAGES.LOGS.TRAIT_CREATED, path), valueToStore)
    else log(format(MESSAGES.LOGS.TRAIT_UPDATED, path), valueToStore)
    // If a storage service has been set, we need to save the root Trait
    trySavingToStorage(getPathRoot(path), get(store.traits, getPathRoot(path)))
  }

  // Subscribes a callback to a Trait and returns a `Subscription` object
  function subscribeToTrait<T>(
    path: string,
    callback: (traitValue: Trait<T>) => void,
    defaultValue?: Trait<T>
  ): Subscription | undefined {
    // If the store has not been created yet, we'll throw an error
    if (!global.store) throw new Error(MESSAGES.ERRORS.NO_STORE_FOUND)
    // If the provided `path` is not a populated string, we'll throw an error
    checkPath(path)
    // If the provided `callback` is not a function, we'll throw an error
    if (typeof callback !== 'function') {
      throw new Error(MESSAGES.ERRORS.SUBSCRIPTION_NO_CALLBACK)
    }
    if (!traitExists(path)) {
      store.paths.add(path)
      store.subjects.set(path, createSubject())
      registerTrait(path, get(store.traits, path, defaultValue), {
        ignorePrevious: true
      })
    }
    return store.subjects.get(path)?.source$.subscribe<T>(callback)
  }

  // Destroys the store
  function destroy(): void {
    if (global.store) {
      // @ts-ignore
      delete global.store
    }
  }

  return {
    create,
    getTrait,
    setTrait,
    subscribeToTrait,
    destroy
  }
}

const storeActions = getStoreActions()

export default storeActions
