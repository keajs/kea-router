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
    clearUnloadInterceptors: true, // Useful for "save" events where you don't want to wait for a re-render before a push
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

  sharedListeners(({ actions }) => ({
    updateLocation: ({ url, searchInput, hashInput }, breakpoint, action) => {
      const method: 'push' | 'replace' = action.type === actions.push.toString() ? 'push' : 'replace'
      const routerContext = getRouterContext()
      const { history } = routerContext
      const response = combineUrl(url, searchInput, hashInput)

      if (preventUnload()) {
        return
      }

      routerContext.stateCount = (routerContext.stateCount ?? 0) + 1
      history[`${method}State`]({ count: routerContext.stateCount }, '', response.url)
      actions.locationChanged({ method: method.toUpperCase() as 'PUSH' | 'REPLACE', ...response })
    },
  })),

  listeners(({ sharedListeners }) => ({
    push: sharedListeners.updateLocation,
    replace: sharedListeners.updateLocation,
    clearUnloadHandlers: () => {
      const routerContext = getRouterContext()
      routerContext.beforeUnloadInterceptors.clear()
    },
  })),

  afterMount(({ actions, cache }) => {
    if (typeof window === 'undefined') {
      return
    }

    cache.popListener = (event: PopStateEvent) => {
      const routerContext = getRouterContext()
      const { location, decodeParams } = routerContext

      const eventStateCount = event.state?.count

      console.log('KEA_ROUTER', {
        eventStateCount: eventStateCount,
        stateCount: routerContext.stateCount,
        listenerLength: cache.__unloadConfirmations?.length,
      })

      if (eventStateCount !== routerContext.stateCount && preventUnload()) {
        if (typeof eventStateCount !== 'number' || routerContext.stateCount === null) {
          // If we can't determine the direction then we just live with the url being wrong
          return
        }
        if (eventStateCount < routerContext.stateCount) {
          routerContext.stateCount = eventStateCount + 1 // Account for page reloads
          history.forward()
        } else {
          routerContext.stateCount = eventStateCount - 1 // Account for page reloads
          history.back()
        }
        return
      }

      routerContext.stateCount = typeof eventStateCount === 'number' ? eventStateCount : routerContext.stateCount

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
