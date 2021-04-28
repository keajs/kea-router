# Change Log

All notable changes to this project will be documented in this file.

As we're at the 0.x phase, deprecations and breaking changes will still happen. They will be documented here.

Once we react 1.0 all deprecations will be removed and the project will switch to SemVer.

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
