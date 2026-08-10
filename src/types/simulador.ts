// Tipos para el simulador y wizard
export interface FormData {
  // Datos Personales
  nombre: string
  apellido: string
  email: string
  telefono: string
  tieneRUT: boolean | undefined
  tipoIdentificacion: 'rut' | 'pasaporte' | ''
  identificacion: string
  extranjero: boolean | undefined
  residencia_chilena: boolean | undefined
  fechaNacimiento: string
  genero: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir' | ''
  anio_nacimiento: number | null
  consentimiento_contacto: boolean

  // Datos Académicos
  nivelEducativo: 'Educación media incompleta' | 'Educación media completa' | 'Educación superior incompleta' | 'Educación superior completa' | ''
  colegio: string
  carrera: string
  carreraId: number
  tipoPrograma: 'Regular' | 'Advance' | 'Especial' | ''
  nem: number | null
  ranking: number | null
  añoEgreso: string

  // Datos Socioeconómicos
  ingresoMensual: string | null
  integrantes: string
  planeaUsarCAE: boolean
  usaBecasEstado: boolean
  decil: number | null
  regionResidencia: string
  comunaResidencia: string
  regionId: number | null

  // PAES
  rendioPAES: boolean
  paes: {
    matematica: number | null
    lenguaje: number | null
    ciencias: number | null
    historia: number | null
    matematica2: number | null
    terceraAsignatura: 'matematica2' | 'ciencias' | 'historia' | null
  }

  // Datos Postgrado
  carreraTitulo: string,
  modalidadPreferencia: ('Presencial' | 'Online' | 'Semipresencial')[],
  objetivo: ('mejorar_habilidades' | 'cambiar_carrera' | 'mejorar_empleo' | 'otro')[],
  institucionId: string,
  motivacion: string,
  origen: string,
  carreraInteres: string,
  carreraInteresId: number,
  gradoAcademico: string,


  // Datos de Campaña (UTM y tracking)
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_term?: string
  utm_content?: string
  campaign_id?: string
  ad_id?: string
  gclid?: string
  fbclid?: string
  msclkid?: string
  ttclid?: string
  li_fat_id?: string
  first_touch_url?: string
  first_touch_timestamp?: string
  last_touch_url?: string
  last_touch_timestamp?: string
}

export interface SimulationResults {
  arancelBase: number
  descuentoTotal: number
  arancelFinal: number
  beneficiosAplicables: BeneficioElegible[]
  beneficiosNoAplicables: BeneficioElegible[]
  decilCalculado: number
  fechaSimulacion: string
  prospectoId?: string
}

export interface BeneficioElegible {
  codigo: number
  descripcion: string
  porcentajeMaximo: number | null
  montoMaximo: number | null
  tipoBeneficio: 'BECA' | 'FINANCIAMIENTO' | 'FINANCIERO'
  origenBeneficio: 'INTERNO' | 'EXTERNO'
  aplicacionConcepto: 'A' | 'M' // A = Arancel, M = Matrícula
  prioridad: number | null
  elegible: boolean
  razonElegibilidad: string
  descuentoAplicado?: number
  montoAplicado?: number
}

export interface WizardStep {
  id: number
  title: string
  description: string
  isValid: boolean
  isCompleted: boolean
  isOptional?: boolean
}

export interface WizardState {
  currentStep: number
  totalSteps: number
  isCompleted: boolean
  canGoNext: boolean
  canGoBack: boolean
  isLastStep: boolean
  progressPercentage: number
}

export interface StepValidation {
  [key: number]: boolean
}

export interface SimulationProgress {
  isSimulating: boolean
  progress: number
  currentStep: string
  totalSteps: number
}

export interface ArancelInfo {
  arancelBase: number
  matriculaBase: number
  totalBase: number
  descuentos: DescuentoInfo[]
  totalDescuentos: number
  arancelFinal: number
  matriculaFinal: number
  totalFinal: number
}

export interface DescuentoInfo {
  beneficio: BeneficioElegible
  tipo: 'porcentaje' | 'monto_fijo'
  valor: number
  aplicadoA: 'arancel' | 'matricula' | 'total'
  descuentoCalculado: number
}

export interface DecilInfo {
  numero: number
  descripcion: string
  descripcionCorta: string
  rangoIngresoMin: number
  rangoIngresoMax: number
  porcentajePoblacion: number
}

export interface NacionalidadInfo {
  id: string
  codigoIso: string
  nombreEspanol: string
  nombreIngles: string
  continente: string
  region?: string
}

export interface ColegioInfo {
  id: string
  rbd: string
  nombre: string
  nombreCorto?: string
  dependencia: 'Municipal' | 'Particular Subvencionado' | 'Particular Pagado' | 'Corporación de Administración Delegada' | 'Servicio Local de Educación'
  tipoEducacion: 'Básica' | 'Media' | 'Básica y Media' | 'Especial'
  region: string
  comuna: string
}

export interface CarreraInfo {
  id: string
  nombre: string
  codigo: string
  facultad: string
  arancelAnual: number
  matriculaAnual: number
  duracion: number
  modalidad: 'Presencial' | 'Online' | 'Híbrida'
  jornada: 'Diurna' | 'Vespertina' | 'Nocturna'
}

export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface FormFieldConfig {
  name: keyof FormData
  label: string
  type: 'text' | 'email' | 'number' | 'select' | 'radio' | 'checkbox' | 'date' | 'tel'
  required: boolean
  placeholder?: string
  options?: { value: string; label: string }[]
  validation?: ValidationRule[]
  dependsOn?: string
  showWhen?: (data: FormData) => boolean
  step: number
}

export interface ValidationRule {
  type: 'required' | 'email' | 'min' | 'max' | 'pattern' | 'custom' | 'rut' | 'phone'
  value?: unknown
  message: string
  validator?: (value: unknown, data?: FormData) => boolean
}

export interface SimulationConfig {
  arancelBase: number
  matriculaBase: number
  maxDescuentoPorcentaje: number
  maxDescuentoMonto: number
  beneficiosActivos: boolean
  calculoDecil: boolean
  incluirPAES: boolean
}

export interface StepConfig {
  id: number
  title: string
  description: string
  fields: FormFieldConfig[]
  validation: (data: FormData) => boolean
  isOptional: boolean
  showProgress: boolean
  allowSkip: boolean
}

export interface WizardConfig {
  steps: StepConfig[]
  allowBackNavigation: boolean
  saveProgress: boolean
  autoSave: boolean
  showProgressBar: boolean
  showStepNumbers: boolean
  theme: 'light' | 'dark' | 'auto'
}

export interface SimulationHistory {
  id: string
  prospectoId: string
  fechaSimulacion: string
  datosEntrada: FormData
  resultados: SimulationResults
  beneficiosAplicables: BeneficioElegible[]
  beneficiosNoAplicables: BeneficioElegible[]
  decilCalculado: number
  arancelInfo: ArancelInfo
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json'
  includeDetails: boolean
  includeBenefits: boolean
  includeCalculations: boolean
  language: 'es' | 'en'
}

export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    handler: () => void
  }
}
