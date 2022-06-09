/* global window */
import {
  kea,
  getPluginContext,
  path,
  actions,
  reducers,
  selectors,
  listeners,
  sharedListeners,
  afterMount,
  beforeUnmount,
  setPluginContext,
} from 'kea'
import { combineUrl } from './utils'
import { routerType } from './routerType'
import { LocationChangedPayload, RouterPluginContext } from './types'
import { preventUnload } from './useUnloadConfirmation'

export const router = kea<routerType>([
  path(['kea', 'router']),

  actions({
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

  reducers(() => ({
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
  })),

  selectors({
    currentLocation: [
      (s) => [s.location, s.searchParams, s.hashParams, s.lastMethod],
      (location, searchParams, hashParams, method) => ({ ...location, searchParams, hashParams, method }),
    ],
  }),

  sharedListeners(({ actions, cache }) => ({
    updateLocation: ({ url, searchInput, hashInput }, breakpoint, action) => {
      const method: 'push' | 'replace' = action.type === actions.push.toString() ? 'push' : 'replace'
      const { history } = getRouterContext()
      const response = combineUrl(url, searchInput, hashInput)

      if (preventUnload()) {
        return
      }

      cache._stateCount = (cache._stateCount ?? 0) + 1
      history[`${method}State` as 'pushState' | 'replaceState']({ count: cache._stateCount }, '', response.url)
      actions.locationChanged({ method: method.toUpperCase() as 'PUSH' | 'REPLACE', ...response })
    },
  })),

  listeners(({ sharedListeners }) => ({
    push: sharedListeners.updateLocation,
    replace: sharedListeners.updateLocation,
  })),

  afterMount(({ actions, cache }) => {
    if (typeof window === 'undefined') {
      return
    }

    cache._stateCount = null
    cache.popListener = (event: PopStateEvent) => {
      const { location, decodeParams } = getRouterContext()

      if (event.state.count !== cache._stateCount && preventUnload()) {
        if (typeof event.state.count !== 'number' || cache._stateCount === null) {
          // If we can't determine the direction then we just live with the url being wrong
          return
        }
        if (event.state.count < cache._stateCount) {
          cache._stateCount = event.state.count + 1 // Account for page reloads
          history.forward()
        } else {
          cache._stateCount = event.state.count - 1 // Account for page reloads
          history.back()
        }
        return
      }

      cache._stateCount = typeof event.state.count === 'number' ? event.state.count : cache._stateCount

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
    window.addEventListener('popstate', cache.popListener)
  }),

  beforeUnmount(({ cache }) => {
    if (typeof window === 'undefined') {
      return
    }
    window.removeEventListener('popstate', cache.popListener)
  }),
])

export function getRouterContext(): RouterPluginContext {
  return getPluginContext('router') as RouterPluginContext
}

export function setRouterContext(context: RouterPluginContext): void {
  setPluginContext('router', context)
}

function getLocationFromContext() {
  const {
    location: { pathname, search, hash },
  } = getRouterContext()
  return { pathname, search, hash }
}
