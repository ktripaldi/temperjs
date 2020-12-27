# Change Log

## 1.0.0 - 2020-12-27

- Separate store from React utilities

## 0.5.2 - 2020-10-10

- Make minor internal optimizations

## 0.5.1 - 2020-09-22

- Make minor internal optimizations

## 0.5.0 - 2020-09-09

- Add tests for `rxSubject`

## 0.4.4 - 2020-09-09

- Fix `SetterValue` type
- Convert interfaces to types and add some new types

## 0.4.3 - 2020-09-06

- Update logo

## 0.4.2 - 2020-09-06

- Fix Traits not being persisted when a storage service is set

## 0.4.1 - 2020-09-06

- Make major internal optimizations

## 0.3.0 - 2020-09-03

- Update readme after publishing the documentation website
- Add contributing guide

## 0.2.2 - 2020-09-02

- Fix non callable callbacks throwing error when setting a Trait
- Fix nested Traits with more than two levels not being set

## 0.2.1 - 2020-08-31

- Update readme

## 0.2.0 - 2020-08-30

- Refactor Store to allow setting object Traits with selectors

## 0.1.1 - 2020-08-29

- Fix readme errors

## 0.1.0 - 2020-08-29

- Fix default value being ignored
- Fix dependent Traits being resetted on selector update

## 0.0.7 - 2020-08-28

- Add the ability to subscribe to a Trait specifying a default value
- Allow creating a selector based on Trait that doesn't exist

## 0.0.6 - 2020-08-28

- Fix Traits not being imported from storage
- Fix dependent Traits not being retrieved correctly

## 0.0.5 - 2020-08-28

- Fix selectors not resetting dependencies on update
- Cache selector values
- Add the ability to subscribe a Trait as Loadable
- Add the ability to create a selector based on another selector

## 0.0.4 - 2020-08-26

- Fix hoc `withTemper`
- Export `Subscription`, `SetterHelpers`, `StorageService` and `StoreOptions` interfaces

## 0.0.3 - 2020-08-24

- Fix React not recognizing subscription updates when the Trait is an object
- Fix object recognition for nested Traits creation

## 0.0.2 - 2020-08-24

- Fix package release (v.0.0.1 is broken)

## 0.0.1 - 2020-08-23

- Initial release
