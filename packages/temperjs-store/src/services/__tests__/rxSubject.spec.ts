import { Subscription } from '../../config/types'
import createSubject from '../rxSubject'
import { of, Subscriber } from 'rxjs'
import { delay } from 'rxjs/operators'

describe('rxSubject', function () {
  describe('.source$', function () {
    it('should pump values right on through itself', function (done) {
      const subject = createSubject()
      const expected = ['testValue1', 'testValue2']

      const sub = subject.source$.subscribe(
        function (value: string) {
          expect(value).toBe(expected.shift())
        },
        function () {
          sub.unsubscribe()
          done(new Error('should not be called'))
        },
        function () {
          sub.unsubscribe()
          done()
        }
      )

      subject.sink.next('testValue1')
      subject.sink.next('testValue2')
      if (subject.sink.complete) subject.sink.complete()
    })

    it('should pump values to multiple subscribers', function (done) {
      const subject = createSubject()
      const expected = ['testValue1', 'testValue2']
      const subscriptions: Subscription[] = []

      let i = 0
      let j = 0

      subscriptions.push(
        subject.source$.subscribe(function (value: string) {
          expect(value).toBe(expected[i++])
        })
      )

      subscriptions.push(
        subject.source$.subscribe(
          function (value: string) {
            expect(value).toBe(expected[j++])
          },
          function () {
            subscriptions.forEach(subscription => subscription.unsubscribe())
            done(new Error('should not be called'))
          },
          function () {
            subscriptions.forEach(subscription => subscription.unsubscribe())
            done()
          }
        )
      )

      subject.sink.next('testValue1')
      subject.sink.next('testValue2')
      if (subject.sink.complete) subject.sink.complete()
    })

    it('should handle subscribers that arrive and leave at different times, subject does not complete', function () {
      const subject = createSubject()
      const results1: (number | string)[] = []
      const results2: (number | string)[] = []
      const results3: (number | string)[] = []

      subject.sink.next(1)
      subject.sink.next(2)
      subject.sink.next(3)
      subject.sink.next(4)

      const subscription1 = subject.source$.subscribe(
        function (value: number) {
          results1.push(value)
        },
        function () {
          results1.push('E')
        },
        function () {
          results1.push('C')
        }
      )

      subject.sink.next(5)

      const subscription2 = subject.source$.subscribe(
        function (value: number) {
          results2.push(value)
        },
        function () {
          results2.push('E')
        },
        function () {
          results2.push('C')
        }
      )

      subject.sink.next(6)
      subject.sink.next(7)

      subscription1.unsubscribe()

      subject.sink.next(8)

      subscription2.unsubscribe()

      subject.sink.next(9)
      subject.sink.next(10)

      const subscription3 = subject.source$.subscribe(
        function (value: number) {
          results3.push(value)
        },
        function () {
          results3.push('E')
        },
        function () {
          results3.push('C')
        }
      )

      subject.sink.next(11)

      subscription3.unsubscribe()

      expect(results1).toEqual([5, 6, 7])
      expect(results2).toEqual([6, 7, 8])
      expect(results3).toEqual([11])
    })

    it(
      'should handle subscribers that arrive and leave at different times, ' +
        'subject completes',
      function () {
        const subject = createSubject()
        const results1: (number | string)[] = []
        const results2: (number | string)[] = []
        const results3: (number | string)[] = []

        subject.sink.next(1)
        subject.sink.next(2)
        subject.sink.next(3)
        subject.sink.next(4)

        const subscription1 = subject.source$.subscribe(
          function (value: number) {
            results1.push(value)
          },
          function () {
            results1.push('E')
          },
          function () {
            results1.push('C')
          }
        )

        subject.sink.next(5)

        const subscription2 = subject.source$.subscribe(
          function (value: number) {
            results2.push(value)
          },
          function () {
            results2.push('E')
          },
          function () {
            results2.push('C')
          }
        )

        subject.sink.next(6)
        subject.sink.next(7)

        subscription1.unsubscribe()

        if (subject.sink.complete) subject.sink.complete()

        subscription2.unsubscribe()

        const subscription3 = subject.source$.subscribe(
          function (value: number) {
            results3.push(value)
          },
          function () {
            results3.push('E')
          },
          function () {
            results3.push('C')
          }
        )

        subscription3.unsubscribe()

        expect(results1).toEqual([5, 6, 7])
        expect(results2).toEqual([6, 7, 'C'])
        expect(results3).toEqual(['C'])
      }
    )

    it(
      'should handle subscribers that arrive and leave at different times, ' +
        'subject terminates with an error',
      function () {
        const subject = createSubject()
        const results1: (number | string)[] = []
        const results2: (number | string)[] = []
        const results3: (number | string)[] = []

        subject.sink.next(1)
        subject.sink.next(2)
        subject.sink.next(3)
        subject.sink.next(4)

        const subscription1 = subject.source$.subscribe(
          function (value: number) {
            results1.push(value)
          },
          function () {
            results1.push('E')
          },
          function () {
            results1.push('C')
          }
        )

        subject.sink.next(5)

        const subscription2 = subject.source$.subscribe(
          function (value: number) {
            results2.push(value)
          },
          function () {
            results2.push('E')
          },
          function () {
            results2.push('C')
          }
        )

        subject.sink.next(6)
        subject.sink.next(7)

        subscription1.unsubscribe()

        if (subject.sink.error) subject.sink.error(new Error('err'))

        subscription2.unsubscribe()

        const subscription3 = subject.source$.subscribe(
          function (value: number) {
            results3.push(value)
          },
          function () {
            results3.push('E')
          },
          function () {
            results3.push('C')
          }
        )

        subscription3.unsubscribe()

        expect(results1).toEqual([5, 6, 7])
        expect(results2).toEqual([6, 7, 'E'])
        expect(results3).toEqual(['E'])
      }
    )

    it(
      'should handle subscribers that arrive and leave at different times, ' +
        'subject completes before nexting any value',
      function () {
        const subject = createSubject()
        const results1: (number | string)[] = []
        const results2: (number | string)[] = []
        const results3: (number | string)[] = []

        const subscription1 = subject.source$.subscribe(
          function (value: number) {
            results1.push(value)
          },
          function () {
            results1.push('E')
          },
          function () {
            results1.push('C')
          }
        )

        const subscription2 = subject.source$.subscribe(
          function (value: number) {
            results2.push(value)
          },
          function () {
            results2.push('E')
          },
          function () {
            results2.push('C')
          }
        )

        subscription1.unsubscribe()

        if (subject.sink.complete) subject.sink.complete()

        subscription2.unsubscribe()

        const subscription3 = subject.source$.subscribe(
          function (value: number) {
            results3.push(value)
          },
          function () {
            results3.push('E')
          },
          function () {
            results3.push('C')
          }
        )

        subscription3.unsubscribe()

        expect(results1).toEqual([])
        expect(results2).toEqual(['C'])
        expect(results3).toEqual(['C'])
      }
    )
    it('should support subscription from an RxJS Subscriber', function (done) {
      const subject = createSubject()
      const expected = ['testValue1', 'testValue2']
      const err = new Error('boom')

      const sub = subject.source$.subscribe(
        Subscriber.create(
          function (value: string | undefined) {
            expect(value).toBe(expected.shift())
          },
          function (value: Error) {
            expect(value).toBe(err)
            sub.unsubscribe()
            done()
          },
          function () {
            sub.unsubscribe()
            done(new Error('should not be called'))
          }
        )
      )

      subject.sink.next('testValue1')
      subject.sink.next('testValue2')
      if (subject.sink.error) subject.sink.error(err)
    })
    it(
      'should pump values to multiple subscribers one after the other, ' +
        'in order of subscriptions',
      function (done) {
        const subject = createSubject()
        const subscriptions: Subscription[] = []

        let seq = 0
        let i = 0
        let j = 0
        let k = 0

        subscriptions.push(
          subject.source$.subscribe(function () {
            expect(seq++).toBe(3 * i++)
          })
        )

        subscriptions.push(
          subject.source$.subscribe(function () {
            expect(seq++).toBe(1 + 3 * j++)
          })
        )

        subscriptions.push(
          subject.source$.subscribe(
            function () {
              expect(seq++).toBe(2 + 3 * k++)
            },
            function () {
              subscriptions.forEach(subscription => subscription.unsubscribe())
              done(new Error('should not be called'))
            },
            function () {
              subscriptions.forEach(subscription => subscription.unsubscribe())
              done()
            }
          )
        )

        subject.sink.next('testValue1')
        subject.sink.next('testValue2')
        subject.sink.next('testValue3')
        if (subject.sink.complete) subject.sink.complete()
      }
    )
  })

  describe('.sink', function () {
    it('should be an Observer which can be given to Observable.subscribe', function (done) {
      const source = of(1, 2, 3, 4, 5)
      const subject = createSubject()
      const expected = [1, 2, 3, 4, 5]

      const sub = subject.source$.subscribe(
        function (value: number) {
          expect(value).toBe(expected.shift())
        },
        function () {
          sub.unsubscribe()
          done(new Error('should not be called'))
        },
        function () {
          sub.unsubscribe()
          done()
        }
      )

      source.subscribe(subject.sink)
    })

    it('should be usable as an Observer of a finite delayed Observable', function (done) {
      const source = of(1, 2, 3).pipe(delay(50))
      const subject = createSubject()

      const expected = [1, 2, 3]

      subject.source$.subscribe(
        function (value: number) {
          expect(value).toBe(expected.shift())
        },
        function () {
          done(new Error('should not be called'))
        },
        function () {
          done()
        }
      )

      source.subscribe(subject.sink)
    })

    it('should not next after completed', function () {
      const subject = createSubject()
      const results: string[] = []
      const sub = subject.source$.subscribe(
        (result: string) => results.push(result),
        undefined,
        () => results.push('C')
      )
      subject.sink.next('a')
      if (subject.sink.complete) subject.sink.complete()
      subject.sink.next('b')
      expect(results).toEqual(['a', 'C'])
      sub.unsubscribe()
    })

    it('should not next after error', function () {
      const error = new Error('wut?')
      const subject = createSubject()
      const results: (string | Error)[] = []
      const sub = subject.source$.subscribe(
        (result: string) => results.push(result),
        (err: Error) => results.push(err)
      )
      subject.sink.next('a')
      if (subject.sink.error) subject.sink.error(error)
      subject.sink.next('b')
      expect(results).toEqual(['a', error])
      sub.unsubscribe()
    })
  })
})
