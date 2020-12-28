export type Trait<T> = T | Promise<T> | undefined

export type SetterHelpers<T> = {
  value: Trait<T>
  get(path: string): unknown
}

export type SetterValue<T> =
  | Trait<T>
  | ((helpers: SetterHelpers<T>) => Trait<T>)

export type RegisterTraitOptions = {
  ignorePrevious: boolean
}

export type Subject<T> = {
  sink: Observer<T>
  source$: Subscribable
  hasObservers(): boolean
}

export type Observer<T> = {
  next(val: T): void
  error?(error?: any): void
  complete?(): void
}

export type Subscribable = {
  subscribe<T>(observer: Observer<T>): Subscription
  subscribe<T>(
    next: (val: T) => void,
    error?: (error?: any) => void,
    complete?: () => void
  ): Subscription
}

export type Subscription = {
  unsubscribe(): void
}

export type StorageService = {
  set: (key: string, value: unknown) => void
  get: (key: string) => unknown
  clear: (key: string) => unknown
}

export type StoreOptions = {
  pathSeparator?: string
  storageService?: StorageService
  debug?: boolean
}

export type ResolveTraitOptions = {
  tiedPath?: string
  correlationId?: string
}

export type Store = {
  paths: Set<string>
  pathSeparator: string
  traits: Record<string, unknown>
  subjects: Map<string, Subject<unknown>>
  tiedTraits: Map<string, Set<string>>
  selectors: Map<
    string,
    {
      value: (<T>(helpers: SetterHelpers<T>) => T | Promise<T>) | undefined
      tiedTraits: Set<string>
      correlationId: string
    }
  >
  storageService: StorageService | undefined
  debug: boolean
}

export type StoreActions = {
  create(options?: StoreOptions): void
  getTrait<T>(path: string): Trait<T>
  setTrait<T>(path: string, traitValue: SetterValue<T>): void
  subscribeToTrait<T>(
    path: string,
    callback: (traitValue: Trait<T>) => void,
    defaultValue?: Trait<T>
  ): Subscription | undefined
  destroy(): void
}
