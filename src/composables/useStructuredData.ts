import { computed } from 'vue'
import { useRoute } from 'vue-router'

/**
 * URL base del sitio
 */
const getBaseURL = (): string => {
  if (typeof window === 'undefined') {
    return 'https://simulador.uniacc.cl'
  }
  return `${window.location.protocol}//${window.location.host}`
}

/**
 * Schema.org Organization (UNIACC)
 */
export interface OrganizationSchema {
  '@context': string
  '@type': string
  name: string
  url: string
  logo?: string
  description?: string
  contactPoint?: {
    '@type': string
    telephone?: string
    contactType?: string
    email?: string
  }
  sameAs?: string[]
}

/**
 * Schema.org WebApplication (Simulador)
 */
export interface WebApplicationSchema {
  '@context': string
  '@type': string
  name: string
  url: string
  description: string
  applicationCategory: string
  operatingSystem: string
  offers: {
    '@type': string
    price: string
    priceCurrency: string
  }
}

/**
 * Schema.org BreadcrumbList
 */
export interface BreadcrumbSchema {
  '@context': string
  '@type': string
  itemListElement: Array<{
    '@type': string
    position: number
    name: string
    item: string
  }>
}

/**
 * Inyecta JSON-LD en el head
 */
export const injectJSONLD = (json: object, id: string): void => {
  if (typeof document === 'undefined') return

  // Remover script anterior si existe
  const existing = document.getElementById(id)
  if (existing) {
    existing.remove()
  }

  // Crear nuevo script
  const script = document.createElement('script')
  script.id = id
  script.type = 'application/ld+json'
  script.textContent = JSON.stringify(json)
  document.head.appendChild(script)
}

/**
 * Genera schema de Organization para UNIACC
 */
export const generateOrganizationSchema = (): OrganizationSchema => {
  const baseURL = getBaseURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'UNIACC',
    url: 'https://www.uniacc.cl',
    logo: `${baseURL}/logo-uniacc.png`,
    description: 'Universidad UNIACC - Formamos profesionales creativos e innovadores',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Admisión',
      telephone: '+56-2-2206-3000',
      email: 'admision@uniacc.cl'
    },
    sameAs: [
      'https://www.facebook.com/UNIACC',
      'https://www.instagram.com/uniacc_cl',
      'https://www.linkedin.com/school/uniacc',
      'https://twitter.com/UNIACC'
    ]
  }
}

/**
 * Genera schema de WebApplication para el Simulador
 */
export const generateWebApplicationSchema = (): WebApplicationSchema => {
  const baseURL = getBaseURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Simulador de Becas UNIACC',
    url: baseURL,
    description: 'Simulador gratuito para calcular becas disponibles en UNIACC',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CLP'
    }
  }
}

/**
 * Genera schema de BreadcrumbList
 */
export const generateBreadcrumbSchema = (items: Array<{ name: string; path: string }>): BreadcrumbSchema => {
  const baseURL = getBaseURL()

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${baseURL}${item.path}`
    }))
  }
}

/**
 * Genera breadcrumbs basados en la ruta actual
 */
export function generateBreadcrumbsFromRoute(routePath: string): Array<{ name: string; path: string }> {
  const breadcrumbs: Array<{ name: string; path: string }> = [
    { name: 'Inicio', path: '/' }
  ]

  const pathSegments = routePath.split('/').filter(Boolean)

  pathSegments.forEach((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/')
    const name = segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
    breadcrumbs.push({ name, path })
  })

  return breadcrumbs
}

/**
 * Composable para gestión de Structured Data
 */
export function useStructuredData() {
  const route = useRoute()

  /**
   * Inyecta todos los schemas en el head
   */
  const injectAllSchemas = (): void => {
    // Organization schema (siempre presente)
    const orgSchema = generateOrganizationSchema()
    injectJSONLD(orgSchema, 'schema-organization')

    // WebApplication schema (siempre presente)
    const appSchema = generateWebApplicationSchema()
    injectJSONLD(appSchema, 'schema-webapplication')

    // Breadcrumb schema (basado en la ruta actual)
    const breadcrumbs = generateBreadcrumbsFromRoute(route.path)
    if (breadcrumbs.length > 1) {
      const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs)
      injectJSONLD(breadcrumbSchema, 'schema-breadcrumb')
    }
  }

  /**
   * Inyecta un schema personalizado
   */
  const injectCustomSchema = (json: object, id: string): void => {
    injectJSONLD(json, id)
  }

  /**
   * Limpia todos los schemas
   */
  const clearAllSchemas = (): void => {
    if (typeof document === 'undefined') return

    const schemas = document.querySelectorAll('script[type="application/ld+json"]')
    schemas.forEach(script => {
      const id = script.id
      if (id && id.startsWith('schema-')) {
        script.remove()
      }
    })
  }

  return {
    injectAllSchemas,
    injectCustomSchema,
    clearAllSchemas,
    generateOrganizationSchema,
    generateWebApplicationSchema,
    generateBreadcrumbSchema,
    generateBreadcrumbsFromRoute
  }
}

