import * as React from 'react'
import { storeActions } from 'temperjs-store'
import {
  LoadableState,
  SubscribedTrait,
  SubscriptionOptions
} from '../config/types'

/**
 * `useTraitValue` returns the up-to-date value of the specified Trait
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {SubscriptionOptions} [options] - These are the options of your subscription
 * @returns {SubscribedTrait<T>} This is the up-to-date value of the Trait
 */
function useTraitValue<T>(
  path: string,
  options?: SubscriptionOptions<T>
): SubscribedTrait<T> {
  const [trait, setTrait] = React.useState<SubscribedTrait<T>>(
    storeActions.getTrait<T>(path) ?? options?.default
  )

  React.useEffect(() => {
    const subscription = storeActions.subscribeToTrait<T>(
      path,
      setTrait,
      options?.default
    )
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  if (options?.loadable && typeof (trait as Promise<T>)?.then === 'function') {
    ;(trait as Promise<T>)
      .then(resolve => {
        setTrait({
          state: LoadableState.HAS_VALUE,
          value: resolve
        })
      })
      .catch(error => {
        setTrait({
          state: LoadableState.HAS_ERROR,
          value: error
        })
      })
    return {
      state: LoadableState.LOADING,
      value: trait as Promise<T>
    }
  }
  return trait as T
}

export default useTraitValue
