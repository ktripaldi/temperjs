import * as React from 'react'
import storeActions from '../services/store'
import { StoreOptions } from '..'

/**
 * `withTemper` wraps your application by creating the Temper store
 * @template T
 * @param {React.FunctionComponent<P> | React.ComponentType<P>} Component - This is the Component to wrap, preferably the root of your application
 * @param {StoreOptions} [options] - These are the options for the store
 */
function withTemper<P extends {}>(
  Component: React.FunctionComponent<P> | React.ComponentType<P>,
  options?: StoreOptions
): React.FC {
  storeActions.create(options)
  return function (props) {
    return <Component {...(props as P)} />
  }
}

export default withTemper
