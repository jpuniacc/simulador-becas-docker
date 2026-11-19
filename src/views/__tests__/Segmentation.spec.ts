import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import Segmentation from '../Segmentation.vue'

const montar = async () => {
  const Vacia = { template: '<div />' }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: Vacia },
      { path: '/elige-tu-camino', component: Segmentation },
      { path: '/simulador', component: Vacia },
      { path: '/postgrados', component: Vacia },
      { path: '/advance', component: Vacia },
      { path: '/diplomados', component: Vacia }
    ]
  })
  router.push('/elige-tu-camino')
  await router.isReady()
  const wrapper = mount(Segmentation, { global: { plugins: [router] } })
  return { wrapper, router }
}

describe('Elige tu camino', () => {
  it('muestra título, Pregrado con botón y Postgrado «Próximamente»', async () => {
    const { wrapper } = await montar()
    expect(wrapper.text()).toContain('Elige tu camino')
    expect(wrapper.text()).toContain('Simular pregrado')
    expect(wrapper.get('[data-testid="card-postgrado"]').text()).toContain('Próximamente')
  })

  it('Pregrado navega a /simulador', async () => {
    const { wrapper, router } = await montar()
    await wrapper.get('[data-testid="card-pregrado"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/simulador')
  })

  it('Postgrado no es clicable: no navega y queda marcado como deshabilitado', async () => {
    const { wrapper, router } = await montar()
    const card = wrapper.get('[data-testid="card-postgrado"]')
    expect(card.attributes('aria-disabled')).toBe('true')
    await card.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/elige-tu-camino')
  })

  it('tiene forma de volver al inicio', async () => {
    const { wrapper, router } = await montar()
    await wrapper.get('[data-testid="volver"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
  })
})
