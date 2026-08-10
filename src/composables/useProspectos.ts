import { ref } from 'vue'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type { FormData } from '@/types/simulador'
import { logger } from '@/utils/logger'

type ProspectoInsert = Database['public']['Tables']['prospectos']['Insert']
type ProspectoRow = Database['public']['Tables']['prospectos']['Row']

export function useProspectos() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Tipo para becas aplicadas
  type BecaAplicada = {
    beca: {
      id: string | number
      nombre?: string
      [key: string]: any
    }
    descuento_aplicado?: number
    monto_descuento?: number
    [key: string]: any
  }

  // Tipo para respuesta del CRM
  type RespuestaCRM = {
    cod_respuesta?: number
    des_respuesta?: string
    _crmEndpointUrl?: string
    [key: string]: any
  }

  // JPS: Agregar parámetros opcionales para datos de simulación
  // Modificación: Agregar parámetros para guardar datos de simulación (medio de pago, cuotas, montos)
  // Funcionamiento: Estos datos se capturan al hacer clic en "Guardar Simulación" y se guardan en la tabla prospectos
  const insertarProspecto = async (
    form: FormData,
    segmentacion?: string,
    becasAplicadas?: BecaAplicada[],
    prospectoCrm?: Record<string, any> | null,
    respuestaCRM?: RespuestaCRM | null,
    // JPS: Nuevos parámetros para datos de simulación
    medioPago?: string | null,
    numeroCuotas?: number | null,
    arancelOriginal?: number | null,
    matriculaOriginal?: number | null,
    descuentoTotal?: number | null,
    arancelFinal?: number | null,
    matriculaFinal?: number | null,
    totalFinal?: number | null,
    valorMensual?: number | null
  ): Promise<ProspectoRow | null> => {
    // JPS: Logging seguro con ofuscación de datos sensibles
    // Modificación: Usar logger.prospecto() que ofusca automáticamente RUT, email, teléfono
    // Funcionamiento: El logger detecta campos sensibles en formData y los reemplaza con asteriscos
    logger.prospecto('Insertando prospecto', { form, segmentacion, becasAplicadas })

    loading.value = true
    error.value = null
    try {
      // Extraer región y país del campo paisPasaporte si existe
      // El formato es "REGION-PAIS" (ej: "LA-AR")
      // Nota: paisPasaporte puede no existir en FormData, usar casting seguro
      let regionPais: string | null = null
      let pais: string | null = null

      const formAny = form as any
      if (formAny.paisPasaporte) {
        const [region, countryCode] = formAny.paisPasaporte.split('-')
        regionPais = region || null
        pais = countryCode || null
      }

      // Extraer ID de la beca aplicada (solo puede haber una)
      // Si hay becas aplicadas, guardar el ID de la primera (y única) beca
      const becaId: string | null = becasAplicadas && becasAplicadas.length > 0 && becasAplicadas[0]?.beca?.id != null
        ? String(becasAplicadas[0].beca.id)
        : null

      const payload: ProspectoInsert = {
        // Básicos
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: form.telefono || null,
        genero: form.genero ? (form.genero as ProspectoInsert['genero']) : null,
        rut: form.tipoIdentificacion === 'rut' ? (form.identificacion || null) : null,
        pasaporte: form.tipoIdentificacion === 'pasaporte' ? (form.identificacion || null) : null,
        anio_nacimiento: form.anio_nacimiento ?? null,

        // Académicos
        curso: form.nivelEducativo || 'No especificado',
        colegio: form.colegio || null,
        carrera: form.carreraId,
        año_egreso: form.añoEgreso ? Number(form.añoEgreso) : null,
        nem: form.nem ?? null,
        ranking: form.ranking ?? null,

        // PAES
        paes: form.rendioPAES ?? null,
        matematica1: form.paes?.matematica ?? null,
        comprension_lectora: form.paes?.lenguaje ?? null,

        // Socioeconómico
        region: form.regionResidencia || null,
        comuna: form.comunaResidencia || null,
        decil: form.decil != null ? String(form.decil) : null,
        rango_ingreso: form.ingresoMensual,
        cae: form.planeaUsarCAE ?? null,
        becas_estado: form.usaBecasEstado ?? null,

        // Postgrado
        carreratitulo: form.carreraTitulo || null,
        area_interes: (form as any).area || null,
        modalidadpreferencia: form.modalidadPreferencia && form.modalidadPreferencia.length > 0 ? form.modalidadPreferencia : null,
        objetivo: form.objetivo && form.objetivo.length > 0 ? form.objetivo : null,
        grado_academico: (form as any).gradoAcademico || null,

        // Beca aplicada (solo puede haber una)
        beca: becaId,

        // Consentimiento
        consentimiento_contacto: form.consentimiento_contacto ?? false,

        // Segmentación
        segmentacion: segmentacion || null,

        // JPS: URL de origen del navegador
        // Modificación: Capturar la URL completa del navegador al momento de insertar el prospecto
        // Funcionamiento:
        // - Verifica que window esté disponible (para evitar errores en SSR o contextos sin navegador)
        // - Captura window.location.href que contiene la URL completa (protocolo + host + path + query + hash)
        // - Si window no está disponible, se guarda null
        // - Esto permite rastrear desde qué página/URL el usuario inició el proceso de simulación
        url_origen: typeof window !== 'undefined' ? window.location.href : null,

        // Parámetros UTM y de campaña
        utm_source: form.utm_source || null,
        utm_medium: form.utm_medium || null,
        utm_campaign: form.utm_campaign || null,
        utm_term: form.utm_term || null,
        utm_content: form.utm_content || null,
        campaign_id: form.campaign_id || null,
        ad_id: form.ad_id || null,
        gclid: form.gclid || null,
        fbclid: form.fbclid || null,
        msclkid: form.msclkid || null,
        ttclid: form.ttclid || null,
        li_fat_id: form.li_fat_id || null,
        first_touch_url: form.first_touch_url || null,
        first_touch_timestamp: form.first_touch_timestamp || null,
        last_touch_url: form.last_touch_url || null,
        last_touch_timestamp: form.last_touch_timestamp || null,

        // JSON del CRM enviado al sistema de CRM
        prospecto_crm: prospectoCrm || null,

        // JPS: Respuesta del CRM
        // Modificación: Guardar la respuesta del CRM con URL real del endpoint, código y descripción
        // Funcionamiento: Se guarda un objeto JSON con:
        // - URL_Endpoint_crm: URL real del CRM usado (ej: https://crmadmision.uniacc.cl/webservice/formulario_web.php)
        //   NO se guarda la URL del proxy, sino la URL real del servidor CRM
        // - codigo_respuesta_crm: Código de respuesta del CRM (cod_respuesta)
        // - descripcion_respuesta: Descripción de la respuesta (des_respuesta)
        respuesta_crm: respuestaCRM ? {
          URL_Endpoint_crm: respuestaCRM._crmEndpointUrl || null,
          codigo_respuesta_crm: respuestaCRM.cod_respuesta ?? null,
          descripcion_respuesta: respuestaCRM.des_respuesta || null
        } : null,

        // JPS: Campos de simulación de cuotas y medios de pago
        // Modificación: Agregar campos para guardar datos de la simulación de cuotas y medios de pago
        // Funcionamiento: Estos campos se capturan cuando el usuario hace clic en "Guardar Simulación"
        // y representan la configuración de pago seleccionada por el usuario
        medio_pago: medioPago || null,
        numero_cuotas: numeroCuotas || null,
        arancel_original: arancelOriginal || null,
        matricula_original: matriculaOriginal || null,
        descuento_total: descuentoTotal || null,
        arancel_final: arancelFinal || null,
        matricula_final: matriculaFinal || null,
        total_final: totalFinal || null,
        valor_mensual: valorMensual || null
      }

      // Log de debugging para verificar parámetros de campaña
      if (import.meta.env.DEV) {
        console.log('📊 useProspectos - Parámetros de campaña en payload:', {
          utm_source: payload.utm_source,
          utm_medium: payload.utm_medium,
          utm_campaign: payload.utm_campaign,
          utm_term: payload.utm_term,
          utm_content: payload.utm_content,
          gclid: payload.gclid,
          fbclid: payload.fbclid,
          first_touch_url: payload.first_touch_url,
          last_touch_url: payload.last_touch_url
        })
      }

      const { data, error: insertError } = await supabase
        .from('prospectos')
        .insert(payload)
        .select('*')
        .single()

      if (insertError) throw insertError

      // Log de éxito con datos guardados
      if (import.meta.env.DEV && data) {
        console.log('✅ useProspectos - Prospecto guardado exitosamente con datos de campaña:', {
          id: data.id,
          utm_source: data.utm_source,
          utm_medium: data.utm_medium,
          utm_campaign: data.utm_campaign
        })
      }

      logger.prospecto('Prospecto insertado correctamente', { id: data.id })
      return data
    } catch (e: any) {
      error.value = e?.message || 'Error al insertar prospecto'
      logger.error('Error insertarProspecto:', e)
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    insertarProspecto
  }
}


