import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import BotonContactarAsesor from '../BotonContactarAsesor.vue'
import { urlWhatsAppAsesor } from '@/utils/resumenPregrado'

// Results.vue y ResumenPregrado.vue usan este mismo componente.
describe('BotonContactarAsesor', () => {
  afterEach(() => { delete (window as any).dataLayer })

  it('arma el enlace a WhatsApp con carrera y total, en pestaña nueva', () => {
    const w = mount(BotonContactarAsesor, { props: { carrera: 'Diseño & Comunicación', total: '$1.234.567' } })
    const href = w.get('a').attributes('href')!
    expect(href.startsWith('https://wa.me/56942284987?text=')).toBe(true)
    const texto = decodeURIComponent(href.split('?text=')[1])
    expect(texto).toContain('Diseño & Comunicación')
    expect(texto).toContain('$1.234.567')
    expect(w.get('a').attributes('target')).toBe('_blank')
    expect(w.get('a').attributes('rel')).toContain('noopener')
    expect(w.text()).toContain('Contactar asesor')
  })

  it('al hacer clic envía contactar_asesor al dataLayer', async () => {
    ;(window as any).dataLayer = []
    const w = mount(BotonContactarAsesor, { props: { carrera: 'X', total: '$1', segmentacion: 'diplomados' } })
    await w.get('a').trigger('click')
    const ev = (window as any).dataLayer.find((e: any) => e.event === 'contactar_asesor')
    expect(ev).toBeTruthy()
    expect(ev.segmentacion).toBe('diplomados')
  })

  it('urlWhatsAppAsesor codifica el mensaje', () => {
    expect(urlWhatsAppAsesor('A b', '$2')).toContain(encodeURIComponent('A b'))
  })
})
