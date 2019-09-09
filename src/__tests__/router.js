/* global test, expect, beforeEach */
import { kea, resetContext, getContext } from 'kea'

import routerPlugin from '../index'

beforeEach(() => {
  resetContext({
    plugins: [routerPlugin],
    createStore: { middleware: [] }
  })
})

test.skip('we test something', () => {
  // no test
})
