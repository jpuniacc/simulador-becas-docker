/**
 * Mapea el DTO del simulador (alineado a prospectos / FormData) a properties HubSpot Contact.
 * No envía: grado_academico (calculada), msclkid (no existe en portal).
 * paes HubSpot = puntaje numérico (no el boolean de Supabase).
 */

function asString(value) {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'object') {
    try {
      return Array.isArray(value) ? value.join(', ') : JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

function asNumber(value) {
  if (value === null || value === undefined || value === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

function asBoolean(value) {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1') return true
  if (value === 'false' || value === '0') return false
  return Boolean(value)
}

function toUnixMs(value) {
  if (value === null || value === undefined || value === '') return undefined
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const t = Date.parse(String(value))
  return Number.isFinite(t) ? t : undefined
}

function jsonToString(value) {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

/**
 * @param {Record<string, unknown>} dto
 * @returns {Record<string, string | number | boolean>}
 */
export function toHubSpotProperties(dto = {}) {
  const lectora = asNumber(dto.comprension_lectora ?? dto.paes_lenguaje)
  const mat1 = asNumber(dto.matematica1 ?? dto.paes_matematica)
  let paesScore = asNumber(dto.paes_puntaje)
  if (paesScore === undefined && lectora !== undefined && mat1 !== undefined) {
    paesScore = Math.round((lectora + mat1) / 2)
  }

  const props = {
    firstname: asString(dto.firstname ?? dto.nombre),
    lastname: asString(dto.lastname ?? dto.apellido),
    email: asString(dto.email),
    phone: asString(dto.phone ?? dto.telefono),
    rut: asString(dto.rut),
    pasaporte: asString(dto.pasaporte),
    comuna: asString(dto.comuna),
    colegio_de_egreso: asString(dto.colegio_de_egreso ?? dto.colegio),
    anio_egreso_ensenanza_media: asNumber(dto.anio_egreso_ensenanza_media ?? dto.año_egreso ?? dto.anio_egreso),
    promedio_notas_em: asNumber(dto.promedio_notas_em ?? dto.nem),
    genero: asString(dto.genero),
    region: asString(dto.region),
    rango_ingreso: asString(dto.rango_ingreso),
    decil: asString(dto.decil),
    beca: asString(dto.beca),
    curso: asString(dto.curso),
    area_interes: asString(dto.area_interes),
    references: asString(dto.references),
    objetivo: asString(dto.objetivo),
    segmentacion: asString(dto.segmentacion),
    carrera_simulador: asString(dto.carrera_simulador ?? dto.carrera_codigo ?? dto.carrera),
    carreratitulo: asString(dto.carreratitulo),
    medio_pago_preferido_simulador: asString(dto.medio_pago_preferido_simulador ?? dto.medio_pago),
    modalidad_preferencia_simulador: asString(dto.modalidad_preferencia_simulador ?? dto.modalidadpreferencia),
    numero_cuotas_preferido_simulador: asNumber(dto.numero_cuotas_preferido_simulador ?? dto.numero_cuotas),
    anio_nacimiento: asNumber(dto.anio_nacimiento),
    ranking: asNumber(dto.ranking),
    paes: paesScore,
    comprension_lectora: lectora,
    matematica1: mat1,
    cae: asBoolean(dto.cae),
    becas_estado: asBoolean(dto.becas_estado),
    consentimiento_contacto: asBoolean(dto.consentimiento_contacto),
    last_touch_timestamp_simulador: toUnixMs(dto.last_touch_timestamp_simulador ?? dto.last_touch_timestamp),
    first_touch_timestamp_simulador: asString(dto.first_touch_timestamp_simulador ?? dto.first_touch_timestamp),
    url_origen_simulador: asString(dto.url_origen_simulador ?? dto.url_origen),
    first_touch_url_simulador: asString(dto.first_touch_url_simulador ?? dto.first_touch_url),
    last_touch_url_simulador: asString(dto.last_touch_url_simulador ?? dto.last_touch_url),
    utm_source_simulador: asString(dto.utm_source_simulador ?? dto.utm_source),
    utm_medium_simulador: asString(dto.utm_medium_simulador ?? dto.utm_medium),
    utm_campaign_simulador: asString(dto.utm_campaign_simulador ?? dto.utm_campaign),
    utm_term_simulador: asString(dto.utm_term_simulador ?? dto.utm_term),
    utm_content_simulador: asString(dto.utm_content_simulador ?? dto.utm_content),
    campaign_id_simulador: asString(dto.campaign_id_simulador ?? dto.campaign_id),
    ad_id_simulador: asString(dto.ad_id_simulador ?? dto.ad_id),
    hs_google_click_id: asString(
      dto.hs_google_click_id ?? dto.gclid ?? dto.gcl_aw
    ),
    hs_facebook_click_id: asString(dto.hs_facebook_click_id ?? dto.fbclid),
    hs_tiktok_click_id: asString(dto.hs_tiktok_click_id ?? dto.ttclid),
    hs_linkedin_click_id: asString(dto.hs_linkedin_click_id ?? dto.li_fat_id),
    referrer_simulador: asString(dto.referrer_simulador ?? dto.referrer),
    traffic_type_simulador: asString(dto.traffic_type_simulador ?? dto.traffic_type),
    organic_source_simulador: asString(
      dto.organic_source_simulador ?? dto.organic_source
    ),
    organic_medium_simulador: asString(
      dto.organic_medium_simulador ?? dto.organic_medium
    ),
    landing_page_simulador: asString(dto.landing_page_simulador ?? dto.landing_page),
    hutk_simulador: asString(
      dto.hutk_simulador
        ?? (typeof dto.hubspot_context === 'object' && dto.hubspot_context !== null
          ? dto.hubspot_context.hutk
          : undefined)
    ),
    gcl_aw_simulador: asString(dto.gcl_aw_simulador ?? dto.gcl_aw),
  }

  // Quitar undefined
  const cleaned = {}
  for (const [k, v] of Object.entries(props)) {
    if (v !== undefined) cleaned[k] = v
  }

  // Obligatorios Revops: JSON como string
  const prospectoRaw = dto.prospecto_crm !== undefined
    ? jsonToString(dto.prospecto_crm)
    : JSON.stringify(cleaned)
  cleaned.prospecto_crm = prospectoRaw

  cleaned.respuesta_crm = dto.respuesta_crm !== undefined
    ? jsonToString(dto.respuesta_crm)
    : JSON.stringify({ provider: 'hubspot', phase: 'request' })

  return cleaned
}
