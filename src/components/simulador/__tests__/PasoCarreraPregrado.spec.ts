import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PrimeVue from 'primevue/config'

const anio = new Date().getFullYear()
const carrera = (id: number, nombre: string, modalidad: string, arancel: number) => ({
  id, nombre_programa: nombre, modalidad_programa: modalidad, nivel_academico: 'Pregrado',
  duracion_programa: '10 semestres', arancel, matricula: 250000, anio, arancel_referencia: 0, anio_arancel_referencia: anio
})
const TABLAS: Record<string, unknown[]> = {
  carreras_uniacc: [
    carrera(2, 'Psicología', 'Vespertino', 3810000),
    carrera(1, 'Psicología', 'Diurno', 4190000),
    carrera(3, 'Ingeniería Comercial', 'Online', 4020000)
  ],
  deciles: [
    { id: 1, decil: 1, rango_ingreso_min: 0, rango_ingreso_max: 400000, activo: true, orden_visual: 1 },
    { id: 3, decil: 3, rango_ingreso_min: 400001, rango_ingreso_max: 800000, activo: true, orden_visual: 2 }
  ]
}
const escrituras = vi.fn()
vi.mock('@/lib/supabase/client', () => {
  const mk = (tabla: string) => {
    const chain: any = {}
    for (const m of ['select', 'eq', 'order', 'lte', 'or', 'gte', 'single']) chain[m] = () => chain
    for (const m of ['insert', 'update', 'upsert', 'delete']) chain[m] = (...a: unknown[]) => { escrituras(tabla, m, ...a); return chain }
    chain.then = (res: any) => res({ data: TABLAS[tabla] ?? [], error: null })
    return chain
  }
  return { supabase: { from: (t: string) => mk(t), rpc: (...a: unknown[]) => { escrituras('rpc', ...a); return mk('rpc') } } }
})
const registrarLead = vi.fn().mockResolvedValue(undefined)
vi.mock('@/composables/useRegistroSimulacion', () => ({ useRegistroSimulacion: () => ({ registrarLead }) }))

import PasoCarreraPregrado from '../PasoCarreraPregrado.vue'
import { useCarrerasStore } from '@/stores/carrerasStore'
import { useBecasStore } from '@/stores/becasStore'
import { useSimuladorStore } from '@/stores/simuladorStore'

const beca = {
  id: 'b1', codigo_beca: 'MPAES', nombre: 'Beca Mérito Académico PAES', prioridad: 1, activa: true,
  tipo_descuento: 'porcentaje', descuento_porcentaje: 25, requiere_paes: true, paes_minimo: 600,
  vigencia_desde: '2020-01-01', vigencia_hasta: null
}

const FORM = {
  nombre: 'Prueba', apellido: 'Simulador', email: 'prueba@example.com', telefono: '12345678',
  nivelEducativo: 'Educación media completa', carrera: '', carreraId: 0,
  rendioPAES: false, planeaUsarCAE: false, usaBecasEstado: false, decil: null
}

const montados: VueWrapper[] = []
const txt = (w: VueWrapper) => w.text().replace(/\u00a0/g, ' ')

/** Monta el paso 2 con un «padre» mínimo que aplica los update:form-data como Simulador2View. */
const montar = async (inicial: Record<string, unknown> = {}) => {
  const pinia = createPinia()
  setActivePinia(pinia)
  const becas = useBecasStore()
  becas.becas = [beca] as any
  becas.becasEstado = [{ id: 1 }] as any
  useCarrerasStore().carreras = TABLAS.carreras_uniacc as any

  let datos: Record<string, any> = { ...FORM, ...inicial }
  const verResultados = vi.fn()
  let w!: VueWrapper
  const aplicar = (d: Record<string, any>) => {
    datos = { ...datos, ...d }
    w.setProps({ formData: datos })
  }
  w = mount(PasoCarreraPregrado, {
    props: { formData: datos, 'onUpdate:formData': aplicar, onVerResultados: verResultados } as any,
    global: { plugins: [pinia, [PrimeVue, {}]], stubs: { teleport: true, transition: false } },
    attachTo: document.body
  })
  montados.push(w)
  await flushPromises()
  return { w, getDatos: () => datos, verResultados }
}

const abrir = async (w: VueWrapper) => {
  await w.get('form').trigger('submit')
  await flushPromises()
}
const titulo = (w: VueWrapper) => w.get('[data-testid="modal-titulo"]').text()
const siguiente = async (w: VueWrapper) => { await w.get('[data-testid="modal-siguiente"]').trigger('click'); await flushPromises() }
const pulsarVer = async (w: VueWrapper) => { await w.get('[data-testid="modal-ver-resultados"]').trigger('click'); await flushPromises() }
const CONSULTA_DE: Record<number, string> = { 1: 'psico', 2: 'psico', 3: 'comer' }
const escribirEnModal = async (w: VueWrapper, q: string) => { await w.get('[data-testid="modal-busqueda-input"]').setValue(q); await flushPromises() }
/** En el modal: escribe en el autocompletado y elige la sugerencia de esa carrera (por id). */
const elegir = async (w: VueWrapper, id: number) => {
  await escribirEnModal(w, CONSULTA_DE[id])
  await w.get(`[data-carrera-id="${id}"]`).trigger('click')
  await flushPromises()
}
const radio = async (w: VueWrapper, grupo: string, valor: 'Sí' | 'No') => {
  const b = w.get(`[data-testid="${grupo}"]`).findAll('button').find((x) => x.text() === valor)!
  await b.trigger('click')
  await flushPromises()
}

describe('PasoCarreraPregrado · buscador + modal', () => {
  beforeEach(() => {
    escrituras.mockClear()
    registrarLead.mockClear()
    window.matchMedia = window.matchMedia || ((q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } as any))
  })
  afterEach(() => { montados.splice(0).forEach((m) => m.unmount()) })

  it('el paso 2 es un buscador: CTA «¿Qué carrera quieres simular?», input y botón Buscar', async () => {
    const { w } = await montar()
    expect(txt(w)).toContain('¿Qué carrera quieres simular?')
    expect(w.find('[data-testid="buscador-input"]').exists()).toBe(true)
    expect(w.get('[data-testid="buscador-boton"]').text()).toBe('Buscar')
    expect(w.find('[data-testid="modal-simulacion"]').exists()).toBe(false)
  })

  it('Buscar con texto abre el modal en «Paso 1 de 2 · Selección de carrera» con sugerencias que muestran jornada y semestres', async () => {
    const { w } = await montar()
    await w.get('[data-testid="buscador-input"]').setValue('psico')
    await abrir(w)
    expect(titulo(w)).toBe('Paso 1 de 2 · Selección de carrera')
    const lista = txt(w)
    expect(lista).toContain('Pregrado · Diurno · 10 semestres')
    expect(lista).toContain('Pregrado · Vespertino · 10 semestres')
    expect(lista).not.toContain('Pregrado · Online · 10 semestres')
    expect(w.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('1')
  })

  it('lo escrito en el buscador llega al modal como búsqueda (ignora tildes y mayúsculas)', async () => {
    const { w } = await montar()
    await w.get('[data-testid="buscador-input"]').setValue('PSICOLOGIA')
    await abrir(w)
    const ids = w.findAll('[data-testid="modal-simulacion"] [role="option"]').map((o) => o.attributes('data-carrera-id'))
    expect(ids).toEqual(['1', '2'])
    expect((w.get('[data-testid="modal-busqueda-input"]').element as HTMLInputElement).value).toBe('PSICOLOGIA')
  })

  it('elegir una sugerencia en el buscador del paso 2 deja la carrera y abre el modal directo en Financiamiento', async () => {
    const { w, getDatos, verResultados } = await montar()
    await w.get('[data-testid="buscador-input"]').setValue('comercial')
    await flushPromises()
    expect(w.find('[data-testid="modal-simulacion"]').exists()).toBe(false)
    expect(w.get('[role="option"]').text()).toContain('Ingeniería Comercial')
    await w.get('[data-carrera-id="3"]').trigger('click')
    await flushPromises()
    expect(getDatos()).toMatchObject({ carrera: 'Ingeniería Comercial', carreraId: 3, tipoPrograma: 'Regular' })
    expect(titulo(w)).toBe('Paso 2 de 2 · Financiamiento')
    expect(verResultados).not.toHaveBeenCalled()
    expect(registrarLead).not.toHaveBeenCalled()
    expect(escrituras).not.toHaveBeenCalled()
  })

  it('sin coincidencias muestra «No encontramos esa carrera» con el contacto de Admisión', async () => {
    const { w } = await montar()
    await w.get('[data-testid="buscador-input"]').setValue('astronomia')
    await flushPromises()
    const vacio = w.get('[data-testid="sin-resultados"]')
    expect(vacio.text()).toContain('No encontramos esa carrera')
    expect(vacio.text()).toContain('admision@uniacc.cl')
    expect(vacio.text()).toContain('+56 22 640 6100')
    expect(vacio.text()).toContain('+56 22 640 6151')
  })

  it('sub-step 1: sin carrera muestra el error y no avanza; con carrera avanza y Atrás vuelve', async () => {
    const { w } = await montar()
    await abrir(w)
    await siguiente(w)
    expect(w.get('[data-testid="error-carrera"]').text()).toBe('Selecciona una carrera para continuar.')
    expect(titulo(w)).toContain('Paso 1 de 2')
    await elegir(w, 1)
    expect(w.find('[data-testid="error-carrera"]').exists()).toBe(false)
    await siguiente(w)
    expect(titulo(w)).toBe('Paso 2 de 2 · Financiamiento')
    expect(w.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('2')
    await w.get('[data-testid="modal-atras"]').trigger('click')
    await flushPromises()
    expect(titulo(w)).toContain('Paso 1 de 2')
  })

  it('sub-step 2: muestra errores claros de PAES, puntajes, financiamiento, opciones y tramo', async () => {
    const { w } = await montar()
    await abrir(w)
    await elegir(w, 1)
    await siguiente(w)
    await pulsarVer(w)
    expect(w.get('[data-testid="error-paes"]').text()).toBe('Indica si rendiste la PAES.')
    expect(w.get('[data-testid="error-estado"]').text()).toBe('Indica si piensas usar financiamiento del Estado.')

    await radio(w, 'paes-toggle', 'Sí')
    await pulsarVer(w)
    expect(w.get('[data-testid="error-lenguaje"]').text()).toContain('Comprensión Lectora')
    expect(w.get('[data-testid="error-matematica"]').text()).toContain('Matemática 1')

    await w.get('#sf-lenguaje').setValue('100')
    await w.get('#sf-matematica').setValue('650')
    await radio(w, 'estado-toggle', 'Sí')
    await pulsarVer(w)
    expect(w.get('[data-testid="error-lenguaje"]').text()).toContain('entre 150 y 1000')
    expect(w.find('[data-testid="error-matematica"]').exists()).toBe(false)
    expect(w.get('[data-testid="error-opciones"]').text()).toBe('Selecciona al menos una opción: CAE o Becas ministeriales.')
    expect(w.get('[data-testid="error-decil"]').text()).toBe('Selecciona tu tramo de renta mensual.')
    expect(titulo(w)).toContain('Paso 2 de 2')
  })

  it('la nota de requisitos siempre está visible en el sub-step 2', async () => {
    const { w } = await montar()
    await abrir(w)
    await elegir(w, 1)
    await siguiente(w)
    expect(w.get('[data-testid="nota-requisitos"]').text()).toContain('requisitos académicos y socioeconómicos')
    await radio(w, 'estado-toggle', 'Sí')
    expect(w.get('[data-testid="nota-requisitos"]').text()).toContain('preselección y selección')
  })

  it('el modal tiene 2 pasos: barra de 2 segmentos y, en el paso 2, el botón final «Ver mis resultados» (sin paso de motor de becas)', async () => {
    const { w } = await montar()
    await abrir(w)
    expect(w.findAll('.msc-barra')).toHaveLength(2)
    expect(w.get('[role="progressbar"]').attributes('aria-valuemax')).toBe('2')
    expect(w.find('[data-testid="modal-ver-resultados"]').exists()).toBe(false)
    await elegir(w, 1)
    await siguiente(w)
    expect(titulo(w)).toBe('Paso 2 de 2 · Financiamiento')
    expect(w.find('[data-testid="modal-siguiente"]').exists()).toBe(false)
    expect(w.get('[data-testid="modal-ver-resultados"]').text()).toBe('Ver mis resultados')
    expect(w.find('[data-testid="subpaso-motor"]').exists()).toBe(false)
  })

  it('recorrido completo caso A: «Ver mis resultados» en el paso 2 cierra y avisa al padre (sin lead ni escrituras)', async () => {
    const { w, getDatos, verResultados } = await montar()
    await abrir(w)
    await elegir(w, 1)
    await siguiente(w)
    await radio(w, 'paes-toggle', 'Sí')
    await w.get('#sf-lenguaje').setValue('700')
    await w.get('#sf-matematica').setValue('650')
    await radio(w, 'estado-toggle', 'Sí')
    const checks = w.findAll('input[type="checkbox"]')
    await checks[0].setValue(true) // CAE
    await checks[1].setValue(true) // Becas ministeriales
    w.findComponent({ name: 'Dropdown' }).vm.$emit('update:modelValue', 3)
    await flushPromises()

    await w.get('[data-testid="modal-ver-resultados"]').trigger('click')
    await flushPromises()
    expect(verResultados).toHaveBeenCalledTimes(1)
    const d = getDatos()
    expect(d).toMatchObject({
      carrera: 'Psicología', carreraId: 1, rendioPAES: true, paesRespondido: true,
      usaFinanciamientoEstado: true, planeaUsarCAE: true, usaBecasEstado: true, decil: 3
    })
    expect(d.paes).toMatchObject({ lenguaje: 700, matematica: 650 })
    expect(registrarLead).not.toHaveBeenCalled()
    expect(escrituras).not.toHaveBeenCalled()
  })

  it('«Ver mis resultados» con el paso 2 incompleto muestra los errores y no avisa al padre', async () => {
    const { w, verResultados } = await montar()
    await abrir(w)
    await elegir(w, 1)
    await siguiente(w)
    await w.get('[data-testid="modal-ver-resultados"]').trigger('click')
    await flushPromises()
    expect(verResultados).not.toHaveBeenCalled()
    expect(w.get('[data-testid="error-paes"]').text()).toBe('Indica si rendiste la PAES.')
    expect(titulo(w)).toBe('Paso 2 de 2 · Financiamiento')
  })

  it('caso B: PAES «No» y sin financiamiento del Estado entrega paes en falso y avisa al padre', async () => {
    const { w, getDatos, verResultados } = await montar()
    await abrir(w)
    await elegir(w, 3)
    await siguiente(w)
    await radio(w, 'paes-toggle', 'No')
    await radio(w, 'estado-toggle', 'No')
    await w.get('[data-testid="modal-ver-resultados"]').trigger('click')
    await flushPromises()
    expect(verResultados).toHaveBeenCalledTimes(1)
    expect(getDatos()).toMatchObject({ carreraId: 3, rendioPAES: false, paesRespondido: true, usaFinanciamientoEstado: false })
    expect(escrituras).not.toHaveBeenCalled()
  })

  it('tras cerrar el modal, el paso 2 muestra la carrera elegida y las respuestas con opción de editar', async () => {
    const { w, getDatos } = await montar()
    await abrir(w)
    await elegir(w, 1)
    await siguiente(w)
    await radio(w, 'paes-toggle', 'No')
    await radio(w, 'estado-toggle', 'No')
    await w.get('[data-testid="modal-ver-resultados"]').trigger('click')
    await flushPromises()
    expect(getDatos().carreraId).toBe(1)

    expect(w.find('[data-testid="buscador-input"]').exists()).toBe(false)
    const elegida = txt(w.get('[data-testid="carrera-elegida"]') as any)
    expect(elegida).toContain('Psicología')
    expect(elegida).toContain('Pregrado · Diurno · 10 semestres')
    expect(w.get('[data-testid="resp-paes"]').text()).toBe('No')
    expect(w.get('[data-testid="resp-estado"]').text()).toBe('No')
    expect((w.vm as any).isFormValid).toBe(true)
    expect((w.vm as any).getMissingFields()).toEqual([])

    // Editar reabre el modal directo en Financiamiento, conservando lo respondido
    await w.get('[data-testid="editar-respuestas"]').trigger('click')
    await flushPromises()
    expect(titulo(w)).toBe('Paso 2 de 2 · Financiamiento')
    const noPaes = w.get('[data-testid="paes-toggle"]').findAll('button').find((b) => b.text() === 'No')!
    expect(noPaes.attributes('aria-checked')).toBe('true')
  })

  it('cerrar el modal a medias conserva lo hecho y deja el paso incompleto (mismo aviso de campos faltantes)', async () => {
    const { w, getDatos } = await montar()
    await abrir(w)
    await elegir(w, 1)
    await siguiente(w)
    await radio(w, 'paes-toggle', 'No')
    // cierra con ✕ (Dialog) a la mitad del sub-step 2
    w.findComponent({ name: 'Dialog' }).vm.$emit('update:visible', false)
    await flushPromises()
    w.findComponent({ name: 'Dialog' }).vm.$emit('hide')
    await flushPromises()
    expect(getDatos().carreraId).toBe(1)
    expect(getDatos().paesRespondido).toBe(true)
    expect((w.vm as any).isFormValid).toBe(false)
    expect((w.vm as any).getMissingFields()).toEqual(['¿Piensas usar financiamiento del Estado?'])
    ;(w.vm as any).markAsSubmitted()
    await flushPromises()
    expect(w.get('[data-testid="error-respuestas"]').text()).toContain('Completa tus respuestas')
  })

  it('sin carrera, al intentar avanzar se marca el error bajo el buscador', async () => {
    const { w } = await montar()
    expect((w.vm as any).getMissingFields()).toContain('Carrera')
    ;(w.vm as any).markAsSubmitted()
    await flushPromises()
    expect(w.get('[data-testid="error-carrera-paso"]').text()).toBe('Selecciona una carrera para continuar.')
  })

  it('extranjero fuera del país: el autocompletado solo ofrece carreras Online y avisa por qué', async () => {
    const { w } = await montar({ extranjero: true, residencia_chilena: false })
    await abrir(w)
    await escribirEnModal(w, 'comer')
    expect(w.findAll('[role="option"]').map((o) => o.attributes('data-carrera-id'))).toEqual(['3'])
    await escribirEnModal(w, 'psico')
    expect(w.findAll('[role="option"]').filter((o) => o.isVisible())).toHaveLength(0)
    expect(w.find('[data-testid="sin-resultados"]').exists()).toBe(true)
    expect(txt(w)).toContain('solo puedes acceder a carreras en modalidad online')
  })

  it('quien no es egresado no responde PAES ni financiamiento y puede continuar', async () => {
    const { w, verResultados } = await montar({ nivelEducativo: 'Educación media incompleta' })
    await abrir(w)
    await elegir(w, 1)
    await siguiente(w)
    expect(w.find('[data-testid="financiamiento-no-aplica"]').exists()).toBe(true)
    expect(titulo(w)).toBe('Paso 2 de 2 · Financiamiento')
    await w.get('[data-testid="modal-ver-resultados"]').trigger('click')
    await flushPromises()
    expect(verResultados).toHaveBeenCalledTimes(1)
  })

  it('accesibilidad: el diálogo es modal, tiene nombre y el cierre es un botón con etiqueta', async () => {
    const { w } = await montar()
    await abrir(w)
    const dlg = w.get('[role="dialog"]')
    expect(dlg.attributes('aria-modal')).toBe('true')
    expect(dlg.attributes('aria-labelledby')).toBe('msc-titulo')
    expect(w.get('.p-dialog-close-button').attributes('aria-label')).toBe('Cerrar')
  })
})
