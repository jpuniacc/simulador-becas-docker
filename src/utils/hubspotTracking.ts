/**
 * HubSpot tracking embed (51464408.js): cookie hutk, identify, page views SPA.
 */

const HUBSPOT_PORTAL_ID = '51464408'

type HsqWindow = Window & { _hsq?: unknown[][] }

function getHsq(): unknown[][] {
  if (typeof window === 'undefined') return []
  const win = window as HsqWindow
  win._hsq = win._hsq || []
  return win._hsq
}

/** Lee cookie hubspotutk (hutk) seteada por el tracking embed. */
export function getHubSpotUtk(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]*)/)
  const value = match?.[1]?.trim()
  return value || undefined
}

/** Vincula email del contacto con la sesión trackeada por HubSpot. */
export function identifyHubSpotContact(email: string): void {
  const trimmed = email?.trim()
  if (!trimmed) return
  getHsq().push(['identify', { email: trimmed }])
}

/** Page view para SPA (Vue Router). */
export function trackHubSpotPageView(path: string): void {
  const hsq = getHsq()
  hsq.push(['setPath', path])
  hsq.push(['trackPageView'])
}

export function getHubSpotPortalId(): string {
  return HUBSPOT_PORTAL_ID
}

/** Contexto de atribución para enviar al sidecar / HS. */
export function buildHubSpotTrackingContext(pageUri?: string): {
  hutk?: string
  pageUri?: string
  pageName: string
} {
  const uri =
    pageUri || (typeof window !== 'undefined' ? window.location.href : undefined)
  return {
    hutk: getHubSpotUtk(),
    pageUri: uri,
    pageName: 'Simulador UNIACC',
  }
}
