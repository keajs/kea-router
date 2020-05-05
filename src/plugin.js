import { setPluginContext } from 'kea'
import UrlPattern from 'url-pattern'

import { router } from './router'
import { encodeParams as encode, decodeParams as decode } from './utils'

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
          location
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

              listeners[actions.__routerLocationChanged] = function ({ pathname, search, hash }) {
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

                matchedRoute && matchedRoute.action(params, decodeParams(search, '?'), decodeParams(hash, '#'))
              }
            }

            if (input.actionToUrl) {
              for (const [actionKey, urlMapping] of Object.entries(input.actionToUrl(logic))) {
                listeners[actionKey] = function (payload) {
                  const { pathname, search } = logic.values.__routerLocation
                  const currentPathInWindow = pathname + search

                  const pathInRoutes = urlMapping(payload)

                  if (typeof pathInRoutes === 'undefined') {
                    return
                  }

                  const pathInWindow = pathFromRoutesToWindow(pathInRoutes)

                  if (currentPathInWindow !== pathInWindow) {
                    actions.__routerPush(pathInWindow)
                  }
                }
              }
            }

            return listeners
          },

          events: ({ actions, listeners, cache, values }) => ({
            afterMount () {
              const locationChanged = actions.__routerLocationChanged

              if (listeners && listeners[locationChanged] && cache.__routerListeningToLocation) {
                const routerLocation = values.__routerLocation
                listeners[locationChanged].forEach(l =>
                  l({ type: locationChanged.toString(), payload: { ...routerLocation, method: 'POP', initial: true } })
                )
              }
            }
          })
        })
      }
    }
  }
}
