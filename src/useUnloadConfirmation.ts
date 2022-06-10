import { useEffect, useRef } from 'react'
import { getRouterContext } from './router'

/**
 * This makes sure that unloading the page requires user confirmation - if unloadMessage is set.
 * Uses the browser's native `beforeunload` prevention feature.
 *
 * Additionally, it stores a list of "hooks" for the router to check via the `preventUnload` method when navigating
 */
export function useUnloadConfirmation(unloadMessage: string | null, onConfirm?: () => void): void {
  const routerUnloadFunctionRef = useRef({
    unloadMessage,
    onConfirm,
  })

  const { beforeUnloadInterceptors } = getRouterContext()

  // Update the reference each time as we don't want to allow the `onConfirm` to change the useEffect handler
  routerUnloadFunctionRef.current = {
    unloadMessage,
    onConfirm,
  }

  useEffect(() => {
    const unmountFunctions: (() => void)[] = []

    // Native browser unloading (e.g. page refresh)
    if (unloadMessage) {
      const beforeUnloadHandler = (e: BeforeUnloadEvent): void => {
        // Cancel the event to show unsaved changes dialog
        e.preventDefault()
        e.returnValue = ''
      }

      window.addEventListener('beforeunload', beforeUnloadHandler)
      unmountFunctions.push(() => window.removeEventListener('beforeunload', beforeUnloadHandler))
    }

    // Kea-router based unloading (e.g. push(), replace())
    if (unloadMessage) {
      beforeUnloadInterceptors.add(routerUnloadFunctionRef)

      unmountFunctions.push(() => {
        beforeUnloadInterceptors.delete(routerUnloadFunctionRef)
      })
    }

    return () => {
      unmountFunctions.forEach((fn) => fn())
    }
  }, [unloadMessage])
}

export function preventUnload(): boolean {
  // We only check the last reference for unloading. Generally there should only be one loaded anyway.
  const { beforeUnloadInterceptors } = getRouterContext()

  if (!beforeUnloadInterceptors) {
    return
  }
  const lastRef = Array.from(beforeUnloadInterceptors).pop()

  if (!lastRef || !lastRef.current.unloadMessage) {
    return false
  }

  if (confirm(lastRef.current.unloadMessage)) {
    lastRef.current.onConfirm?.()
    return false
  }

  return true
}
