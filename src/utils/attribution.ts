/**
 * Atribución de tráfico: parseo URL, referrer y clasificación traffic_type.
 * Usado por useCampaignTracking y tests.
 */

export type TrafficType = 'paid' | 'organic' | 'social' | 'referral' | 'direct' | 'email'

export interface UrlAttributionParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  campaign_id?: string
  adgroup_id?: string
  ad_id?: string
  gclid?: string
  gcl_aw?: string
  fbclid?: string
  msclkid?: string
  ttclid?: string
  twclid?: string
  li_fat_id?: string
  gad_source?: string
  gbraid?: string
  wbraid?: string
}

export interface SessionAttribution {
  referrer?: string
  landing_page?: string
}

export interface AttributionSnapshot extends UrlAttributionParams, SessionAttribution {
  organic_source?: string
  organic_medium?: string
  traffic_type?: TrafficType
  first_touch_url?: string
  first_touch_timestamp?: string
  last_touch_url?: string
  last_touch_timestamp?: string
}

/**
 * Taxonomía UTM Marketing UNIACC (utm_medium → traffic_type paid).
 * Canal → source/medium: Google Search Ads google/cpc, PMax google/pmax,
 * Demand Gen google/demand_gen, Meta/TikTok paid_social, YouTube Ads youtube/paid_video.
 */
const PAID_MEDIUMS = new Set([
  'cpc',
  'ppc',
  'paid',
  'paidsearch',
  'display',
  'cpm',
  'cpv',
  'pmax',
  'demand_gen',
  'paid_social',
  'paid_video',
])

/** Mediums orgánicos de redes → traffic_type social (instagram/facebook organic_social, youtube organic_video). */
const ORGANIC_SOCIAL_MEDIUMS = new Set(['organic_social', 'organic_video'])

/**
 * Alias de plantillas Google Ads previas a la taxonomía Marketing.
 * Permite consolidar el histórico sin reprocesarlo a mano.
 */
const SOURCE_ALIASES: Record<string, string> = {
  adwords: 'google',
  googleads: 'google',
  google_ads: 'google',
  'google-ads': 'google',
  ig: 'instagram',
  fb: 'facebook',
}

const MEDIUM_ALIASES: Record<string, string> = {
  ppc: 'cpc',
  paidsearch: 'cpc',
  paid_search: 'cpc',
  'paid-search': 'cpc',
  'paid-social': 'paid_social',
  'paid-video': 'paid_video',
  'organic-social': 'organic_social',
  'organic-video': 'organic_video',
  'demand-gen': 'demand_gen',
}

const SEARCH_ENGINES: Array<{ pattern: RegExp; source: string }> = [
  { pattern: /google\./i, source: 'google' },
  { pattern: /bing\./i, source: 'bing' },
  { pattern: /yahoo\./i, source: 'yahoo' },
  { pattern: /duckduckgo\./i, source: 'duckduckgo' },
  { pattern: /ecosia\./i, source: 'ecosia' },
]

const SOCIAL_HOSTS: Array<{ pattern: RegExp; source: string }> = [
  { pattern: /facebook\.|fb\./i, source: 'facebook' },
  { pattern: /instagram\./i, source: 'instagram' },
  { pattern: /linkedin\./i, source: 'linkedin' },
  { pattern: /tiktok\./i, source: 'tiktok' },
  { pattern: /youtube\.|youtu\.be/i, source: 'youtube' },
  { pattern: /twitter\.|^t\.co$/i, source: 'twitter' },
  { pattern: /x\.com/i, source: 'twitter' },
]

function pickParam(params: URLSearchParams, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = params.get(key)?.trim()
    if (value) return value
  }
  return undefined
}

/** Normaliza utm_source a la taxonomía Marketing (adwords → google). */
export function normalizeUtmSource(value: string | undefined): string | undefined {
  const source = value?.trim().toLowerCase()
  if (!source) return undefined
  return SOURCE_ALIASES[source] ?? source
}

/** Normaliza utm_medium a la taxonomía Marketing (ppc → cpc). */
export function normalizeUtmMedium(value: string | undefined): string | undefined {
  const medium = value?.trim().toLowerCase()
  if (!medium) return undefined
  return MEDIUM_ALIASES[medium] ?? medium
}

/** Parsea query string de campaña desde una URL. */
export function parseUrlAttribution(url: string): UrlAttributionParams {
  try {
    const params = new URL(url).searchParams
    return {
      utm_source: normalizeUtmSource(pickParam(params, 'utm_source')),
      utm_medium: normalizeUtmMedium(pickParam(params, 'utm_medium')),
      utm_campaign: pickParam(params, 'utm_campaign') ?? undefined,
      utm_term: pickParam(params, 'utm_term') ?? undefined,
      utm_content: pickParam(params, 'utm_content') ?? undefined,
      // hsa_* y utm_id son los nombres que usan las plantillas ValueTrack vigentes
      campaign_id: pickParam(params, 'campaign_id', 'campaignId', 'utm_id', 'hsa_cam') ?? undefined,
      adgroup_id: pickParam(params, 'adgroup_id', 'adgroupId', 'hsa_grp') ?? undefined,
      ad_id: pickParam(params, 'ad_id', 'adId', 'hsa_ad') ?? undefined,
      gclid: pickParam(params, 'gclid') ?? undefined,
      gcl_aw: pickParam(params, '_gcl_aw') ?? undefined,
      fbclid: pickParam(params, 'fbclid') ?? undefined,
      msclkid: pickParam(params, 'msclkid') ?? undefined,
      ttclid: pickParam(params, 'ttclid') ?? undefined,
      twclid: pickParam(params, 'twclid') ?? undefined,
      li_fat_id: pickParam(params, 'li_fat_id') ?? undefined,
      gad_source: pickParam(params, 'gad_source') ?? undefined,
      gbraid: pickParam(params, 'gbraid') ?? undefined,
      wbraid: pickParam(params, 'wbraid') ?? undefined,
    }
  } catch {
    return {}
  }
}

/** gclid explícito o fallback desde _gcl_aw (Google Ads auto-tagging). */
export function resolveGoogleClickId(data: Pick<UrlAttributionParams, 'gclid' | 'gcl_aw'>): string | undefined {
  return data.gclid || data.gcl_aw || undefined
}

function hostFromReferrer(referrer: string): string | null {
  try {
    return new URL(referrer).hostname.toLowerCase()
  } catch {
    return null
  }
}

function matchHost(host: string, rules: Array<{ pattern: RegExp; source: string }>): string | undefined {
  for (const rule of rules) {
    if (rule.pattern.test(host)) return rule.source
  }
  return undefined
}

/** Deriva organic_source/medium desde HTTP referrer (sin click IDs de pago). */
export function deriveOrganicFromReferrer(referrer: string | undefined): {
  organic_source?: string
  organic_medium?: string
} {
  if (!referrer?.trim()) return {}

  const host = hostFromReferrer(referrer)
  if (!host) return {}

  const search = matchHost(host, SEARCH_ENGINES)
  if (search) {
    return { organic_source: search, organic_medium: 'organic' }
  }

  const social = matchHost(host, SOCIAL_HOSTS)
  if (social) {
    const organic_medium = social === 'youtube' ? 'organic_video' : 'organic_social'
    return { organic_source: social, organic_medium }
  }

  return { organic_source: host, organic_medium: 'referral' }
}

/** Clasifica el tipo de tráfico según params y referrer. */
export function deriveTrafficType(data: Partial<AttributionSnapshot>): TrafficType {
  const medium = normalizeUtmMedium(data.utm_medium) ?? ''
  const hasPaidId = Boolean(
    resolveGoogleClickId(data)
    || data.fbclid
    || data.msclkid
    || data.ttclid
    || data.twclid
    || data.li_fat_id
    || data.gbraid
    || data.wbraid
  )

  if (hasPaidId || PAID_MEDIUMS.has(medium)) return 'paid'
  if (medium === 'email') return 'email'
  if (medium === 'organic') return 'organic'
  if (ORGANIC_SOCIAL_MEDIUMS.has(medium)) return 'social'

  const organic = deriveOrganicFromReferrer(data.referrer)
  if (organic.organic_medium === 'organic') return 'organic'
  if (
    organic.organic_medium === 'social'
    || organic.organic_medium === 'organic_social'
    || organic.organic_medium === 'organic_video'
  ) {
    return 'social'
  }
  if (organic.organic_medium === 'referral' && !data.utm_source) return 'referral'
  if (data.utm_source) return 'referral'

  return 'direct'
}

/** Enriquece snapshot con gclid normalizado, orgánico y traffic_type. */
export function enrichAttributionSnapshot(data: AttributionSnapshot): AttributionSnapshot {
  // Normaliza también snapshots antiguos ya persistidos en localStorage
  const normalized: AttributionSnapshot = {
    ...data,
    utm_source: normalizeUtmSource(data.utm_source),
    utm_medium: normalizeUtmMedium(data.utm_medium),
  }

  const gclid = resolveGoogleClickId(normalized)
  const organicFromReferrer = deriveOrganicFromReferrer(normalized.referrer)
  const traffic_type = deriveTrafficType({ ...normalized, gclid })

  let organic_source = normalized.organic_source
  let organic_medium = normalized.organic_medium

  if (traffic_type === 'organic' || traffic_type === 'social') {
    organic_source = organic_source || normalized.utm_source || organicFromReferrer.organic_source
    organic_medium =
      organic_medium
      || normalized.utm_medium
      || organicFromReferrer.organic_medium
      || (traffic_type === 'social' ? 'organic_social' : 'organic')
  } else if (!organic_source && organicFromReferrer.organic_source) {
    organic_source = organicFromReferrer.organic_source
    organic_medium = organicFromReferrer.organic_medium
  }

  return {
    ...normalized,
    gclid,
    organic_source,
    organic_medium,
    traffic_type,
  }
}

/** ¿La URL trae algún param de campaña? */
export function urlHasCampaignParams(url: string): boolean {
  const p = parseUrlAttribution(url)
  return Object.values(p).some(Boolean)
}
