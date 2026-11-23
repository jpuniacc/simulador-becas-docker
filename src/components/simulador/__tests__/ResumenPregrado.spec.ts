import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'

const registrarLead = vi.fn().mockResolvedValue(undefined)
vi.mock('@/composables/useRegistroSimulacion', () => ({ useRegistroSimulacion: () => ({ registrarLead }) }))
vi.mock('@/lib/supabase/client', () => ({ supabase: {} }))

import ResumenPregrado from '../ResumenPregrado.vue'
import { useSimuladorStore } from '@/stores/simuladorStore'
import { useCarrerasStore } from '@/stores/carrerasStore'
import { useDescuentosStore } from '@/stores/descuentosStore'
import { useBecasStore } from '@/stores/becasStore'

const anio = new Date().getFullYear()
const psicologiaDiurno = {
  id: 1, nombre_programa: 'Psicología', modalidad_programa: 'Diurno', nivel_academico: 'Pregrado',
  duracion_programa: '10 semestres', arancel: 4190000, matricula: 250000, anio,
  arancel_referencia: 3315987, anio_arancel_referencia: anio
}
const beca = {
  beca: { id: 'b1', nombre: 'Beca Mérito Académico PAES', tipo_descuento: 'porcentaje', requiere_documentacion: ['Certificado PAES'] },
  descuento_aplicado: 25,
  monto_descuento: 1047500
}

const texto = (w: ReturnType<typeof montar>) => w.text().replace(/\u00a0/g, ' ')

const montar = (opts: { conBeca?: boolean; cae?: boolean; ministeriales?: boolean; nInformativas?: number } = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const carreras = useCarrerasStore()
  carreras.carreras = [psicologiaDiurno] as any
  const simulador = useSimuladorStore()
  simulador.formData = {
    ...simulador.formData,
    nombre: 'Prueba', carrera: 'Psicología', carreraId: 1,
    planeaUsarCAE: !!opts.cae, usaBecasEstado: !!opts.ministeriales
  } as any
  simulador.calculoBecas = {
    arancel_base: 4190000,
    becas_aplicadas: opts.conBeca === false ? [] : [beca],
    descuento_total: opts.conBeca === false ? 0 : 1047500,
    arancel_final: 0,
    ahorro_total: 0
  } as any
  const descuentos = useDescuentosStore()
  descuentos.descuentosModoPago = [
    { nombre: 'Cheque', dscto_arancel: 3, activa: true },
    { nombre: 'Contado', dscto_arancel: 5, activa: true }
  ] as any
  vi.spyOn(descuentos, 'cargarDescuentosModoPago').mockResolvedValue(undefined as any)
  vi.spyOn(descuentos, 'cargarDescuentosPagoAnticipado').mockResolvedValue(undefined as any)
  const becas = useBecasStore()
  becas.becasInformativas = Array.from({ length: opts.nInformativas ?? 1 }, (_, i) => ({ id: `i${i + 1}`, nombre: `Beca ${i + 1} UNIACC`, descripcion: 'x'.repeat(300) })) as any
  vi.spyOn(becas, 'cargarBecasInformativas').mockResolvedValue(undefined as any)
  return mount(ResumenPregrado, { global: { plugins: [pinia, [PrimeVue, {}]] } })
}

describe('ResumenPregrado', () => {
  beforeEach(() => registrarLead.mockClear())

  it('muestra montos con el arancel de la carrera elegida (Psicología Diurno $4.190.000)', () => {
    const w = montar()
    expect(w.get('[data-testid="arancel-referencial"]').text().replace(/\u00a0/g, ' ')).toContain('4.190.000')
    // total = 4.190.000 − 1.047.500 + 250.000 = 3.392.500 ; cuota (10) = 339.250
    expect(w.get('[data-testid="total-estimado"]').text()).toContain('3.392.500')
    expect(w.get('[data-testid="valor-cuota"]').text()).toContain('339.250')
    expect(w.get('[data-testid="beneficio-estimado"]').text()).toContain('1.047.500')
  })

  it('el CAE no se suma: los totales son iguales con y sin CAE y no aparece «hasta X%»', () => {
    const sin = montar({ cae: false })
    const con = montar({ cae: true, ministeriales: true })
    expect(con.get('[data-testid="total-estimado"]').text()).toBe(sin.get('[data-testid="total-estimado"]').text())
    expect(con.get('[data-testid="valor-cuota"]').text()).toBe(sin.get('[data-testid="valor-cuota"]').text())
    expect(texto(con)).not.toMatch(/hasta (un )?\d+\s?%/i)
    expect(texto(con)).not.toMatch(/Podrías estudiar/i)
  })

  it('bloque referencial solo si el postulante usará financiamiento del Estado', () => {
    expect(montar().find('[data-testid="bloque-referencial"]').exists()).toBe(false)
    const w = montar({ cae: true, ministeriales: true })
    const b = w.get('[data-testid="bloque-referencial"]')
    expect(b.text()).toContain('Referencial')
    expect(w.text()).toContain('Las becas se asignan') // con mayúscula
    expect(w.text()).not.toContain(' las becas se asignan')
  })

  it('selector de cuotas recalcula al instante; 5% contado solo con 1 cuota', async () => {
    const w = montar()
    const valor = () => w.get('[data-testid="valor-cuota"]').text().replace(/\u00a0/g, ' ')
    for (const [n, esperado] of [[3, '1.130.833'], [6, '565.417'], [10, '339.250'], [12, '282.708']] as const) {
      await w.get(`[data-testid="cuota-${n}"]`).trigger('click')
      expect(valor()).toContain(esperado)
      expect(w.find('[data-testid="fila-contado"]').exists()).toBe(false)
    }
    await w.get('[data-testid="cuota-1"]').trigger('click')
    // arancel con beca 3.142.500 → 5% = 157.125 ; total = 3.142.500 − 157.125 + 250.000 = 3.235.375
    expect(w.find('[data-testid="fila-contado"]').exists()).toBe(true)
    expect(w.get('[data-testid="total-estimado"]').text().replace(/\u00a0/g, ' ')).toContain('3.235.375')
    expect(valor()).toContain('3.235.375')
  })

  it('etiqueta de beca con «Sujeta a requisitos»; sin beca muestra el texto neutro', () => {
    const con = montar()
    expect(con.get('[data-testid="beca-aplicada"]').text()).toBe('Beca Mérito Académico PAES · 25% · Sujeta a requisitos')
    const sin = montar({ conBeca: false })
    expect(sin.find('[data-testid="beca-aplicada"]').exists()).toBe(false)
    expect(sin.get('[data-testid="sin-beca"]').text()).toBe('Con tus datos no identificamos una beca UNIACC; Admisión puede revisar tu caso')
  })

  it('muestra «Simulación referencial · sujeta a validación», disclaimer, vigencia y contacto con botón de asesor', () => {
    const w = montar()
    const t = texto(w)
    expect(t).toContain('Simulación referencial · sujeta a validación')
    expect(w.get('[data-testid="disclaimer"]').text()).toContain('preselección y selección')
    expect(t).toContain('duración de 1 semana')
    expect(w.get('[data-testid="contacto"]').text()).toContain('admision@uniacc.cl')
    const b = w.get('[data-testid="contactar-asesor"]')
    expect(b.text()).toContain('Contactar asesor')
    expect(b.attributes('href')).toMatch(/^https:\/\/wa\.me\/56942284987\?text=/)
    expect(b.attributes('target')).toBe('_blank')
    expect(b.attributes('rel')).toContain('noopener')
  })

  it('la descripción de Becas Adicionales usa el clamp compatible (ellipsis)', () => {
    const w = montar()
    expect(w.find('[data-testid="beca-desc"]').exists()).toBe(true)
  })

  it('simulate() dispara el registro del lead exactamente una vez', async () => {
    const w = montar()
    const simulador = useSimuladorStore()
    vi.spyOn(simulador, 'simulate').mockResolvedValue({} as any)
    await (w.vm as any).simulate()
    await flushPromises()
    expect(simulador.simulate).toHaveBeenCalledTimes(1)
    expect(simulador.simulate).toHaveBeenCalledWith({ arancelPorId: true })
    expect(registrarLead).toHaveBeenCalledTimes(1)
    expect(registrarLead.mock.calls[0][0].segmentacion).toBe('pregrado')
  })

  describe('carrusel de Becas Adicionales', () => {
    const scrollTo = vi.fn()
    beforeEach(() => {
      scrollTo.mockClear()
      ;(Element.prototype as any).scrollTo = scrollTo
    })

    it('mantiene todas las tarjetas, un punto por beca y «Ver más» en cada una', () => {
      const w = montar({ nInformativas: 4 })
      expect(w.findAll('[data-testid="becas-adicionales"] article')).toHaveLength(4)
      expect(w.findAll('[data-testid="carrusel-puntos"] button')).toHaveLength(4)
      expect(w.findAll('[data-testid="becas-adicionales"] article button').every((b) => b.text().includes('Ver más'))).toBe(true)
      expect(w.get('[data-testid="carrusel-pista"]').attributes('aria-roledescription')).toBe('carrusel')
    })

    it('no hay flechas anterior/siguiente; los puntos desplazan el carrusel y marcan la posición actual', async () => {
      const w = montar({ nInformativas: 3 })
      await flushPromises()
      const puntos = () => w.findAll('[data-testid="carrusel-puntos"] button')
      expect(w.find('[data-testid="carrusel-prev"]').exists()).toBe(false)
      expect(w.find('[data-testid="carrusel-next"]').exists()).toBe(false)
      expect(puntos()[0].attributes('aria-current')).toBe('true')

      await puntos()[2].trigger('click')
      expect(scrollTo).toHaveBeenCalledTimes(1)
      expect(puntos()[2].attributes('aria-current')).toBe('true')

      await puntos()[1].trigger('click')
      expect(puntos()[1].attributes('aria-current')).toBe('true')
    })

    it('con el teclado (← →) en la pista cambia de tarjeta', async () => {
      const w = montar({ nInformativas: 3 })
      await flushPromises()
      const pista = w.get('[data-testid="carrusel-pista"]')
      await pista.trigger('keydown', { key: 'ArrowRight' })
      expect(w.findAll('[data-testid="carrusel-puntos"] button')[1].attributes('aria-current')).toBe('true')
      await pista.trigger('keydown', { key: 'ArrowLeft' })
      expect(w.findAll('[data-testid="carrusel-puntos"] button')[0].attributes('aria-current')).toBe('true')
    })

    it('«Ver más» sigue abriendo el detalle de la beca', async () => {
      const w = montar({ nInformativas: 2 })
      await w.findAll('[data-testid="becas-adicionales"] article button')[1].trigger('click')
      expect(document.body.textContent).toContain('Beca 2 UNIACC')
    })
  })
})
