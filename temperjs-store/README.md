# Temper Store &middot; ![](https://img.shields.io/npm/v/temperjs-store) ![](https://img.shields.io/github/issues/ktripaldi/temperjs-store) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Table of contents

- [Installation](#installation)
- [Introduction](#introduction)
- [Usage](#usage)
  - [Actions](#actions)
  - [create](#create)
  - [getTrait](#gettrait)
  - [setTrait](#settrait)
  - [subscribeToTrait](#subscribetotrait)
  - [destroy](#destroy)

### Installation

Using [npm](https://www.npmjs.com/get-npm):

```shell
npm install temperjs-store
```

Using [yarn](https://classic.yarnpkg.com/en/docs/install/):

```shell
yarn add temperjs-store
```

### Introduction

Temper Store is a state container for JavaScript apps.

### Usage

```js
// using ES6 modules
import { storeActions } from 'temperjs-store'

// using CommonJS modules
const storeActions = require('temperjs-store').storeActions

storeActions.setTrait('traitPath', 'traitValue')
```

#### Actions

Temper Store exports an object with the following interface (more details on each action below):

```typescript
interface StoreActions = {
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
```

#### create

Creates the global store object.

#### getTrait

Returns the value of a Trait.
Traits are globally shared units of state that components can subscribe to.

#### setTrait

Sets the value of a Trait.

#### subscribeToTrait

Subscribes a callback to a Trait and returns a `Subscription` object

#### destroy

Destroys the store.

## Licence

[MIT](LICENSE)
