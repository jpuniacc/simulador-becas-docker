// Utilidades de validación
import type { FormData, ValidationError } from '../types/simulador'
import type { ValidationRule } from '../types/forms'

/**
 * Valida un RUT chileno
 */
export const validateRUT = (rut: string): boolean => {
  if (!rut || typeof rut !== 'string') return false

  // Limpiar el RUT
  const cleanRut = rut.replace(/[^0-9kK]/g, '')

  if (cleanRut.length < 8) return false

  const rutNumber = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1).toUpperCase()

  // Validar que el número del RUT sea válido
  if (!/^\d+$/.test(rutNumber)) return false

  // Calcular dígito verificador
  let sum = 0
  let multiplier = 2

  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const remainder = sum % 11
  const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'K' : (11 - remainder).toString()

  return dv === calculatedDV
}

/**
 * Valida un email
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== 'string') return false

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Valida un teléfono chileno
 */
export const validatePhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false

  // Limpiar el teléfono
  const cleanPhone = phone.replace(/[^0-9+]/g, '')

  // Validar formato chileno: +569XXXXXXXX o 9XXXXXXXX
  const phoneRegex = /^(\+?569|9)\d{8}$/
  return phoneRegex.test(cleanPhone)
}

/**
 * Valida un NEM (Notas de Enseñanza Media)
 */
export const validateNEM = (nem: number): boolean => {
  if (nem === null || nem === undefined) return false
  return nem >= 1.0 && nem <= 7.0
}

/**
 * Valida un ranking de notas
 */
export const validateRanking = (ranking: number): boolean => {
  if (ranking === null || ranking === undefined) return false
  return ranking >= 0 && ranking <= 1000
}

/**
 * Valida un puntaje PAES
 */
export const validatePAES = (puntaje: number): boolean => {
  if (puntaje === null || puntaje === undefined) return false
  return puntaje >= 100 && puntaje <= 1000
}

/**
 * Valida una fecha de nacimiento
 */
export const validateBirthDate = (date: string): boolean => {
  if (!date || typeof date !== 'string') return false

  const birthDate = new Date(date)
  const today = new Date()
  const age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  // Verificar que la fecha sea válida
  if (isNaN(birthDate.getTime())) return false

  // Verificar que no sea una fecha futura
  if (birthDate > today) return false

  // Verificar que la edad esté en un rango razonable (12-100 años)
  const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age
  return actualAge >= 12 && actualAge <= 100
}

/**
 * Valida un año de egreso
 */
export const validateGraduationYear = (year: number): boolean => {
  if (year === null || year === undefined) return false

  const currentYear = new Date().getFullYear()
  return year >= 2000 && year <= currentYear
}

/**
 * Valida un ingreso mensual
 */
export const validateMonthlyIncome = (income: number): boolean => {
  if (income === null || income === undefined) return false
  return income >= 0 && income <= 10000000 // Máximo 10 millones CLP
}

/**
 * Valida número de integrantes de familia
 */
export const validateFamilyMembers = (members: number): boolean => {
  if (members === null || members === undefined) return false
  return members >= 1 && members <= 20
}

/**
 * Valida un nombre (solo letras y espacios)
 */
export const validateName = (name: string): boolean => {
  if (!name || typeof name !== 'string') return false

  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/
  return nameRegex.test(name.trim()) && name.trim().length >= 2
}

/**
 * Valida un apellido (solo letras y espacios)
 */
export const validateLastName = (lastName: string): boolean => {
  return validateName(lastName)
}

/**
 * Valida un código de carrera
 */
export const validateCareerCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false

  const codeRegex = /^[A-Z]{2,4}\d{2,4}$/
  return codeRegex.test(code.trim())
}

/**
 * Valida un RBD de colegio
 */
export const validateRBD = (rbd: string): boolean => {
  if (!rbd || typeof rbd !== 'string') return false

  const rbdRegex = /^\d{5,6}$/
  return rbdRegex.test(rbd.trim())
}

/**
 * Valida un código de región
 */
export const validateRegionCode = (code: number): boolean => {
  if (code === null || code === undefined) return false
  return code >= 1 && code <= 16
}

/**
 * Valida un código de comuna
 */
export const validateComunaCode = (code: number): boolean => {
  if (code === null || code === undefined) return false
  return code >= 1 && code <= 999
}

/**
 * Valida un decil socioeconómico
 */
export const validateDecil = (decil: number): boolean => {
  if (decil === null || decil === undefined) return false
  return decil >= 1 && decil <= 10
}

/**
 * Valida un porcentaje
 */
export const validatePercentage = (percentage: number): boolean => {
  if (percentage === null || percentage === undefined) return false
  return percentage >= 0 && percentage <= 100
}

/**
 * Valida un monto monetario
 */
export const validateAmount = (amount: number): boolean => {
  if (amount === null || amount === undefined) return false
  return amount >= 0 && amount <= 999999999 // Máximo 999 millones CLP
}

/**
 * Valida una URL
 */
export const validateURL = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Valida un número de teléfono internacional
 */
export const validateInternationalPhone = (phone: string): boolean => {
  if (!phone || typeof phone !== 'string') return false

  // Limpiar el teléfono
  const cleanPhone = phone.replace(/[^0-9+]/g, '')

  // Validar formato internacional: +[código país][número]
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  return phoneRegex.test(cleanPhone)
}

/**
 * Valida un código postal chileno
 */
export const validatePostalCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false

  const postalRegex = /^\d{7}$/
  return postalRegex.test(code.trim())
}

/**
 * Valida un número de pasaporte
 */
export const validatePassport = (passport: string): boolean => {
  if (!passport || typeof passport !== 'string') return false

  // Formato básico de pasaporte (letras y números, 6-12 caracteres)
  const passportRegex = /^[A-Z0-9]{6,12}$/
  return passportRegex.test(passport.trim().toUpperCase())
}

/**
 * Valida un código de nacionalidad ISO
 */
export const validateNationalityCode = (code: string): boolean => {
  if (!code || typeof code !== 'string') return false

  const isoRegex = /^[A-Z]{2,3}$/
  return isoRegex.test(code.trim().toUpperCase())
}

/**
 * Valida un año
 */
export const validateYear = (year: number): boolean => {
  if (year === null || year === undefined) return false

  const currentYear = new Date().getFullYear()
  return year >= 1900 && year <= currentYear + 10
}

/**
 * Valida un mes
 */
export const validateMonth = (month: number): boolean => {
  if (month === null || month === undefined) return false
  return month >= 1 && month <= 12
}

/**
 * Valida un día
 */
export const validateDay = (day: number): boolean => {
  if (day === null || day === undefined) return false
  return day >= 1 && day <= 31
}

/**
 * Valida un campo requerido
 */
export const validateRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'number') return !isNaN(value)
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value).length > 0
  return true
}

/**
 * Valida un campo con longitud mínima
 */
export const validateMinLength = (value: string, minLength: number): boolean => {
  if (!value || typeof value !== 'string') return false
  return value.trim().length >= minLength
}

/**
 * Valida un campo con longitud máxima
 */
export const validateMaxLength = (value: string, maxLength: number): boolean => {
  if (!value || typeof value !== 'string') return false
  return value.trim().length <= maxLength
}

/**
 * Valida un campo con valor mínimo
 */
export const validateMin = (value: number, min: number): boolean => {
  if (value === null || value === undefined) return false
  return value >= min
}

/**
 * Valida un campo con valor máximo
 */
export const validateMax = (value: number, max: number): boolean => {
  if (value === null || value === undefined) return false
  return value <= max
}

/**
 * Valida un campo con patrón regex
 */
export const validatePattern = (value: string, pattern: string | RegExp): boolean => {
  if (!value || typeof value !== 'string') return false

  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern
  return regex.test(value)
}

/**
 * Valida un campo con función personalizada
 */
export const validateCustom = (value: any, validator: (value: any) => boolean): boolean => {
  try {
    return validator(value)
  } catch {
    return false
  }
}

/**
 * Valida un campo con función asíncrona
 */
export const validateAsync = async (value: any, validator: (value: any) => Promise<boolean>): Promise<boolean> => {
  try {
    return await validator(value)
  } catch {
    return false
  }
}

/**
 * Valida un formulario completo
 */
export const validateForm = (data: FormData, rules: Record<string, ValidationRule[]>): ValidationError[] => {
  const errors: ValidationError[] = []

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = (data as any)[field]

    for (const rule of fieldRules) {
      let isValid = true

      switch (rule.type) {
        case 'required':
          isValid = validateRequired(value)
          break
        case 'email':
          isValid = validateEmail(value)
          break
        case 'rut':
          isValid = validateRUT(value)
          break
        case 'phone':
          isValid = validatePhone(value)
          break
        case 'min':
          isValid = validateMin(value, rule.value)
          break
        case 'max':
          isValid = validateMax(value, rule.value)
          break
        case 'minLength':
          isValid = validateMinLength(value, rule.value)
          break
        case 'maxLength':
          isValid = validateMaxLength(value, rule.value)
          break
        case 'pattern':
          isValid = validatePattern(value, rule.value)
          break
        case 'custom':
          isValid = rule.validator ? validateCustom(value, rule.validator) : true
          break
        default:
          isValid = true
      }

      if (!isValid) {
        errors.push({
          field,
          message: rule.message,
          code: rule.type
        })
        break // Solo mostrar el primer error por campo
      }
    }
  }

  return errors
}

/**
 * Valida un campo específico
 */
export const validateField = (value: any, rules: ValidationRule[]): ValidationError | null => {
  for (const rule of rules) {
    let isValid = true

    switch (rule.type) {
      case 'required':
        isValid = validateRequired(value)
        break
      case 'email':
        isValid = validateEmail(value)
        break
      case 'rut':
        isValid = validateRUT(value)
        break
      case 'phone':
        isValid = validatePhone(value)
        break
      case 'min':
        isValid = validateMin(value, rule.value)
        break
      case 'max':
        isValid = validateMax(value, rule.value)
        break
      case 'minLength':
        isValid = validateMinLength(value, rule.value)
        break
      case 'maxLength':
        isValid = validateMaxLength(value, rule.value)
        break
      case 'pattern':
        isValid = validatePattern(value, rule.value)
        break
      case 'custom':
        isValid = rule.validator ? validateCustom(value, rule.validator) : true
        break
      default:
        isValid = true
    }

    if (!isValid) {
      return {
        field: '',
        message: rule.message,
        code: rule.type
      }
    }
  }

  return null
}

/**
 * Valida un campo con validación asíncrona
 */
export const validateFieldAsync = async (value: any, rules: ValidationRule[]): Promise<ValidationError | null> => {
  for (const rule of rules) {
    let isValid = true

    if (rule.async && rule.validator) {
      isValid = await validateAsync(value, rule.validator)
    } else {
      isValid = validateField(value, [rule]) === null
    }

    if (!isValid) {
      return {
        field: '',
        message: rule.message,
        code: rule.type
      }
    }
  }

  return null
}

/**
 * Valida un formulario con validación asíncrona
 */
export const validateFormAsync = async (data: FormData, rules: Record<string, ValidationRule[]>): Promise<ValidationError[]> => {
  const errors: ValidationError[] = []

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = (data as any)[field]
    const error = await validateFieldAsync(value, fieldRules)

    if (error) {
      error.field = field
      errors.push(error)
    }
  }

  return errors
}

/**
 * Limpia y formatea un RUT
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
 * Limpia un RUT para validación
 */
export const cleanRUT = (rut: string): string => {
  if (!rut || typeof rut !== 'string') return ''
  return rut.replace(/[^0-9kK]/g, '')
}

/**
 * Limpia un teléfono para validación
 */
export const cleanPhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return ''
  return phone.replace(/[^0-9+]/g, '')
}

/**
 * Formatea un teléfono chileno
 */
export const formatPhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') return ''

  const clean = cleanPhone(phone)

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
 * Valida si un valor está vacío
 */
export const isEmpty = (value: any): boolean => {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Valida si un valor no está vacío
 */
export const isNotEmpty = (value: any): boolean => {
  return !isEmpty(value)
}

/**
 * Valida si un valor es un número
 */
export const isNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * Valida si un valor es un entero
 */
export const isInteger = (value: any): boolean => {
  return isNumber(value) && Number.isInteger(value)
}

/**
 * Valida si un valor es un decimal
 */
export const isDecimal = (value: any): boolean => {
  return isNumber(value) && !Number.isInteger(value)
}

/**
 * Valida si un valor es una cadena
 */
export const isString = (value: any): boolean => {
  return typeof value === 'string'
}

/**
 * Valida si un valor es un booleano
 */
export const isBoolean = (value: any): boolean => {
  return typeof value === 'boolean'
}

/**
 * Valida si un valor es una fecha
 */
export const isDate = (value: any): boolean => {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * Valida si un valor es un array
 */
export const isArray = (value: any): boolean => {
  return Array.isArray(value)
}

/**
 * Valida si un valor es un objeto
 */
export const isObject = (value: any): boolean => {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
