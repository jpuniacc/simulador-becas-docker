import { describe, it, expect, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import CarreraAutocompletar from '../CarreraAutocompletar.vue'

const c = (id: number, nombre: string, modalidad: string) => ({
  id, nombre_programa: nombre, modalidad_programa: modalidad, nivel_academico: 'Pregrado', duracion_programa: '10 semestres'
})
const CARRERAS = [
  c(1, 'Psicología', 'Diurno'),
  c(2, 'Psicología', 'Vespertino'),
  c(3, 'Ingeniería Comercial', 'Online'),
  c(4, 'Administración Comercial', 'Diurno'),
  ...Array.from({ length: 10 }, (_, i) => c(100 + i, `Pedagogía en ${i}`, 'Diurno'))
]

const montados: VueWrapper[] = []
const montar = (props: Record<string, unknown> = {}) => {
  const w = mount(CarreraAutocompletar, {
    props: {
      modelValue: '',
      carreras: CARRERAS,
      'onUpdate:modelValue': (v: string) => w.setProps({ modelValue: v }),
      ...props
    } as any,
    attachTo: document.body
  })
  montados.push(w)
  return w
}
const input = (w: VueWrapper) => w.get('input[role="combobox"]')
const escribir = async (w: VueWrapper, q: string) => { await input(w).setValue(q); await flushPromises() }
const tecla = async (w: VueWrapper, key: string) => { await input(w).trigger('keydown', { key }); await flushPromises() }
const opciones = (w: VueWrapper) => w.findAll('[role="option"]')

describe('CarreraAutocompletar', () => {
  afterEach(() => { montados.splice(0).forEach((m) => m.unmount()) })

  it('con el campo vacío no muestra sugerencias y declara el patrón combobox', () => {
    const w = montar()
    expect(input(w).attributes('aria-autocomplete')).toBe('list')
    expect(input(w).attributes('aria-expanded')).toBe('false')
    expect(input(w).attributes('aria-controls')).toBe(w.get('[role="listbox"]').attributes('id'))
    expect(w.get('[role="listbox"]').isVisible()).toBe(false)
  })

  it('se filtra con cada letra, sin tildes ni mayúsculas, y marca en negrita lo que coincide', async () => {
    const w = montar()
    await escribir(w, 'p')
    expect(opciones(w).length).toBeGreaterThan(2)
    await escribir(w, 'PSICOLOGIA')
    expect(opciones(w).map((o) => o.attributes('data-carrera-id'))).toEqual(['1', '2'])
    expect(opciones(w)[0].get('strong').text()).toBe('Psicología')
    await escribir(w, 'comer')
    expect(opciones(w).map((o) => o.attributes('data-carrera-id'))).toEqual(['4', '3'])
    expect(opciones(w)[1].get('strong').text()).toBe('Comer')
    expect(opciones(w)[1].text()).toContain('Ingeniería Comercial')
    expect(input(w).attributes('aria-expanded')).toBe('true')
  })

  it('cada sugerencia muestra su jornada y duración', async () => {
    const w = montar()
    await escribir(w, 'psico')
    expect(opciones(w)[0].text()).toContain('Pregrado · Diurno · 10 semestres')
    expect(opciones(w)[1].text()).toContain('Pregrado · Vespertino · 10 semestres')
  })

  it('flechas ↑↓ recorren (con vuelta), aria-activedescendant sigue la opción y el foco queda en el campo', async () => {
    const w = montar()
    input(w).element.focus()
    await escribir(w, 'psico')
    expect(input(w).attributes('aria-activedescendant')).toBeUndefined()
    await tecla(w, 'ArrowDown')
    expect(input(w).attributes('aria-activedescendant')).toBe(opciones(w)[0].attributes('id'))
    expect(opciones(w)[0].attributes('aria-selected')).toBe('true')
    await tecla(w, 'ArrowDown')
    expect(input(w).attributes('aria-activedescendant')).toBe(opciones(w)[1].attributes('id'))
    await tecla(w, 'ArrowDown')
    expect(input(w).attributes('aria-activedescendant')).toBe(opciones(w)[0].attributes('id'))
    await tecla(w, 'ArrowUp')
    expect(input(w).attributes('aria-activedescendant')).toBe(opciones(w)[1].attributes('id'))
    expect(document.activeElement).toBe(input(w).element)
  })

  it('Enter elige la opción resaltada y cierra la lista', async () => {
    const w = montar()
    await escribir(w, 'psico')
    await tecla(w, 'ArrowDown')
    await tecla(w, 'ArrowDown')
    await tecla(w, 'Enter')
    expect(w.emitted('seleccionar')![0][0]).toMatchObject({ id: 2, modalidad_programa: 'Vespertino' })
    expect((input(w).element as HTMLInputElement).value).toBe('Psicología')
    expect(input(w).attributes('aria-expanded')).toBe('false')
  })

  it('Enter con una sola sugerencia la elige; con varias y ninguna resaltada no elige (deja el envío normal del formulario)', async () => {
    const w = montar()
    await escribir(w, 'ingenieria')
    await tecla(w, 'Enter')
    expect(w.emitted('seleccionar')![0][0]).toMatchObject({ id: 3 })
    const w2 = montar()
    await escribir(w2, 'psico')
    await tecla(w2, 'Enter')
    expect(w2.emitted('seleccionar')).toBeUndefined()
  })

  it('Esc cierra la lista y no se propaga (no cierra el modal que la contiene); sin lista, Esc sigue su camino', async () => {
    const w = montar()
    const alDocumento = vi.fn()
    document.addEventListener('keydown', alDocumento)
    await escribir(w, 'psico')
    await tecla(w, 'Escape')
    expect(input(w).attributes('aria-expanded')).toBe('false')
    expect(alDocumento).not.toHaveBeenCalled()
    expect((input(w).element as HTMLInputElement).value).toBe('psico')
    await tecla(w, 'Escape')
    expect(alDocumento).toHaveBeenCalledTimes(1)
    document.removeEventListener('keydown', alDocumento)
  })

  it('escribir de nuevo reabre la lista tras Esc', async () => {
    const w = montar()
    await escribir(w, 'psico')
    await tecla(w, 'Escape')
    await escribir(w, 'psic')
    expect(input(w).attributes('aria-expanded')).toBe('true')
  })

  it('clic o toque en una sugerencia la elige', async () => {
    const w = montar()
    await escribir(w, 'comercial')
    await opciones(w)[0].trigger('click')
    expect(w.emitted('seleccionar')![0][0]).toMatchObject({ id: 4 })
  })

  it('muestra como máximo 8 sugerencias e indica cuántas hay', async () => {
    const w = montar()
    await escribir(w, 'pedagogia')
    expect(opciones(w)).toHaveLength(8)
    expect(w.get('[data-testid="mas-resultados"]').text()).toContain('Mostrando 8 de 10')
  })

  it('sin resultados: «No encontramos esa carrera» con correo y teléfonos de Admisión', async () => {
    const w = montar()
    await escribir(w, 'astronomia')
    const vacio = w.get('[data-testid="sin-resultados"]')
    expect(vacio.text()).toContain('No encontramos esa carrera')
    expect(vacio.get('a[href="mailto:admision@uniacc.cl"]').exists()).toBe(true)
    expect(vacio.findAll('a[href^="tel:"]').map((a) => a.text())).toEqual(['+56 22 640 6100', '+56 22 640 6151'])
    expect(w.get('[role="listbox"]').isVisible()).toBe(false)
    expect(input(w).attributes('aria-expanded')).toBe('false')
  })

  it('solo Online (extranjero fuera del país): ofrece únicamente carreras online', async () => {
    const w = montar({ soloOnline: true })
    await escribir(w, 'comercial')
    expect(opciones(w).map((o) => o.attributes('data-carrera-id'))).toEqual(['3'])
  })

  it('la carrera elegida se marca en la lista', async () => {
    const w = montar({ carreraId: 2 })
    await escribir(w, 'psico')
    expect(opciones(w)[1].classes()).toContain('ca-opcion-elegida')
  })

  it('el botón «Borrar búsqueda» limpia el campo', async () => {
    const w = montar()
    await escribir(w, 'psico')
    await w.get('[data-testid="buscador-borrar"]').trigger('click')
    expect((input(w).element as HTMLInputElement).value).toBe('')
    expect(w.get('[role="listbox"]').isVisible()).toBe(false)
  })
})
