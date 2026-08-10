// Composable para validación de formularios
import { ref, computed, watch, nextTick } from 'vue'
import type { FormData, ValidationError, ValidationRule } from '../types/simulador'
import type { FormField, FormError, FormValidation, FormState, FormActions } from '../types/forms'
import {
  validateForm,
  validateField,
  validateFieldAsync,
  validateFormAsync,
  validateRUT,
  validateEmail,
  validatePhone,
  validateNEM,
  validateRanking,
  validatePAES,
  validateBirthDate,
  validateGraduationYear,
  validateMonthlyIncome,
  validateFamilyMembers,
  validateName,
  validateRequired,
  validateMin,
  validateMax,
  validateMinLength,
  validateMaxLength,
  validatePattern,
  validateCustom
} from '../utils/validation'

export interface UseFormValidationOptions {
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit'
  debounceMs?: number
  showErrors?: boolean
  showWarnings?: boolean
  validateOnMount?: boolean
}

export function useFormValidation(
  initialData: FormData,
  validationRules: Record<string, ValidationRule[]>,
  options: UseFormValidationOptions = {}
) {
  const {
    validationMode = 'onBlur',
    debounceMs = 300,
    showErrors = true,
    showWarnings = true,
    validateOnMount = false
  } = options

  // Estado del formulario
  const formData = ref<FormData>({ ...initialData })
  const errors = ref<FormError[]>([])
  const warnings = ref<FormError[]>([])
  const touched = ref<Set<string>>(new Set())
  const dirty = ref<Set<string>>(new Set())
  const focused = ref<Set<string>>(new Set())
  const validating = ref<Set<string>>(new Set())
  const isSubmitting = ref(false)
  const submitCount = ref(0)
  const lastSubmitTime = ref<Date | null>(null)
  const submitError = ref<string | null>(null)

  // Debounce para validación
  const debounceTimeouts = ref<Map<string, NodeJS.Timeout>>(new Map())

  // Computed
  const isValid = computed(() => errors.value.length === 0)
  const isDirty = computed(() => dirty.value.size > 0)
  const hasErrors = computed(() => errors.value.length > 0)
  const hasWarnings = computed(() => warnings.value.length > 0)
  const isTouched = computed(() => touched.value.size > 0)
  const isFocused = computed(() => focused.value.size > 0)
  const isValidationInProgress = computed(() => validating.value.size > 0)

  // Validación de campos específicos
  const validateFieldValue = async (fieldName: string, value: any): Promise<FormError | null> => {
    const rules = validationRules[fieldName] || []
    if (rules.length === 0) return null

    // Marcar como validando
    validating.value.add(fieldName)

    try {
      // Limpiar timeout anterior si existe
      const existingTimeout = debounceTimeouts.value.get(fieldName)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Aplicar debounce
      if (debounceMs > 0) {
        await new Promise(resolve => {
          const timeout = setTimeout(resolve, debounceMs)
          debounceTimeouts.value.set(fieldName, timeout)
        })
      }

      // Validar campo
      const error = await validateFieldAsync(value, rules)

      if (error) {
        error.field = fieldName
        return error
      }

      return null
    } finally {
      // Remover de validando
      validating.value.delete(fieldName)
    }
  }

  // Validación de formulario completo
  const validateFormData = async (): Promise<FormValidation> => {
    const formErrors = await validateFormAsync(formData.value, validationRules)

    // Convertir errores de validación a errores de formulario
    const formValidationErrors: FormError[] = formErrors.map(error => ({
      field: error.field,
      message: error.message,
      code: error.code,
      level: 'error' as const
    }))

    // Limpiar errores anteriores
    errors.value = []
    warnings.value = []

    // Agregar nuevos errores
    errors.value = formValidationErrors

    return {
      isValid: formValidationErrors.length === 0,
      errors: formValidationErrors,
      warnings: warnings.value,
      validFields: Object.keys(validationRules).filter(field =>
        !formValidationErrors.some(error => error.field === field)
      ),
      invalidFields: formValidationErrors.map(error => error.field),
      pendingFields: Array.from(validating.value)
    }
  }

  // Validación de campo individual
  const validateField = async (fieldName: string): Promise<boolean> => {
    const value = (formData.value as any)[fieldName]
    const error = await validateFieldValue(fieldName, value)

    if (error) {
      // Agregar error
      const existingErrorIndex = errors.value.findIndex(e => e.field === fieldName)
      if (existingErrorIndex >= 0) {
        errors.value[existingErrorIndex] = error
      } else {
        errors.value.push(error)
      }
      return false
    } else {
      // Remover error
      errors.value = errors.value.filter(e => e.field !== fieldName)
      return true
    }
  }

  // Validación de múltiples campos
  const validateFields = async (fieldNames: string[]): Promise<boolean> => {
    const results = await Promise.all(
      fieldNames.map(fieldName => validateField(fieldName))
    )
    return results.every(result => result)
  }

  // Validación de paso del wizard
  const validateStep = async (stepFields: string[]): Promise<boolean> => {
    return await validateFields(stepFields)
  }

  // Limpiar errores de un campo
  const clearFieldError = (fieldName: string) => {
    errors.value = errors.value.filter(e => e.field !== fieldName)
    warnings.value = warnings.value.filter(w => w.field !== fieldName)
  }

  // Limpiar todos los errores
  const clearAllErrors = () => {
    errors.value = []
    warnings.value = []
  }

  // Limpiar warnings de un campo
  const clearFieldWarning = (fieldName: string) => {
    warnings.value = warnings.value.filter(w => w.field !== fieldName)
  }

  // Limpiar todos los warnings
  const clearAllWarnings = () => {
    warnings.value = []
  }

  // Obtener error de un campo
  const getFieldError = (fieldName: string): FormError | undefined => {
    return errors.value.find(e => e.field === fieldName)
  }

  // Obtener warning de un campo
  const getFieldWarning = (fieldName: string): FormError | undefined => {
    return warnings.value.find(w => w.field === fieldName)
  }

  // Obtener mensaje de error de un campo
  const getFieldErrorMessage = (fieldName: string): string => {
    const error = getFieldError(fieldName)
    return error?.message || ''
  }

  // Obtener mensaje de warning de un campo
  const getFieldWarningMessage = (fieldName: string): string => {
    const warning = getFieldWarning(fieldName)
    return warning?.message || ''
  }

  // Verificar si un campo tiene error
  const hasFieldError = (fieldName: string): boolean => {
    return errors.value.some(e => e.field === fieldName)
  }

  // Verificar si un campo tiene warning
  const hasFieldWarning = (fieldName: string): boolean => {
    return warnings.value.some(w => w.field === fieldName)
  }

  // Verificar si un campo es válido
  const isFieldValid = (fieldName: string): boolean => {
    return !hasFieldError(fieldName)
  }

  // Verificar si un campo está siendo validado
  const isFieldValidating = (fieldName: string): boolean => {
    return validating.value.has(fieldName)
  }

  // Verificar si un campo ha sido tocado
  const isFieldTouched = (fieldName: string): boolean => {
    return touched.value.has(fieldName)
  }

  // Verificar si un campo está sucio
  const isFieldDirty = (fieldName: string): boolean => {
    return dirty.value.has(fieldName)
  }

  // Verificar si un campo está enfocado
  const isFieldFocused = (fieldName: string): boolean => {
    return focused.value.has(fieldName)
  }

  // Marcar campo como tocado
  const touchField = (fieldName: string) => {
    touched.value.add(fieldName)
  }

  // Marcar campo como sucio
  const dirtyField = (fieldName: string) => {
    dirty.value.add(fieldName)
  }

  // Marcar campo como enfocado
  const focusField = (fieldName: string) => {
    focused.value.add(fieldName)
  }

  // Marcar campo como no enfocado
  const blurField = (fieldName: string) => {
    focused.value.delete(fieldName)

    // Validar campo al perder el foco si está en modo onBlur
    if (validationMode === 'onBlur') {
      validateField(fieldName)
    }
  }

  // Actualizar valor de campo
  const updateField = (fieldName: string, value: any) => {
    (formData.value as any)[fieldName] = value

    // Marcar como sucio
    dirtyField(fieldName)

    // Validar campo si está en modo onChange
    if (validationMode === 'onChange') {
      validateField(fieldName)
    }
  }

  // Actualizar múltiples campos
  const updateFields = (updates: Partial<FormData>) => {
    Object.entries(updates).forEach(([fieldName, value]) => {
      updateField(fieldName, value)
    })
  }

  // Resetear formulario
  const resetForm = () => {
    formData.value = { ...initialData }
    errors.value = []
    warnings.value = []
    touched.value.clear()
    dirty.value.clear()
    focused.value.clear()
    validating.value.clear()
    isSubmitting.value = false
    submitCount.value = 0
    lastSubmitTime.value = null
    submitError.value = null

    // Limpiar timeouts
    debounceTimeouts.value.forEach(timeout => clearTimeout(timeout))
    debounceTimeouts.value.clear()
  }

  // Resetear campo
  const resetField = (fieldName: string) => {
    (formData.value as any)[fieldName] = (initialData as any)[fieldName]
    clearFieldError(fieldName)
    clearFieldWarning(fieldName)
    touched.value.delete(fieldName)
    dirty.value.delete(fieldName)
    focused.value.delete(fieldName)
    validating.value.delete(fieldName)
  }

  // Enviar formulario
  const submitForm = async (): Promise<boolean> => {
    isSubmitting.value = true
    submitError.value = null

    try {
      // Validar formulario completo
      const validation = await validateFormData()

      if (!validation.isValid) {
        return false
      }

      // Incrementar contador de envíos
      submitCount.value++
      lastSubmitTime.value = new Date()

      return true
    } catch (error) {
      submitError.value = error instanceof Error ? error.message : 'Error desconocido'
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  // Watchers para validación automática con debounce
  let validationTimeout: NodeJS.Timeout | null = null

  watch(
    formData,
    (newData, oldData) => {
      if (!oldData) return

      // Limpiar timeout anterior
      if (validationTimeout) {
        clearTimeout(validationTimeout)
      }

      // Debounce para validación
      validationTimeout = setTimeout(() => {
        // Validar campos que han cambiado
        Object.keys(newData).forEach(fieldName => {
          const newValue = (newData as any)[fieldName]
          const oldValue = (oldData as any)[fieldName]

          if (newValue !== oldValue) {
            dirtyField(fieldName)

            if (validationMode === 'onChange') {
              validateField(fieldName)
            }
          }
        })
      }, 300) // Debounce de 300ms
    },
    { deep: true }
  )

  // Validación inicial si está habilitada
  if (validateOnMount) {
    nextTick(() => {
      validateFormData()
    })
  }

  // Estado del formulario
  const formState: FormState = {
    currentStep: 0,
    totalSteps: 0,
    isCompleted: false,
    isValid: isValid.value,
    isSubmitting: isSubmitting.value,
    errors: errors.value,
    warnings: warnings.value,
    touched: touched.value,
    dirty: dirty.value,
    values: formData.value,
    initialValues: initialData
  }

  // Acciones del formulario
  const formActions: FormActions = {
    nextStep: () => {},
    prevStep: () => {},
    goToStep: () => {},
    setValue: updateField,
    setValues: updateFields,
    reset: resetForm,
    validate: validateFormData,
    validateField: validateField,
    submit: submitForm,
    save: async () => {},
    load: (data: FormData) => {
      formData.value = { ...data }
    }
  }

  return {
    // Estado
    formData,
    errors,
    warnings,
    touched,
    dirty,
    focused,
    validating,
    isSubmitting,
    submitCount,
    lastSubmitTime,
    submitError,

    // Computed
    isValid,
    isDirty,
    hasErrors,
    hasWarnings,
    isTouched,
    isFocused,
    isValidationInProgress,

    // Métodos de validación
    validateFormData,
    validateField,
    validateFields,
    validateStep,
    validateFieldValue,

    // Métodos de limpieza
    clearFieldError,
    clearAllErrors,
    clearFieldWarning,
    clearAllWarnings,

    // Métodos de consulta
    getFieldError,
    getFieldWarning,
    getFieldErrorMessage,
    getFieldWarningMessage,
    hasFieldError,
    hasFieldWarning,
    isFieldValid,
    isFieldValidating,
    isFieldTouched,
    isFieldDirty,
    isFieldFocused,

    // Métodos de estado
    touchField,
    dirtyField,
    focusField,
    blurField,
    updateField,
    updateFields,
    resetForm,
    resetField,
    submitForm,

    // Estado y acciones
    formState,
    formActions
  }
}

// Composable específico para validación de campos del simulador
export function useSimulatorValidation(initialData: FormData) {
  const validationRules: Record<string, ValidationRule[]> = {
    // Datos Personales
    nombre: [
      { type: 'required', message: 'El nombre es requerido' },
      { type: 'custom', message: 'El nombre debe tener al menos 2 caracteres', validator: (value) => validateName(value) }
    ],
    apellido: [
      { type: 'required', message: 'El apellido es requerido' },
      { type: 'custom', message: 'El apellido debe tener al menos 2 caracteres', validator: (value) => validateName(value) }
    ],
    email: [
      { type: 'required', message: 'El email es requerido' },
      { type: 'email', message: 'El email debe ser válido' }
    ],
    telefono: [
      { type: 'required', message: 'El teléfono es requerido' },
      { type: 'custom', message: 'El teléfono debe ser válido', validator: (value) => validatePhone(value) }
    ],
    identificacion: [
      { type: 'required', message: 'La identificación es requerida' },
      { type: 'custom', message: 'La identificación debe ser válida', validator: (value, data) => {
        if (data?.tipoIdentificacion === 'rut') {
          return validateRUT(value)
        } else if (data?.tipoIdentificacion === 'pasaporte') {
          return value && value.length >= 6 && value.length <= 12
        }
        return false
      }}
    ],
    nacionalidad: [
      { type: 'required', message: 'La nacionalidad es requerida' }
    ],
    fechaNacimiento: [
      { type: 'required', message: 'La fecha de nacimiento es requerida' },
      { type: 'custom', message: 'La fecha de nacimiento debe ser válida', validator: (value) => validateBirthDate(value) }
    ],

    // Datos Académicos
    nivelEducativo: [
      { type: 'required', message: 'El nivel educativo es requerido' }
    ],
    colegio: [
      { type: 'required', message: 'El colegio es requerido' }
    ],
    carrera: [
      { type: 'required', message: 'La carrera es requerida' }
    ],
    nem: [
      { type: 'custom', message: 'El NEM debe estar entre 1.0 y 7.0', validator: (value) => !value || validateNEM(value) }
    ],
    ranking: [
      { type: 'custom', message: 'El ranking debe estar entre 0 y 1000', validator: (value) => !value || validateRanking(value) }
    ],
    añoEgreso: [
      { type: 'custom', message: 'El año de egreso debe ser válido', validator: (value) => !value || validateGraduationYear(parseInt(value)) }
    ],

    // Datos Socioeconómicos
    ingresoMensual: [
      { type: 'required', message: 'El ingreso mensual es requerido' },
      { type: 'custom', message: 'El ingreso mensual debe ser válido', validator: (value) => validateMonthlyIncome(value) }
    ],
    integrantes: [
      { type: 'required', message: 'El número de integrantes es requerido' },
      { type: 'custom', message: 'El número de integrantes debe ser válido', validator: (value) => validateFamilyMembers(parseInt(value)) }
    ],

    // PAES
    'paes.matematica': [
      { type: 'custom', message: 'El puntaje PAES debe estar entre 100 y 1000', validator: (value) => !value || validatePAES(value) }
    ],
    'paes.lenguaje': [
      { type: 'custom', message: 'El puntaje PAES debe estar entre 100 y 1000', validator: (value) => !value || validatePAES(value) }
    ],
    'paes.ciencias': [
      { type: 'custom', message: 'El puntaje PAES debe estar entre 100 y 1000', validator: (value) => !value || validatePAES(value) }
    ],
    'paes.historia': [
      { type: 'custom', message: 'El puntaje PAES debe estar entre 100 y 1000', validator: (value) => !value || validatePAES(value) }
    ]
  }

  return useFormValidation(initialData, validationRules, {
    validationMode: 'onBlur',
    debounceMs: 300,
    showErrors: true,
    showWarnings: true,
    validateOnMount: false
  })
}
