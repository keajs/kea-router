import { MutableRefObject, useEffect, useRef } from 'react'
import { router } from './router'

interface UnloadConfig {
  unloadMessage: string | null
  onConfirm: (() => void) | undefined
}

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

  router.cache.__unloadConfirmations = (router.cache.__unloadConfirmations || []) as MutableRefObject<UnloadConfig>[]

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
      routerUnloadFunctionRef.current = {
        unloadMessage,
        onConfirm,
      }

      router.cache.__unloadConfirmations.push(routerUnloadFunctionRef)

      unmountFunctions.push(() => {
        const index = router.cache.__unloadConfirmations.indexOf(routerUnloadFunctionRef)
        if (index > -1) {
          router.cache.__unloadConfirmations.splice(index, 1)
        }
      })
    }

    return () => {
      unmountFunctions.forEach((fn) => fn())
    }
  }, [unloadMessage])
}

export function preventUnload(): boolean {
  // We only check the last reference for unloading. Generally there should only be one loaded anyway.
  const unloadConfirmations = router.cache.__unloadConfirmations as MutableRefObject<UnloadConfig>[]

  if (!unloadConfirmations) {
    return
  }
  const lastRef = unloadConfirmations[unloadConfirmations.length - 1]

  if (!lastRef || !lastRef.current.unloadMessage) {
    return false
  }

  if (confirm(lastRef.current.unloadMessage)) {
    lastRef.current.onConfirm?.()
    return false
  }

  return true
}
