/* global test, expect */
import '@babel/polyfill'

import { encodeParams, decodeParams, combineUrl } from '../utils'

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
    { otherKey: 'a=b&c=d' },
    { otherKey: { "otherKey": {} } }, // eslint-disable-line
    { otherKey: '{ "otherKey": {} }' },
    { otherKey: {} },
    { otherKey: '{ }' },
    { otherKey: '{}' },
    { otherKey: '{} ' },
    { otherKey: [] },
    { otherKey: '[ ] ' },
    { otherKey: '[]' },
    { otherKey: '[] ' },
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

  expect(encodeParams({ key: '{}' }, '?')).toBe('?key=%7B%7D%20')
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

test('combineUrl works', async () => {
  expect(combineUrl('/path').url).toEqual('/path')

  expect(combineUrl('/path?a=b&key=value', { key: 'otherValue' }).url).toEqual('/path?a=b&key=otherValue')
  expect(combineUrl('/path?a=b&key=value', { key: 'otherValue' }, { hash: 'value' }).url).toEqual('/path?a=b&key=otherValue#hash=value')
  expect(combineUrl('/path?a=b&key=value', '', { hash: 'value' }).url).toEqual('/path?a=b&key=value#hash=value')

  expect(combineUrl('/path?a=b&key=value', '?key=otherValue').url).toEqual('/path?a=b&key=otherValue')
  expect(combineUrl('/path?a=b&key=value', '?key=otherValue', '#hash=value').url).toEqual('/path?a=b&key=otherValue#hash=value')
  expect(combineUrl('/path?a=b&key=value', '', '#hash=value').url).toEqual('/path?a=b&key=value#hash=value')

  expect(combineUrl('/path?a=b&key=value', 'key=otherValue').url).toEqual('/path?a=b&key=otherValue')
  expect(combineUrl('/path?a=b&key=value', 'key=otherValue', 'hash=value').url).toEqual('/path?a=b&key=otherValue#hash=value')
  expect(combineUrl('/path?a=b&key=value', '', 'hash=value').url).toEqual('/path?a=b&key=value#hash=value')

  expect(combineUrl('/path?a=b&key=value#hash=other', '', 'hash=value').url).toEqual('/path?a=b&key=value#hash=value')

  expect(combineUrl('/path')).toEqual({ url: '/path', pathname: '/path', search: '', searchParams: {}, hash: '', hashParams: {} })
  expect(combineUrl('/path?a=b#hash=value')).toEqual({ url: '/path?a=b#hash=value', pathname: '/path', search: '?a=b', searchParams: { a: 'b' }, hash: '#hash=value', hashParams: { hash: 'value' } })

})
