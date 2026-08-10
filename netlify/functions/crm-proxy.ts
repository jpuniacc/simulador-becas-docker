/**
 * Netlify Function que actúa como proxy para las peticiones al CRM
 * Esto evita problemas de CORS en producción
 */
interface NetlifyEvent {
  httpMethod: string
  body: string | null
  headers: Record<string, string>
}

export const handler = async (event: NetlifyEvent) => {
  // Manejar preflight OPTIONS primero
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: ''
    }
  }

  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Determinar la URL del CRM según el hostname del request
    // QA (simuladorqa.uniacc.cl) -> CRM de QA
    // MAIN (simulador.uniacc.cl) -> CRM de producción
    const host = event.headers.host || event.headers['x-forwarded-host'] || ''
    const isMain = host.includes('simulador.uniacc.cl') && !host.includes('simuladorqa')
    const isQA = host.includes('simuladorqa.uniacc.cl')

    let crmUrl: string
    if (isMain) {
      // MAIN: usar CRM de producción desde variable de entorno
      // JPS: Usar VITE_CRM_URL si está disponible, sino usar fallbacks
      crmUrl = process.env.VITE_CRM_URL ||
               process.env.CRM_URL_MAIN ||
               process.env.VITE_API_MANTIS_WEB ||
               'https://crmadmision.uniacc.cl/webservice/formulario_web.php'
    } else {
      // QA o fallback: usar CRM de QA desde variable de entorno
      // JPS: Usar VITE_CRM_URL si está disponible, sino usar fallbacks
      crmUrl = process.env.VITE_CRM_URL ||
               process.env.CRM_URL_QA ||
               process.env.VITE_API_MANTIS_WEB ||
               process.env.CRM_URL ||
               'http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php'
    }

    // Obtener el body de la petición
    const body = event.body || '{}'
    let parsedBody
    try {
      parsedBody = JSON.parse(body)
    } catch {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid JSON body' })
      }
    }

    // Hacer la petición al CRM
    const response = await fetch(crmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parsedBody)
    })

    const data = await response.json()

    // Retornar la respuesta con headers CORS
    return {
      statusCode: response.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    }
  } catch (error: unknown) {
    console.error('Error en proxy CRM:', error)
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Error al comunicarse con el CRM',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

