# Temper &middot; ![](https://img.shields.io/npm/v/temperjs) ![](https://img.shields.io/github/issues/ktripaldi/temperjs) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![alt text](Temper.png "Temper" )

## Installation

Using [npm](https://www.npmjs.com/get-npm):
```shell
npm install temperjs
```

Using [yarn](https://classic.yarnpkg.com/en/docs/install/):

```shell
yarn add temperjs
```

## Introduction

Temper is a state management library for React.

Temper's states are called Traits.
Traits are globally shared units of state that components can subscribe to.
Traits can be read and written from any component.
Subscribed components will rerender everytime the Trait value changes.

Traits can be anything. When a Trait is an object, each attribute will become a new Trait that is individually updatable and subscribable.
**Traits are type safe**. Once set, a Trait type cannot change.

A few examples (more on the usage below):

```js
setTrait('fontSize', 14);
```
will create a single trait:
- fontSize: `14`

```js
setTrait('font', { size: 14, isBold: true });
```
will create a 3 traits:
- font: `{ size: 14, isBold: true }`
- font.size: `14`
- font.isBold: `true`

These traits will be independently accessible:
```js
const font = getTrait('font');
const [size, setSize] = useTrait('font.size');
const isBold = useTraitValue('font.isBold');
```

Similarly:
```js
setTrait('font.isBold', true);
```

will create a 2 traits:
- font: `{ isBold: true }`
- font.isBold: `true`

## Usage

To be able to use Traits, you need to wrap your root component using the `withTemper()` hoc.

```jsx
// using ES6 modules
import { withTemper } from 'temperjs';
// using CommonJS modules
const withTemper = require('temperjs').withTemper

function App() {
  return <h1>Hello, world!</h1>
}

export default withTemper(App);
```

You can also pass a custom configuration:

```jsx
// using ES6 modules
import { withTemper } from 'temperjs';
// using CommonJS modules
const withTemper = require('temperjs').withTemper

function App() {
  return <h1>Hello, world!</h1>
}

export default withTemper(App, {
  pathSeparator: '>',
  storageService: new StorageService(),
  debug: true
});
```

`pathSeparator` lets you set an alternative path separator.
If you change the path separator to `>` for instance, you'll be able to reference nested Trait like this: `exampleTrait>subTrait`.

`storageService` lets you set a service to persist and retrieve Traits as you prefer.
The storage service must match the following interface:
```ts
interface StorageService {
  set: (key: string, value: unknown) => void; // This method persists Traits to the storage of your choice when they're updated
  get: (key: string) => unknown; // This method retrieve Traits from the storage of your choice when they're used the first time
  clear: (key: string) => unknown; // This method delete Traits from the storage of your choice when they're set to `undefined`
}
```

`debug`, if set to `true`, will log useful information on the browser console.

### setTrait

`setTrait` creates or updates a Trait.

```js
// using ES6 modules
import { setTrait } from 'temperjs'

// using CommonJS modules
const setTrait = require('temperjs').setTrait

// to create a new Trait
setTrait('titles', { mainTitle: "Lorem ipsum", subTitle: 'Aliquam suscipit'});
// to update a Trait
setTrait('titles.mainTitle', 'Lorem ipsum dolor sit amet');
// to update a Trait using the current value
setTrait('title.subTitle', ({ value }) => value.toLowerCase());
```

**Traits are type safe**. Once set, a Trait type cannot change.
You can however unset a Trait by passing an `undefined` value.

**Trait can also be selectors.**
A selector represents a piece of derived state and lets you build dynamic data that depends on other data.

```js
setTrait('circleArea', ({ get }) => Math.pow(get('radius'), 2) * Math.PI);
```

### useTraitValue

`useTraitValue` returns the current value of a Trait.
The component will rerender when the Trait value changes.

```js
// using ES6 modules
import { useTraitValue } from 'temperjs'

// using CommonJS modules
const useTraitValue = require('temperjs').useTraitValue

const count = useTraitValue('count');
```

### useTrait

`useTrait` returns an array of two elements:
- the result of `useTraitValue`;
- a memoized reference to `setTrait`.

```js
// using ES6 modules
import { useTrait } from 'temperjs';

// using CommonJS modules
const useTrait = require('temperjs').useTrait;

const [count, setCount] = useTrait('count');

function increaseCount() {
  setCount(({ value }) => value += 1);
}
```

### getTrait

`getTrait` returns the value of a Trait at the time it's called, so you can read its value without subscribing.

```js
// using ES6 modules
import { getTrait } from 'temperjs'

// using CommonJS modules
const getTrait = require('temperjs').getTrait

const height = getTrait('height');
```

### Licence

[MIT](LICENSE)
