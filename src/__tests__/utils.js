/* global test, expect */
import '@babel/polyfill'

import { encodeParams, decodeParams } from '../utils'

test('encode & decode works', async () => {
  const reverseOptions = [
    { key: 'value' },
    { key: ['value'] },
    { key: ['aweawe', { 'bawera': 'waeawr', 'asdasd': 'waerwe' }] },
    { key: 1, otherKey: 12342.232 },
    { key: [], otherKey: {} },
    { key: true, otherKey: false },
    { key: null, otherKey: 'not so null' },
    { otherKey: 'a=b' },
    { otherKey: 'a=b&c=d' }
  ]

  const specialEncode = [
    [{ key: undefined }, ''],
  ]

  const specialDecode = [
    ['a=', { a: '' }],
    ['a', { a: null }]
  ]

  for (const option of reverseOptions) {
    const encoded = encodeParams(option, '?')
    expect(decodeParams(encoded, '?')).toEqual(option)
  }

  for (const [option, result] of specialEncode) {
    const encoded = encodeParams(option, '?')
    expect(encoded).toBe(result)
  }

  for (const [option, result] of specialDecode) {
    const decoded = decodeParams(option, '?')
    expect(decoded).toEqual(result)
  }
})

test('symbols work', async () => {
  expect(encodeParams({ key: 'value' }, '?')).toBe('?key=value')
  expect(encodeParams({ key: 'value' }, '#')).toBe('#key=value')
  expect(encodeParams({ key: 'value' }, '')).toBe('key=value')
  expect(encodeParams({ }, '?')).toBe('')
  expect(encodeParams(undefined, '?')).toBe('')

  expect(decodeParams('', '')).toEqual({})
  expect(decodeParams('', '?')).toEqual({})
  expect(decodeParams('a=b', '?')).toEqual({ a: 'b' })
  expect(decodeParams('?a=b', '?')).toEqual({ a: 'b' })
  expect(decodeParams('#a=b', '?')).toEqual({ '#a': 'b' })
  expect(decodeParams('?a=b', '')).toEqual({ '?a': 'b' })
})
