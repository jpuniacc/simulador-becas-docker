import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  mapSegmentacionToModalidad,
  trackSimulacionExitosa,
  linkSimulacionExitosa,
  pushToDataLayer,
  getCampaignDataFromStorage
} from '../analytics'

vi.mock('../analyticsPersistence', () => ({
  persistSimulacionExitosaEvent: vi.fn().mockResolvedValue('event-uuid-123'),
  linkSimulacionExitosaEvent: vi.fn().mockResolvedValue(undefined)
}))

import {
  persistSimulacionExitosaEvent,
  linkSimulacionExitosaEvent
} from '../analyticsPersistence'

const storage = new Map<string, string>()

const localStorageMock = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => {
    storage.set(key, value)
  },
  removeItem: (key: string) => {
    storage.delete(key)
  },
  clear: () => {
    storage.clear()
  }
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
})

describe('analytics', () => {
  beforeEach(() => {
    ;(window as Window & { dataLayer?: unknown[] }).dataLayer = []
    storage.clear()
    vi.clearAllMocks()
  })

  it('mapea segmentacion a modalidad', () => {
    expect(mapSegmentacionToModalidad('pregrado')).toBe('Pregrado')
    expect(mapSegmentacionToModalidad('pregrado_advance')).toBe('Pregrado Advance')
    expect(mapSegmentacionToModalidad('diplomados')).toBe('Diplomados')
    expect(mapSegmentacionToModalidad('postgrado')).toBe('Postgrado')
    expect(mapSegmentacionToModalidad(undefined)).toBe('Pregrado')
  })

  it('getCampaignDataFromStorage excluye expiresAt', () => {
    localStorage.setItem(
      'simulador-campaign-data',
      JSON.stringify({ utm_source: 'google', expiresAt: '2099-01-01T00:00:00.000Z' })
    )

    expect(getCampaignDataFromStorage()).toEqual({ utm_source: 'google' })
  })

  it('pushToDataLayer agrega event y campaign_data', () => {
    localStorage.setItem(
      'simulador-campaign-data',
      JSON.stringify({ utm_source: 'google', expiresAt: '2099-01-01T00:00:00.000Z' })
    )

    pushToDataLayer('test_event', { foo: 'bar' })

    const dataLayer = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer
    expect(dataLayer).toHaveLength(1)
    expect(dataLayer[0]).toMatchObject({
      event: 'test_event',
      foo: 'bar',
      campaign_data: { utm_source: 'google' }
    })
  })

  it('trackSimulacionExitosa emite evento con modalidad y carrera', async () => {
    const eventId = await trackSimulacionExitosa({
      segmentacion: 'diplomados',
      carrera: '  Psicología  '
    })

    const dataLayer = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer
    expect(dataLayer[0]).toMatchObject({
      event: 'simulacion_exitosa',
      modalidad: 'Diplomados',
      carrera: 'Psicología'
    })
    expect(persistSimulacionExitosaEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        modalidad: 'Diplomados',
        carrera: 'Psicología',
        segmentacion: 'diplomados'
      })
    )
    expect(eventId).toBe('event-uuid-123')
  })

  it.each([
    { segmentacion: 'pregrado', modalidad: 'Pregrado', carrera: 'Administración Pública' },
    { segmentacion: 'pregrado_advance', modalidad: 'Pregrado Advance', carrera: 'Diseño Gráfico' },
    { segmentacion: 'diplomados', modalidad: 'Diplomados', carrera: 'Marketing Digital' },
    { segmentacion: 'postgrado', modalidad: 'Postgrado', carrera: 'Magíster en Educación' }
  ])(
    'trackSimulacionExitosa emite simulacion_exitosa para $segmentacion',
    async ({ segmentacion, modalidad, carrera }) => {
      await trackSimulacionExitosa({ segmentacion, carrera })

      const dataLayer = (window as unknown as { dataLayer: Record<string, unknown>[] }).dataLayer
      const event = dataLayer[dataLayer.length - 1]
      expect(event).toMatchObject({
        event: 'simulacion_exitosa',
        modalidad,
        carrera
      })
    }
  )

  it('trackSimulacionExitosa persiste en BD aunque dataLayer no exista', async () => {
    delete (window as Window & { dataLayer?: unknown[] }).dataLayer

    const eventId = await trackSimulacionExitosa({
      segmentacion: 'pregrado',
      carrera: 'Diseño'
    })

    expect(persistSimulacionExitosaEvent).toHaveBeenCalled()
    expect(eventId).toBe('event-uuid-123')
  })

  it('linkSimulacionExitosa delega a persistencia', async () => {
    await linkSimulacionExitosa('event-uuid-123', {
      prospectoId: 'prospecto-1',
      simulacionId: 'sim-1'
    })

    expect(linkSimulacionExitosaEvent).toHaveBeenCalledWith('event-uuid-123', {
      prospectoId: 'prospecto-1',
      simulacionId: 'sim-1'
    })
  })
})
