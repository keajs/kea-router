![NPM Version](https://img.shields.io/npm/v/kea-router.svg)
[![minified](https://badgen.net/bundlephobia/min/kea-router)](https://bundlephobia.com/result?p=kea-router)
[![minified + gzipped](https://badgen.net/bundlephobia/minzip/kea-router)](https://bundlephobia.com/result?p=kea-router)
[![Backers on Open Collective](https://opencollective.com/kea/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/kea/sponsors/badge.svg)](#sponsors)

# kea-router

Router plugin for kea. Works with kea `1.0.0-rc.8` and up.

## Installation

`kea-router` depends on `kea-listeners`, so you must add both.

```sh
yarn add kea-router kea-listener
```

Add them to the plugins list when resetting the context:

```js
import { routerPlugin } from 'kea-router'
import listenersPlugin from 'kea-listeners'

resetContext({
  plugins: [listenersPlugin, routerPlugin]
})
```

You may add extra options with `routerPlugin(options)`, see the source for more :)

## Sample usage

`kea-router` adds two fields to your logic: `urlToAction` and `actionToUrl`. See below for sample usage:

```js
kea({
  // define the actions from below
  actions: () => ({ ... }),

  // define article = { id, ... }
  reducers: () => ({ ... }),

  actionToUrl: ({ actions, values }) => ({
    [actions.openList]: ({ id }) => `/articles`,
    [actions.openArticle]: ({ id }) => `/articles/${id}`,
    [actions.openComments]: () => `/articles/${values.article.id}/comments`,
    [actions.closeComments]: () => `/articles/${values.article.id}`
  }),

  urlToAction: ({ actions }) => ({
    '/articles/:id/comments': ({ id }) => {
      actions.openArticle(id)
      actions.openComments()
    },
    '/articles/:id': ({ id }) => actions.openArticle(id),
    '/articles': () => actions.openList()
  })
})
```

To get or manipulate the route, import `router` and ask it for the following:

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
