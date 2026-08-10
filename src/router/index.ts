import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import { updateSEO } from '../composables/useSEO'
import { useCampaignTracking } from '../composables/useCampaignTracking'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        title: 'Inicio - Simulador de Becas UNIACC',
        description: 'Descubre qué beneficios y becas puedes obtener en UNIACC con nuestro simulador gratuito. Calcula tu arancel con descuentos en solo minutos.',
        keywords: ['simulador becas', 'UNIACC', 'becas universitarias', 'descuentos', 'arancel'],
        type: 'website'
      }
    },
    {
      path: '/elige-tu-camino',
      name: 'elige-tu-camino',
      component: () => import('../views/Segmentation.vue'),
      meta: {
        title: 'Elige tu camino - UNIACC',
        description: 'Elige tu camino hacia la universidad en UNIACC'
      }
    },
    {
      path: '/elige-tu-camino',
      name: 'elige-tu-camino',
      component: () => import('../views/Segmentation.vue'),
      meta: {
        title: 'Elige tu camino - UNIACC',
        description: 'Elige tu camino hacia la universidad en UNIACC'
      }
    },
    {
      path: '/advance',
      name: 'advance',
      component: () => import('../views/PostgradoView.vue'),
      meta: {
        title: 'Postgrado - UNIACC',
        description: 'Postgrado en UNIACC'
      }
    },
    {
      path: '/diplomados',
      name: 'diplomados',
      component: () => import('../views/DiplomadosView.vue'),
      meta: {
        title: 'Cursos y Diplomados - UNIACC',
        description: 'Cursos y Diplomados en UNIACC'
      }
    },
    {
      path: '/postgrados',
      name: 'postgrados',
      component: () => import('../views/MagisterView.vue'),
      meta: {
        title: 'Postgrado - UNIACC',
        description: 'Postgrado en UNIACC'
      }
    },
    {
      path: '/simulador',
      name: 'simulador',
      component: () => import('../views/Simulador2View.vue'),
      meta: {
        title: 'Simulador de Becas - UNIACC',
        description: 'Simula tus beneficios y becas disponibles en UNIACC en solo 5 minutos. Calcula tu arancel con descuentos y beneficios especiales.',
        keywords: ['simulador becas', 'calcular arancel', 'becas UNIACC', 'beneficios estudiantiles'],
        type: 'website'
      }
    },
    {
      path: '/simulador2',
      name: 'simulador2',
      component: () => import('../views/SimuladorView.vue'),
      meta: {
        title: 'Simulador de Becas - UNIACC',
        description: 'Simula tus beneficios y becas disponibles en UNIACC en solo 5 minutos'
      }
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
      meta: {
        title: 'Sobre UNIACC - Simulador de Becas',
        description: 'Conoce más sobre UNIACC y nuestro simulador de becas y beneficios'
      }
    },
    {
      path: '/test-carreras',
      name: 'test-carreras',
      component: () => import('../components/TestCarreras.vue'),
      meta: {
        title: 'Prueba de Carreras - UNIACC',
        description: 'Página de prueba para verificar el funcionamiento del dropdown de carreras'
      }
    },
    {
      path: '/test-deciles',
      name: 'test-deciles',
      component: () => import('../components/TestDeciles.vue'),
      meta: {
        title: 'Prueba de Deciles - UNIACC',
        description: 'Página de prueba para verificar el funcionamiento del dropdown de deciles'
      }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'),
      meta: {
        title: 'Página no encontrada - UNIACC',
        description: 'La página que buscas no existe. Regresa al inicio o usa nuestro simulador de becas'
      }
    }
  ],
  scrollBehavior(to, from, savedPosition) {
    // Comportamiento de scroll personalizado
    if (savedPosition) {
      return savedPosition
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    } else {
      return { top: 0, behavior: 'smooth' }
    }
  }
})

// Guard de navegación para actualizar SEO
router.beforeEach((to, from, next) => {
  // Actualizar SEO desde meta de la ruta
  const meta = to.meta as Record<string, any>
  if (meta) {
    updateSEO({
      title: meta.title as string,
      description: meta.description as string,
      image: meta.image as string,
      type: meta.type as string || 'website',
      canonical: meta.canonical as string,
      robots: meta.robots as string,
      keywords: meta.keywords as string[]
    })
  }

  next()
})

// Guard de navegación para analytics y tracking
router.afterEach((to, from) => {
  // Inicializar/actualizar tracking de campañas en cada navegación
  // Esto asegura que si hay parámetros nuevos en la URL, se capturen
  // o que se carguen datos desde localStorage si no hay parámetros nuevos
  const { initialize: initializeCampaignTracking } = useCampaignTracking()
  const campaignData = initializeCampaignTracking()

  // Actualizar datos de campaña en el store en el próximo tick
  // para asegurar que el componente ya esté montado
  import('vue').then(({ nextTick }) => {
    nextTick(() => {
      // Importar el store dinámicamente para evitar circular dependencies
      import('../stores/simuladorStore').then(({ useSimuladorStore }) => {
        try {
          const store = useSimuladorStore()
          if (store && typeof store.initializeCampaignData === 'function') {
            store.initializeCampaignData()
          }
        } catch (e) {
          // Ignorar si el store no está disponible aún
          if (import.meta.env.DEV) {
            console.debug('Store no disponible aún para actualizar campaign data')
          }
        }
      }).catch(() => {
        // Ignorar errores de importación
      })
    })
  })

  // Trackear navegación en GTM (si dataLayer está disponible)
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    ;(window as any).dataLayer.push({
      event: 'page_view',
      page_path: to.path,
      page_url: window.location.href,
      page_title: to.meta.title as string,
      campaign_data: campaignData
    })
  }

  // Log para debugging (remover en producción si es necesario)
  if (import.meta.env.DEV) {
    console.log(`Navegación: ${from.path} → ${to.path}`)
  }
})

export default router
