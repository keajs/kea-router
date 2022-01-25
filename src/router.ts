/* global window */
import { kea, getPluginContext } from 'kea'
import { combineUrl } from './utils'
import { routerType } from './routerType'
import { LocationChangedPayload, RouterPluginContext } from './types'

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

export const router = kea<routerType>({
  path: () => ['kea', 'router'],

  actions: () => ({
    push: (url: string, searchInput?: string | Record<string, any>, hashInput?: string | Record<string, any>) => ({
      url,
      searchInput,
      hashInput,
    }),
    replace: (url: string, searchInput?: string | Record<string, any>, hashInput?: string | Record<string, any>) => ({
      url,
      searchInput,
      hashInput,
    }),
    locationChanged: ({
      method,
      pathname,
      search,
      searchParams,
      hash,
      hashParams,
      initial,
    }: LocationChangedPayload) => ({
      method,
      pathname,
      search,
      searchParams,
      hash,
      hashParams,
      initial: initial || false,
    }),
  }),

  reducers: () => ({
    location: [
      getLocationFromContext(),
      {
        locationChanged: (_, { pathname, search, hash }) => ({ pathname, search, hash }),
      },
    ],
    searchParams: [
      getRouterContext().decodeParams(getLocationFromContext().search, '?'),
      {
        locationChanged: (_, { searchParams }) => searchParams,
      },
    ],
    hashParams: [
      getRouterContext().decodeParams(getLocationFromContext().hash, '#'),
      {
        locationChanged: (_, { hashParams }) => hashParams,
      },
    ],
    lastMethod: [
      null as string | null,
      {
        locationChanged: (_, { method }) => method,
      },
    ],
  }),

  selectors: ({}) => ({
    currentLocation: [
      (s) => [s.location, s.searchParams, s.hashParams, s.lastMethod],
      (location, searchParams, hashParams, method) => ({ ...location, searchParams, hashParams, method }),
    ],
  }),

  listeners: ({ sharedListeners }) => ({
    push: sharedListeners.updateLocation,
    replace: sharedListeners.updateLocation,
  }),

  sharedListeners: ({ actions }) => ({
    updateLocation: ({ url, searchInput, hashInput }, breakpoint, action) => {
      const method: 'push' | 'replace' = action.type === actions.push.toString() ? 'push' : 'replace'
      const { history } = getRouterContext()
      const response = combineUrl(url, searchInput, hashInput)

      history[`${method}State` as 'pushState' | 'replaceState']({}, '', response.url)
      actions.locationChanged({ method: method.toUpperCase() as 'PUSH' | 'REPLACE', ...response })
    },
  }),

  events: ({ actions, cache }) => ({
    afterMount() {
      if (typeof window === 'undefined') {
        return
      }

      cache.listener = (event: PopStateEvent) => {
        const { location, decodeParams } = getRouterContext()
        if (location) {
          actions.locationChanged({
            method: 'POP',
            pathname: location.pathname,
            search: location.search,
            searchParams: decodeParams(location.search, '?'),
            hash: location.hash,
            hashParams: decodeParams(location.hash, '#'),
            url: `${location.pathname}${location.search}${location.hash}`,
          })
        }
      }
      window.addEventListener('popstate', cache.listener)
    },

    beforeUnmount() {
      if (typeof window === 'undefined') {
        return
      }
      window.removeEventListener('popstate', cache.listener)
    },
  }),
})

function getRouterContext(): RouterPluginContext {
  return getPluginContext('router') as RouterPluginContext
}

function getLocationFromContext() {
  const {
    location: { pathname, search, hash },
  } = getRouterContext()
  return { pathname, search, hash }
}
