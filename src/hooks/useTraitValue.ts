import * as React from 'react'
import storeActions from '../services/store'

/**
 * `useTraitValue` returns a globally shared unit of state that components can subscribe to
 * The component will rerender when the Trait value changes
 * @template T
 * @param {string} path - This is the Trait identifier
 * You can target any level of an object using the dot notation (ex. level1.level2.level3)
 * @returns {T} Returns the updated value of the Trait
 */
function useTraitValue<T>(path: string): T {
  const [trait, setTrait] = React.useState<T>(storeActions.getTrait<T>(path))

  React.useEffect(() => {
    const subscription = storeActions.subscribeToTrait<T>(path, setTrait)
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return trait
}

export default useTraitValue
