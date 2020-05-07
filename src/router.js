/* global window */
import { kea, getPluginContext } from 'kea'
import { combineUrl } from './utils'

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

export const router = kea({
  path: () => ['kea', 'router'],

  actions: () => ({
    push: (url, searchInput, hashInput) => ({ url, searchInput, hashInput }),
    replace: (url, searchInput, hashInput) => ({ url, searchInput, hashInput }),
    locationChanged: ({ method, pathname, search, searchParams, hash, hashParams, initial = false }) => ({
      method,
      pathname,
      search,
      searchParams,
      hash,
      hashParams,
      initial
    })
  }),

  reducers: ({ actions }) => ({
    location: [
      getLocationFromContext(),
      {
        [actions.locationChanged]: (_, { pathname, search, hash }) => ({ pathname, search, hash })
      }
    ],
    searchParams: [
      getPluginContext('router').decodeParams(getLocationFromContext().search, '?'),
      {
        [actions.locationChanged]: (_, { searchParams }) => searchParams
      }
    ],
    hashParams: [
      getPluginContext('router').decodeParams(getLocationFromContext().hash, '#'),
      {
        [actions.locationChanged]: (_, { hashParams }) => hashParams
      }
    ]
  }),

  listeners: ({ actions, sharedListeners }) => ({
    [actions.push]: sharedListeners.updateLocation,
    [actions.replace]: sharedListeners.updateLocation
  }),

  sharedListeners: ({ actions }) => ({
    updateLocation: ({ url, searchInput, hashInput }, breakpoint, action) => {
      const method = action.type === actions.push.toString() ? 'push' : 'replace'
      const { history } = getPluginContext('router')
      const response = combineUrl(url, searchInput, hashInput)

      history[`${method}State`]({}, '', response.url)
      actions.locationChanged({ method: method.toUpperCase(), ...response })
    }
  }),

  events: ({ actions, cache }) => ({
    afterMount () {
      if (typeof window === 'undefined') {
        return
      }

      cache.listener = event => {
        const { location, decodeParams } = getPluginContext('router')
        if (location) {
          actions.locationChanged({
            method: 'POP',
            pathname: location.pathname,
            search: location.search,
            searchParams: decodeParams(location.search, '?'),
            hash: location.hash,
            hashParams: decodeParams(location.hash, '#')
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

function getLocationFromContext () {
  const {
    location: { pathname, search, hash }
  } = getPluginContext('router')
  return { pathname, search, hash }
}
