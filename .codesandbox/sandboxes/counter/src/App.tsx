import React, { useEffect } from 'react'
import { withTemper, setTrait, SetterHelpers } from 'temperjs'
import Counter from './Counter'

function App() {
  setTrait('counter', {
    count: 0,
    isTargetReached: ({ get }: SetterHelpers<boolean>) =>
      (get('counter.count') as number) >= 5
  })

  return <Counter />
}

export default withTemper(App, { debug: true })
