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

[Read the documentation](https://kea.js.org/plugins/router)
