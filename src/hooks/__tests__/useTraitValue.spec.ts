import { act, renderHook } from '@testing-library/react-hooks';
import storeActions from '../../services/store'; // We will call `storeActions` methods directly to check the results of `useTraitsValue`
import useTraitValue from '../useTraitValue';

// Sets some random Trait values
const randomValues = ['test', 1, { key: 2 }, false, null, new Map()];

describe('The hook `useTraitValue`', () => {
  beforeAll(() => spyOn(console, 'error'));
  beforeEach(() => storeActions.create());
  afterEach(() => storeActions.destroy());

  it(`should throw an error, if no path is specified`, () => {
    // @ts-ignore
    const { result } = renderHook(() => useTraitValue());
    expect(result.error.message).toEqual('Trait needs a string path to be accessed');
  });

  it('should throw an error, if path is an empty a string', () => {
    const { result } = renderHook(() => useTraitValue(''));
    expect(result.error.message).toEqual('Trait cannot be accessed with an empty path');
  });

  it(`should return the current Trait value`, () => {
    randomValues.forEach((testValue, index) => {
      storeActions.setTrait(`testTraitPath${index}`, testValue);
      const { result } = renderHook(() => useTraitValue(`testTraitPath${index}`));
      expect(result.current).toEqual(storeActions.getTrait(`testTraitPath${index}`));
    });
  });

  it(`should return the updated value, when the Trait value changes`, () => {
    storeActions.setTrait('testTraitPath', 'testValue');
    const testValue = 'testValue2';
    const { result } = renderHook(() => useTraitValue('testTraitPath'));
    act(() => {
      storeActions.setTrait('testTraitPath', testValue);
    });
    expect(result.current).toEqual(testValue);
  });
});
