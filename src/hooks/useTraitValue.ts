import * as React from 'react'
import storeActions from '../services/store'
import { Loadable, SubscriptionOptions } from '..'

/**
 * `useTraitValue` returns the up-to-date value of the specified Trait
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {SubscriptionOptions} [options] - These are the options of your subscription
 * @returns {T | Loadable<T>} This is the up-to-date value of the Trait
 */
function useTraitValue<T>(
  path: string,
  options?: SubscriptionOptions<T>
): T | Loadable<T> | undefined {
  const [trait, setTrait] = React.useState<T>()

  React.useEffect(() => {
    const subscription = storeActions.subscribeToTrait<T>(
      path,
      setTrait,
      options
    )
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return trait
}

export default useTraitValue
