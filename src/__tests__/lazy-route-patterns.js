/* global test, expect, jest */
import { kea, resetContext } from 'kea'
import UrlPattern from 'url-pattern'

import '@babel/polyfill'

import { routerPlugin } from '../plugin'
import { parsePath } from '../utils'
import { router } from '../router'

jest.mock('url-pattern', () => {
  const ActualUrlPattern = jest.requireActual('url-pattern')
  return jest.fn((path, options) => new ActualUrlPattern(path, options))
})

test('urlToAction compiles a route pattern only when the path can match it, and only once', async () => {
  const location = { pathname: '/pages/first', search: '', hash: '' }
  const history = {
    pushState(state, _, url) {
      Object.assign(location, parsePath(url))
    },
    replaceState(state, _, url) {
      Object.assign(location, parsePath(url))
    },
  }
  resetContext({ plugins: [routerPlugin({ history, location })], createStore: { middleware: [] } })

  const matched = []
  kea({
    urlToAction: {
      '/pages/first': () => matched.push('first'),
      '/pages/:id': ({ id }) => matched.push(id),
      '/users/:id': ({ id }) => matched.push(`user ${id}`),
      '/settings': () => matched.push('settings'),
    },
  }).mount()

  const compiledPaths = () => UrlPattern.mock.calls.map(([path]) => path)

  expect(matched).toEqual(['first'])
  expect(compiledPaths()).toEqual(['/pages/first'])

  router.actions.push('/pages/2')
  router.actions.push('/pages/3')
  expect(matched).toEqual(['first', '2', '3'])
  expect(compiledPaths()).toEqual(['/pages/first', '/pages/:id'])

  router.actions.push('/users/7')
  expect(matched).toEqual(['first', '2', '3', 'user 7'])
  expect(compiledPaths()).toEqual(['/pages/first', '/pages/:id', '/users/:id'])
})
