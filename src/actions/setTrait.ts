import storeActions from '../services/store'
import {TraitSetterValue} from '..'

/**
 * `setTrait` creates or updates the specified Trait
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {TraitSetterValue<T>} traitValue - This is the Trait value or the callback to set the value
 */
function setTrait<T>(path: string, traitValue: TraitSetterValue<T>): void {
  storeActions.setTrait<T>(path, traitValue)
}

export default setTrait
