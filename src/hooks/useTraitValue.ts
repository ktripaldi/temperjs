import * as React from 'react'
import storeActions from '../services/store'
import { Loadable, SubscriptionOptions } from '..'

/**
 * `useTraitValue` returns a globally shared unit of state that components can subscribe to
 * The component will rerender when the Trait value changes
 * @template T
 * @param {string} path - This is the Trait identifier
 * @param {SubscriptionOptions} options - These are the options of your subscription
 * @returns {T | Loadable<T>} Returns the updated value of the Trait
 */
function useTraitValue<T>(
  path: string,
  options?: SubscriptionOptions
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
