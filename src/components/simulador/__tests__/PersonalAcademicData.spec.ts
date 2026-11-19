import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import { nextTick } from 'vue'

vi.mock('@/lib/supabase/client', () => ({ supabase: {} }))
vi.mock('@/components/modals/SchoolSelectionModal.vue', () => ({
  default: { name: 'SchoolSelectionModal', template: '<div />' }
}))

import PersonalAcademicData from '../PersonalAcademicData.vue'

// jsdom no trae matchMedia (lo usa el DatePicker de PrimeVue)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false, media: query, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false
  })
})

const base = {
  nombre: 'Prueba',
  apellido: 'Simulador',
  email: 'prueba@example.com',
  telefono: '12345678',
  identificacion: '11.111.111-1',
  nivelEducativo: 'Educación media completa' as const,
  colegio: 'LICEO B 42 TAJAMAR',
  comunaResidencia: 'PROVIDENCIA',
  regionResidencia: 'REGION METROPOLITANA',
  anio_nacimiento: 2005
}

const montar = (layout: 'plano' | 'grupos', formData: Record<string, unknown> = base) =>
  mount(PersonalAcademicData, {
    props: { layout, formData } as any,
    global: { plugins: [[PrimeVue, {}]] }
  })

const ultimoEmit = (w: ReturnType<typeof montar>) => {
  const emits = w.emitted('update:form-data') || []
  return (emits[emits.length - 1]?.[0] || {}) as Record<string, any>
}

describe('PersonalAcademicData · layout grupos (pregrado)', () => {
  it('muestra el título y los 3 grupos', () => {
    const w = montar('grupos')
    expect(w.text()).toContain('Conoce las becas que se ajustan a tu perfil')
    const grupos = w.findAll('fieldset.g-group').map((g) => g.attributes('data-grupo'))
    expect(grupos).toEqual(['sobre-ti', 'contacto', 'estudios'])
    expect(w.text()).toContain('Sobre ti')
    expect(w.text()).toContain('¿Cómo te contactamos?')
    expect(w.text()).toContain('Tus estudios')
  })

  it('cada campo de texto tiene un placeholder de ejemplo', () => {
    const w = montar('grupos', {})
    const ph = (id: string) => w.get(`#${id}`).attributes('placeholder')
    expect(ph('nombre')).toBe('Ej: Camila')
    expect(ph('apellido')).toBe('Ej: Rojas')
    expect(ph('identificacion')).toBe('Ej: 12.345.678-9')
    expect(ph('email')).toBe('tu@correo.cl')
    expect(ph('telefono')).toBe('1234 5678')
  })

  it('tiene un solo aviso de privacidad y no el texto antiguo duplicado', () => {
    const w = montar('grupos')
    expect(w.findAll('[data-testid="aviso-privacidad"]').length).toBe(1)
    expect(w.text()).toContain('Aceptas que el equipo de admisión de UNIACC te contacte')
    expect(w.text().match(/Tus datos se usan sólo para esta simulación/g)?.length).toBe(1)
  })

  it('nivel educativo es un radio (se puede elegir uno solo)', () => {
    const w = montar('grupos', {})
    const radios = w.findAll('input[type="radio"][name="nivelEducativo"]')
    expect(radios.length).toBe(4)
  })

  it('marcar y desmarcar «extranjero» NO borra nivel educativo, colegio ni identificación', async () => {
    const w = montar('grupos')
    const chk = w.get('#esExtranjero')
    await chk.setValue(true)
    await nextTick()
    let e = ultimoEmit(w)
    expect(e.nivelEducativo).toBe('Educación media completa')
    expect(e.colegio).toBe('LICEO B 42 TAJAMAR')
    expect(e.identificacion).toBe('11.111.111-1')

    await chk.setValue(false)
    await nextTick()
    e = ultimoEmit(w)
    expect(e.nivelEducativo).toBe('Educación media completa')
    expect(e.colegio).toBe('LICEO B 42 TAJAMAR')
    expect(e.identificacion).toBe('11.111.111-1')
    expect((w.get('#identificacion').element as HTMLInputElement).value).toBe('11.111.111-1')
  })

  it('extranjero que reside fuera del país: el colegio oculto no viaja', async () => {
    const w = montar('grupos')
    await w.get('#esExtranjero').setValue(true)
    await w.get('#resideFueraPais').setValue(true)
    await nextTick()
    const e = ultimoEmit(w)
    expect(e.colegio).toBe('')
    expect(e.regionResidencia).toBe('')
    expect(e.nivelEducativo).toBe('Educación media completa')
  })

  it('el año de egreso tiene como máximo el año actual (no 2025 fijo)', () => {
    const w = montar('grupos')
    const campo = w.get('input#añoEgreso')
    const anio = new Date().getFullYear()
    expect(campo.attributes('aria-valuemax')).toBe(String(anio))
  })
})

describe('PersonalAcademicData · layout plano (postgrados, sin cambios)', () => {
  it('no usa la variante de grupos y mantiene el texto original', () => {
    const w = montar('plano', {})
    expect(w.find('.g-form').exists()).toBe(false)
    expect(w.text()).toContain('Cuéntanos un poco sobre ti')
  })

  it('mantiene el comportamiento anterior: al desmarcar extranjero se limpia la identificación', async () => {
    const w = montar('plano')
    const chk = w.get('#esExtranjero input')
    await chk.setValue(true)
    await chk.setValue(false)
    await nextTick()
    expect(ultimoEmit(w).identificacion).toBe('')
  })
})
