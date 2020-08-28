import * as React from 'react'
import { useTraitValue, setTrait, SetterHelpers } from '..'
import { Loadable, SubscriptionOptions } from '..'

/**
 * `useTrait` returns a tuple with:
 * - the result of `useTraitValue`;
 * - a memoized reference to `setTrait`.
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {SubscriptionOptions} [options] - These are the options of your subscription
 * @returns {[T | Loadable<T> | undefined, (traitValue: T) => void]} This is the result of `useTraitValue` and a memoized reference to `setTrait`
 */
function useTrait<T>(
  path: string,
  options?: SubscriptionOptions
): [
  T | Loadable<T> | undefined,
  (traitValue: T | ((helpers: SetterHelpers<T>) => T)) => void
] {
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
