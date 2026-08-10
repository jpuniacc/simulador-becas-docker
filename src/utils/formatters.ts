// Utilidades de formateo
import type { BeneficioElegible, DecilInfo, NacionalidadInfo, ColegioInfo } from '../types/beneficios'

/**
 * Formatea un monto en pesos chilenos
 */
export const formatCurrency = (amount: number, options: {
  showSymbol?: boolean
  showDecimals?: boolean
  locale?: string
} = {}): string => {
  const {
    showSymbol = true,
    showDecimals = false,
    locale = 'es-CL'
  } = options

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: showDecimals ? 0 : 0,
    maximumFractionDigits: showDecimals ? 0 : 0
  })

  let formatted = formatter.format(amount)

  if (!showSymbol) {
    formatted = formatted.replace('CLP', '').trim()
  }

  return formatted
}

/**
 * Formatea un monto en formato compacto (ej: 1.5M, 500K)
 */
export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  } else {
    return `$${amount.toFixed(0)}`
  }
}

/**
 * Formatea un RUT chileno
 */
export const formatRUT = (rut: string): string => {
  if (!rut || typeof rut !== 'string') return ''

  const cleanRut = rut.replace(/[^0-9kK]/g, '')

  if (cleanRut.length < 8) return rut

  const rutNumber = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1).toUpperCase()

  // Formatear con puntos y guión
  const formattedNumber = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${formattedNumber}-${dv}`
}

/**
 * Limpia un RUT para almacenamiento
 */
export const cleanRUT = (rut: string): string => {
  if (!rut || typeof rut !== 'string') return ''
  return rut.replace(/[^0-9kK]/g, '')
}

/**
 * Formatea un teléfono chileno
 */
export const formatPhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return ''

  const clean = phone.replace(/[^0-9+]/g, '')

  if (clean.startsWith('+569')) {
    return `+56 9 ${clean.slice(4, 8)} ${clean.slice(8)}`
  } else if (clean.startsWith('569')) {
    return `+56 9 ${clean.slice(3, 7)} ${clean.slice(7)}`
  } else if (clean.startsWith('9')) {
    return `9 ${clean.slice(1, 5)} ${clean.slice(5)}`
  }

  return phone
}

/**
 * Limpia un teléfono para almacenamiento
 */
export const cleanPhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return ''
  return phone.replace(/[^0-9+]/g, '')
}

/**
 * Formatea una fecha en formato chileno
 */
export const formatDate = (date: string | Date, options: {
  format?: 'short' | 'long' | 'medium'
  locale?: string
} = {}): string => {
  const { format = 'short', locale = 'es-CL' } = options

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) return ''

  const formatter = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: format === 'short' ? '2-digit' : format === 'long' ? 'long' : 'short',
    day: '2-digit'
  })

  return formatter.format(dateObj)
}

/**
 * Formatea una fecha relativa (ej: "hace 2 días")
 */
export const formatRelativeDate = (date: string | Date, locale: string = 'es-CL'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) return ''

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  const now = new Date()
  const diffInMs = dateObj.getTime() - now.getTime()
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24))

  if (Math.abs(diffInDays) < 1) {
    const diffInHours = Math.round(diffInMs / (1000 * 60 * 60))
    return rtf.format(diffInHours, 'hour')
  } else if (Math.abs(diffInDays) < 7) {
    return rtf.format(diffInDays, 'day')
  } else if (Math.abs(diffInDays) < 30) {
    const diffInWeeks = Math.round(diffInDays / 7)
    return rtf.format(diffInWeeks, 'week')
  } else if (Math.abs(diffInDays) < 365) {
    const diffInMonths = Math.round(diffInDays / 30)
    return rtf.format(diffInMonths, 'month')
  } else {
    const diffInYears = Math.round(diffInDays / 365)
    return rtf.format(diffInYears, 'year')
  }
}

/**
 * Formatea un porcentaje
 */
export const formatPercentage = (value: number, options: {
  showSymbol?: boolean
  decimals?: number
  locale?: string
} = {}): string => {
  const {
    showSymbol = true,
    decimals = 1,
    locale = 'es-CL'
  } = options

  const formatter = new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  let formatted = formatter.format(value / 100)

  if (!showSymbol) {
    formatted = formatted.replace('%', '').trim()
  }

  return formatted
}

/**
 * Formatea un número con separadores de miles
 */
export const formatNumber = (value: number, options: {
  decimals?: number
  locale?: string
} = {}): string => {
  const {
    decimals = 0,
    locale = 'es-CL'
  } = options

  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })

  return formatter.format(value)
}

/**
 * Formatea un decil socioeconómico
 */
export const formatDecil = (decil: number): string => {
  if (decil < 1 || decil > 10) return 'N/A'

  const decilNames = {
    1: 'Primer decil (más vulnerable)',
    2: 'Segundo decil',
    3: 'Tercer decil',
    4: 'Cuarto decil',
    5: 'Quinto decil',
    6: 'Sexto decil',
    7: 'Séptimo decil',
    8: 'Octavo decil',
    9: 'Noveno decil',
    10: 'Décimo decil (menos vulnerable)'
  }

  return decilNames[decil as keyof typeof decilNames] || 'N/A'
}

/**
 * Formatea un decil con información adicional
 */
export const formatDecilWithInfo = (decil: DecilInfo): string => {
  return `${decil.decil}° decil - ${decil.descripcionCorta}`
}

/**
 * Formatea un beneficio para mostrar
 */
export const formatBenefit = (beneficio: BeneficioElegible): string => {
  let formatted = beneficio.descripcion

  if (beneficio.porcentajeMaximo) {
    formatted += ` (${formatPercentage(beneficio.porcentajeMaximo)})`
  }

  if (beneficio.montoMaximo) {
    formatted += ` - ${formatCurrency(beneficio.montoMaximo)}`
  }

  return formatted
}

/**
 * Formatea un beneficio con descuento aplicado
 */
export const formatBenefitWithDiscount = (beneficio: BeneficioElegible, descuento: number): string => {
  let formatted = beneficio.descripcion

  if (descuento > 0) {
    formatted += ` - Descuento: ${formatCurrency(descuento)}`
  }

  return formatted
}

/**
 * Formatea una nacionalidad
 */
export const formatNationality = (nacionalidad: NacionalidadInfo): string => {
  return nacionalidad.nombreEspanol
}

/**
 * Formatea un colegio
 */
export const formatSchool = (colegio: ColegioInfo): string => {
  return `${colegio.nombre} (${colegio.dependencia})`
}

/**
 * Formatea un colegio con ubicación
 */
export const formatSchoolWithLocation = (colegio: ColegioInfo): string => {
  return `${colegio.nombre} - ${colegio.comuna}, ${colegio.region}`
}

/**
 * Formatea un NEM
 */
export const formatNEM = (nem: number): string => {
  return nem.toFixed(2)
}

/**
 * Formatea un ranking
 */
export const formatRanking = (ranking: number): string => {
  return ranking.toFixed(0)
}

/**
 * Formatea un puntaje PAES
 */
export const formatPAES = (puntaje: number): string => {
  return puntaje.toFixed(0)
}

/**
 * Formatea un puntaje total PAES
 */
export const formatPAESTotal = (puntajes: {
  matematica: number | null
  lenguaje: number | null
  ciencias: number | null
  historia: number | null
}): string => {
  const total = Object.values(puntajes).reduce((sum, puntaje) => sum + (puntaje || 0), 0)
  return total > 0 ? total.toFixed(0) : 'N/A'
}

/**
 * Formatea un año
 */
export const formatYear = (year: number): string => {
  return year.toString()
}

/**
 * Formatea una edad
 */
export const formatAge = (birthDate: string | Date): string => {
  const dateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate

  if (isNaN(dateObj.getTime())) return 'N/A'

  const today = new Date()
  const age = today.getFullYear() - dateObj.getFullYear()
  const monthDiff = today.getMonth() - dateObj.getMonth()

  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate()) ? age - 1 : age

  return `${actualAge} años`
}

/**
 * Formatea un período de tiempo
 */
export const formatDuration = (months: number): string => {
  if (months < 12) {
    return `${months} ${months === 1 ? 'mes' : 'meses'}`
  } else {
    const years = Math.floor(months / 12)
    const remainingMonths = months % 12

    let result = `${years} ${years === 1 ? 'año' : 'años'}`

    if (remainingMonths > 0) {
      result += ` ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`
    }

    return result
  }
}

/**
 * Formatea un tamaño de archivo
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Formatea un número de teléfono internacional
 */
export const formatInternationalPhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return ''

  const clean = phone.replace(/[^0-9+]/g, '')

  if (clean.startsWith('+')) {
    const countryCode = clean.slice(1, 3)
    const number = clean.slice(3)

    if (number.length >= 8) {
      return `+${countryCode} ${number.slice(0, 4)} ${number.slice(4)}`
    }
  }

  return phone
}

/**
 * Formatea un código postal chileno
 */
export const formatPostalCode = (code: string): string => {
  if (!code || typeof code !== 'string') return ''

  const clean = code.replace(/[^0-9]/g, '')

  if (clean.length === 7) {
    return `${clean.slice(0, 7)}`
  }

  return code
}

/**
 * Formatea un pasaporte
 */
export const formatPassport = (passport: string): string => {
  if (!passport || typeof passport !== 'string') return ''

  return passport.toUpperCase()
}

/**
 * Formatea un código de carrera
 */
export const formatCareerCode = (code: string): string => {
  if (!code || typeof code !== 'string') return ''

  return code.toUpperCase()
}

/**
 * Formatea un RBD de colegio
 */
export const formatRBD = (rbd: string): string => {
  if (!rbd || typeof rbd !== 'string') return ''

  const clean = rbd.replace(/[^0-9]/g, '')

  if (clean.length >= 5) {
    return clean
  }

  return rbd
}

/**
 * Formatea un nombre completo
 */
export const formatFullName = (nombre: string, apellido: string): string => {
  const cleanNombre = nombre?.trim() || ''
  const cleanApellido = apellido?.trim() || ''

  if (cleanNombre && cleanApellido) {
    return `${cleanNombre} ${cleanApellido}`
  } else if (cleanNombre) {
    return cleanNombre
  } else if (cleanApellido) {
    return cleanApellido
  }

  return ''
}

/**
 * Formatea un nombre con iniciales
 */
export const formatNameWithInitials = (nombre: string, apellido: string): string => {
  const cleanNombre = nombre?.trim() || ''
  const cleanApellido = apellido?.trim() || ''

  if (cleanNombre && cleanApellido) {
    const firstInitial = cleanNombre.charAt(0).toUpperCase()
    return `${firstInitial}. ${cleanApellido}`
  }

  return formatFullName(nombre, apellido)
}

/**
 * Formatea un email para mostrar
 */
export const formatEmail = (email: string): string => {
  if (!email || typeof email !== 'string') return ''

  return email.toLowerCase().trim()
}

/**
 * Formatea una URL
 */
export const formatURL = (url: string): string => {
  if (!url || typeof url !== 'string') return ''

  let formatted = url.trim()

  if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
    formatted = `https://${formatted}`
  }

  return formatted
}

/**
 * Formatea un texto con capitalización
 */
export const formatCapitalize = (text: string): string => {
  if (!text || typeof text !== 'string') return ''

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Formatea un texto con título
 */
export const formatTitle = (text: string): string => {
  if (!text || typeof text !== 'string') return ''

  return text
    .toLowerCase()
    .split(' ')
    .map(word => {
      if (word.length <= 3) return word
      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

/**
 * Formatea un texto truncado
 */
export const formatTruncate = (text: string, maxLength: number, suffix: string = '...'): string => {
  if (!text || typeof text !== 'string') return ''

  if (text.length <= maxLength) return text

  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Formatea un texto con saltos de línea
 */
export const formatLineBreaks = (text: string): string => {
  if (!text || typeof text !== 'string') return ''

  return text.replace(/\n/g, '<br>')
}

/**
 * Formatea un texto con enlaces
 */
export const formatLinks = (text: string): string => {
  if (!text || typeof text !== 'string') return ''

  const urlRegex = /(https?:\/\/[^\s]+)/g
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
}

/**
 * Formatea un texto con markdown básico
 */
export const formatMarkdown = (text: string): string => {
  if (!text || typeof text !== 'string') return ''

  let formatted = text

  // Bold
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Italic
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Links
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')

  // Line breaks
  formatted = formatted.replace(/\n/g, '<br>')

  return formatted
}

/**
 * Formatea un texto con números de teléfono
 */
export const formatPhoneNumbers = (text: string): string => {
  if (!text || typeof text !== 'string') return ''

  const phoneRegex = /(\+?56\s?9\s?\d{4}\s?\d{4})/g
  return text.replace(phoneRegex, '<a href="tel:$1">$1</a>')
}

/**
 * Formatea un texto con emails
 */
export const formatEmails = (text: string): string => {
  if (!text || typeof text !== 'string') return ''

  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g
  return text.replace(emailRegex, '<a href="mailto:$1">$1</a>')
}
