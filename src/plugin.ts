import { KeaPlugin } from 'kea'
import { router, setRouterContext } from './router'
import { encodeParams as encode, decodeParams as decode, stringOrObjectToString } from './utils'
import { RouterPluginContext, RouterPluginOptions } from './types'
import { actionToUrl, urlToAction } from './builders'

const memoryHistroy = {
  pushState(state, _, url) {},
  replaceState(state, _, url) {},
} as RouterPluginContext['history']

export function routerPlugin(options: RouterPluginOptions = {}): KeaPlugin {
  return {
    name: 'router',
    events: {
      afterPlugin() {
        setRouterContext({
          history: options.history || (typeof window !== 'undefined' ? window.history : memoryHistroy),
          location:
            options.location ||
            (typeof window !== 'undefined' ? window.location : { pathname: '', search: '', hash: '' }),
          encodeParams: options.encodeParams ?? encode,
          decodeParams: options.decodeParams ?? decode,
          pathFromRoutesToWindow: (path) => path,
          pathFromWindowToRoutes: (path) => path,
          options,
          beforeUnloadInterceptors: new Set(),
          stateCount:
            typeof window !== 'undefined' && typeof window.history.state?.count === 'number'
              ? window.history.state?.count
              : null,
        })
      },

      afterReduxStore() {
        router.mount()
      },

      legacyBuild(logic, input) {
        'urlToAction' in input && input.urlToAction && urlToAction(input.urlToAction)(logic)
        'actionToUrl' in input && input.actionToUrl && actionToUrl(input.actionToUrl)(logic)
      },
    },
  }
}
