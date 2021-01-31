export interface RouterPluginContext {
  history: {
    pushState(state: Record<string, any>, title: string, url: string): void
    replaceState(state: Record<string, any>, title: string, url: string): void
  }
  location: { pathname: string; search: string; hash: string }
  encodeParams: (obj: Record<string, any>, symbol: string) => string
  decodeParams: (input: string, symbol: string) => Record<string, any>
}

// from node_modules/url-pattern/index.d.ts
export interface UrlPatternOptions {
  escapeChar?: string
  segmentNameStartChar?: string
  segmentValueCharset?: string
  segmentNameCharset?: string
  optionalSegmentStartChar?: string
  optionalSegmentEndChar?: string
  wildcardChar?: string
}
