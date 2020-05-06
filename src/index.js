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

export { router } from './router'
export { routerPlugin } from './plugin'
export { encodeParams, decodeParams } from './utils'
