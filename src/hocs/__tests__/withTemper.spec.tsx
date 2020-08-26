import React from 'react'
import storeActions from '../../services/store' // We will call `storeActions` methods directly to check the results of `useTraitsValue`
import withTemper from '../withTemper'

const TestComponent = function () {
  return <h1>Test component</h1>
}

describe('The hoc withTemper', () => {
  it(`should return the wrapped component`, () => {
    const wrappedComponent = withTemper(TestComponent)
    expect(
      String(wrappedComponent).includes('return React.createElement')
    ).toBeTruthy()
  })

  it(`should create the Temper store`, () => {
    const storeCreateSpy = jest.spyOn(storeActions, 'create')
    withTemper(TestComponent)
    expect(storeCreateSpy).toHaveBeenCalled()
  })
})
