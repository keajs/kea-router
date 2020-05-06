import { setPluginContext } from 'kea'
import UrlPattern from 'url-pattern'

import { router } from './router'
import { encodeParams as encode, decodeParams as decode, stringOrObjectToString } from './utils'

const memoryHistroy = {
  pushState (state, _, url) {},
  replaceState (state, _, url) {}
}

export function routerPlugin ({
  history: _history,
  location: _location,
  pathFromRoutesToWindow = path => path,
  pathFromWindowToRoutes = path => path,
  encodeParams = encode,
  decodeParams = decode
} = {}) {
  const history = _history || (typeof window !== 'undefined' ? window.history : memoryHistroy)
  const location = _location || (typeof window !== 'undefined' ? window.location : {})

  return {
    name: 'router',
    events: {
      afterPlugin () {
        setPluginContext('router', {
          history,
          location,
          encodeParams,
          decodeParams
        })
      },

      afterReduxStore () {
        router.mount()
      },

      afterLogic (logic, input) {
        if (!input.actionToUrl && !input.urlToAction) {
          return
        }

        if (input.urlToAction) {
          logic.cache.__routerListeningToLocation = true
        }

        logic.extend({
          connect: {
            actions: [router, ['push as __routerPush', 'locationChanged as __routerLocationChanged']],
            values: [router, ['location as __routerLocation']]
          },

          listeners: ({ actions }) => {
            const listeners = {}

            if (input.urlToAction) {
              const urlToActionMapping = input.urlToAction(logic)
              const routes = Object.keys(urlToActionMapping).map(pathFromRoutes => ({
                path: pathFromRoutes,
                pattern: new UrlPattern(pathFromRoutes),
                action: urlToActionMapping[pathFromRoutes]
              }))

              listeners[actions.__routerLocationChanged] = function ({ pathname, searchParams, hashParams }) {
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
              for (const [actionKey, urlMapping] of Object.entries(input.actionToUrl(logic))) {
                listeners[actionKey] = function (payload) {
                  const { pathname, search, hash } = logic.values.__routerLocation
                  const currentPathInWindow = pathname + search + hash

                  const pathInRoutes = urlMapping(payload)

                  if (typeof pathInRoutes === 'undefined') {
                    return
                  }

                  const pathInWindow = Array.isArray(pathInRoutes)
                    ? pathFromRoutesToWindow(pathInRoutes[0]) + stringOrObjectToString(pathInRoutes[1], '?') + stringOrObjectToString(pathInRoutes[2], '#')
                    : pathFromRoutesToWindow(pathInRoutes)

                  if (currentPathInWindow !== pathInWindow) {
                    actions.__routerPush(pathInWindow)
                  }
                }
              }
            }

            return listeners
          },

          events: ({ actions, listeners, cache }) => ({
            afterMount () {
              const locationChanged = actions.__routerLocationChanged
              if (listeners && listeners[locationChanged] && cache.__routerListeningToLocation) {
                listeners[locationChanged].forEach(listener => {
                  listener({
                    type: locationChanged.toString(),
                    payload: {
                      ...router.values.location,
                      searchParams: router.values.searchParams,
                      hashParams: router.values.hashParams,
                      method: 'POP',
                      initial: true
                    }
                  })
                })
              }
            }
          })
        })
      }
    }
  }
}
