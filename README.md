# Temper &middot; ![](https://img.shields.io/npm/v/temperjs) ![](https://img.shields.io/github/issues/ktripaldi/temperjs) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

![alt text](Temper.png "Temper" )

## Getting Started

This section is meant to get you familiar with the Temper way of doing things.
If you're looking for something specific, please read the [API Documentation](#api-documentation). If you're just starting out with Temper, read on!

For the purpose of this guide, we'll create a simple counter that prints _You've reached the target!_ when you get to the value of 5.

### Create React App
Temper is a state management library for React, so you need to have React installed and running to use Temper. The easiest and recommended way for bootstrapping a React application is to use [Create React App](https://github.com/facebook/create-react-app#creating-an-app):

```shell
npx create-react-app my-app
```

> [npx](https://medium.com/@maybekatz/introducing-npx-an-npm-package-runner-55f7d4bd282b) is a package runner tool that comes with npm 5.2+ and higher, see [instructions for older npm versions](https://gist.github.com/gaearon/4064d3c23a77c74a3614c498a8bb1c5f).

For more ways to install Create React App, see the [official documentation](https://github.com/facebook/create-react-app#creating-an-app).

### Installation

Using [npm](https://www.npmjs.com/get-npm):
```shell
npm install temperjs
```

Using [yarn](https://classic.yarnpkg.com/en/docs/install/):

```shell
yarn add temperjs
```

### withTemper

If you want to use Temper states, you need to wrap your component (preferably the root component) with the hoc `withTemper`.

```jsx
import React from 'react';
import { withTemper } from 'temperjs';

function App() {
  return <Counter />
}

export default withTemper(App);
```

We'll implement the `Counter` component in the following section.

### Traits

Temper states are called **Traits**.
Traits are globally shared units of state that components can subscribe to.
**Traits can be read and written from any component.**
Subscribed components will rerender everytime the Trait value changes.

If you want to set a Trait, use can use the action `setTrait`:

```jsx
import React from 'react';
import { withTemper, setTrait } from 'temperjs';

function App() {
  setTrait('count', 0);
  return <Counter />
}

export default withTemper(App);
```

If you need to read from **and write to** a Trait, you can use the hook `useTrait`:

```jsx
import React from 'react';
import { useTrait } from 'temperjs';

function Counter() {
  const [count, setCount] = useTrait('count');

  function incrementCounter() {
    setCount(({ value }) => value + 1);
  }
  function decrementCounter() {
    setCount(({ value }) => value - 1);
  }

  return (
    <div>
      <p>{count}</p>
      <button onClick={incrementCounter}>Increment</button>
      <button onClick={decrementCounter}>Decrement</button>
    </div>
  );
}

export default Counter;

```

### Selectors

**A selector is a derived state**. You can think of selectors as the output of passing a state to a pure function that execute some logic based on that state.

In Temper selectors are regular Traits:

```jsx
import React from 'react';
import { withTemper, setTrait } from 'temperjs';

function App() {
  // This is a simple Trait
  setTrait('count', 0);
  // This is a selector Trait
  setTrait('isTargetReached', ({ get }) => get('count') >= 5);

  return <Counter />
}

export default withTemper(App);
```

### Nested Traits

Temper encourages you to wrap related Traits in a single object.
**When a Trait is an object, each attribute will become a new Trait that is individually updatable and subscribable**:

```jsx
import React from 'react';
import { withTemper, setTrait } from 'temperjs';

function App() {
  setTrait('counter', {
    count: 0,
    isTargetReached: ({ get }) => get('counter.count') >= 5
  });

  return <Counter />
}

export default withTemper(App);
```

You'll be able to reference nested Traits with the dot notation.
If you just need to read a Trait, you can use the hook `useTraitValue`:

```jsx
import React from 'react';
import { useTrait, useTraitValue } from 'temperjs';

function Counter() {
  const [count, setCount] = useTrait('counter.count');
  const isTargetReached = useTraitValue('counter.isTargetReached');

  function incrementCounter() {
    setCount(({ value }) => value + 1);
  }
  function decrementCounter() {
    setCount(({ value }) => value - 1);
  }

  return (
    <div>
      <p>{count} { isTargetReached && (<span>You've reached the target!</span>)}</p>
      <button onClick={incrementCounter}>Increment</button>
      <button onClick={decrementCounter}>Decrement</button>
    </div>
  );
}

export default Counter;

```

### Wrapping things up

Run the Counter on [Sandbox](https://codesandbox.io/s/temperjs-getting-started-o9l56?file=/src/App.js).

## API Documentation

### withTemper

If you want to use Temper states, you need to wrap your component (preferably the root component) with the hoc `withTemper`.

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

- `pathSeparator` lets you set an alternative path separator.
If you change the path separator to `>` for instance, you'll be able to reference nested Trait like this: `exampleTrait>subTrait`.

- `storageService` lets you set a service to persist and retrieve Traits as you prefer.
The storage service must match the following interface:
```ts
interface StorageService {
  set: (key: string, value: unknown) => void; // This method persists Traits to the storage of your choice when they're updated
  get: (key: string) => unknown; // This method retrieve Traits from the storage of your choice when they're used the first time
  clear: (key: string) => unknown; // This method delete Traits from the storage of your choice when they're set to `undefined`
}
```

- `debug`, if set to `true`, will log useful information on the browser console.

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

Traits are type safe. Once set, a Trait type cannot change.
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

You can also pass a subscription configuration:

```js
// using ES6 modules
import { useTraitValue } from 'temperjs'

// using CommonJS modules
const useTraitValue = require('temperjs').useTraitValue

const count = useTraitValue('count', { default: 0 });
const count = useTraitValue('asyncCount', { loadable: true });
```

- `default` lets you specify a default value to be used when the Trait doesn't exist yet or when its value is `undefined`.

- `loadable` tells the hook that you want to receive a Loadable instance of the Trait.

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

`useTrait` accepts the same subscription configuration options of `useTraitValue`.

### getTrait

`getTrait` returns the value of a Trait at the time it's called, so you can read its value without subscribing.

```js
// using ES6 modules
import { getTrait } from 'temperjs'

// using CommonJS modules
const getTrait = require('temperjs').getTrait

const height = getTrait('height');
```

## Licence

[MIT](LICENSE)
