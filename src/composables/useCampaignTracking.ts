import { ref, computed } from 'vue'

/**
 * Parámetros UTM estándar
 */
export interface UTMParameters {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
}

/**
 * Parámetros de campaña personalizados adicionales
 */
export interface CustomCampaignParameters {
  campaign_id?: string
  ad_id?: string
  gclid?: string // Google Click ID
  fbclid?: string // Facebook Click ID
  msclkid?: string // Microsoft Click ID
  ttclid?: string // TikTok Click ID
  li_fat_id?: string // LinkedIn Click ID
}

/**
 * Datos completos de campaña
 */
export interface CampaignData extends UTMParameters, CustomCampaignParameters {
  first_touch_url?: string
  first_touch_timestamp?: string
  last_touch_url?: string
  last_touch_timestamp?: string
}

/**
 * Datos almacenados en localStorage
 */
interface StoredCampaignData extends CampaignData {
  expiresAt?: string
}

/**
 * Clave para localStorage
 */
const STORAGE_KEY = 'simulador-campaign-data'
const DEFAULT_EXPIRATION_DAYS = 30

/**
 * Composable para tracking de campañas y parámetros UTM
 */
export function useCampaignTracking() {
  const campaignData = ref<CampaignData>({})

  /**
   * Extrae parámetros UTM de la URL
   */
  const extractUTMFromURL = (url: string = window.location.href): UTMParameters => {
    const urlObj = new URL(url)
    const params = new URLSearchParams(urlObj.search)

    return {
      utm_source: params.get('utm_source') || undefined,
      utm_medium: params.get('utm_medium') || undefined,
      utm_campaign: params.get('utm_campaign') || undefined,
      utm_term: params.get('utm_term') || undefined,
      utm_content: params.get('utm_content') || undefined
    }
  }

  /**
   * Extrae parámetros personalizados de la URL
   */
  const extractCustomParamsFromURL = (url: string = window.location.href): CustomCampaignParameters => {
    const urlObj = new URL(url)
    const params = new URLSearchParams(urlObj.search)

    return {
      campaign_id: params.get('campaign_id') || params.get('campaignId') || undefined,
      ad_id: params.get('ad_id') || params.get('adId') || undefined,
      gclid: params.get('gclid') || undefined,
      fbclid: params.get('fbclid') || undefined,
      msclkid: params.get('msclkid') || undefined,
      ttclid: params.get('ttclid') || undefined,
      li_fat_id: params.get('li_fat_id') || undefined
    }
  }

  /**
   * Carga datos de campaña desde localStorage
   */
  const loadFromLocalStorage = (): StoredCampaignData | null => {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const data: StoredCampaignData = JSON.parse(stored)

      // Verificar expiración
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

  /**
   * Guarda datos de campaña en localStorage
   */
  const saveToLocalStorage = (data: CampaignData, expirationDays: number = DEFAULT_EXPIRATION_DAYS): void => {
    if (typeof window === 'undefined') return

    try {
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + expirationDays)

      const storedData: StoredCampaignData = {
        ...data,
        expiresAt: expirationDate.toISOString()
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData))
    } catch (error) {
      console.error('Error al guardar datos de campaña en localStorage:', error)
    }
  }

  /**
   * Captura parámetros de campaña de la URL actual
   */
  const captureFromCurrentURL = (): CampaignData => {
    const currentURL = window.location.href
    const utmParams = extractUTMFromURL(currentURL)
    const customParams = extractCustomParamsFromURL(currentURL)

    const hasCampaignParams = Object.keys(utmParams).some(key => utmParams[key as keyof UTMParameters]) ||
                              Object.keys(customParams).some(key => customParams[key as keyof CustomCampaignParameters])

    if (!hasCampaignParams) {
      return {}
    }

    return {
      ...utmParams,
      ...customParams,
      last_touch_url: currentURL,
      last_touch_timestamp: new Date().toISOString()
    }
  }

  /**
   * Inicializa y captura parámetros de campaña
   * Si hay parámetros nuevos en la URL, los captura y actualiza
   * Si no hay parámetros nuevos, carga los almacenados
   */
  const initialize = (expirationDays: number = DEFAULT_EXPIRATION_DAYS): CampaignData => {
    const currentParams = captureFromCurrentURL()
    const storedData = loadFromLocalStorage()

    // Logs de debugging
    if (import.meta.env.DEV) {
      console.log('🔍 Campaign Tracking - Initializing...')
      console.log('🔍 Campaign Tracking - Current URL:', window.location.href)
      console.log('🔍 Campaign Tracking - Current params from URL:', currentParams)
      console.log('🔍 Campaign Tracking - Stored data from localStorage:', storedData)
    }

    // Si hay parámetros nuevos en la URL, usar esos (nuevo contacto)
    if (Object.keys(currentParams).length > 0) {
      const mergedData: CampaignData = {
        // Mantener first_touch si ya existe, sino usar current
        first_touch_url: storedData?.first_touch_url || currentParams.last_touch_url,
        first_touch_timestamp: storedData?.first_touch_timestamp || currentParams.last_touch_timestamp,
        // Actualizar last_touch siempre
        last_touch_url: currentParams.last_touch_url,
        last_touch_timestamp: currentParams.last_touch_timestamp,
        // Priorizar parámetros nuevos sobre almacenados
        ...storedData,
        ...currentParams
      }

      campaignData.value = mergedData
      saveToLocalStorage(mergedData, expirationDays)

      if (import.meta.env.DEV) {
        console.log('✅ Campaign Tracking - New params captured, merged data:', mergedData)
        console.log('✅ Campaign Tracking - Saved to localStorage')
      }

      return mergedData
    }

    // Si no hay parámetros nuevos, usar los almacenados
    if (storedData) {
      // Limpiar expiresAt antes de asignar (no lo necesitamos en el objeto final)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expiresAt, ...data } = storedData
      campaignData.value = data

      if (import.meta.env.DEV) {
        console.log('📦 Campaign Tracking - Using stored data from localStorage:', data)
        console.log('📦 Campaign Tracking - Data persisted from previous visit')
      }

      return data
    }

    if (import.meta.env.DEV) {
      console.log('⚠️ Campaign Tracking - No campaign data found (no params in URL, no stored data)')
    }

    return {}
  }

  /**
   * Obtiene los datos de campaña actuales
   * Si no hay datos en memoria, intenta cargar desde localStorage
   */
  const getCampaignData = (): CampaignData => {
    // Si hay datos en memoria, retornarlos
    if (Object.keys(campaignData.value).length > 0) {
      return { ...campaignData.value }
    }
    
    // Si no hay datos en memoria, intentar cargar desde localStorage
    const storedData = loadFromLocalStorage()
    if (storedData) {
      // Limpiar expiresAt antes de retornar
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expiresAt, ...data } = storedData
      // Actualizar también el estado en memoria para futuras consultas
      campaignData.value = data
      return data
    }
    
    return {}
  }

  /**
   * Limpia los datos de campaña
   */
  const clearCampaignData = (): void => {
    campaignData.value = {}
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  /**
   * Obtiene solo los parámetros UTM
   */
  const getUTMParameters = computed((): UTMParameters => {
    return {
      utm_source: campaignData.value.utm_source,
      utm_medium: campaignData.value.utm_medium,
      utm_campaign: campaignData.value.utm_campaign,
      utm_term: campaignData.value.utm_term,
      utm_content: campaignData.value.utm_content
    }
  })

  /**
   * Verifica si hay datos de campaña
   */
  const hasCampaignData = computed((): boolean => {
    return Object.keys(campaignData.value).length > 0
  })

  /**
   * Push a Google Tag Manager dataLayer (si está disponible)
   */
  const pushToDataLayer = (eventName: string, additionalData?: Record<string, unknown>): void => {
    if (typeof window === 'undefined') {
      return
    }

    const win = window as Window & { dataLayer?: unknown[] }
    if (!win.dataLayer) {
      return
    }

    win.dataLayer.push({
      event: eventName,
      campaign_data: campaignData.value,
      ...additionalData
    } as Record<string, unknown>)
  }

  // Nota: La inicialización se hace manualmente desde App.vue
  // No usar onMounted aquí para evitar múltiples inicializaciones

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
    saveToLocalStorage
  }
}

