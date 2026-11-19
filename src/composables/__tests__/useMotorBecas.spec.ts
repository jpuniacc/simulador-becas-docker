import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'

const escrituras = vi.fn()
vi.mock('@/lib/supabase/client', () => {
  const chain: any = {}
  for (const m of ['select', 'eq', 'order', 'lte', 'or', 'gte', 'single']) chain[m] = () => chain
  for (const m of ['insert', 'update', 'upsert', 'delete']) chain[m] = (...a: unknown[]) => { escrituras(m, ...a); return chain }
  chain.then = (res: any) => res({ data: [], error: null })
  return { supabase: { from: () => chain, rpc: (...a: unknown[]) => { escrituras('rpc', ...a); return chain } } }
})
const registrarLead = vi.fn().mockResolvedValue(undefined)
vi.mock('@/composables/useRegistroSimulacion', () => ({ useRegistroSimulacion: () => ({ registrarLead }) }))

import { useMotorBecas } from '../useMotorBecas'
import ResumenPregrado from '@/components/simulador/ResumenPregrado.vue'
import { useSimuladorStore } from '@/stores/simuladorStore'
import { useCarrerasStore } from '@/stores/carrerasStore'
import { useBecasStore } from '@/stores/becasStore'
import { useDescuentosStore } from '@/stores/descuentosStore'
import { TEXTOS_RESUMEN } from '@/utils/resumenPregrado'

const anio = new Date().getFullYear()
const carrera = (id: number, nombre: string, modalidad: string, arancel: number) => ({
  id, nombre_programa: nombre, modalidad_programa: modalidad, nivel_academico: 'Pregrado',
  duracion_programa: '10 semestres', arancel, matricula: 250000, anio, arancel_referencia: 0, anio_arancel_referencia: anio
})
const beca = {
  id: 'b1', codigo_beca: 'MPAES', nombre: 'Beca Mérito Académico PAES', prioridad: 1, activa: true,
  tipo_descuento: 'porcentaje', descuento_porcentaje: 25, requiere_paes: true, paes_minimo: 600,
  vigencia_desde: '2020-01-01', vigencia_hasta: null
}

const datosBase = {
  nombre: 'Prueba', apellido: 'Simulador', email: 'prueba@example.com', telefono: '12345678',
  nivelEducativo: 'Educación media completa'
}
const CASOS = {
  // A: Psicología Diurno con PAES + CAE → beca 25 %
  A: { ...datosBase, carrera: 'Psicología', carreraId: 1, rendioPAES: true, paes: { lenguaje: 700, matematica: 650 }, planeaUsarCAE: true, usaBecasEstado: true, decil: 3 },
  // B: Ingeniería Comercial Online sin PAES ni financiamiento → sin beca
  B: { ...datosBase, carrera: 'Ingeniería Comercial', carreraId: 3, rendioPAES: false, planeaUsarCAE: false, usaBecasEstado: false },
  // C: Psicología Vespertino sin PAES → sin beca (arancel por id, no por nombre)
  C: { ...datosBase, carrera: 'Psicología', carreraId: 2, rendioPAES: false }
} as const

const preparar = () => {
  const pinia = createPinia()
  setActivePinia(pinia)
  // Orden real de la BD: Vespertino aparece primero con ese nombre
  useCarrerasStore().carreras = [
    carrera(2, 'Psicología', 'Vespertino', 3810000),
    carrera(1, 'Psicología', 'Diurno', 4190000),
    carrera(3, 'Ingeniería Comercial', 'Online', 4020000)
  ] as any
  const becas = useBecasStore()
  becas.becas = [beca] as any
  becas.becasEstado = [{ id: 1 }] as any
  vi.spyOn(becas, 'cargarBecasInformativas').mockResolvedValue(undefined as any)
  const descuentos = useDescuentosStore()
  descuentos.descuentosModoPago = [{ nombre: 'Contado', dscto_arancel: 5, activa: true }] as any
  vi.spyOn(descuentos, 'cargarDescuentosModoPago').mockResolvedValue(undefined as any)
  vi.spyOn(descuentos, 'cargarDescuentosPagoAnticipado').mockResolvedValue(undefined as any)
  return pinia
}

/** Lo que muestra el resumen real (ResumenPregrado) para los mismos datos. */
const montarResumen = async (pinia: ReturnType<typeof createPinia>, datos: Record<string, unknown>) => {
  const simulador = useSimuladorStore()
  simulador.updateFormData(datos as any)
  // La simulación legacy puede rechazar por datos faltantes en jsdom; el cálculo de becas ocurre antes
  await simulador.simulate({ arancelPorId: true }).catch(() => undefined)
  const w = mount(ResumenPregrado, { global: { plugins: [pinia, [PrimeVue, {}]] } })
  const t = (id: string) => w.get(`[data-testid="${id}"]`).text().replace(/\u00a0/g, ' ')
  return {
    arancel: t('arancel-referencial'),
    total: t('total-estimado'),
    beneficio: t('beneficio-estimado'),
    beca: w.find('[data-testid="beca-aplicada"]').exists() ? t('beca-aplicada') : null,
    sinBeca: w.find('[data-testid="sin-beca"]').exists() ? t('sin-beca') : null
  }
}

const moneda = (n: number) => new Intl.NumberFormat('es-CL').format(n)

describe('useMotorBecas', () => {
  beforeEach(() => {
    escrituras.mockClear()
    registrarLead.mockClear()
  })

  it('caso A (Psicología Diurno, PAES+CAE): beca 25 % = −$1.047.500 sobre $4.190.000', async () => {
    const pinia = preparar()
    const motor = useMotorBecas()
    const r = await motor.calcular(CASOS.A as any)
    expect(r?.arancelReferencial).toBe(4190000)
    expect(r?.hayBeca).toBe(true)
    expect(r?.beca?.porcentaje).toBe(25)
    expect(r?.descuentoBeca).toBe(1047500)
    expect(r?.beca?.etiqueta).toBe('Beca Mérito Académico PAES · 25% · Sujeta a requisitos')
    expect(pinia).toBeTruthy()
  })

  it('caso B (Ingeniería Comercial Online, sin financiamiento): sin beca y arancel $4.020.000', async () => {
    preparar()
    const r = await useMotorBecas().calcular(CASOS.B as any)
    expect(r?.hayBeca).toBe(false)
    expect(r?.beca).toBeNull()
    expect(r?.descuentoBeca).toBe(0)
    expect(r?.arancelReferencial).toBe(4020000)
  })

  it('caso C (Psicología Vespertino): arancel por id = $3.810.000, no el del primero con ese nombre ni el Diurno', async () => {
    preparar()
    const r = await useMotorBecas().calcular(CASOS.C as any)
    expect(r?.arancelReferencial).toBe(3810000)
    expect(r?.hayBeca).toBe(false)
  })

  for (const caso of ['A', 'B', 'C'] as const) {
    it(`el motor da el mismo resultado que el resumen (caso ${caso})`, async () => {
      const pinia = preparar()
      const motor = useMotorBecas()
      const r = await motor.calcular(CASOS[caso] as any)
      const res = await montarResumen(pinia, CASOS[caso] as any)

      expect(res.arancel).toContain(moneda(r!.arancelReferencial))
      // resumen con 10 cuotas (por defecto) = mismo total que calculó el motor
      expect(res.total).toContain(moneda(r!.resumen.totalEstimado))
      expect(res.beneficio).toContain(moneda(r!.resumen.beneficioEstimado))
      if (r!.beca) expect(res.beca).toBe(r!.beca.etiqueta)
      else expect(res.sinBeca).toBe(TEXTOS_RESUMEN.sinBeca)
    })
  }

  it('cero escrituras y cero lead: no llama a simulate(), ni a registrarLead, ni escribe en Supabase', async () => {
    preparar()
    const simulador = useSimuladorStore()
    const simular = vi.spyOn(simulador, 'simulate')
    const fetchSpy = vi.spyOn(globalThis, 'fetch' as any).mockResolvedValue({ ok: true, json: async () => ({}) } as any)
    for (const caso of ['A', 'B', 'C'] as const) await useMotorBecas().calcular(CASOS[caso] as any)
    expect(simular).not.toHaveBeenCalled()
    expect(registrarLead).not.toHaveBeenCalled()
    expect(escrituras).not.toHaveBeenCalled()
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  it('sin carrera devuelve un error claro en vez de calcular', async () => {
    preparar()
    const motor = useMotorBecas()
    const r = await motor.calcular({ ...datosBase, carreraId: 0 } as any)
    expect(r).toBeNull()
    expect(motor.error.value).toMatch(/carrera/i)
  })
})
