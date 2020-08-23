import * as React from 'react'
import storeActions, { StoreOptions } from '../services/store'

function withTemper(Component: React.FC, options?: StoreOptions): React.FC {
  return function () {
    storeActions.create(options)
    return <Component />
  }
}

export default withTemper
