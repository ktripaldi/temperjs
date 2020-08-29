import storeActions from '../services/store'
import { Trait } from '..'

/**
 * `getTrait` returns the value of the specified Trait at the time it's called, so you can read its value without subscribing
 * @template T
 * @param {string} path - This is the Trait identifier.
 * @returns {T | undefined} This is the current value of the Trait
 */
function getTrait<T>(path: string): Trait<T> {
  return storeActions.getTrait(path)
}

export default getTrait
