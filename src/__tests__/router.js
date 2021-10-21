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
    hash: '',
  }

  const history = {
    pushState(state, _, url) {
      Object.assign(location, parsePath(url))
    },
    replaceState(state, _, url) {
      Object.assign(location, parsePath(url))
    },
  }

  resetContext({
    plugins: [routerPlugin({ history, location })],
    createStore: { middleware: [] },
  })

  const logic = kea({
    actions: () => ({
      first: true,
      second: true,
      page: (page) => ({ page }),
      list: true,
      url: (opt1, opt2) => ({ opt1, opt2 }),
    }),

    reducers: ({ actions }) => ({
      activePage: [
        null,
        {
          [actions.first]: () => 'first',
          [actions.second]: () => 'second',
          [actions.page]: (_, payload) => payload.page,
          [actions.list]: () => null,
        },
      ],
      opts: [
        {},
        {
          [actions.url]: (_, payload) => payload,
        },
      ],
    }),

    urlToAction: ({ actions }) => ({
      '/pages/first': () => actions.first(),
      '/pages/second': () => actions.second(),
      '/pages/:page': ({ page }) => actions.page(page),
      '/pages': ({ page }) => actions.list(),
      '/url(/:opt1)(/:opt2)': ({ opt1, opt2 }) => actions.url(opt1, opt2),
    }),

    actionToUrl: ({ actions }) => ({
      [actions.first]: () => '/pages/first',
      second: () => '/pages/second',
      [actions.page]: ({ page }) => `/pages/${page}`,
      [actions.list]: () => `/pages`,
    }),
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

test('replace: true', async () => {
  const locations = [
    {
      pathname: '/pages/first',
      search: '',
      hash: '',
    },
  ]
  const location = { ...locations[0] }

  const history = {
    pushState(state, _, url) {
      locations.push(parsePath(url))
      Object.assign(location, locations[location.length - 1])
    },
    replaceState(state, _, url) {
      if (locations.length > 0) {
        locations[locations.length - 1] = parsePath(url)
      } else {
        locations.push(parsePath(url))
      }
      Object.assign(location, locations[location.length - 1])
    },
  }

  resetContext({
    plugins: [routerPlugin({ history, location })],
    createStore: { middleware: [] },
  })

  const logic = kea({
    actions: () => ({
      push: true,
      replace: true,
    }),

    actionToUrl: {
      push: () => '/pages/push',
      replace: () => ['/pages/replace', undefined, undefined, { replace: true }],
    },
  })

  const unmount = logic.mount()

  expect(locations.length).toBe(1)
  expect(locations[0].pathname).toBe('/pages/first')

  logic.actions.push()

  expect(locations.length).toBe(2)
  expect(locations[0].pathname).toBe('/pages/first')
  expect(locations[1].pathname).toBe('/pages/push')

  logic.actions.replace()

  expect(locations.length).toBe(2)
  expect(locations[0].pathname).toBe('/pages/first')
  expect(locations[1].pathname).toBe('/pages/replace')

  logic.actions.push()

  expect(locations.length).toBe(3)
  expect(locations[0].pathname).toBe('/pages/first')
  expect(locations[1].pathname).toBe('/pages/replace')
  expect(locations[2].pathname).toBe('/pages/push')

  unmount()
})

test('encode and decode for search and hash', async () => {
  const location = {
    pathname: '/pages/first',
    search: '?query=string',
    hash: '#hash=stuff',
  }

  const history = {
    pushState(state, _, url) {
      Object.assign(location, parsePath(url))
    },
    replaceState(state, _, url) {
      Object.assign(location, parsePath(url))
    },
  }

  resetContext({
    plugins: [routerPlugin({ history, location })],
    createStore: { middleware: [] },
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
      sixth: true,
    }),

    reducers: ({ actions }) => ({}),

    urlToAction: {
      '/pages/:id': ({ id }, search, hash, payload) => {
        if (id === 'first') {
          expect(search).toEqual({ query: 'string' })
          expect(hash).toEqual({ hash: 'stuff' })
          expect(payload).toEqual({
            hash: '#hash=stuff',
            hashParams: {
              hash: 'stuff',
            },
            initial: true,
            method: 'POP',
            pathname: '/pages/first',
            search: '?query=string',
            searchParams: {
              query: 'string',
            },
          })
        } else if (id === 'second') {
          expect(search).toEqual({ key: 'value', obj: { a: 'b' }, bool: true, number: 3.14 })
          expect(hash).toEqual({ hashishere: null })
          expect(payload).toEqual({
            hash: '#hashishere',
            hashParams: {
              hashishere: null,
            },
            initial: false,
            method: 'PUSH',
            pathname: '/pages/second',
            search: '?key=value&obj=%7B%22a%22%3A%22b%22%7D&bool=true&number=3.14',
            searchParams: {
              bool: true,
              key: 'value',
              number: 3.14,
              obj: {
                a: 'b',
              },
            },
          })
        } else if (id === 'third') {
          expect(search).toEqual({ search: 'ishere' })
          expect(hash).toEqual({ hash: 'isalsohere' })
          expect(payload).toEqual({
            hash: '#hash=isalsohere',
            hashParams: {
              hash: 'isalsohere',
            },
            initial: false,
            method: 'PUSH',
            pathname: '/pages/third',
            search: '?search=ishere',
            searchParams: {
              search: 'ishere',
            },
          })
        } else if (id === 'fourth') {
          expect(search).toEqual({ key: 'value', otherkey: 'value' })
          expect(hash).toEqual({ hashishere: null, morehash: false })
          expect(payload).toEqual({
            hash: '#hashishere&morehash=false',
            hashParams: {
              hashishere: null,
              morehash: false,
            },
            initial: false,
            method: 'PUSH',
            pathname: '/pages/fourth',
            search: '?key=value&otherkey=value',
            searchParams: {
              key: 'value',
              otherkey: 'value',
            },
          })
        } else if (id === 'fifth') {
          expect(search).toEqual({ foo: 'bar', key: 'meh', otherKey: 'value' })
          expect(hash).toEqual({ hashishere: null, morehash: false })
          expect(payload).toEqual({
            hash: '#hashishere&morehash=false',
            hashParams: {
              hashishere: null,
              morehash: false,
            },
            initial: false,
            method: 'PUSH',
            pathname: '/pages/fifth',
            search: '?key=meh&foo=bar&otherKey=value',
            searchParams: {
              foo: 'bar',
              key: 'meh',
              otherKey: 'value',
            },
          })
        } else if (id === 'sixth') {
          expect(search).toEqual({ search: 'inline' })
          expect(hash).toEqual({ hash: 'alsoinline' })
          expect(payload).toEqual({
            hash: '#hash=alsoinline',
            hashParams: {
              hash: 'alsoinline',
            },
            initial: false,
            method: 'PUSH',
            pathname: '/pages/sixth',
            search: '?search=inline',
            searchParams: {
              search: 'inline',
            },
          })
        }

        evaluatedUrl += 1
      },
    },

    actionToUrl: {
      third: () => ['/pages/third', { search: 'ishere' }, { hash: 'isalsohere' }],
      sixth: () => ['/pages/sixth', '?search=inline', '#hash=alsoinline'],
    },
  })

  const unmount = logic.mount()

  expect(location.pathname).toBe('/pages/first')
  expect(router.values.searchParams).toEqual({ query: 'string' })
  expect(router.values.hashParams).toEqual({ hash: 'stuff' })
  expect(evaluatedUrl).toBe(1)

  router.actions.push(
    `/pages/second?key=value&obj=${encodeURIComponent(JSON.stringify({ a: 'b' }))}&bool=true&number=3.14#hashishere`,
  )

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

  router.actions.push(
    `/pages/fifth?key=value&foo=bar#hashishere&morehash=true`,
    { key: 'meh', otherKey: 'value' },
    { morehash: false },
  )

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

test('urlPatternOptions', async () => {
  const location = {
    pathname: '/pages/me@gmail.com',
    search: '',
    hash: '',
  }

  const history = {
    pushState(state, _, url) {
      Object.assign(location, parsePath(url))
    },
    replaceState(state, _, url) {
      Object.assign(location, parsePath(url))
    },
  }

  const logic = kea({
    actions: () => ({
      page: (page) => ({ page }),
      list: true,
    }),

    reducers: ({ actions }) => ({
      activePage: [
        null,
        {
          page: (_, payload) => payload.page,
          list: () => null,
        },
      ],
    }),

    urlToAction: ({ actions }) => ({
      '/pages/:page': ({ page }) => actions.page(page),
      '/pages': () => actions.list(),
    }),

    actionToUrl: ({ actions }) => ({
      [actions.page]: ({ page }) => `/pages/${page}`,
      [actions.list]: () => `/pages`,
    }),
  })

  // TEST 1

  location.pathname = '/pages/me@gmail.com'

  resetContext({
    plugins: [
      routerPlugin({
        history,
        location,
        urlPatternOptions: {
          // default: 'a-zA-Z0-9-_~ %'
        },
      }),
    ],
    createStore: { middleware: [] },
  })

  logic.mount()

  expect(location.pathname).toBe('/pages/me@gmail.com')
  expect(logic.values.activePage).toBe(null)

  logic.actions.page('me@gmail.com')

  expect(location.pathname).toBe('/pages/me@gmail.com')
  expect(logic.values.activePage).toBe('me@gmail.com')

  // TEST 2

  location.pathname = '/pages/me@gmail.com'

  resetContext({
    plugins: [
      routerPlugin({
        history,
        location,
        urlPatternOptions: {
          segmentValueCharset: 'a-zA-Z0-9-_~ %.@', // adds '@' to default
        },
      }),
    ],
    createStore: { middleware: [] },
  })

  logic.mount()

  expect(location.pathname).toBe('/pages/me@gmail.com')
  expect(logic.values.activePage).toBe('me@gmail.com')

  logic.actions.page('me@gmail.com')

  expect(location.pathname).toBe('/pages/me@gmail.com')
  expect(logic.values.activePage).toBe('me@gmail.com')

  logic.actions.list()

  expect(location.pathname).toBe('/pages')
  expect(logic.values.activePage).toBe(null)
})
