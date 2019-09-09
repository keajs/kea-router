![NPM Version](https://img.shields.io/npm/v/kea-router.svg)
[![minified](https://badgen.net/bundlephobia/min/kea-router)](https://bundlephobia.com/result?p=kea-router)
[![minified + gzipped](https://badgen.net/bundlephobia/minzip/kea-router)](https://bundlephobia.com/result?p=kea-router)
[![Backers on Open Collective](https://opencollective.com/kea/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/kea/sponsors/badge.svg)](#sponsors)

# kea-router

Router plugin for kea. Works with kea `1.0.0-rc.8` and up.

This version bundles all of react-router to get the path parsing working. This is probably not what you want to use in production.

Future version will be much leaner!

## Installation

```sh
yarn add kea-router
```

```js
import { routerPlugin } from 'kea-router'

resetContext({
  plugins: [routerPlugin]
})
```

## Sample usage

```js
kea({
  // define actions selectEmail and unselectEmail
  actions: () => ({ ... }),

  actionToUrl: ({ actions }) => ({
    [actions.selectEmail]: () => '/signup/email',
    [actions.unselectEmail]: () => '/signup'
  }),

  urlToAction: ({ actions }) => ({
    '/signup/email': () => actions.selectEmail(),
    '/signup': () => actions.unselectEmail()
  })
})
```

To get or manipulate the route

```js
import { router } from 'kea-router'

kea({
  connect: {
    actions: [
      router, [
        'push',   // push(url)
        'replace' // replace(url),
        'locationChanged' // payload == { pathname, search, hash, method }
      ]
    ],
    values: [
      router, [
        'location' // { pathname, search, hash }
      ]
    ]
  }
})
```
