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
import { CombinedLocation, combineUrl, decodeParams as decode, encodeParams as encode } from './utils'
import { routerType } from './routerType'
import { LocationChangedPayload, RouterPluginContext } from './types'

function preventUnload(newLocation?: CombinedLocation): boolean {
  // We only check the last reference for unloading. Generally there should only be one loaded anyway.
  const { beforeUnloadInterceptors } = getRouterContext()

  if (!beforeUnloadInterceptors) {
    return
  }

  for (const beforeUnload of Array.from(beforeUnloadInterceptors)) {
    if (!beforeUnload.enabled(newLocation)) {
      continue
    }

    if (confirm(beforeUnload.message)) {
      beforeUnload.onConfirm?.()
      return false
    }
    return true
  }

  return false
}

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

  sharedListeners(({ actions }) => ({
    updateLocation: ({ url, searchInput, hashInput }, breakpoint, action) => {
      const method: 'push' | 'replace' = action.type === actions.push.toString() ? 'push' : 'replace'
      const routerContext = getRouterContext()
      const { history } = routerContext
      const response = combineUrl(url, searchInput, hashInput)

      if (preventUnload(response)) {
        return
      }

      routerContext.historyStateCount = (routerContext.historyStateCount ?? 0) + 1
      history[`${method}State`]({ count: routerContext.historyStateCount }, '', response.url)
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

    cache.popListener = (event: PopStateEvent) => {
      const routerContext = getRouterContext()
      const { location, decodeParams } = routerContext

      const eventStateCount = event.state?.count

      if (eventStateCount !== routerContext.historyStateCount && preventUnload()) {
        if (typeof eventStateCount !== 'number' || routerContext.historyStateCount === null) {
          // If we can't determine the direction then we just live with the url being wrong
          return
        }
        if (eventStateCount < routerContext.historyStateCount) {
          routerContext.historyStateCount = eventStateCount + 1 // Account for page reloads
          history.forward()
        } else {
          routerContext.historyStateCount = eventStateCount - 1 // Account for page reloads
          history.back()
        }
        return
      }

      routerContext.historyStateCount =
        typeof eventStateCount === 'number' ? eventStateCount : routerContext.historyStateCount

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
  let context: RouterPluginContext | undefined = getPluginContext('router')
  if (!context || !context.history || !context.location) {
    const defaultContext = getDefaultContext()
    if (!context || Object.keys(context).length === 0) {
      context = defaultContext
      setRouterContext(context)
    } else {
      if (!context.history) {
        context.history = defaultContext.history
      }
      if (!context.location) {
        context.location = defaultContext.location
      }
    }
  }
  return context
}

export function setRouterContext(context: RouterPluginContext): void {
  setPluginContext('router', context)
}

export const memoryHistroy = {
  pushState(state, _, url) {},
  replaceState(state, _, url) {},
} as RouterPluginContext['history']

export function getDefaultContext(): RouterPluginContext {
  return {
    history: typeof window !== 'undefined' ? window.history : memoryHistroy,
    location: typeof window !== 'undefined' ? window.location : { pathname: '', search: '', hash: '' },
    encodeParams: encode,
    decodeParams: decode,
    pathFromRoutesToWindow: (path) => path,
    pathFromWindowToRoutes: (path) => path,
    beforeUnloadInterceptors: new Set(),
    historyStateCount:
      typeof window !== 'undefined' && typeof window.history.state?.count === 'number'
        ? window.history.state?.count
        : null,
  }
}

function getLocationFromContext() {
  const {
    location: { pathname, search, hash },
  } = getRouterContext()
  return { pathname, search, hash }
}
