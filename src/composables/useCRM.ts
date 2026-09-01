import { ref } from 'vue'
import axios from 'axios'
import type { FormData } from '@/types/simulador'
import type { Carrera } from '@/stores/carrerasStore'
import { logger } from '@/utils/logger'
import { buildHubSpotContactDto } from '@/utils/hubspotContact'
import { identifyHubSpotContact } from '@/utils/hubspotTracking'

const HUBSPOT_ENDPOINT = '/api/hubspot-contact'
const HUBSPOT_URL_REAL = 'https://api.hubapi.com/crm/v3/objects/contacts'

export function useCRM() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Compat: algunos call sites aún piden el JSON “CRM” para prospecto_crm.
   * Con HubSpot el payload real va en _prospectoPayload de la respuesta.
   */
  const createJSONcrm = (formData: FormData, carreraInfo?: Carrera | null, userAgent?: string) => {
    return buildHubSpotContactDto(formData, carreraInfo, { userAgent })
  }

  const enviarCRM = async (
    formData: FormData,
    carreraInfo?: Carrera | null,
    userAgent?: string,
    extras?: {
      segmentacion?: string | null
      becaNombre?: string | null
      medioPago?: string | null
      numeroCuotas?: number | null
    }
  ): Promise<any> => {
    if (!formData.consentimiento_contacto) {
      logger.crm('Envío a HubSpot omitido: consentimiento_contacto es false')
      return { skipped: true, reason: 'No hay consentimiento de contacto', provider: 'hubspot' }
    }

    loading.value = true
    error.value = null

    const dto = buildHubSpotContactDto(formData, carreraInfo, {
      ...extras,
      userAgent
    })

    try {
      console.log('[useCRM] POST HubSpot', { url: HUBSPOT_ENDPOINT, email: dto.email, dto })
      logger.crm('Enviando datos a HubSpot', { crmUrl: HUBSPOT_ENDPOINT, email: dto.email })

      const response = await axios.post(HUBSPOT_ENDPOINT, dto, {
        headers: { 'Content-Type': 'application/json' }
      })

      console.log('[useCRM] HubSpot OK', response.data)
      if (response.data?.request_properties) {
        console.log('[HubSpot] properties enviadas:', response.data.request_properties)
      }
      logger.crm('Respuesta HubSpot', {
        id: response.data?.id,
        created: response.data?.created
      })

      identifyHubSpotContact(String(dto.email ?? ''))

      return {
        ...response.data,
        provider: 'hubspot',
        hubspot_contact_id: response.data?.id || response.data?.hubspot_contact_id || null,
        request_properties: response.data?.request_properties || null,
        _crmEndpointUrl: response.data?._crmEndpointUrl || HUBSPOT_URL_REAL,
        cod_respuesta: response.data?.cod_respuesta ?? 1,
        des_respuesta: response.data?.des_respuesta || 'OK',
        _prospectoPayload: dto
      }
    } catch (e: any) {
      error.value = e?.response?.data?.error
        || e?.response?.data?.des_respuesta
        || e?.message
        || 'Error al enviar contacto a HubSpot'

      logger.error('Error enviarCRM (HubSpot):', {
        message: e?.message,
        status: e?.response?.status,
        responseData: e?.response?.data
      })

      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    enviarCRM,
    createJSONcrm,
    getCrmProvider: () => 'hubspot' as const
  }
}
