import { getRouterContext, router } from './router'
import UrlPattern from 'url-pattern'
import { ActionToUrlPayload, BeforeUnloadPayload, LocationChangedPayload, UrlToActionPayload } from './types'
import { stringOrObjectToString } from './utils'
import { afterMount, beforeUnmount, BuiltLogic, connect, getContext, listeners, Logic, LogicBuilder } from 'kea'

function assureConnectionToRouter<L extends Logic = Logic>(logic: BuiltLogic<L>) {
  if (!logic.connections[router.pathString]) {
    connect({ logic: [router] })(logic)
  }
}

/**
actionToUrl - change the URL in response to an action

  kea([
    actionToUrl(({ actions }) => ({
      [actions.selectEmail]: payload => `/signup/email`,
      [actions.unselectEmail]: payload => `/signup`
    })),
  ])
*/
export function actionToUrl<L extends Logic = Logic>(
  input: ActionToUrlPayload<L> | ((logic: BuiltLogic<L>) => ActionToUrlPayload<L>),
): LogicBuilder<L> {
  return (logic) => {
    const inputEntries = typeof input === 'function' ? input(logic) : input

    assureConnectionToRouter(logic)
    const newListeners: Record<string, any> = {}
    for (const [actionKey, urlMapping] of Object.entries(inputEntries)) {
      newListeners[actionKey] = function (payload: Record<string, any>) {
        const { pathname, search, hash } = router.values.location
        const currentPathInWindow = pathname + search + hash

        const pathInRoutes = urlMapping(payload)

        if (typeof pathInRoutes === 'undefined') {
          return
        }
        const { pathFromRoutesToWindow } = getRouterContext()

        const pathInWindow = Array.isArray(pathInRoutes)
          ? pathFromRoutesToWindow(pathInRoutes[0]) +
            stringOrObjectToString(pathInRoutes[1], '?') +
            stringOrObjectToString(pathInRoutes[2], '#')
          : pathFromRoutesToWindow(pathInRoutes)

        if (currentPathInWindow !== pathInWindow) {
          if (Array.isArray(pathInRoutes) && pathInRoutes[3] && pathInRoutes[3].replace) {
            router.actions.replace(pathInWindow)
          } else {
            router.actions.push(pathInWindow)
          }
        }
      }
    }
    listeners(newListeners)(logic)
  }
}

/**
urlToAction - dispatch an action when the URL changes

  kea([
    urlToAction(({ actions }) => ({
      '/signup/:type': ({ type }) => actions.selectEmail(),
      '/signup': () => actions.unselectEmail()
    })),
  ])
*/
export function urlToAction<L extends Logic = Logic>(
  input: UrlToActionPayload<L> | ((logic: BuiltLogic<L>) => UrlToActionPayload<L>),
): LogicBuilder<L> {
  return (logic) => {
    const inputEntries = typeof input === 'function' ? input(logic) : input

    assureConnectionToRouter(logic)
    logic.cache.__routerListeningToLocation = true

    const newListeners: Record<string, any> = {}
    const { urlPatternOptions, pathFromWindowToRoutes } = getRouterContext()

    const routes = Object.entries(inputEntries).map(([pathFromRoutes, action]) => ({
      path: pathFromRoutes,
      pattern: new UrlPattern(pathFromRoutes, urlPatternOptions),
      action: action,
    }))

    newListeners[router.actionTypes.locationChanged] = function (
      payload: LocationChangedPayload,
      _,
      __,
      previousState,
    ) {
      const { pathname, searchParams, hashParams } = payload
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

      if (matchedRoute) {
        const previousLocation = router.selectors.currentLocation(previousState)
        matchedRoute.action(params, searchParams, hashParams, payload, previousLocation)
      }
    }
    listeners(newListeners)(logic)

    afterMount((logic) => {
      const previousState = getContext().store.getState()
      for (const listener of logic.listeners[router.actionTypes.locationChanged] ?? []) {
        listener(
          {
            type: router.actionTypes.locationChanged,
            payload: {
              ...router.values.location,
              searchParams: router.values.searchParams,
              hashParams: router.values.hashParams,
              method: 'POP',
              initial: true,
            },
          },
          previousState,
        )
      }
    })(logic)
  }
}

/**
beforeUnload - when enabled prevent navigation with a confirmation popup
  kea([
    beforeUnload(({ actions, values }) => ({
      enabled: (newLocation?: Location) => values.formChanged,
      message: "Your changes will be lost. Are you sure you want to leave?",
      onConfirm: () => actions.resetForm()
    })),
  ])
*/
export function beforeUnload<L extends Logic = Logic>(
  input: BeforeUnloadPayload<L> | ((logic: BuiltLogic<L>) => BeforeUnloadPayload<L>),
): LogicBuilder<L> {
  return (logic) => {
    const config = typeof input === 'function' ? input(logic) : input

    const beforeWindowUnloadHandler = (e: BeforeUnloadEvent): void => {
      if (config.enabled()) {
        e.preventDefault()
        e.returnValue = config.message
      }
    }

    afterMount(() => {
      const { beforeUnloadInterceptors } = getRouterContext()

      beforeUnloadInterceptors.add(config)
      window.addEventListener('beforeunload', beforeWindowUnloadHandler)
    })(logic)

    beforeUnmount(() => {
      const { beforeUnloadInterceptors } = getRouterContext()

      beforeUnloadInterceptors.delete(config)
      window.removeEventListener('beforeunload', beforeWindowUnloadHandler)
    })(logic)
  }
}
