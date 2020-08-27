import storeActions from '../services/store'

/**
 * `getTrait` returns the value of a Trait at the time it's called, so you can read its value without subscribing
 * @template T
 * @param {string} path - This is the Trait identifier.
 * @returns {T} Returns the current value of the Trait
 */
function getTrait<T>(path: string): T | undefined {
  return storeActions.getTrait(path)
}

export default getTrait
