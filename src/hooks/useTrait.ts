import * as React from 'react'
import { useTraitValue, setTrait, SetterHelpers } from '..'
import { Loadable, SubscriptionOptions } from '..'

/**
 * `useTrait` returns an array of two elements:
 * - the result of `useTraitValue`;
 * - a memoized reference to `setTrait`.
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {SubscriptionOptions} options - These are the options of your subscription
 * @returns {[T, (traitValue: T) => void]} Returns an array of two elements: the result of `useTraitValue` and a memoized reference to `setTrait`
 */
function useTrait<T>(
  path: string,
  options?: SubscriptionOptions
): [T | Loadable<T> | undefined, (traitValue: T) => void] {
  return [
    useTraitValue<T>(path, options),
    React.useCallback(
      (traitValue: T | ((helpers: SetterHelpers<T>) => T)): void =>
        setTrait<T>(path, traitValue),
      []
    )
  ]
}

export default useTrait
