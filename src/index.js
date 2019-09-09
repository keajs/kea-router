/* global window */
import { kea, setPluginContext, getPluginContext } from 'kea'
import { matchRoutes } from 'react-router-config'

/*
Usage:

  kea({
    actionToUrl: ({ actions }) => ({
      [actions.selectEmail]: payload => `/signup/email`,
      [actions.unselectEmail]: payload => `/signup`
    }),

    urlToAction: ({ actions }) => ({
      '/signup/:type': ({ type }) => actions.selectEmail(),
      '/signup': () => actions.unselectEmail()
    }),
  })
*/
const memoryHistroy = {
  pushState (state, _, url) {},
  replaceState (state, _, url) {}
}

function getLocationFromContext () {
  const {
    location: { pathname, search, hash }
  } = getPluginContext('router')
  return { pathname, search, hash }
}

export const router = kea({
  path: () => ['kea', 'router'],

  actions: () => ({
    push: url => ({ url }),
    replace: url => ({ url }),
    locationChanged: ({ method, pathname, search, hash, initial = false }) => ({
      method,
      pathname,
      search,
      hash,
      initial
    })
  }),

  reducers: ({ actions }) => ({
    location: [
      getLocationFromContext(),
      {
        [actions.locationChanged]: (_, { pathname, search, hash }) => ({ pathname, search, hash })
      }
    ]
  }),

  listeners: ({ actions, sharedListeners }) => ({
    [actions.push]: sharedListeners.updateLocation,
    [actions.replace]: sharedListeners.updateLocation
  }),

  sharedListeners: ({ actions }) => ({
    updateLocation: ({ url }, breakpoint, action) => {
      const method = action.type === actions.push.toString() ? 'push' : 'replace'
      const { history } = getPluginContext('router')

      history[`${method}State`]({}, '', url)
      actions.locationChanged({ ...parsePath(url), method: method.toUpperCase() })
    }
  }),

  events: ({ actions, cache }) => ({
    afterMount () {
      if (typeof window === 'undefined') {
        return
      }

      cache.listener = event => {
        const { location } = getPluginContext('router')
        if (location) {
          actions.locationChanged({
            method: 'POP',
            pathname: location.pathname,
            search: location.search,
            hash: location.hash
          })
        }
      }
      window.addEventListener('popstate', cache.listener)
    },

    beforeUnmount () {
      if (typeof window === 'undefined') {
        return
      }
      window.removeEventListener('popstate', cache.listener)
    }
  })
})

export function routerPlugin ({
  history: _history,
  location: _location,
  pathFromRoutesToWindow = path => path,
  pathFromWindowToRoutes = path => path
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
              const routes = Object.keys(urlToActionMapping).map(pathFromRoutes => {
                return {
                  path: pathFromRoutes,
                  exact: true,
                  action: urlToActionMapping[pathFromRoutes]
                }
              })

              listeners[actions.__routerLocationChanged] = function ({ pathname }) {
                const pathInWindow = decodeURI(pathname)
                const pathInRoutes = pathFromWindowToRoutes(pathInWindow)
                const matches = matchRoutes(routes, pathInRoutes)

                if (matches[0]) {
                  matches[0].route.action(matches[0].match.params, matches[0].match)
                }
              }
            }

            if (input.actionToUrl) {
              for (const [actionKey, urlMapping] of Object.entries(input.actionToUrl(logic))) {
                listeners[actionKey] = function (payload) {
                  const { pathname, search } = logic.values.__routerLocation
                  const currentPathInWindow = pathname + search

                  const pathInRoutes = urlMapping(payload)
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

// copied from react-router!
function parsePath (path) {
  let pathname = path || '/'
  let search = ''
  let hash = ''
  let hashIndex = pathname.indexOf('#')

  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex)
    pathname = pathname.substr(0, hashIndex)
  }

  let searchIndex = pathname.indexOf('?')

  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex)
    pathname = pathname.substr(0, searchIndex)
  }

  return {
    pathname: pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash
  }
}
