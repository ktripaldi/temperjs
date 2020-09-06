import * as React from 'react'
import useTraitValue from '../hooks/useTraitValue'
import setTrait from '../actions/setTrait'
import {
  SubscriptionOptions,
  SubscribedTrait,
  TraitSetterValue
} from '../config/interfaces'

/**
 * `useTrait` returns a tuple with:
 * - the result of `useTraitValue`;
 * - a memoized reference to `setTrait`.
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {SubscriptionOptions} [options] - These are the options of your subscription
 * @returns {[SubscribedTrait<T>, (traitValue: TraitSetterValue<T>) => void]} This is the result of `useTraitValue` and a memoized reference to `setTrait`
 */
function useTrait<T>(
  path: string,
  options?: SubscriptionOptions<T>
): [SubscribedTrait<T>, (traitValue: TraitSetterValue<T>) => void] {
  return [
    useTraitValue<T>(path, options),
    React.useCallback(
      (traitValue: TraitSetterValue<T>): void => setTrait<T>(path, traitValue),
      []
    )
  ]
}

export default useTrait
