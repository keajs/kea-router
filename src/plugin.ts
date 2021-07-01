import { getContext, KeaPlugin, setPluginContext } from 'kea'
import UrlPattern from 'url-pattern'

import { router } from './router'
import { encodeParams as encode, decodeParams as decode, stringOrObjectToString } from './utils'
import { ActionToUrlReturn, RouterPluginContext, UrlPatternOptions } from './types'

const memoryHistroy = {
  pushState(state, _, url) {},
  replaceState(state, _, url) {},
} as RouterPluginContext['history']

export function routerPlugin({
  history: _history = undefined,
  location: _location = undefined,
  pathFromRoutesToWindow = (path: string) => path,
  pathFromWindowToRoutes = (path: string) => path,
  encodeParams = encode,
  decodeParams = decode,
  urlPatternOptions = {},
}: {
  history?: undefined
  location?: undefined
  pathFromRoutesToWindow?: (path: string) => string
  pathFromWindowToRoutes?: (path: string) => string
  encodeParams?: (obj: Record<string, any>, symbol: string) => string
  decodeParams?: (input: string, symbol: string) => Record<string, any>
  urlPatternOptions?: UrlPatternOptions
} = {}): KeaPlugin {
  const history = _history || (typeof window !== 'undefined' ? window.history : memoryHistroy)
  const location = _location || (typeof window !== 'undefined' ? window.location : {})

  return {
    name: 'router',
    events: {
      afterPlugin() {
        setPluginContext('router', {
          history,
          location,
          encodeParams,
          decodeParams,
        } as RouterPluginContext)
      },

      afterReduxStore() {
        router.mount()
      },

      afterLogic(logic, input) {
        if (!input.actionToUrl && !input.urlToAction) {
          return
        }

        if (input.urlToAction) {
          logic.cache.__routerListeningToLocation = true
        }

        logic.extend({
          connect: {
            logic: [router],
          },

          listeners: () => {
            const listeners: Record<string, any> = {}

            if (input.urlToAction) {
              const urlToActionMapping =
                typeof input.urlToAction === 'function' ? input.urlToAction(logic) : input.urlToAction
              const routes = Object.keys(urlToActionMapping).map((pathFromRoutes) => ({
                path: pathFromRoutes,
                pattern: new UrlPattern(pathFromRoutes, urlPatternOptions),
                action: urlToActionMapping[pathFromRoutes],
              }))

              listeners[router.actionTypes.locationChanged] = function ({
                pathname,
                searchParams,
                hashParams,
              }: {
                pathname: string
                searchParams: Record<string, any>
                hashParams: Record<string, any>
              }) {
                const pathInWindow = decodeURI(pathname)
                const pathInRoutes = pathFromWindowToRoutes(pathInWindow)

                let matchedRoute
                let params

                for (const route of routes) {
                  params = route.pattern.match(pathInRoutes)
                  if (params) {
                    matchedRoute = route
                    break
                  }
                }

                matchedRoute && matchedRoute.action(params, searchParams, hashParams)
              }
            }

            if (input.actionToUrl) {
              const actionToUrl = typeof input.actionToUrl === 'function' ? input.actionToUrl(logic) : input.actionToUrl
              for (const [actionKey, urlMapping] of Object.entries(actionToUrl) as [
                string,
                (payload: Record<string, any>) => ActionToUrlReturn,
              ][]) {
                listeners[actionKey] = function (payload: Record<string, any>) {
                  const { pathname, search, hash } = router.values.location
                  const currentPathInWindow = pathname + search + hash

                  const pathInRoutes = urlMapping(payload)

                  if (typeof pathInRoutes === 'undefined') {
                    return
                  }

                  const pathInWindow = Array.isArray(pathInRoutes)
                    ? pathFromRoutesToWindow(pathInRoutes[0]) +
                      stringOrObjectToString(pathInRoutes[1], '?') +
                      stringOrObjectToString(pathInRoutes[2], '#')
                    : pathFromRoutesToWindow(pathInRoutes)

                  if (currentPathInWindow !== pathInWindow) {
                    if (Array.isArray(pathInRoutes) && pathInRoutes[3]?.replace) {
                      router.actions.replace(pathInWindow)
                    } else {
                      router.actions.push(pathInWindow)
                    }
                  }
                }
              }
            }

            return listeners
          },

          events: ({ listeners, cache }) => ({
            afterMount() {
              const locationChanged = router.actionTypes.locationChanged
              if (listeners && listeners[locationChanged] && cache.__routerListeningToLocation) {
                const previousState = getContext().store.getState()
                listeners[locationChanged].forEach((listener) => {
                  listener(
                    {
                      type: locationChanged.toString(),
                      payload: {
                        ...router.values.location,
                        searchParams: router.values.searchParams,
                        hashParams: router.values.hashParams,
                        method: 'POP',
                        initial: true,
                      },
                    },
                    previousState,
                  )
                })
              }
            },
          }),
        })
      },
    },
  }
}
