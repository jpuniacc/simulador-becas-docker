import express from 'express'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { toHubSpotProperties } from './mapper.js'

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  for (const rawLine of readFileSync(filePath, 'utf8').split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnvFile(resolve(__dirname, '../../.env'))
loadEnvFile(resolve(__dirname, '.env'))

const PORT = Number(process.env.PORT || 3000)
const HUBSPOT_BASE_URL = (process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com').replace(/\/$/, '')
const HUBSPOT_ACCESS_TOKEN = process.env.HUBSPOT_ACCESS_TOKEN || ''

const app = express()
app.use(express.json({ limit: '1mb' }))

app.get('/health', (_req, res) => {
  res.type('text').send('OK\n')
})

async function hubspotFetch(path, options = {}, attempt = 1) {
  if (!HUBSPOT_ACCESS_TOKEN) {
    const err = new Error('HUBSPOT_ACCESS_TOKEN no configurado')
    err.status = 500
    throw err
  }

  const url = `${HUBSPOT_BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if ((response.status === 429 || response.status >= 500) && attempt < 4) {
    const waitMs = Math.min(1000 * 2 ** (attempt - 1), 8000)
    await new Promise((r) => setTimeout(r, waitMs))
    return hubspotFetch(path, options, attempt + 1)
  }

  const text = await response.text()
  let body = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { raw: text }
  }

  return { status: response.status, body }
}

async function getContactByEmail(email) {
  const encoded = encodeURIComponent(email)
  return hubspotFetch(
    `/crm/v3/objects/contacts/${encoded}?idProperty=email&properties=email,firstname,lastname`,
    { method: 'GET' }
  )
}

async function createContact(properties) {
  return hubspotFetch('/crm/v3/objects/contacts', {
    method: 'POST',
    body: JSON.stringify({ properties }),
  })
}

async function updateContactByEmail(email, properties) {
  const encoded = encodeURIComponent(email)
  return hubspotFetch(`/crm/v3/objects/contacts/${encoded}?idProperty=email`, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  })
}

/**
 * POST /hubspot/contact
 * Body: DTO del simulador (campos prospecto / form). Mapper → HubSpot upsert.
 */
app.post('/hubspot/contact', async (req, res) => {
  try {
    const dto = req.body || {}
    const hubspotContext = dto.hubspot_context && typeof dto.hubspot_context === 'object'
      ? dto.hubspot_context
      : null
    const properties = toHubSpotProperties(dto)
    const email = properties.email

    if (!email) {
      return res.status(400).json({
        provider: 'hubspot',
        error: 'email es obligatorio',
      })
    }

    const getRes = await getContactByEmail(email)
    let result
    let created = false

    if (getRes.status === 200 && getRes.body?.id) {
      result = await updateContactByEmail(email, properties)
      created = false
    } else if (getRes.status === 404) {
      result = await createContact(properties)
      created = true
    } else if (getRes.status === 409) {
      result = await updateContactByEmail(email, properties)
      created = false
    } else {
      return res.status(getRes.status >= 400 ? getRes.status : 502).json({
        provider: 'hubspot',
        error: 'Error al consultar contacto en HubSpot',
        hubspot_status: getRes.status,
        hubspot_body: getRes.body,
        correlationId: getRes.body?.correlationId,
      })
    }

    if (result.status === 409) {
      // Carrera create/update: reintentar patch
      result = await updateContactByEmail(email, properties)
      created = false
    }

    if (result.status >= 400) {
      return res.status(result.status).json({
        provider: 'hubspot',
        error: 'Error al crear/actualizar contacto en HubSpot',
        hubspot_status: result.status,
        hubspot_body: result.body,
        correlationId: result.body?.correlationId,
      })
    }

    const id = result.body?.id
    console.log('[hubspot-api] request_properties', {
      email,
      created,
      id,
      hubspot_context: hubspotContext,
      request_properties: properties,
    })

    return res.status(created ? 201 : 200).json({
      provider: 'hubspot',
      id,
      created,
      properties: result.body?.properties || {},
      request_properties: properties,
      _crmEndpointUrl: `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`,
      // Compatibilidad con useProspectos (forma Mantis-like + HubSpot)
      cod_respuesta: created ? 1 : 1,
      des_respuesta: created ? 'OK (created)' : 'OK (updated)',
      hubspot_contact_id: id,
    })
  } catch (e) {
    console.error('[hubspot-api]', e?.message || e)
    return res.status(e.status || 500).json({
      provider: 'hubspot',
      error: e?.message || 'Error interno HubSpot proxy',
    })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[hubspot-api] listening on :${PORT}`)
  if (!HUBSPOT_ACCESS_TOKEN) {
    console.warn('[hubspot-api] WARNING: HUBSPOT_ACCESS_TOKEN vacío')
  } else {
    console.log('[hubspot-api] HUBSPOT_ACCESS_TOKEN cargado')
  }
})
