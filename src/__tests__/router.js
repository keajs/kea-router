/* global test, expect */
import { kea, resetContext } from 'kea'

import '@babel/polyfill'

import { routerPlugin } from '../plugin'
import { router } from '../router'

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
      routerPlugin({ history, location })
    ],
    createStore: { middleware: [] }
  })

  const logic = kea({
    actions: () => ({
      first: true,
      second: true,
      page: (page) => ({ page }),
      list: true,
      url: (opt1, opt2) => ({ opt1, opt2 })
    }),

    reducers: ({ actions }) => ({
      activePage: [null, {
        [actions.first]: () => 'first',
        [actions.second]: () => 'second',
        [actions.page]: (_, payload) => payload.page,
        [actions.list]: () => null
      }],
      opts: [{}, {
        [actions.url]: (_, payload) => payload
      }]
    }),

    urlToAction: ({ actions }) => ({
      '/pages/first': () => actions.first(),
      '/pages/second': () => actions.second(),
      '/pages/:page': ({ page }) => actions.page(page),
      '/pages': ({ page }) => actions.list(),
      '/url(/:opt1)(/:opt2)': ({ opt1, opt2 }) => actions.url(opt1, opt2)
    }),

    actionToUrl: ({ actions }) => ({
      [actions.first]: () => '/pages/first',
      second: () => '/pages/second',
      [actions.page]: ({ page }) => `/pages/${page}`,
      [actions.list]: () => `/pages`
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

  logic.actions.list()

  expect(location.pathname).toBe('/pages')
  expect(logic.values.activePage).toBe(null)

  router.actions.push('/url/a/b')

  expect(location.pathname).toBe('/url/a/b')
  expect(logic.values.opts).toEqual({ opt1: 'a', opt2: 'b' })

  router.actions.push('/url/a')

  expect(location.pathname).toBe('/url/a')
  expect(logic.values.opts).toEqual({ opt1: 'a', opt2: undefined })

  router.actions.replace('/url')

  expect(location.pathname).toBe('/url')
  expect(logic.values.opts).toEqual({ opt1: undefined, opt2: undefined })

  unmount()
})

test('encode and decode for search and hash', async () => {
  const location = {
    pathname: '/pages/first',
    search: '?query=string',
    hash: '#hash=stuff'
  }

  const history = {
    pushState (state, _, url) { location.pathname = url },
    replaceState (state, _, url) { location.pathname = url }
  }

  resetContext({
    plugins: [
      routerPlugin({ history, location })
    ],
    createStore: { middleware: [] }
  })

  let evaluatedUrl = 0

  const logic = kea({
    actions: () => ({
      first: true,
      second: true,
    }),

    reducers: ({ actions }) => ({
    }),

    urlToAction: ({ actions }) => ({
      '/pages/:id': ({ id }, search, hash) => {
        if (id === 'first') {
          expect(search).toMatchObject({ query: 'string' })
          expect(hash).toMatchObject({ hash: 'stuff' })
        } else {
          expect(search).toMatchObject({ key: 'value', obj: { a: 'b' }, bool: true, number: 3.14 })
          expect(hash).toMatchObject({ hashishere: null })
        }

        evaluatedUrl += 1
      }
    }),

    actionToUrl: ({ actions }) => ({
      second: () => ['/pages/second', {}]
    })
  })

  const unmount = logic.mount()

  expect(location.pathname).toBe('/pages/first')
  expect(evaluatedUrl).toBe(1)

  router.actions.push(`/pages/second?key=value&obj=${encodeURIComponent(JSON.stringify({ a: 'b' }))}&bool=true&number=3.14#hashishere`)

  expect(evaluatedUrl).toBe(2)

  unmount()
})
