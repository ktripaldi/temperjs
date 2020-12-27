import { Trait, SetterValue } from 'temperjs-store'

export enum LoadableState {
  HAS_VALUE = 'hasValue',
  HAS_ERROR = 'hasError',
  LOADING = 'loading'
}

export type Loadable<T> = {
  state: LoadableState
  value: Trait<T> | Error
}

export type SubscribedTrait<T> = Trait<T> | Loadable<T>

export type Setter<T> = (traitValue: SetterValue<T>) => void

export type WithSetter<T> = [T, Setter<T>]

export type AsyncWithSetter<T> = [Promise<T>, Setter<Promise<T>>]

export type LoadableWithSetter<T> = [Loadable<T>, Setter<Promise<T>>]

export type SubscriptionOptions<T> = {
  default?: Trait<T>
  loadable?: boolean
}
