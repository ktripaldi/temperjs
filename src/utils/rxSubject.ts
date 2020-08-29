import {
  Subject,
  Observer,
  Subscribable,
  Subscription
} from '../config/interfaces'

export default function createSubject<T>(): Subject<T> {
  let done: { key: 'error' | 'complete'; args: any[] }
  const resources = [] as [Observer<T>, SubscriptionOptions<T>][]

  const sink: Observer<T> = {
    next: emit('next'),
    error: emit('error'),
    complete: emit('complete')
  }

  const source$: Subscribable = {
    subscribe
  }

  const hasObservers = () => resources.length > 0

  return { sink, source$, hasObservers }

  function emit(this: void, key: 'next' | 'error' | 'complete') {
    return (...args: any[]) => {
      if (done) {
        return
      }
      for (const resource of resources.slice()) {
        apply(resource, key, args)
      }
      if (key === 'next') {
        return
      }
      resources.splice(0, resources.length)
      done = { key, args }
    }
  }

  function subscribe(
    this: void,
    options: SubscriptionOptions<T>,
    startValue: T | undefined,
    observerOrNext: Observer<T> | ((val: T) => void),
    error?: (error?: any) => void,
    complete?: () => void
  ): Subscription {
    const observer = toObserver(observerOrNext, error, complete)

    if (done) {
      const { key, args } = done
      apply([observer, options], key, args)
      // tslint:disable-next-line:no-empty
      return { unsubscribe() {} }
    }

    resources.push([observer, options])
    apply([observer, options], 'next', [startValue])
    return { unsubscribe }

    function unsubscribe(): void {
      const i = resources.findIndex(item => item.includes(observer))
      if (i >= 0) {
        resources.splice(i, 1)
      }
    }
  }
}

function toObserver<T>(
  this: void,
  observerOrNext = nop as Observer<T> | ((val: T) => void),
  error = nop as (error?: any) => void,
  complete = nop as () => void
): Observer<T> {
  return typeof observerOrNext !== 'function'
    ? toObserver(
        observerOrNext.next.bind(observerOrNext),
        // @ts-ignore
        observerOrNext.error.bind(observerOrNext),
        // @ts-ignore
        observerOrNext.complete.bind(observerOrNext)
      )
    : { next: observerOrNext, error, complete }
}

function apply<T>(
  resource: [Observer<T>, SubscriptionOptions<T>],
  key: 'next' | 'error' | 'complete',
  args: any[]
) {
  ;(resource[0][key] as (val?: T) => void)(
    ...args.map(arg => {
      if (resource[1].loadable) {
        if (typeof arg?.then === 'function') {
          arg
            .then((response: T) => {
              apply(resource, key, [response])
            })
            .catch((error: Error) => {
              apply(resource, key, [error])
            })
          return {
            state: LoadableState.LOADING,
            value: arg
          }
        }
        return {
          state:
            arg instanceof Error
              ? LoadableState.HAS_ERROR
              : LoadableState.HAS_VALUE,
          value: arg
        }
      }
      return arg ?? resource[1].default
    })
  )
}

// tslint:disable-next-line:no-empty
function nop() {}
