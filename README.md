![NPM Version](https://img.shields.io/npm/v/kea-router.svg)
[![minified](https://badgen.net/bundlephobia/min/kea-router)](https://bundlephobia.com/result?p=kea-router)
[![minified + gzipped](https://badgen.net/bundlephobia/minzip/kea-router)](https://bundlephobia.com/result?p=kea-router)
[![Backers on Open Collective](https://opencollective.com/kea/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/kea/sponsors/badge.svg)](#sponsors)

# kea-router

Router plugin for kea. Version 3 works with kea `3.0.0` and up.

## Installation

Install the package: 

```sh
yarn add kea-router
```

Add the plugin to the list when resetting the context:

```js
import { routerPlugin } from 'kea-router'

resetContext({
  plugins: [routerPlugin]
})
```

You may add extra options with `routerPlugin(options)`, see the source for more :)

## Sample usage

[Read the documentation](https://kea.js.org/docs/plugins/router)
