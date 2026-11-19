import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/lib/supabase/client', () => {
  const chain: any = {}
  for (const m of ['select', 'eq', 'order', 'lte', 'or', 'gte', 'insert', 'single']) chain[m] = () => chain
  chain.then = (res: any) => res({ data: [], error: null })
  return { supabase: { from: () => chain, rpc: () => chain } }
})

import { useCarrerasStore } from '../carrerasStore'
import { useBecasStore } from '../becasStore'
import { useSimuladorStore } from '../simuladorStore'

const anio = new Date().getFullYear()
const carrera = (id: number, modalidad: string, arancel: number, nombre = 'Psicología') => ({
  id,
  nombre_programa: nombre,
  modalidad_programa: modalidad,
  nivel_academico: 'Pregrado',
  duracion_programa: '10 semestres',
  arancel,
  matricula: 250000,
  anio,
  arancel_referencia: 0,
  anio_arancel_referencia: anio
})

describe('arancel por id de carrera (Psicología Diurno vs Vespertino)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const carreras = useCarrerasStore()
    // Orden real de la BD: Vespertino aparece primero con ese nombre
    carreras.carreras = [
      carrera(2, 'Vespertino', 3810000),
      carrera(1, 'Diurno', 4190000),
      carrera(3, 'Semipresencial', 4190000)
    ] as any
  })
  afterEach(() => vi.restoreAllMocks())

  it('por nombre (comportamiento antiguo) devuelve el primero con ese nombre: $3.810.000', () => {
    expect(useCarrerasStore().obtenerArancelCarrera('Psicología')).toBe(3810000)
  })

  it('por id: Psicología Diurno cuesta $4.190.000', () => {
    expect(useCarrerasStore().obtenerCostosCarrera(1)?.arancel).toBe(4190000)
    expect(useCarrerasStore().obtenerCostosCarrera(2)?.arancel).toBe(3810000)
  })

  it('calcularBecas con arancel por id usa $4.190.000 como arancel base', () => {
    const becas = useBecasStore()
    const arancelPorId = useCarrerasStore().obtenerCostosCarrera(1)!.arancel
    const r = becas.calcularBecas({ carrera: 'Psicología', carreraId: 1 } as any, arancelPorId)
    expect(r.arancel_base).toBe(4190000)
  })

  const preparar = () => {
    const simulador = useSimuladorStore()
    const becas = useBecasStore()
    becas.becas = [{ id: 'x' }] as any
    becas.becasEstado = [{ id: 'y' }] as any
    simulador.updateFormData({
      nombre: 'Prueba', email: 'prueba@example.com', telefono: '12345678',
      carrera: 'Psicología', carreraId: 1
    } as any)
    return { simulador, spy: vi.spyOn(becas, 'calcularBecas') }
  }

  it('simulate({ arancelPorId: true }) calcula con el arancel de la carrera elegida', async () => {
    const { simulador, spy } = preparar()
    // La simulación legacy (useSimulation) puede rechazar por datos faltantes en este entorno;
    // lo que se prueba es el cálculo de becas, que ocurre antes.
    await simulador.simulate({ arancelPorId: true }).catch(() => undefined)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][1]).toBe(4190000)
    expect(simulador.calculoBecas?.arancel_base).toBe(4190000)
  })

  it('simulate() sin opción conserva el cálculo por nombre (postgrados sin cambios)', async () => {
    const { simulador, spy } = preparar()
    await simulador.simulate().catch(() => undefined)
    expect(spy.mock.calls[0][1]).toBeUndefined()
    expect(simulador.calculoBecas?.arancel_base).toBe(3810000)
  })
})
