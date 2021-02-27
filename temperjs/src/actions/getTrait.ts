import { storeActions } from 'temperjs-store'

/**
 * `getTrait` returns the value of the specified Trait at the time it's called, so you can read its value without subscribing
 * @template T
 * @param {string} path - This is the Trait identifier.
 * @returns {T} This is the current value of the Trait
 */
function getTrait<T>(path: string): T | undefined {
  return storeActions.getTrait(path)
}

export default getTrait
