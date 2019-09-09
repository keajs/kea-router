/* global test, expect, beforeEach */
import { kea, resetContext, getContext } from 'kea'

import { routerPlugin } from '../plugin'
import '@babel/polyfill'
import listenersPlugin from 'kea-listeners'

test('urlToAction and actionToUrl work', async () => {
  const location = {
    pathname: '/pages/first',
    search: '',
    hash: ''
  }

  const history = {
    pushState (state, _, url) { location.pathname = url },
    replaceState (state, _, url) { location.pathname = url }
  }

  resetContext({
    plugins: [
      listenersPlugin,
      routerPlugin({ history, location })
    ],
    createStore: { middleware: [] }
  })

  const logic = kea({
    actions: () => ({
      first: true,
      second: true,
      page: (page) => ({ page }),
    }),

    reducers: ({ actions }) => ({
      activePage: ['', {
        [actions.first]: () => 'first',
        [actions.second]: () => 'second',
        [actions.page]: (_, payload) => payload.page
      }]
    }),

    urlToAction: ({ actions }) => ({
      '/pages/first': () => actions.first(),
      '/pages/second': () => actions.second(),
      '/pages/:page': ({ page }) => actions.page(page)
    }),

    actionToUrl: ({ actions }) => ({
      [actions.first]: () => '/pages/first',
      [actions.second]: () => '/pages/second',
      [actions.page]: ({ page }) => `/pages/${page}`
    })
  })

  const unmount = logic.mount()

  expect(location.pathname).toBe('/pages/first')
  expect(logic.values.activePage).toBe('first')

  logic.actions.second()

  expect(location.pathname).toBe('/pages/second')
  expect(logic.values.activePage).toBe('second')

  logic.actions.page('custom')

  expect(location.pathname).toBe('/pages/custom')
  expect(logic.values.activePage).toBe('custom')

  unmount()
})
