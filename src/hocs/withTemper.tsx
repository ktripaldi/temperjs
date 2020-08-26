import * as React from 'react'
import storeActions, { StoreOptions } from '../services/store'

function withTemper(Component: React.FC, options?: StoreOptions): React.FC {
  storeActions.create(options)
  return function (props) {
    return <Component {...props} />
  }
}

export default withTemper
