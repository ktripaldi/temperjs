export type Trait<T> = T | Promise<T> | undefined

export type SubscribedTrait<T> = Trait<T> | Loadable<T>

export interface SetterHelpers<T> {
  value: Trait<T>
  get(path: string): unknown
}

export type TraitSetterValue<T> =
  | T
  | Promise<T>
  | ((helpers: SetterHelpers<T>) => T | Promise<T>)

export enum LoadableState {
  HAS_VALUE = 'hasValue',
  HAS_ERROR = 'hasError',
  LOADING = 'loading'
}

export interface Loadable<T> {
  state: LoadableState
  value: Trait<T> | Error
}

export interface SubscriptionOptions<T> {
  default?: Trait<T>
  loadable?: boolean
}

export interface Subject<T> {
  sink: Observer<T>
  source$: Subscribable
  hasObservers(): boolean
}

export interface Observer<T> {
  next(val: T): void
  error?(error?: any): void
  complete?(): void
}

export interface Subscribable {
  subscribe<T>(observer: Observer<T>): Subscription
  subscribe<T>(
    next: (val: T) => void,
    error?: (error?: any) => void,
    complete?: () => void
  ): Subscription
}

export interface Subscription {
  unsubscribe(): void
}

export interface StorageService {
  set: (key: string, value: unknown) => void
  get: (key: string) => unknown
  clear: (key: string) => unknown
}

export interface StoreOptions {
  pathSeparator?: string
  storageService?: StorageService
  debug?: boolean
}

export interface ResolveTraitOptions {
  getSelectorCached?: boolean
  tiedPath?: string
  correlationId?: string
}

export interface Store {
  paths: Map<string, (string | number)[]>
  pathSeparator: string
  traits: unknown[]
  subjects: Map<string, Subject<unknown>>
  tiedTraits: Map<string, Set<string>>
  selectors: Map<
    string,
    { value: unknown; tiedTraits: Set<string>; correlationId: string }
  >
  storageService: StorageService | undefined
  debug: boolean
  size: number
}

export interface StoreActions {
  create(options?: StoreOptions): void
  getTrait<T>(path: string): Trait<T>
  setTrait<T>(path: string, traitValue: TraitSetterValue<T>): void
  subscribeToTrait<T>(
    path: string,
    callback: (traitValue: Trait<T>) => void,
    defaultValue?: Trait<T>
  ): Subscription | undefined
  destroy(): void
}
