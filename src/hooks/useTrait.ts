import * as React from 'react'
import useTraitValue from './useTraitValue'
import setTrait from '../actions/setTrait'

/**
 * `useTrait` returns an array of two elements:
 * - the result of `useTraitValue`;
 * - a memoized reference to `setTrait`.
 * @template T
 * @param {string} path - This is the Trait identifier
 * You can target any level of an object using the dot notation (ex. level1.level2.level3)
 * @returns {[T, (traitValue: T) => void]} Returns an array of two elements: the result of `useTraitValue` and a memoized reference to `setTrait`
 */
function useTrait<T>(path: string): [T, (traitValue: T) => void] {
  return [
    useTraitValue<T>(path),
    React.useCallback(
      (traitValue: T): void => setTrait<T>(path, traitValue),
      []
    )
  ]
}

export default useTrait
