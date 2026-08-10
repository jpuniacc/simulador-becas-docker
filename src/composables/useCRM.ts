import { ref } from 'vue'
import axios from 'axios'
import type { FormData } from '@/types/simulador'
import type { Carrera } from '@/stores/carrerasStore'
import { logger } from '@/utils/logger'

// JPS: Función para obtener la URL real del CRM (no la del proxy)
// Modificación: Retornar la URL real del CRM según el ambiente, no la URL del proxy
// Funcionamiento: Determina la URL real del CRM que se usará, independientemente de si se usa proxy o no
// Esta URL es la que se guarda en la base de datos para tracking
const getCRMUrlReal = () => {
  // Obtener URL del CRM desde variable de entorno
  const crmUrlFromEnv = import.meta.env.VITE_CRM_URL

  if (typeof window === 'undefined') {
    // SSR: usar URL de QA por defecto
    return crmUrlFromEnv || 'http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php'
  }

  const hostname = window.location.hostname
  const isMain = hostname === 'simulador.uniacc.cl'

  // MAIN (producción): URL de producción
  if (isMain) {
    return crmUrlFromEnv || 'https://crmadmision.uniacc.cl/webservice/formulario_web.php'
  }

  // QA/DEV: URL de QA
  return crmUrlFromEnv || 'http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php'
}

// URL del CRM según ambiente:
// - localhost: proxy Vite (/crm/...)
// - resto (Docker/Traefik/prod): proxy nginx /api/crm-proxy
const getCRMUrl = () => {
  if (typeof window === 'undefined') {
    return '/api/crm-proxy'
  }

  const hostname = window.location.hostname
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

  if (isLocalhost) {
    return '/crm/webservice/formulario_web.php'
  }

  return '/api/crm-proxy'
}

interface JSONCRM {
  nombre: string
  primerApellido: string
  segundoApellido: string
  email: string
  rut: string
  telefono: string
  carrera: string
  origen: number
  User_Agent: string
  // Parámetros de campaña (opcionales, depende de si el backend del CRM los acepta)
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  campaign_id?: string
  gclid?: string
  fbclid?: string
}

export function useCRM() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  const enviarCRM = async (formData: FormData, carreraInfo?: Carrera | null, userAgent?: string): Promise<any> => {
    // Verificar consentimiento de contacto
    if (!formData.consentimiento_contacto) {
      logger.crm('Envío al CRM omitido: consentimiento_contacto es false')
      return { skipped: true, reason: 'No hay consentimiento de contacto' }
    }

    loading.value = true
    error.value = null

    // JPS: Obtener la URL del CRM según el ambiente actual en tiempo de ejecución
    // Modificación: La URL se determina dinámicamente en cada petición, no al cargar el módulo
    // Funcionamiento: Esto permite que la misma build funcione en diferentes ambientes (localhost, QA/DEV, producción)
    // sin necesidad de recompilar, detectando automáticamente el dominio desde donde se ejecuta la aplicación
    const crmUrl = getCRMUrl()

    try {
      // Construir el JSON usando createJSONcrm
      const data = createJSONcrm(formData, carreraInfo, userAgent)

      // JPS: Logging seguro con ofuscación de datos sensibles
      // Modificación: Usar logger.crm() que ofusca automáticamente RUT, email, teléfono y URLs de endpoints
      // Funcionamiento: El logger detecta campos sensibles y los reemplaza con asteriscos manteniendo formato parcial
      logger.crm('Enviando datos al CRM', { crmUrl, data })

      // JPS: Log adicional para debugging - mostrar URL real que se está usando
      // En localhost: crmUrl será '/crm/webservice/formulario_web.php' (proxy de Vite)
      // El proxy redirige a la URL configurada en VITE_CRM_URL
      if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        const targetUrl = import.meta.env.VITE_CRM_URL || 'http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php'
        logger.info('[DEBUG] En localhost, el proxy de Vite redirigirá a:', targetUrl)
      }

      const response = await axios.post(crmUrl, data, {
        headers: {
          'Content-Type': 'application/json',
        }
      })

      logger.crm('Respuesta recibida del CRM', response.data)

      // JPS: Retornar respuesta completa con URL real del CRM
      // Modificación: Retornar objeto con respuesta del CRM y URL real del endpoint (no la del proxy)
      // Funcionamiento: Esto permite guardar la respuesta completa en la tabla prospectos
      // incluyendo la URL real del CRM que se usó (obtenida de VITE_CRM_URL o determinada por ambiente)
      // La URL real se obtiene usando getCRMUrlReal() que retorna la URL real, no la del proxy
      const crmUrlReal = getCRMUrlReal()

      return {
        ...response.data,
        _crmEndpointUrl: crmUrlReal // URL real del CRM (ej: https://crmadmision.uniacc.cl/webservice/formulario_web.php)
      }
    } catch (e: any) {
      error.value = e?.response?.data?.des_respuesta || e?.message || 'Error al enviar mensaje al CRM'

      // JPS: Logging detallado del error para debugging
      // Modificación: Agregar información sobre el error del CRM de QA
      // Funcionamiento: Muestra el status code, la respuesta del servidor y la URL que se intentó usar
      logger.error('Error enviarCRM:', {
        message: e?.message,
        status: e?.response?.status,
        statusText: e?.response?.statusText,
        responseData: e?.response?.data,
        crmUrl: crmUrl,
        // En localhost, mostrar que el proxy redirige a la URL configurada en VITE_CRM_URL
        targetUrl: (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
          ? `${import.meta.env.VITE_CRM_URL || 'http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php'} (vía proxy Vite)`
          : crmUrl
      })

      throw e
    } finally {
      loading.value = false
    }
  }

  const createJSONcrm = (formData: FormData, carreraInfo?: Carrera | null, userAgent?: string): JSONCRM => {
    // Separar apellido en primer y segundo apellido
    const apellidos = formData.apellido?.trim().split(/\s+/) || []
    const primerApellido = apellidos[0] || ''
    const segundoApellido = apellidos.slice(1).join(' ') || ''

    // Obtener y formatear RUT si está disponible
    let rut = ''
    if (formData.tipoIdentificacion === 'rut' && formData.identificacion) {
      // Formatear RUT con puntos y guión (ej: 15.834.697-4)
      const rutLimpio = formData.identificacion.replace(/[^0-9kK]/g, '')

      const rutSinDV = rutLimpio.slice(0, -1)
      const dv = rutLimpio.slice(-1).toUpperCase()
      // Agregar puntos cada 3 dígitos desde la derecha
      const rutFormateado = rutSinDV.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      rut = `${rutFormateado}-${dv}`

    } else {
      rut = formData.identificacion
    }

    // Obtener código de la carrera
    const codigoCarrera = carreraInfo?.codigo_carrera || ''

    // Formatear teléfono con +56 (remover espacios y caracteres especiales, mantener solo números)
    let telefono = formData.telefono?.replace(/\D/g, '') || ''
    if (telefono && !telefono.startsWith('56')) {
      // Si no empieza con 56, agregarlo
      if (telefono.startsWith('9')) {
        telefono = `569${telefono.slice(1)}`
      } else {
        telefono = `56${telefono}`
      }
    }
    if (telefono && !telefono.startsWith('+')) {
      telefono = `+${telefono}`
    }

    return {
      nombre: formData.nombre || '',
      primerApellido,
      segundoApellido,
      email: formData.email || '',
      rut,
      telefono,
      carrera: codigoCarrera,
      // origen: 2,
      //JPS se cambia el origen de 2 a 4 a solicitud de Innovadev
      origen: 4,
      User_Agent: userAgent || '',
      // Parámetros de campaña (si están disponibles)
      utm_source: formData.utm_source,
      utm_medium: formData.utm_medium,
      utm_campaign: formData.utm_campaign,
      utm_term: formData.utm_term,
      utm_content: formData.utm_content,
      campaign_id: formData.campaign_id,
      gclid: formData.gclid,
      fbclid: formData.fbclid
    }
  }

  return {
    loading,
    error,
    enviarCRM,
    createJSONcrm
  }
}

