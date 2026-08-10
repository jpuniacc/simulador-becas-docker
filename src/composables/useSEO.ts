import { watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

/**
 * Configuración de SEO para una ruta
 */
export interface SEOConfig {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  canonical?: string
  robots?: string
  keywords?: string[]
}

/**
 * URL base del sitio (se debe configurar según el ambiente)
 */
const getBaseURL = (): string => {
  if (typeof window === 'undefined') {
    return 'https://simulador.uniacc.cl'
  }
  return `${window.location.protocol}//${window.location.host}`
}

/**
 * Actualiza o crea un meta tag en el head
 */
const updateMetaTag = (property: string, content: string, isProperty: boolean = false): void => {
  if (typeof document === 'undefined') return

  const attribute = isProperty ? 'property' : 'name'
  let meta = document.querySelector(`meta[${attribute}="${property}"]`)

  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, property)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

/**
 * Actualiza el título de la página
 */
const updateTitle = (title: string): void => {
  if (typeof document === 'undefined') return
  document.title = title
}

/**
 * Actualiza o crea el link canonical
 */
const updateCanonical = (url: string): void => {
  if (typeof document === 'undefined') return

  let canonical = document.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }
  canonical.setAttribute('href', url)
}

/**
 * Actualiza todos los meta tags SEO
 */
export const updateSEO = (config: SEOConfig): void => {
  if (typeof document === 'undefined') return

  const baseURL = getBaseURL()
  // Obtener path desde window.location si no se proporciona URL
  const path = typeof window !== 'undefined' ? window.location.pathname : '/'
  const fullURL = config.url || `${baseURL}${path}`

  // Title
  if (config.title) {
    const fullTitle = config.title.includes('UNIACC') ? config.title : `${config.title} - UNIACC`
    updateTitle(fullTitle)
    updateMetaTag('og:title', fullTitle, true)
    updateMetaTag('twitter:title', fullTitle)
  }

  // Description
  if (config.description) {
    updateMetaTag('description', config.description)
    updateMetaTag('og:description', config.description, true)
    updateMetaTag('twitter:description', config.description)
  }

  // Image
  const imageURL = config.image || `${baseURL}/og-image.jpg`
  updateMetaTag('og:image', imageURL, true)
  updateMetaTag('twitter:image', imageURL)

  // URL
  updateMetaTag('og:url', fullURL, true)
  updateMetaTag('twitter:url', fullURL)

  // Type
  if (config.type) {
    updateMetaTag('og:type', config.type, true)
  }

  // Canonical
  const canonicalURL = config.canonical || fullURL
  updateCanonical(canonicalURL)

  // Robots
  if (config.robots) {
    updateMetaTag('robots', config.robots)
  }

  // Keywords (si se proporcionan)
  if (config.keywords && config.keywords.length > 0) {
    updateMetaTag('keywords', config.keywords.join(', '))
  }
}

/**
 * Composable para gestión de SEO
 */
export function useSEO() {
  const route = useRoute()

  /**
   * Aplica configuración SEO a la ruta actual
   */
  const applySEO = (config: SEOConfig): void => {
    nextTick(() => {
      updateSEO(config)
    })
  }

  /**
   * Aplica SEO desde meta de la ruta
   */
  const applySEOFromRoute = (): void => {
    const meta = route.meta as Record<string, unknown>

    if (!meta) return

    const config: SEOConfig = {
      title: meta.title as string,
      description: meta.description as string,
      image: meta.image as string,
      type: meta.type as string || 'website',
      canonical: meta.canonical as string,
      robots: meta.robots as string,
      keywords: meta.keywords as string[]
    }

    applySEO(config)
  }

  /**
   * Inicializa el watcher para actualizar SEO en cambios de ruta
   */
  const initialize = (): void => {
    // Aplicar SEO inicial
    applySEOFromRoute()

    // Watch cambios de ruta
    watch(
      () => route.path,
      () => {
        applySEOFromRoute()
      }
    )
  }

  return {
    applySEO,
    applySEOFromRoute,
    updateSEO,
    initialize
  }
}

