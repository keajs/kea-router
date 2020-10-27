import { getPluginContext } from 'kea'

function parseValue(value: string | null): any {
  if (!Number.isNaN(Number(value)) && typeof value === 'string' && value.trim() !== '') {
    return Number(value)
  } else if (value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
    return value.toLowerCase() === 'true'
  } else if (value !== null && value.length >= 2 && (value.match(/^\[.*\] +$/) || value.match(/^\{.*\} +$/))) {
    return value.substring(0, value.length - 1)
  } else if (value !== null && value.length >= 2 && (value.match(/^\[.*\]$/) || value.match(/^\{.*\}$/))) {
    try {
      return JSON.parse(value)
    } catch (e) {
      // well, damn
    }
  }

  return value
}

function serializeValue(value: any): string {
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  } else if (typeof value === 'string' && (value.match(/^\[.*\] *$/) || value.match(/^\{.*\} *$/))) {
    value = value + ' '
  }

  return value
}

export function decodeParams(input: string, symbol: string = ''): Record<string, any> {
  if (symbol && input.indexOf(symbol) === 0) {
    input = input.slice(1)
  }

  const ret = Object.create(null)

  for (let param of input.split('&')) {
    param = param.replace(/\+/g, ' ')
    const index = param.indexOf('=')
    if (index === -1) {
      if (param.length > 0) {
        ret[decodeURIComponent(param)] = null
      }
    } else {
      const key = decodeURIComponent(param.slice(0, index))
      const value = decodeURIComponent(param.slice(index + 1))
      ret[key] = parseValue(value)
    }
  }

  return ret
}

export function encodeParams(obj: Record<string, any>, symbol: string = ''): string {
  if (typeof obj !== 'object') {
    return ''
  }
  const string = Object.keys(obj)
    .map((key) => {
      const value = obj[key]
      if (typeof value === 'undefined') {
        return ''
      }
      if (value === null) {
        return encodeURIComponent(key)
      }
      return encodeURIComponent(key) + '=' + encodeURIComponent(serializeValue(value))
    })
    .filter((k) => k.length !== 0)
    .join('&')

  return string.length > 0 ? symbol + string : ''
}

export function stringOrObjectToString(input: any, symbol: string): string {
  if (!input) {
    return ''
  }

  return typeof input === 'object' ? encodeParams(input, symbol) : input.indexOf(symbol) === 0 ? input : symbol + input
}

// copied from react-router! :)
export function parsePath(
  path: string,
): {
  pathname: string
  search: string
  hash: string
} {
  let pathname = path || '/'
  let search = ''
  let hash = ''
  const hashIndex = pathname.indexOf('#')

  if (hashIndex !== -1) {
    hash = pathname.substr(hashIndex)
    pathname = pathname.substr(0, hashIndex)
  }

  const searchIndex = pathname.indexOf('?')

  if (searchIndex !== -1) {
    search = pathname.substr(searchIndex)
    pathname = pathname.substr(0, searchIndex)
  }

  return {
    pathname: pathname,
    search: search === '?' ? '' : search,
    hash: hash === '#' ? '' : hash,
  }
}

const _e = encodeParams
const _d = decodeParams

export function combineUrl(
  url: string,
  searchInput: string | Record<string, any>,
  hashInput: string | Record<string, any>,
  encodeParams: (obj: Record<string, any>, symbol: string) => string = getPluginContext('router').encodeParams || _e,
  decodeParams: (input: string, symbol: string) => Record<string, any> = getPluginContext('router').decodeParams || _d,
): {
  pathname: string
  search: string
  searchParams: Record<string, any>
  hash: string
  hashParams: Record<string, any>
  url: string
} {
  const parsedPath = parsePath(url)

  const response = {
    pathname: parsedPath.pathname,
    search: '', // set below
    searchParams: decodeParams(parsedPath.search, '?'),
    hash: '', // set below
    hashParams: decodeParams(parsedPath.hash, '#'),
    url: '',
  }

  if (typeof searchInput === 'object') {
    Object.assign(response.searchParams, searchInput)
  } else if (typeof searchInput === 'string') {
    Object.assign(response.searchParams, decodeParams(searchInput, '?'))
  }
  response.search = encodeParams(response.searchParams, '?')

  if (typeof hashInput === 'object') {
    Object.assign(response.hashParams, hashInput)
  } else if (typeof hashInput === 'string') {
    Object.assign(response.hashParams, decodeParams(hashInput, '#'))
  }
  response.hash = encodeParams(response.hashParams, '#')
  response.url = `${response.pathname}${response.search}${response.hash}`
  return response
}
