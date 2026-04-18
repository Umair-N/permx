const DEFAULT_SITE_ORIGIN = 'https://permx.nuvaynlabs.com'
const DEFAULT_BASE_PATH = '/'

const rawOrigin =
  import.meta.env.VITE_SITE_ORIGIN ?? DEFAULT_SITE_ORIGIN
const rawBase = import.meta.env.BASE_URL ?? DEFAULT_BASE_PATH

export const SITE_ORIGIN = rawOrigin.replace(/\/$/, '')
export const BASE_PATH = rawBase.endsWith('/') ? rawBase : `${rawBase}/`

export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`

export function siteUrl(path: string = ''): string {
  const trimmed = path.replace(/^\//, '')
  if (!trimmed) return SITE_URL
  const withTrailing = trimmed.endsWith('/') ? trimmed : `${trimmed}/`
  return `${SITE_URL}${withTrailing}`
}
