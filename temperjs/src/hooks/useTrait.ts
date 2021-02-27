import * as React from 'react'
import { SetterValue } from 'temperjs-store'
import useTraitValue from '../hooks/useTraitValue'
import setTrait from '../actions/setTrait'
import { SubscriptionOptions, SubscribedTrait, Setter } from '../config/types'

/**
 * `useTrait` returns a tuple with:
 * - the result of `useTraitValue`;
 * - a memoized reference to `setTrait`.
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {SubscriptionOptions} [options] - These are the options of your subscription
 * @returns {[SubscribedTrait<T>, (traitValue: SetterValue<T>) => void]} This is the result of `useTraitValue` and a memoized reference to `setTrait`
 */
function useTrait<T>(path: string): [T | undefined, Setter<T>]
function useTrait<T>(path: string, options: { default: T }): [T, Setter<T>]
function useTrait<T>(
  path: string,
  options?: SubscriptionOptions<T>
): [SubscribedTrait<T>, Setter<T>]
function useTrait<T>(
  path: string,
  options?: SubscriptionOptions<T>
): [SubscribedTrait<T>, Setter<T>] {
  return [
    useTraitValue<T>(path, options),
    React.useCallback(
      (traitValue: SetterValue<T>): void => setTrait<T>(path, traitValue),
      []
    )
  ]
}

export default useTrait
