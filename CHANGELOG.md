# Change Log

All notable changes to this project will be documented in this file.

## 3.0.1 - 2022-06-10
- Add `beforeUnload` builder. @benjackwhite

## 3.0.0 - 2022-05-12
- Kea v3 support

## 1.0.7 - 2022-01-25

- Add `currentLocation` selector to `router`, which contains both `search` and `searchParams` unlike `location` that doesn't contain the params.
- Add `previousLocation` as the 5th argument to `urlToAction` functions. 

## 1.0.6 - 2021-11-07

- Add `lastMethod` value to easily check if the back button was pressed (`POP`) or not (`PUSH` or `REPLACE`).

## 1.0.5 - 2021-10-21

- Pass the payload of the `router.actions.locationChagned` action as the 4th parameter to `urlToAction`.

## 1.0.4 - 2021-10-19

- Change build from `rollup` to `tsc`

## 1.0.3 - 2021-10-19

- Fix package.json paths.

## 1.0.2 - 2021-07-13

- Fix `combineUrl` util's type's fix

## 1.0.1 - 2021-07-13

- Fix `combineUrl` util's type

## 1.0.0 - 2021-07-01

- This library is stable enough, bumping to 1.0! :tada:
- Add option to return `{ replace: true }` as the 4th array element from `actionToUrl`, which will `replace`
  the last location in the stack instead of `push`ing a new one.

## 0.5.3 - 2021-04-28

- Add `<A href='/url'>text</A>` tag which hijacks `onClick` and delegates the rest to an `<a>` tag.

## 0.5.2 - 2020-10-27

- Adds `urlPatternOptions` to `routerPlugin` options. Use the following to match emails in url segments:

```js
routerPlugin({
  urlPatternOptions: {
    segmentValueCharset: 'a-zA-Z0-9-_~ %.@', // adds '@' to default
  },
}),
```

## 0.5.1 - 2020-10-27

- Fix type issues

## 0.5.0 - 2020-10-27

- Requires Kea 2.2.1 to work
- Added types

## 0.4.0 - 2020-06-15

- Works with passing objects (`{}`) to `actionsToUrl` and `urlToActions`. Passing
  functions (`() => ({})`) no longer strictly needed.

## 0.3.0 - 2020-05-07

- Support for url parameters

## 0.1.2 - 2020-03-25

### Changed

- Don't change the URL if actionToUrl returns undefined

## 0.1.1 - 2017-09-29

### Changed

- First version
