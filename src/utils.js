function parseValue (value) {
  if (!Number.isNaN(Number(value)) && (typeof value === 'string' && value.trim() !== '')) {
    value = Number(value)
  } else if (value !== null && (value.toLowerCase() === 'true' || value.toLowerCase() === 'false')) {
    value = value.toLowerCase() === 'true'
  } else if (value.length >= 2 && (value.match(/^\[.*\] +$/) || value.match(/^\{.*\} +$/))) {
    value = value.substring(0, value.length - 1)
  } else if (value.length >= 2 && (value.match(/^\[.*\]$/) || value.match(/^\{.*\}$/))) {
    try {
      value = JSON.parse(value)
    } catch (e) {
      // well, damn
    }
  }

  return value
}

function serializeValue (value) {
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  } else if (typeof value === 'string' && (value.match(/^\[.*\] *$/) || value.match(/^\{.*\} *$/))) {
    value = value + ' '
  }

  return value
}

export function decodeParams (input, symbol) {
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

export function encodeParams (obj, symbol) {
  if (typeof obj !== 'object') {
    return ''
  }
  const string = Object.keys(obj).map(key => {
    let value = obj[key]
    if (typeof value === 'undefined') {
      return ''
    }
    if (value === null) {
      return encodeURIComponent(key)
    }
    return encodeURIComponent(key) + '=' + encodeURIComponent(serializeValue(value))
  }).filter(k => k.length !== 0).join('&')

  return string.length > 0 ? symbol + string : ''
}

export function stringOrObjectToString (input, symbol) {
  if (!input) {
    return ''
  }

  return typeof input === 'object'
    ? encodeParams(input, symbol)
    : (input.indexOf(symbol) === 0 ? input : '?' + input)
}