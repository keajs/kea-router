import { parsePath } from '../utils'
import { actions, kea, reducers, resetContext } from 'kea'
import { actionToUrl, urlToAction } from '../builders'

delete window.history
delete window.location

window.history = {
  pushState(state, _, url) {
    Object.assign(location, parsePath(url))
  },
  replaceState(state, _, url) {
    Object.assign(location, parsePath(url))
  },
  location: {
    pathname: '/pages/first',
    search: '',
    hash: '',
  },
}
window.location = window.history.location

test('works without plugin init', async () => {
  resetContext()

  const logic = kea([
    actions({
      page: (page) => ({ page }),
    }),
    reducers({ activePage: ['first', { page: (_, { page }) => page }] }),
    urlToAction(({ actions }) => ({
      '/pages/:page': ({ page }) => {
        actions.page(page)
      },
    })),
    actionToUrl(({ actions }) => ({
      [actions.page]: ({ page }) => `/pages/${page}`,
    })),
  ])

  logic.mount()
  expect(window.location.pathname).toBe('/pages/first')
  logic.actions.page('haha')
  expect(window.location.pathname).toBe('/pages/haha')
})
