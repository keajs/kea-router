/* global window */
import { kea, getPluginContext } from 'kea'
import { decodeParams } from './utils'

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
    updateLocation: ({ url, searchInput, hashInput }, breakpoint, action) => {
      const method = action.type === actions.push.toString() ? 'push' : 'replace'
      const { history, encodeParams } = getPluginContext('router')

      const parsedPath = parsePath(url)

      if (typeof searchInput === 'object') {
        parsedPath.search = encodeParams(Object.assign(decodeParams(parsedPath.search, '?'), searchInput), '?')
      } else if (typeof searchInput === 'string') {
        parsedPath.search = encodeParams(Object.assign(decodeParams(parsedPath.search, '?'), decodeParams(searchInput, '?')), '?')
      }

      if (typeof hashInput === 'object') {
        parsedPath.hash = encodeParams(Object.assign(decodeParams(parsedPath.hash, '#'), hashInput), '#')
      } else if (typeof hashInput === 'string') {
        parsedPath.hash = encodeParams(Object.assign(decodeParams(parsedPath.hash, '#'), decodeParams(hashInput, '#')), '#')
      }

      history[`${method}State`]({}, '', `${parsedPath.pathname}${parsedPath.search}${parsedPath.hash}`)
      actions.locationChanged({ ...parsedPath, method: method.toUpperCase() })
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

function getLocationFromContext () {
  const {
    location: { pathname, search, hash }
  } = getPluginContext('router')
  return { pathname, search, hash }
}

// copied from react-router! :)
export function parsePath (path) {
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
