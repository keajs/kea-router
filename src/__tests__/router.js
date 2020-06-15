/* global test, expect */
import { kea, resetContext } from 'kea'

import '@babel/polyfill'

import { routerPlugin } from '../plugin'
import { parsePath } from '../utils'
import { router } from '../router'

test('urlToAction and actionToUrl work', async () => {
  const location = {
    pathname: '/pages/first',
    search: '',
    hash: ''
  }

  const history = {
    pushState (state, _, url) { Object.assign(location, parsePath(url)) },
    replaceState (state, _, url) { Object.assign(location, parsePath(url)) }
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
    pushState (state, _, url) { Object.assign(location, parsePath(url)) },
    replaceState (state, _, url) { Object.assign(location, parsePath(url)) }
  }

  resetContext({
    plugins: [
      routerPlugin({ history, location })
    ],
    createStore: { middleware: [] }
  })

  expect(router.values.searchParams).toEqual({ query: 'string' })
  expect(router.values.hashParams).toEqual({ hash: 'stuff' })
  expect(router.values.location).toEqual(location)

  let evaluatedUrl = 0

  const logic = kea({
    actions: () => ({
      first: true,
      second: true,
      third: true,
      sixth: true
    }),

    reducers: ({ actions }) => ({
    }),

    urlToAction: {
      '/pages/:id': ({ id }, search, hash) => {
        if (id === 'first') {
          expect(search).toEqual({ query: 'string' })
          expect(hash).toEqual({ hash: 'stuff' })
        } else if (id === 'second') {
          expect(search).toEqual({ key: 'value', obj: { a: 'b' }, bool: true, number: 3.14 })
          expect(hash).toEqual({ hashishere: null })
        } else if (id === 'third') {
          expect(search).toEqual({ search: 'ishere' })
          expect(hash).toEqual({ hash: 'isalsohere' })
        } else if (id === 'fourth') {
          expect(search).toEqual({ key: 'value', otherkey: 'value' })
          expect(hash).toEqual({ hashishere: null, morehash: false })
        } else if (id === 'fifth') {
          expect(search).toEqual({ foo: 'bar', key: 'meh', otherKey: 'value' })
          expect(hash).toEqual({ hashishere: null, morehash: false })
        } else if (id === 'sixth') {
          expect(search).toEqual({ search: 'inline' })
          expect(hash).toEqual({ hash: 'alsoinline' })
        }

        evaluatedUrl += 1
      }
    },

    actionToUrl: {
      third: () => ['/pages/third', { search: 'ishere' }, { hash: 'isalsohere' }],
      sixth: () => ['/pages/sixth', '?search=inline', '#hash=alsoinline']
    }
  })

  const unmount = logic.mount()

  expect(location.pathname).toBe('/pages/first')
  expect(router.values.searchParams).toEqual({ query: 'string' })
  expect(router.values.hashParams).toEqual({ hash: 'stuff' })
  expect(evaluatedUrl).toBe(1)

  router.actions.push(`/pages/second?key=value&obj=${encodeURIComponent(JSON.stringify({ a: 'b' }))}&bool=true&number=3.14#hashishere`)

  expect(router.values.searchParams).toEqual({ key: 'value', obj: { a: 'b' }, bool: true, number: 3.14 })
  expect(router.values.hashParams).toEqual({ hashishere: null })
  expect(evaluatedUrl).toBe(2)

  logic.actions.third()

  expect(location.pathname).toBe('/pages/third')
  expect(location.search).toBe('?search=ishere')
  expect(location.hash).toBe('#hash=isalsohere')
  expect(router.values.searchParams).toEqual({ search: 'ishere' })
  expect(router.values.hashParams).toEqual({ hash: 'isalsohere' })

  expect(evaluatedUrl).toBe(3)

  router.actions.push(`/pages/fourth?key=value#hashishere&morehash=true`, '?otherkey=value', 'morehash=false')

  expect(location.pathname).toBe('/pages/fourth')
  expect(location.search).toBe('?key=value&otherkey=value')
  expect(location.hash).toBe('#hashishere&morehash=false')
  expect(router.values.searchParams).toEqual({ key: 'value', otherkey: 'value' })
  expect(router.values.hashParams).toEqual({ hashishere: null, morehash: false })

  expect(evaluatedUrl).toBe(4)

  router.actions.push(`/pages/fifth?key=value&foo=bar#hashishere&morehash=true`, { key: 'meh', otherKey: 'value' }, { morehash: false })

  expect(location.pathname).toBe('/pages/fifth')
  expect(location.search).toBe('?key=meh&foo=bar&otherKey=value')
  expect(location.hash).toBe('#hashishere&morehash=false')
  expect(router.values.searchParams).toEqual({ foo: 'bar', key: 'meh', otherKey: 'value' })
  expect(router.values.hashParams).toEqual({ hashishere: null, morehash: false })

  expect(evaluatedUrl).toBe(5)

  logic.actions.sixth()

  expect(location.pathname).toBe('/pages/sixth')
  expect(location.search).toBe('?search=inline')
  expect(location.hash).toBe('#hash=alsoinline')
  expect(router.values.searchParams).toEqual({ search: 'inline' })
  expect(router.values.hashParams).toEqual({ hash: 'alsoinline' })

  expect(evaluatedUrl).toBe(6)

  unmount()
})
