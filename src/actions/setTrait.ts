import storeActions, { SetterHelpers } from '../services/store'

/**
 * `setTrait` creates a globally shared unit of state that components can subscribe to
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {T} traitValue - This is the Trait value
 *
 * Traits can be anything. When a Trait is an object, each attribute will become a new Trait that is individually subscribable.
 * When you create a Trait, you can target any level of an object using the dot notation (ex. level1.level2)
 * `setTrait(level1.level2, value)` will create a trait with this value: `{ level1 : { level2 : value }}`
 */
function setTrait<T>(
  path: string,
  traitValue: T | ((helpers: SetterHelpers<T>) => T)
): void {
  storeActions.setTrait<T>(path, traitValue)
}

export default setTrait
