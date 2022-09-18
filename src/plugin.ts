import { KeaPlugin } from 'kea'
import { getDefaultContext, router, setRouterContext } from './router'
import { RouterPluginOptions } from './types'
import { actionToUrl, beforeUnload, urlToAction } from './builders'

export function routerPlugin(options: RouterPluginOptions = {}): KeaPlugin {
  return {
    name: 'router',
    events: {
      afterPlugin() {
        const defaults = getDefaultContext()
        setRouterContext({
          ...defaults,
          ...options,
        })
      },

      afterReduxStore() {
        router.mount()
      },

      legacyBuild(logic, input) {
        'urlToAction' in input && input.urlToAction && urlToAction(input.urlToAction)(logic)
        'actionToUrl' in input && input.actionToUrl && actionToUrl(input.actionToUrl)(logic)
        'beforeUnload' in input && input.beforeUnload && beforeUnload(input.beforeUnload)(logic)
      },
    },
  }
}
