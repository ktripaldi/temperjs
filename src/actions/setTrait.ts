import storeActions from '../services/store'
import { SetterHelpers } from '..'

/**
 * `setTrait` creates a globally shared unit of state that components can subscribe to
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {T} traitValue - This is the Trait value
 *
 * Traits can be anything. When a Trait is an object, each attribute will become a new Trait that is individually subscribable.
 */
function setTrait<T>(
  path: string,
  traitValue: T | ((helpers: SetterHelpers<T>) => T)
): void {
  storeActions.setTrait<T>(path, traitValue)
}

export default setTrait
