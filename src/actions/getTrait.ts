import storeActions from '../services/store';

/**
 * `getTrait` returns the value of a Trait at the time it's called, so you can read its value without subscribing
 * @template T
 * @param {string} path - This is the Trait identifier.
 * You can target any level of an object using the dot notation (ex. level1.level2.level3)
 * @returns {T} Returns the current value of the Trait
 */
function getTrait<T>(path: string): T {
  return storeActions.getTrait(path);
}

export default getTrait;
