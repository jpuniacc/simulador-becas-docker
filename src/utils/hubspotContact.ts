import type { FormData } from '@/types/simulador'
import type { Carrera } from '@/stores/carrerasStore'

/**
 * DTO enviado al sidecar HubSpot (mapea a properties en server/hubspot/mapper.js).
 */
export type HubSpotContactDto = Record<string, unknown>

function formatRut(identificacion: string): string {
  const rutLimpio = identificacion.replace(/[^0-9kK]/g, '')
  if (rutLimpio.length < 2) return identificacion
  const rutSinDV = rutLimpio.slice(0, -1)
  const dv = rutLimpio.slice(-1).toUpperCase()
  const rutFormateado = rutSinDV.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${rutFormateado}-${dv}`
}

function formatTelefono(telefono: string): string {
  let t = telefono.replace(/\D/g, '') || ''
  if (t && !t.startsWith('56')) {
    if (t.startsWith('9')) t = `569${t.slice(1)}`
    else t = `56${t}`
  }
  if (t && !t.startsWith('+')) t = `+${t}`
  return t
}

/**
 * Construye el body para POST /api/hubspot-contact desde el formulario del simulador.
 */
export function buildHubSpotContactDto(
  form: FormData,
  carreraInfo?: Carrera | null,
  extras?: {
    segmentacion?: string | null
    becaNombre?: string | null
    medioPago?: string | null
    numeroCuotas?: number | null
    userAgent?: string
  }
): HubSpotContactDto {
  const rut =
    form.tipoIdentificacion === 'rut' && form.identificacion
      ? formatRut(form.identificacion)
      : undefined
  const pasaporte =
    form.tipoIdentificacion === 'pasaporte' ? form.identificacion || undefined : undefined

  const dto: HubSpotContactDto = {
    nombre: form.nombre || '',
    apellido: form.apellido || '',
    email: form.email || '',
    telefono: form.telefono ? formatTelefono(form.telefono) : undefined,
    rut,
    pasaporte,
    genero: form.genero || undefined,
    anio_nacimiento: form.anio_nacimiento ?? undefined,
    curso: form.nivelEducativo || undefined,
    colegio: form.colegio || undefined,
    año_egreso: form.añoEgreso ? Number(form.añoEgreso) : undefined,
    nem: form.nem ?? undefined,
    ranking: form.ranking ?? undefined,
    comprension_lectora: form.paes?.lenguaje ?? undefined,
    matematica1: form.paes?.matematica ?? undefined,
    region: form.regionResidencia || undefined,
    comuna: form.comunaResidencia || undefined,
    decil: form.decil != null ? String(form.decil) : undefined,
    rango_ingreso: form.ingresoMensual || undefined,
    cae: form.planeaUsarCAE ?? undefined,
    becas_estado: form.usaBecasEstado ?? undefined,
    consentimiento_contacto: form.consentimiento_contacto ?? false,
    carreratitulo: form.carreraTitulo || carreraInfo?.nombre_carrera || form.carrera || undefined,
    carrera_simulador: carreraInfo?.codigo_carrera || form.carrera || undefined,
    area_interes: (form as any).area || undefined,
    modalidadpreferencia: form.modalidadPreferencia?.length
      ? form.modalidadPreferencia
      : undefined,
    objetivo: form.objetivo?.length ? form.objetivo : undefined,
    segmentacion: extras?.segmentacion || undefined,
    beca: extras?.becaNombre || undefined,
    medio_pago: extras?.medioPago || undefined,
    numero_cuotas: extras?.numeroCuotas ?? undefined,
    url_origen: typeof window !== 'undefined' ? window.location.href : undefined,
    utm_source: form.utm_source || undefined,
    utm_medium: form.utm_medium || undefined,
    utm_campaign: form.utm_campaign || undefined,
    utm_term: form.utm_term || undefined,
    utm_content: form.utm_content || undefined,
    campaign_id: form.campaign_id || undefined,
    ad_id: form.ad_id || undefined,
    gclid: form.gclid || undefined,
    fbclid: form.fbclid || undefined,
    ttclid: form.ttclid || undefined,
    li_fat_id: form.li_fat_id || undefined,
    first_touch_url: form.first_touch_url || undefined,
    first_touch_timestamp: form.first_touch_timestamp || undefined,
    last_touch_url: form.last_touch_url || undefined,
    last_touch_timestamp: form.last_touch_timestamp || undefined,
    User_Agent: extras?.userAgent || undefined,
  }

  return dto
}
