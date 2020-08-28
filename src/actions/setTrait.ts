import storeActions from '../services/store'
import { SetterHelpers } from '..'

/**
 * `setTrait` creates or updates the specified Trait
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {T | ((helpers: SetterHelpers<T>) => T)} traitValue - This is the Trait value or the callback to set the value
 */
function setTrait<T>(
  path: string,
  traitValue: T | ((helpers: SetterHelpers<T>) => T)
): void {
  storeActions.setTrait<T>(path, traitValue)
}

export default setTrait
