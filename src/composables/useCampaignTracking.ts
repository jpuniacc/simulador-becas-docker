import { ref, computed } from 'vue'
import {
  type AttributionSnapshot,
  enrichAttributionSnapshot,
  parseUrlAttribution,
  urlHasCampaignParams,
} from '@/utils/attribution'

/**
 * Parámetros UTM estándar (compat exports)
 */
export interface UTMParameters {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

export interface CustomCampaignParameters {
  campaign_id?: string
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

/** Datos completos de campaña y atribución */
export type CampaignData = AttributionSnapshot

interface StoredCampaignData extends CampaignData {
  expiresAt?: string
}

const STORAGE_KEY = 'simulador-campaign-data'
const SESSION_LANDING_KEY = 'simulador-landing-page'
const DEFAULT_EXPIRATION_DAYS = 30

function captureSessionAttribution(): Pick<
  CampaignData,
  'referrer' | 'landing_page'
> {
  if (typeof window === 'undefined') return {}

  let landing_page = sessionStorage.getItem(SESSION_LANDING_KEY) || undefined
  if (!landing_page) {
    landing_page = window.location.href
    try {
      sessionStorage.setItem(SESSION_LANDING_KEY, landing_page)
    } catch {
      // ignore quota / private mode
    }
  }

  const referrer = document.referrer?.trim() || undefined
  return { referrer, landing_page }
}

function mergeAttribution(
  stored: StoredCampaignData | null,
  currentUrl: string,
  expirationDays: number
): CampaignData {
  const now = new Date().toISOString()
  const urlParams = parseUrlAttribution(currentUrl)
  const session = captureSessionAttribution()
  const hasUrlParams = urlHasCampaignParams(currentUrl)

  const base: AttributionSnapshot = {
    ...(stored ?? {}),
    referrer: stored?.referrer || session.referrer,
    landing_page: stored?.landing_page || session.landing_page,
    first_touch_url: stored?.first_touch_url || session.landing_page || currentUrl,
    first_touch_timestamp: stored?.first_touch_timestamp || now,
    last_touch_url: currentUrl,
    last_touch_timestamp: now,
    ...urlParams,
  }

  if (hasUrlParams) {
    base.last_touch_url = currentUrl
    base.last_touch_timestamp = now
  }

  return enrichAttributionSnapshot(base)
}

export function useCampaignTracking() {
  const campaignData = ref<CampaignData>({})

  const extractUTMFromURL = (url: string = window.location.href): UTMParameters => {
    const p = parseUrlAttribution(url)
    return {
      utm_source: p.utm_source,
      utm_medium: p.utm_medium,
      utm_campaign: p.utm_campaign,
      utm_term: p.utm_term,
      utm_content: p.utm_content,
    }
  }

  const extractCustomParamsFromURL = (
    url: string = window.location.href
  ): CustomCampaignParameters => {
    const p = parseUrlAttribution(url)
    return {
      campaign_id: p.campaign_id,
      ad_id: p.ad_id,
      gclid: p.gclid,
      gcl_aw: p.gcl_aw,
      fbclid: p.fbclid,
      msclkid: p.msclkid,
      ttclid: p.ttclid,
      twclid: p.twclid,
      li_fat_id: p.li_fat_id,
      gad_source: p.gad_source,
      gbraid: p.gbraid,
      wbraid: p.wbraid,
    }
  }

  const loadFromLocalStorage = (): StoredCampaignData | null => {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const data: StoredCampaignData = JSON.parse(stored)

      if (data.expiresAt) {
        const expirationDate = new Date(data.expiresAt)
        if (expirationDate < new Date()) {
          localStorage.removeItem(STORAGE_KEY)
          return null
        }
      }

      return data
    } catch (error) {
      console.error('Error al cargar datos de campaña desde localStorage:', error)
      return null
    }
  }

  const saveToLocalStorage = (
    data: CampaignData,
    expirationDays: number = DEFAULT_EXPIRATION_DAYS
  ): void => {
    if (typeof window === 'undefined') return

    try {
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + expirationDays)

      const storedData: StoredCampaignData = {
        ...data,
        expiresAt: expirationDate.toISOString(),
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData))
    } catch (error) {
      console.error('Error al guardar datos de campaña en localStorage:', error)
    }
  }

  const captureFromCurrentURL = (): CampaignData => {
    if (typeof window === 'undefined') return {}
    const stored = loadFromLocalStorage()
    return mergeAttribution(stored, window.location.href, DEFAULT_EXPIRATION_DAYS)
  }

  const initialize = (expirationDays: number = DEFAULT_EXPIRATION_DAYS): CampaignData => {
    if (typeof window === 'undefined') return {}

    const stored = loadFromLocalStorage()
    const merged = mergeAttribution(stored, window.location.href, expirationDays)

    campaignData.value = merged
    saveToLocalStorage(merged, expirationDays)

    if (import.meta.env.DEV) {
      console.log('🔍 Campaign Tracking - Initialized:', merged)
    }

    return merged
  }

  const getCampaignData = (): CampaignData => {
    if (Object.keys(campaignData.value).length > 0) {
      return { ...campaignData.value }
    }

    const storedData = loadFromLocalStorage()
    if (storedData) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expiresAt, ...data } = storedData
      campaignData.value = data
      return data
    }

    return {}
  }

  const clearCampaignData = (): void => {
    campaignData.value = {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(SESSION_LANDING_KEY)
    }
  }

  const getUTMParameters = computed((): UTMParameters => extractUTMFromURL())

  const hasCampaignData = computed((): boolean => {
    return Object.keys(campaignData.value).length > 0
  })

  const pushToDataLayer = (eventName: string, additionalData?: Record<string, unknown>): void => {
    if (typeof window === 'undefined') return

    const win = window as Window & { dataLayer?: unknown[] }
    if (!win.dataLayer) return

    win.dataLayer.push({
      event: eventName,
      campaign_data: campaignData.value,
      ...additionalData,
    } as Record<string, unknown>)
  }

  return {
    campaignData,
    getCampaignData,
    getUTMParameters,
    hasCampaignData,
    initialize,
    captureFromCurrentURL,
    clearCampaignData,
    pushToDataLayer,
    loadFromLocalStorage,
    saveToLocalStorage,
    extractUTMFromURL,
    extractCustomParamsFromURL,
  }
}
