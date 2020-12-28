import React from 'react'
import { useTrait, useTraitValue, SetterHelpers } from 'temperjs'

function Counter() {
  const [count, setCount] = useTrait<number>('counter.count')
  const isTargetReached = useTraitValue<boolean>('counter.isTargetReached')

  function incrementCounter() {
    setCount(({ value }: SetterHelpers<number>) => (value as number) + 1)
  }
  function decrementCounter() {
    setCount(({ value }: SetterHelpers<number>) => (value as number) - 1)
  }

  return (
    <div>
      <p>
        {count} {isTargetReached && <span>You've reached the target!</span>}
      </p>
      <button onClick={incrementCounter}>Increment</button>
      &nbsp;
      <button onClick={decrementCounter}>Decrement</button>
    </div>
  )
}

export default Counter
