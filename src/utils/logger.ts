/**
 * Utilidad para logging seguro con ofuscación de datos sensibles
 * JPS: Sistema de logging que ofusca datos sensibles antes de mostrarlos en consola
 * Funcionamiento:
 * - Detecta campos sensibles (RUT, pasaporte, email, teléfono, URLs de endpoints)
 * - Los reemplaza con asteriscos manteniendo formato parcial para debugging
 * - Permite logging estructurado sin exponer información personal
 */

// Campos considerados sensibles que deben ser ofuscados
const SENSITIVE_FIELDS = [
  'rut',
  'pasaporte',
  'identificacion',
  'email',
  'telefono',
  'url',
  'endpoint',
  'crmUrl',
  'crm_url',
  'url_origen'
] as const

// Campos que pueden contener datos sensibles en objetos anidados
const SENSITIVE_PATTERNS = [
  /rut/i,
  /pasaporte/i,
  /identificacion/i,
  /email/i,
  /telefono/i,
  /phone/i,
  /crm.*url/i,
  /endpoint/i
]

/**
 * Ofusca un valor sensible manteniendo parte del formato para debugging
 */
function obfuscateValue(value: string | number | null | undefined): string {
  if (!value) return '***'
  
  const str = String(value)
  
  // Si es un RUT (formato con puntos y guión o solo números)
  if (/^[\d\.]+-?[0-9kK]$/.test(str.replace(/\./g, ''))) {
    const clean = str.replace(/[^0-9kK]/g, '')
    if (clean.length >= 8) {
      // Mostrar solo últimos 2 dígitos + DV: ********97-4
      const lastDigits = clean.slice(-3)
      return `***${lastDigits}`
    }
    return '***'
  }
  
  // Si es un email
  if (str.includes('@')) {
    const [local, domain] = str.split('@')
    if (local.length > 2) {
      return `${local.slice(0, 2)}***@${domain}`
    }
    return `***@${domain}`
  }
  
  // Si es un teléfono (números con + o espacios)
  if (/^[\d\s\+\-\(\)]+$/.test(str) && str.replace(/\D/g, '').length >= 8) {
    const digits = str.replace(/\D/g, '')
    // Mostrar solo últimos 3 dígitos: +56 9 ***123
    const lastDigits = digits.slice(-3)
    return `***${lastDigits}`
  }
  
  // Si es una URL/endpoint
  if (str.startsWith('http://') || str.startsWith('https://')) {
    try {
      const url = new URL(str)
      // Mantener dominio pero ofuscar path y query
      return `${url.protocol}//${url.hostname}/***`
    } catch {
      return '***'
    }
  }
  
  // Para otros valores, mostrar solo primeros 2 y últimos 2 caracteres
  if (str.length > 4) {
    return `${str.slice(0, 2)}***${str.slice(-2)}`
  }
  
  return '***'
}

/**
 * Verifica si un nombre de campo es sensible
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerField = fieldName.toLowerCase()
  
  // Verificar en lista de campos sensibles
  if (SENSITIVE_FIELDS.some(field => lowerField.includes(field))) {
    return true
  }
  
  // Verificar con patrones
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(lowerField))
}

/**
 * Ofusca un objeto recursivamente, reemplazando valores de campos sensibles
 */
function obfuscateObject(obj: any, depth = 0): any {
  // Limitar profundidad para evitar loops infinitos
  if (depth > 10) return '***[max depth]'
  
  if (obj === null || obj === undefined) {
    return obj
  }
  
  // Si es un string o número primitivo
  if (typeof obj !== 'object') {
    return obj
  }
  
  // Si es un array
  if (Array.isArray(obj)) {
    return obj.map(item => obfuscateObject(item, depth + 1))
  }
  
  // Si es un objeto
  const obfuscated: Record<string, any> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (isSensitiveField(key)) {
      // Campo sensible: ofuscar el valor
      obfuscated[key] = obfuscateValue(value)
    } else if (typeof value === 'object' && value !== null) {
      // Objeto anidado: procesar recursivamente
      obfuscated[key] = obfuscateObject(value, depth + 1)
    } else {
      // Campo normal: mantener valor original
      obfuscated[key] = value
    }
  }
  
  return obfuscated
}

/**
 * Logger seguro que ofusca datos sensibles antes de loggear
 */
export const logger = {
  /**
   * Log de información (equivalente a console.log)
   */
  info: (...args: any[]) => {
    const obfuscated = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return obfuscateObject(arg)
      }
      if (typeof arg === 'string' && isSensitiveField(arg)) {
        return obfuscateValue(arg)
      }
      return arg
    })
    console.log(...obfuscated)
  },
  
  /**
   * Log de error (equivalente a console.error)
   */
  error: (...args: any[]) => {
    const obfuscated = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return obfuscateObject(arg)
      }
      if (typeof arg === 'string' && isSensitiveField(arg)) {
        return obfuscateValue(arg)
      }
      return arg
    })
    console.error(...obfuscated)
  },
  
  /**
   * Log de advertencia (equivalente a console.warn)
   */
  warn: (...args: any[]) => {
    const obfuscated = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return obfuscateObject(arg)
      }
      if (typeof arg === 'string' && isSensitiveField(arg)) {
        return obfuscateValue(arg)
      }
      return arg
    })
    console.warn(...obfuscated)
  },
  
  /**
   * Log de debug (equivalente a console.debug)
   */
  debug: (...args: any[]) => {
    const obfuscated = args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return obfuscateObject(arg)
      }
      if (typeof arg === 'string' && isSensitiveField(arg)) {
        return obfuscateValue(arg)
      }
      return arg
    })
    console.debug(...obfuscated)
  },
  
  /**
   * Log de datos del CRM (ofusca URL y datos sensibles)
   */
  crm: (message: string, data?: any) => {
    const obfuscatedData = data ? obfuscateObject(data) : undefined
    console.log(`[CRM] ${message}`, obfuscatedData || '')
  },
  
  /**
   * Log de datos de prospecto (ofusca RUT, email, teléfono)
   */
  prospecto: (message: string, data?: any) => {
    const obfuscatedData = data ? obfuscateObject(data) : undefined
    console.log(`[PROSPECTO] ${message}`, obfuscatedData || '')
  },
  
  /**
   * Log de formData (ofusca todos los campos sensibles)
   */
  formData: (message: string, data?: any) => {
    const obfuscatedData = data ? obfuscateObject(data) : undefined
    console.log(`[FORM] ${message}`, obfuscatedData || '')
  }
}

/**
 * Función helper para ofuscar un valor específico
 * Útil cuando necesitas ofuscar un valor antes de pasarlo a console.log normal
 */
export function obfuscate(value: any): any {
  if (typeof value === 'object' && value !== null) {
    return obfuscateObject(value)
  }
  return obfuscateValue(value)
}

