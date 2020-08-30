import MESSAGES from '../config/messages'
import compare from '../utils/compare'
import deepMerge from '../utils/deepMerge'
import createSubject from '../utils/rxSubject'
import {
  Trait,
  TraitSetterValue,
  BuildTraitOptions,
  Subscription,
  StoreOptions,
  ResolveTraitOptions,
  Store,
  StoreActions
} from '../config/interfaces'

// Checks if a variable is an array
export function isArray(element: unknown): boolean {
  return typeof element !== 'undefined' && Array.isArray(element)
}

// Checks if a variable is a plain object (like { key: value })
export function isPlainObject(element: unknown): boolean {
  return (
    typeof element === 'object' &&
    element !== null &&
    element.constructor === Object &&
    Object.prototype.toString.call(element) === '[object Object]'
  )
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
            buildTrait(storageKey, rootTrait, { negletPrevious: true })
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
    return isArray(store.paths.get(path))
  }

  // Returns the root key of a given path
  function getPathRoot(path: string): string {
    return path.split(store.pathSeparator)[0]
  }

  // Returns the index of a root Trait
  function getRootTraitIndex(path: string): number | undefined {
    const index = store.paths.get(getPathRoot(path))
    if (typeof index?.[0] === 'number') return index[0]
    return undefined
  }

  // Returns the array path to reach the Trait
  function getArrayPath(path: string): (string | number)[] {
    if (traitExists(path)) return store.paths.get(path)!
    const arrayPath = path.split(store.pathSeparator)
    arrayPath.shift()
    const rootIndex = getRootTraitIndex(path)
    return typeof rootIndex !== 'undefined'
      ? [rootIndex, ...arrayPath]
      : [store.size, ...arrayPath]
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
      const tiedTraitValue = resolveTrait(tiedPath, {
        getSelectorCached: false
      })
      getSelector(tiedPath).value = tiedTraitValue
      const subject = store.subjects.get(tiedPath)
      if (subject?.hasObservers()) {
        subject?.sink.next(tiedTraitValue)
        // If log is enabled, we log the operation
        log(
          format(MESSAGES.LOGS.SELECTOR_UPDATED, tiedPath, path),
          tiedTraitValue
        )
      }
      updateSelectors(tiedPath)
    })
  }

  // Notifies subscribers that the Trait has changed its value
  function broadcastChange(path: string): void {
    loopThroughPath(path, key => {
      const subject = store.subjects.get(key)
      const traitValue = resolveTrait(key)
      if (subject?.hasObservers())
        subject?.sink.next(
          key !== path || isPlainObject(traitValue)
            ? { ...(traitValue as object) }
            : traitValue
        )
    })
  }

  // Returns the value of a Trait
  function readTrait(path: string): unknown {
    if (traitExists(path) || tryImportingFromStorage(path)) {
      return (
        store.paths
          .get(path)
          ?.reduce(
            (obj, key) =>
              isPlainObject(obj) || isArray(obj)
                ? ((obj as Record<string | number, unknown>)[key] as unknown)
                : undefined,
            store.traits as unknown
          ) ?? undefined
      )
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

  // Creates the wrapping objects when an orphan (sub) Trait is set
  function getRootTraitTree(
    path: string,
    nodeValue: unknown
  ): [string, unknown] {
    const arrayPath = path.split(store.pathSeparator)
    const rootPath = arrayPath.shift()!
    return [
      rootPath,
      arrayPath.length > 0
        ? arrayPath.reduce((prev, curr, index) => {
            ;(prev as Record<string, unknown>)[curr] =
              index < arrayPath.length - 1 ? {} : nodeValue
            return prev
          }, {})
        : nodeValue
    ]
  }

  // Sets the Trait and its sub Traits, if any
  function buildTrait(
    path: string,
    traitValue: unknown,
    options?: BuildTraitOptions
  ): void {
    function buildTraitFromTree(
      nodePath: string,
      nodeArrayPath: (number | string)[],
      nodeValue: unknown
    ): void {
      registerTrait(nodePath, nodeArrayPath, nodeValue, options)
      if (isPlainObject(nodeValue)) {
        Object.keys(nodeValue as object).forEach(key => {
          buildTraitFromTree(
            `${nodePath}${store.pathSeparator}${key}`,
            [...nodeArrayPath, key],
            (nodeValue as Record<string, unknown>)[key]
          )
        })
      }
    }
    if (!traitExists(getPathRoot(path))) {
      const [nodePath, traitTree] = getRootTraitTree(path, traitValue)
      buildTraitFromTree(nodePath, getArrayPath(nodePath), traitTree)
    } else buildTraitFromTree(path, getArrayPath(path), traitValue)
    // We need to notify all subscribers about the update
    broadcastChange(path)
  }

  // Returns the value of the simple version of a Trait by path
  function resolveTrait<T>(
    path: string,
    options?: ResolveTraitOptions
  ): Trait<T> | undefined {
    const trait = readTrait(path)
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

    // If the Trait is a selector, we want to return the cached value whenever possible
    if (isSelector(path)) {
      return options?.getSelectorCached === false ||
        typeof getSelector(path).value === 'undefined'
        ? (trait as Function)({
            get(traitPath: string): unknown {
              return resolveTrait(traitPath)
            }
          })
        : (getSelector(path).value as T)
    }
    return trait as Trait<T>
  }

  // Returns the previous and the current value of a given Trait
  function processTraitValue(
    path: string,
    traitValue: unknown,
    negletPrevious?: boolean
  ): [unknown, unknown] {
    let currentValue = negletPrevious ? undefined : resolveTrait(path)
    // If `traitValue` is a function, we need to call it so we can evaluate the result.
    // To do so, we need to inject an object containing the current Trait value and a method to get any other Trait
    const newValue =
      typeof traitValue === 'function'
        ? traitValue({
            value: currentValue,
            get(traitPath: string): unknown {
              return resolveTrait(traitPath, {
                tiedPath: path,
                correlationId: makeCorrelationId()
              })
            }
          })
        : traitValue

    if (currentValue) {
      // Traits are type safe. Once set, they cannot change type.
      // If `traitValue` is a function, it must return always the same type
      // If the provided value has different type from the previous one, we'll throw an error
      if (
        typeof currentValue !== 'undefined' &&
        typeof currentValue !== 'function' &&
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
    }
    return [currentValue, newValue]
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
        paths: new Map(),
        pathSeparator: options?.pathSeparator ?? '.',
        traits: [],
        subjects: new Map(),
        tiedTraits: new Map(),
        selectors: new Map(),
        storageService: options?.storageService ?? undefined,
        debug: options?.debug ?? false,
        get size(): number {
          return this.traits.length
        }
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
    // This will set the Trait and its sub Traits, if any
    buildTrait(path, traitValue)
  }

  // Registers the Trait
  function registerTrait<T>(
    path: string,
    arrayPath: (number | string)[],
    traitValue: TraitSetterValue<T>,
    options?: BuildTraitOptions
  ): void {
    const isNew = !traitExists(path)
    if (isNew) {
      store.subjects.set(path, createSubject())
      store.paths.set(path, arrayPath)
    }
    const [currentValue, newValue] = processTraitValue(
      path,
      traitValue,
      options?.negletPrevious ?? isNew
    )
    // If the Trait value doesn't change, we won't need to do anything
    if (
      typeof currentValue !== 'undefined' &&
      compare(currentValue, newValue)
    ) {
      return
    }
    let valueToStore = deepMerge(currentValue, newValue)
    if (isSelector(path)) {
      // If a selector is overwritten with a qualified value, we need to unregister it
      if (typeof traitValue !== 'function') {
        getSelector(path).tiedTraits.forEach(item =>
          store.tiedTraits.get(item)?.delete(path)
        )
        store.selectors.delete(path)
      } else {
        // We want to cache the value of the selector
        getSelector(path).value = newValue
        valueToStore = traitValue
      }
    }
    let traits = store.traits
    // We need to loop through the traits to set the Trait value
    arrayPath.forEach((key, index) => {
      if (index < arrayPath.length - 1) traits = (traits as any)[key]
      else (traits as any)[key] = valueToStore
    })
    // If log is enabled, we log the operation
    if (isNew) log(format(MESSAGES.LOGS.TRAIT_CREATED, path), valueToStore)
    else log(format(MESSAGES.LOGS.TRAIT_UPDATED, path), valueToStore)
    // If we have selectors that depend on this Trait, we need to dispatch the updated value for each one of them
    updateSelectors(path)
    // If a storage service has been set, we need to save the root Trait
    trySavingToStorage(getPathRoot(path), store.traits[arrayPath[0] as number])
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
    if (!traitExists(path))
      // This will set the Trait and its sub Traits, if any
      buildTrait(path, defaultValue, { negletPrevious: true })
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
