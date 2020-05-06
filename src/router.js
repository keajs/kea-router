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
      decodeParams(getLocationFromContext().search, '?'),
      {
        [actions.locationChanged]: (_, { searchParams }) => searchParams
      }
    ],
    hashParams: [
      decodeParams(getLocationFromContext().hash, '#'),
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
      const { history, encodeParams } = getPluginContext('router')

      const parsedPath = parsePath(url)

      let response = {
        method: method.toUpperCase(),
        pathname: parsedPath.pathname,
        search: undefined, // set below
        searchParams: decodeParams(parsedPath.search, '?'),
        hash: undefined, // set below
        hashParams: decodeParams(parsedPath.hash, '#')
      }

      if (typeof searchInput === 'object') {
        Object.assign(response.searchParams, searchInput)
      } else if (typeof searchInput === 'string') {
        Object.assign(response.searchParams, decodeParams(searchInput, '?'))
      }
      response.search = encodeParams(response.searchParams, '?')

      if (typeof hashInput === 'object') {
        Object.assign(response.hashParams, hashInput)
      } else if (typeof hashInput === 'string') {
        Object.assign(response.hashParams, decodeParams(hashInput, '#'))
      }
      response.hash = encodeParams(response.hashParams, '#')

      history[`${method}State`]({}, '', `${response.pathname}${response.search}${response.hash}`)
      actions.locationChanged(response)
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
