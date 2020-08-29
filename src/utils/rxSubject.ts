import {
  Subject,
  Observer,
  Subscribable,
  Subscription
} from '../config/interfaces'

export default function createSubject<T>(): Subject<T> {
  let done: { key: 'error' | 'complete'; args: any[] }
  const observers = [] as Observer<T>[]

  const sink: Observer<T> = {
    next: emit('next'),
    error: emit('error'),
    complete: emit('complete')
  }

  const source$: Subscribable = {
    subscribe
  }

  const hasObservers = () => observers.length > 0

  return { sink, source$, hasObservers }

  function emit(this: void, key: 'next' | 'error' | 'complete') {
    return (...args: any[]) => {
      if (done) {
        return
      }
      for (const observer of observers.slice()) {
        apply(observer, key, args)
      }
      if (key === 'next') {
        return
      }
      observers.splice(0, observers.length)
      done = { key, args }
    }
  }

  function subscribe(
    this: void,
    observerOrNext: Observer<T> | ((val: T) => void),
    error?: (error?: any) => void,
    complete?: () => void
  ): Subscription {
    const observer = toObserver(observerOrNext, error, complete)

    if (done) {
      const { key, args } = done
      apply(observer, key, args)
      // tslint:disable-next-line:no-empty
      return { unsubscribe() {} }
    }

    observers.push(observer)
    return { unsubscribe }

    function unsubscribe(): void {
      const i = observers.indexOf(observer)
      if (i >= 0) {
        observers.splice(i, 1)
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

function apply<T>(observer: Observer<T>, key: string, args: any[]) {
  ;((observer as any)[key] as (val?: T) => void)(...args)
}

// tslint:disable-next-line:no-empty
function nop() {}
