// Tipos para formularios y validación
import type { FormData } from './simulador'

export interface FormField {
  name: keyof FormData | string
  label: string
  type: 'text' | 'email' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'tel' | 'textarea' | 'password'
  required: boolean
  placeholder?: string
  options?: FormFieldOption[]
  validation?: ValidationRule[]
  dependsOn?: string
  showWhen?: (data: FormData) => boolean
  step: number
  group?: string
  helpText?: string
  disabled?: boolean
  readonly?: boolean
  maxLength?: number
  minLength?: number
  min?: number
  max?: number
  stepSize?: number
  pattern?: string
  autocomplete?: string
  multiple?: boolean
  accept?: string
  rows?: number
  cols?: number
}

export interface FormFieldOption {
  value: string | number
  label: string
  disabled?: boolean
  description?: string
  icon?: string
  group?: string
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom' | 'rut' | 'phone' | 'minLength' | 'maxLength' | 'url' | 'date' | 'number' | 'integer' | 'decimal' | 'alpha' | 'alphanumeric' | 'numeric'
  value?: any
  message: string
  validator?: (value: any, data?: FormData) => boolean | Promise<boolean>
  async?: boolean
  debounce?: number
}

export interface FormError {
  field: string
  message: string
  code?: string
  level?: 'error' | 'warning' | 'info'
}

export interface FormStep {
  id: number
  title: string
  description: string
  fields: FormField[]
  validation: (data: FormData) => boolean | Promise<boolean>
  isOptional?: boolean
  showProgress?: boolean
  allowSkip?: boolean
  icon?: string
  color?: string
}

export interface FormConfig {
  steps: FormStep[]
  allowBackNavigation: boolean
  saveProgress: boolean
  autoSave: boolean
  showProgressBar: boolean
  showStepNumbers: boolean
  theme: 'light' | 'dark' | 'auto'
  language: 'es' | 'en'
  validationMode: 'onChange' | 'onBlur' | 'onSubmit'
  errorDisplayMode: 'inline' | 'tooltip' | 'modal'
}

export interface FormState {
  currentStep: number
  totalSteps: number
  isCompleted: boolean
  isValid: boolean
  isSubmitting: boolean
  errors: FormError[]
  warnings: FormError[]
  touched: Set<string>
  dirty: Set<string>
  values: FormData
  initialValues: FormData
}

export interface FormActions {
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  setValue: (field: string, value: any) => void
  setValues: (values: Partial<FormData>) => void
  reset: () => void
  validate: () => Promise<boolean>
  validateField: (field: string) => Promise<boolean>
  submit: () => Promise<void>
  save: () => Promise<void>
  load: (data: FormData) => void
}

export interface FieldState {
  value: any
  error?: string
  warning?: string
  touched: boolean
  dirty: boolean
  focused: boolean
  validating: boolean
}

export interface FormValidation {
  isValid: boolean
  errors: FormError[]
  warnings: FormError[]
  validFields: string[]
  invalidFields: string[]
  pendingFields: string[]
}

export interface AsyncValidation {
  field: string
  promise: Promise<boolean>
  message?: string
}

export interface FormSubmission {
  isSubmitting: boolean
  submitCount: number
  lastSubmitTime?: Date
  submitError?: string
}

export interface FormPersistence {
  enabled: boolean
  key: string
  storage: 'localStorage' | 'sessionStorage' | 'indexedDB'
  debounce: number
  exclude: string[]
}

export interface FormAnalytics {
  stepTimes: Record<number, number>
  fieldInteractions: Record<string, number>
  validationErrors: Record<string, number>
  completionRate: number
  abandonmentPoints: number[]
  totalTime: number
}

export interface FormAccessibility {
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaLabelledBy?: string
  role?: string
  tabIndex?: number
  autoFocus?: boolean
}

export interface FormFieldAccessibility {
  ariaLabel?: string
  ariaDescribedBy?: string
  ariaInvalid?: boolean
  ariaRequired?: boolean
  role?: string
  tabIndex?: number
}

export interface FormTheme {
  primary: string
  secondary: string
  success: string
  warning: string
  error: string
  info: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  borderRadius: string
  spacing: string
  fontSize: string
  fontFamily: string
}

export interface FormLayout {
  direction: 'vertical' | 'horizontal'
  alignment: 'start' | 'center' | 'end' | 'stretch'
  spacing: 'tight' | 'normal' | 'loose'
  columns: number
  responsive: boolean
  breakpoints: Record<string, number>
}

export interface FormAnimation {
  enabled: boolean
  type: 'slide' | 'fade' | 'scale' | 'none'
  duration: number
  easing: string
  direction: 'left' | 'right' | 'up' | 'down'
}

export interface FormNotification {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  position: 'top' | 'bottom' | 'center'
  action?: {
    label: string
    handler: () => void
  }
}

export interface FormConditionalLogic {
  field: string
  condition: 'equals' | 'notEquals' | 'contains' | 'notContains' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'in' | 'notIn' | 'isEmpty' | 'isNotEmpty'
  value: any
  action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional' | 'setValue' | 'clearValue'
  targetValue?: any
}

export interface FormDependency {
  field: string
  dependsOn: string[]
  condition: (values: FormData) => boolean
  action: (field: FormField, values: FormData) => Partial<FormField>
}

export interface FormValidationSchema {
  [key: string]: ValidationRule[]
}

export interface FormStepValidation {
  [step: number]: (data: FormData) => boolean | Promise<boolean>
}

export interface FormFieldValidation {
  [field: string]: ValidationRule[]
}

export interface FormErrorMapping {
  [errorCode: string]: string
}

export interface FormLocalization {
  [key: string]: string
}

export interface FormCustomization {
  theme: FormTheme
  layout: FormLayout
  animation: FormAnimation
  accessibility: FormAccessibility
  localization: FormLocalization
}

export interface FormHook {
  formState: FormState
  formActions: FormActions
  fieldState: (field: string) => FieldState
  validation: FormValidation
  submission: FormSubmission
  analytics: FormAnalytics
}

export interface FormProvider {
  config: FormConfig
  customization: FormCustomization
  persistence: FormPersistence
  validationSchema: FormValidationSchema
  errorMapping: FormErrorMapping
  localization: FormLocalization
}

export interface FormContext {
  form: FormHook
  provider: FormProvider
  step: FormStep
  field: FormField
  value: any
  error?: string
  warning?: string
  touched: boolean
  dirty: boolean
  focused: boolean
  validating: boolean
  setValue: (value: any) => void
  setTouched: (touched: boolean) => void
  setFocused: (focused: boolean) => void
  validate: () => Promise<boolean>
  clearError: () => void
  clearWarning: () => void
}
