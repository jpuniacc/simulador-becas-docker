import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  anioConsultaArancel,
  carreraTieneArancelAnioActual,
} from '@/utils/carreraArancelAnio'

describe('carreraArancelAnio', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('anioConsultaArancel usa el año de sysdate', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T12:00:00Z'))
    expect(anioConsultaArancel()).toBe(2026)
  })

  it('exige arancel > 0 y anio = año actual o siguiente', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-10T12:00:00Z'))
    expect(carreraTieneArancelAnioActual({ arancel: 2510000, anio: 2026 })).toBe(true)
    expect(carreraTieneArancelAnioActual({ arancel: 2510000, anio: 2027 })).toBe(true)
    expect(carreraTieneArancelAnioActual({ arancel: 2510000, anio: 2025 })).toBe(false)
    expect(carreraTieneArancelAnioActual({ arancel: 0, anio: 2026 })).toBe(false)
    expect(carreraTieneArancelAnioActual({ arancel: null, anio: 2026 })).toBe(false)
    expect(carreraTieneArancelAnioActual({ arancel: 100, anio: null })).toBe(false)
  })
})
