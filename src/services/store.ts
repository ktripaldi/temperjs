import MESSAGES from '../config/messages'
import compare from '../utils/compare'
import deepMerge from '../utils/deepMerge'
import createSubject from '../utils/rxSubject'
import {
  Trait,
  TraitSetterValue,
  Subscription,
  StoreOptions,
  ResolveTraitOptions,
  Store,
  StoreActions
} from '../config/interfaces'

export function isArray(element: unknown): boolean {
  return typeof element !== 'undefined' && Array.isArray(element)
}

export function isPlainObject(element: unknown): boolean {
  return (
    typeof element === 'object' &&
    element !== null &&
    element.constructor === Object &&
    Object.prototype.toString.call(element) === '[object Object]'
  )
}

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

function log(logMessage: string, logValue: unknown | string = ''): void {
  if (store.debug) console.log(`${logMessage}`, logValue) // tslint:disable-line:no-console
}

function makeCorrelationId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

declare global {
  var store: Store
}

function getStoreActions(): StoreActions {
  // Returns the root key of a given path
  function getPathRootKey(path: string): string {
    return path.split(store.pathSeparator)[0]
  }

  // Retrieves the value of a Trait from an external service storage, if configured
  function tryImportingFromStorage(path: string): boolean {
    if (store.storageService) {
      const storageKey = getPathRootKey(path)
      if (store.storageService.get) {
        if (!store.paths.get(storageKey)) {
          const rootTrait = store.storageService.get(storageKey) as Record<
            string,
            unknown
          >
          if (rootTrait) {
            createSubjects(storageKey, [store.size], rootTrait)
            store.traits.push(rootTrait)
            log(format(MESSAGES.LOGS.STORAGE_IMPORTED, storageKey), rootTrait)
            return true
          }
        }
      } else throw new Error(MESSAGES.ERRORS.STORAGE_MISS_GET)
    }
    return false
  }

  // Saves the value of a Trait to an external service storage, if configured
  function trySavingToStorage(storageKey: string, storageValue: unknown): void {
    if (store.storageService) {
      if (typeof storageValue !== 'undefined') {
        if (storageValue !== 'function') {
          if (store.storageService.set) {
            store.storageService.set(storageKey, storageValue)
            log(format(MESSAGES.LOGS.STORAGE_SAVED, storageKey), storageValue)
          } else throw new Error(MESSAGES.ERRORS.STORAGE_MISS_SET)
        }
      } else {
        if (store.storageService.clear) {
          store.storageService.clear(storageKey)
          log(format(MESSAGES.LOGS.STORAGE_REMOVED, storageKey))
        } else throw new Error(MESSAGES.ERRORS.STORAGE_MISS_CLEAR)
      }
    }
  }

  // Check if a Trait exists
  function traitExists(path: string): boolean {
    return isArray(store.paths.get(path)) || tryImportingFromStorage(path)
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

  // Returns the index of a root Trait
  function getRootTraitIndex(path: string): number | undefined {
    const index = store.paths.get(getPathRootKey(path))
    if (typeof index?.[0] === 'number') return index[0]
    return undefined
  }

  // Executes a callback for every child Trait
  function executeCallbackForEveryChild(
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

  // Returns the value of a Trait
  function getRawTrait(path: string): unknown {
    if (traitExists(path)) {
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
        log(
          format(MESSAGES.LOGS.SELECTOR_UPDATED, tiedPath, path),
          tiedTraitValue
        )
      }
      updateSelectors(tiedPath)
    })
  }

  // Returns the list of all Traits that depend on a given Trait
  function getTiedTraits(path: string): Set<string> {
    let tiedTraits: Set<string> = new Set()
    executeCallbackForEveryChild(path, key =>
      store.tiedTraits.get(key)?.forEach(tiedTraits.add, tiedTraits)
    )
    return tiedTraits
  }

  // Creates a subject for every Trait
  function createSubjects(
    path: string,
    arrayPath: (string | number)[],
    traitValue: unknown
  ): void {
    if (!store.subjects.get(path)) {
      store.subjects.set(path, createSubject())
      store.paths.set(path, arrayPath)
    }
    if (isPlainObject(traitValue)) {
      Object.keys(traitValue as object).forEach(key => {
        createSubjects(
          `${path}${store.pathSeparator}${key}`,
          [...arrayPath, key],
          (traitValue as Record<string, unknown>)[key]
        )
      })
    }
  }

  // Notifies subscribers that the Trait has changed its value
  function broadcastChange(
    path: string,
    previousValue: unknown,
    value: unknown
  ): void {
    function broadcastChangeToParents(path: string): void {
      executeCallbackForEveryChild(path, key => {
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
    function broadcastChangeToChildren(
      nodePath: string,
      nodePreviousValue: unknown,
      nodeValue: unknown
    ) {
      if (!compare(nodePreviousValue, nodeValue)) {
        const subject = store.subjects.get(nodePath)
        const isNodePlainObject = isPlainObject(nodeValue)
        if (subject?.hasObservers())
          subject?.sink.next(
            isNodePlainObject ? { ...(nodeValue as object) } : nodeValue
          )
        if (isNodePlainObject) {
          Object.keys(nodeValue as object).forEach(key => {
            broadcastChangeToChildren(
              `${nodePath}${store.pathSeparator}${key}`,
              (nodePreviousValue as Record<string, unknown>)?.[key],
              (nodeValue as Record<string, unknown>)[key]
            )
          })
        }
      }
    }
    broadcastChangeToParents(path)
    if (isPlainObject(value)) {
      Object.keys(value as object).forEach(key => {
        broadcastChangeToChildren(
          `${path}${store.pathSeparator}${key}`,
          (previousValue as Record<string, unknown>)?.[key],
          (value as Record<string, unknown>)[key]
        )
      })
    }
  }

  // Creates the wrapping objects when an orphan (sub) Trait is set
  function createObjectHierarchy(
    arrayPath: string[],
    nodeValue: unknown
  ): Record<string, unknown> {
    return arrayPath.reduce((prev, curr, index) => {
      ;(prev as Record<string, unknown>)[curr] =
        index < arrayPath.length - 1 ? {} : nodeValue
      return prev
    }, {})
  }

  // Creates a new Trait
  function initializeTrait(path: string, value: unknown): void {
    const arrayPath = path.split(store.pathSeparator)
    const rootPath = arrayPath.shift()
    let trait =
      arrayPath.length > 0 ? createObjectHierarchy(arrayPath, value) : value
    const rootTraitIndex = getRootTraitIndex(path)
    if (typeof rootTraitIndex !== 'undefined') {
      trait = deepMerge(store.traits[rootTraitIndex], trait)
      createSubjects(rootPath!, [rootTraitIndex], trait)
      store.traits[rootTraitIndex] = trait
    } else {
      createSubjects(rootPath!, [store.size], trait)
      store.traits.push(trait)
    }
    log(format(MESSAGES.LOGS.TRAIT_CREATED, path), value)
    trySavingToStorage(rootPath!, trait)
  }

  // Updates an existing Trait
  function updateTrait(
    path: string,
    previousValue: unknown,
    newValue: unknown
  ): void {
    const arrayPath = store.paths.get(path)!
    let traits = store.traits
    const newMergedValue = deepMerge(previousValue, newValue)
    createSubjects(path, arrayPath, newMergedValue)
    arrayPath.forEach((key, index) => {
      if (index < arrayPath.length - 1) traits = (traits as any)[key]
      else (traits as any)[key] = newMergedValue
    })
    log(format(MESSAGES.LOGS.TRAIT_UPDATED, path), newMergedValue)
    // We need to notify all subscribers about the update
    broadcastChange(path, previousValue, newMergedValue)
    // If we have selectors that depend on this Trait, we need to dispatch the updated value for each one of them
    updateSelectors(path)
    // If a storage service has been set, we need to save the root Trait
    trySavingToStorage(
      path.split(store.pathSeparator)?.[0],
      store.traits[arrayPath[0] as number]
    )
  }

  // Returns the value of the simple version of a Trait by path
  function resolveTrait<T>(
    path: string,
    options?: ResolveTraitOptions
  ): T | undefined {
    const trait = getRawTrait(path)
    if (typeof options?.tiedPath !== 'undefined') {
      const selector = getSelector(options.tiedPath)
      selector.value = resolveTrait(options.tiedPath)
      if (selector.correlationId === options.correlationId)
        selector.tiedTraits.add(path)
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
    if (isSelector(path)) {
      return options?.getSelectorCached === false
        ? (trait as Function)({
            get(traitPath: string): unknown {
              return resolveTrait(traitPath)
            }
          })
        : (getSelector(path).value as T)
    }
    return trait as T
  }

  // Returns the previous and the current value of a given Trait
  function processTraitValue(
    path: string,
    traitValue: unknown
  ): [unknown, unknown] {
    const currentValue = resolveTrait(path)
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
    }
    return [currentValue, newValue]
  }

  // Verifies that the path is a non empty string
  function checkPath(path?: string): void {
    // `path` must be a string
    if (typeof path !== 'string') {
      throw new Error(MESSAGES.ERRORS.PATH_NO_STRING)
    }
    // `path` cannot be an empty string because that's how the user refers to the Trait
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
    if (!global.store) throw new Error(MESSAGES.ERRORS.NO_STORE_FOUND)
    checkPath(path)
    return resolveTrait<T>(path)
  }

  // Sets the value of a Trait
  function setTrait<T>(path: string, traitValue: TraitSetterValue<T>): void {
    if (!global.store) throw new Error(MESSAGES.ERRORS.NO_STORE_FOUND)
    checkPath(path)
    const [currentValue, newValue] = processTraitValue(path, traitValue)
    // If the Trait value doesn't change, we won't need to do anything
    if (
      typeof currentValue !== 'undefined' &&
      compare(currentValue, newValue)
    ) {
      return
    }
    let valueToStore = newValue
    if (isSelector(path)) {
      // Caches the value of the selector
      getSelector(path).value = newValue
      valueToStore = traitValue
    }
    if (traitExists(path)) {
      updateTrait(path, currentValue, valueToStore)
    } else {
      initializeTrait(path, valueToStore)
    }
  }

  // Subscribes a callback to a Trait
  function subscribeToTrait<T>(
    path: string,
    callback: (traitValue: Trait<T>) => void,
    defaultValue?: Trait<T>
  ): Subscription | undefined {
    if (!global.store) throw new Error(MESSAGES.ERRORS.NO_STORE_FOUND)
    checkPath(path)
    // `callback` must be a function
    if (typeof callback !== 'function') {
      throw new Error(MESSAGES.ERRORS.SUBSCRIPTION_NO_CALLBACK)
    }
    if (!traitExists(path)) initializeTrait(path, defaultValue)
    return store.subjects.get(path)?.source$.subscribe<T>(callback)
  }

  // Empties the store
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
