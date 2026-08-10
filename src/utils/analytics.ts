/**
 * Analytics / GTM helpers for the scholarship simulator.
 */

import {
  linkSimulacionExitosaEvent,
  persistSimulacionExitosaEvent
} from '@/utils/analyticsPersistence'

const CAMPAIGN_STORAGE_KEY = 'simulador-campaign-data'

/**
 * Mapeo de segmentación interna → valor de modalidad para dataLayer
 */
const SEGMENTACION_A_MODALIDAD: Record<string, string> = {
  pregrado: 'Pregrado',
  pregrado_advance: 'Pregrado Advance',
  diplomados: 'Diplomados',
  postgrado: 'Postgrado'
}

export interface SimulacionExitosaPayload {
  segmentacion?: string
  carrera?: string | null
}

export interface SimulacionExitosaLinks {
  prospectoId?: string | null
  simulacionId?: string | null
}

/**
 * Resuelve el label de modalidad que espera marketing en el dataLayer.
 */
export function mapSegmentacionToModalidad(segmentacion?: string): string {
  if (!segmentacion) {
    return 'Pregrado'
  }

  return SEGMENTACION_A_MODALIDAD[segmentacion] ?? segmentacion
}

export function getCampaignDataFromStorage(): Record<string, unknown> {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    const stored = localStorage.getItem(CAMPAIGN_STORAGE_KEY)
    if (!stored) {
      return {}
    }

    const data = JSON.parse(stored) as Record<string, unknown>
    const { expiresAt: _expiresAt, ...campaignData } = data
    return campaignData
  } catch {
    return {}
  }
}

/**
 * Push genérico al dataLayer (si está disponible).
 */
export function pushToDataLayer(
  eventName: string,
  additionalData?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') {
    return
  }

  const win = window as Window & { dataLayer?: unknown[] }
  if (!win.dataLayer) {
    if (import.meta.env.DEV) {
      console.warn(`[analytics] dataLayer no disponible; evento ${eventName} no enviado`, additionalData)
    }
    return
  }

  win.dataLayer.push({
    event: eventName,
    campaign_data: getCampaignDataFromStorage(),
    ...additionalData
  })
}

/**
 * Dispara el evento GTM `simulacion_exitosa` y lo persiste en Supabase.
 * Retorna el ID del registro en BD (si el insert fue exitoso).
 */
export async function trackSimulacionExitosa({
  segmentacion,
  carrera
}: SimulacionExitosaPayload): Promise<string | null> {
  const modalidad = mapSegmentacionToModalidad(segmentacion)
  const carreraNombre = (carrera ?? '').trim()
  const campaignData = getCampaignDataFromStorage()

  pushToDataLayer('simulacion_exitosa', {
    modalidad,
    carrera: carreraNombre
  })

  let eventId: string | null = null

  try {
    eventId = await persistSimulacionExitosaEvent({
      modalidad,
      carrera: carreraNombre || null,
      segmentacion: segmentacion ?? null,
      campaign_data: Object.keys(campaignData).length > 0 ? campaignData : null,
      url_origen: typeof window !== 'undefined' ? window.location.href : null
    })
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[analytics] No se pudo persistir simulacion_exitosa en BD', error)
    }
  }

  if (import.meta.env.DEV) {
    console.log('[analytics] simulacion_exitosa', {
      modalidad,
      carrera: carreraNombre,
      segmentacion,
      eventId
    })
  }

  return eventId
}

/**
 * Vincula un evento analytics ya persistido con prospecto y/o simulación.
 */
export async function linkSimulacionExitosa(
  eventId: string,
  links: SimulacionExitosaLinks
): Promise<void> {
  try {
    await linkSimulacionExitosaEvent(eventId, links)
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[analytics] No se pudo vincular simulacion_exitosa', error)
    }
  }
}

export { linkSimulacionExitosaEvent, persistSimulacionExitosaEvent }
