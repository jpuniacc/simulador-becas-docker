// Tipos para beneficios y becas
import type { Database } from './supabase'

// Tipos base de Supabase
export type Nacionalidad = Database['public']['Tables']['nacionalidades']['Row']
export type Colegio = Database['public']['Tables']['colegios3']['Row']
export type Decil = Database['public']['Tables']['deciles']['Row']
export type BeneficioUniacc = Database['public']['Tables']['beneficios_uniacc']['Row']
export type Beca = Database['public']['Tables']['becas']['Row']
export type Beneficio = Database['public']['Tables']['beneficios']['Row']

// Tipos para inserción
export type NacionalidadInsert = Database['public']['Tables']['nacionalidades']['Insert']
export type ColegioInsert = Database['public']['Tables']['colegios3']['Insert']
export type DecilInsert = Database['public']['Tables']['deciles']['Insert']
export type BeneficioUniaccInsert = Database['public']['Tables']['beneficios_uniacc']['Insert']
export type BecaInsert = Database['public']['Tables']['becas']['Insert']
export type BeneficioInsert = Database['public']['Tables']['beneficios']['Insert']

// Tipos para actualización
export type NacionalidadUpdate = Database['public']['Tables']['nacionalidades']['Update']
export type ColegioUpdate = Database['public']['Tables']['colegios3']['Update']
export type DecilUpdate = Database['public']['Tables']['deciles']['Update']
export type BeneficioUniaccUpdate = Database['public']['Tables']['beneficios_uniacc']['Update']
export type BecaUpdate = Database['public']['Tables']['becas']['Update']
export type BeneficioUpdate = Database['public']['Tables']['beneficios']['Update']

// Tipos extendidos para la aplicación
export interface BeneficioElegible {
  id: string
  codigoBeneficio: number
  descripcion: string
  porcentajeMaximo: number | null
  montoMaximo: number | null
  tipoBeneficio: 'BECA' | 'FINANCIAMIENTO' | 'FINANCIERO'
  origenBeneficio: 'INTERNO' | 'EXTERNO'
  aplicacionConcepto: 'A' | 'M' // A = Arancel, M = Matrícula
  aplicacion: 'SALDO' | 'TOTAL'
  prioridad: number | null
  vigente: boolean
  requisitos: any | null
  elegible: boolean
  razonElegibilidad: string
  descuentoAplicado?: number
  montoAplicado?: number
  fechaModificacion?: string | null
}

export interface DecilInfo {
  id: string
  decil: number
  rangoIngresoMin: number
  rangoIngresoMax: number
  descripcion: string
  descripcionCorta: string
  porcentajePoblacion: number
  activo: boolean
  ordenVisual: number
}

export interface NacionalidadInfo {
  id: string
  codigoIso: string
  nombreEspanol: string
  nombreIngles: string
  continente: string
  region?: string | null
  activa: boolean
  ordenVisual?: number | null
}

export interface ColegioInfo {
  id: string
  rbd: string
  nombre: string
  nombreCorto?: string | null
  dependencia: 'Municipal' | 'Particular Subvencionado' | 'Particular Pagado' | 'Corporación de Administración Delegada' | 'Servicio Local de Educación'
  tipoEducacion: 'Básica' | 'Media' | 'Básica y Media' | 'Especial'
  modalidad?: string | null
  regionId: number
  regionNombre: string
  comunaId: number
  comunaNombre: string
  direccion?: string | null
  telefono?: string | null
  email?: string | null
  sitioWeb?: string | null
  latitud?: number | null
  longitud?: number | null
  activo: boolean
  fechaCreacion?: string | null
  fechaCierre?: string | null
}

export interface BecaInfo {
  id: string
  nombre: string
  descripcion?: string | null
  porcentajeDescuento?: number | null
  montoFijo?: number | null
  requisitos?: string[] | null
  activa: boolean
}

export interface BeneficioInfo {
  id: string
  nombre: string
  descripcion?: string | null
  tipo: 'Descuento' | 'Financiamiento' | 'Beca' | 'Convenio'
  valor?: number | null
  activo: boolean
}

export interface BeneficioUniaccInfo {
  id: string
  codigoBeneficio: number
  descripcion: string
  porcentajeMaximo?: number | null
  montoMaximo?: number | null
  tipoBeneficio: 'BECA' | 'FINANCIAMIENTO' | 'FINANCIERO'
  origenBeneficio: 'INTERNO' | 'EXTERNO'
  aplicacionConcepto: 'A' | 'M'
  aplicacion: 'SALDO' | 'TOTAL'
  prioridad?: number | null
  vigente: boolean
  usuarioCreacion?: number | null
  fechaModificacion?: string | null
  requisitos?: any | null
}

export interface CriterioElegibilidad {
  tipo: 'decil' | 'nem' | 'ranking' | 'paes' | 'colegio' | 'nacionalidad' | 'carrera' | 'edad'
  operador: '=' | '>' | '<' | '>=' | '<=' | 'in' | 'not_in' | 'between'
  valor: any
  valorMin?: any
  valorMax?: any
  descripcion: string
}

export interface BeneficioConCriterios extends BeneficioElegible {
  criteriosElegibilidad: CriterioElegibilidad[]
  esCombinable: boolean
  beneficiosIncompatibles: number[]
  ordenAplicacion: number
  descuentoMaximoTotal?: number
  montoMaximoTotal?: number
}

export interface CalculoBeneficio {
  beneficio: BeneficioElegible
  criteriosCumplidos: CriterioElegibilidad[]
  criteriosNoCumplidos: CriterioElegibilidad[]
  descuentoCalculado: number
  montoCalculado: number
  aplicadoA: 'arancel' | 'matricula' | 'total'
  razonAplicacion: string
  esValido: boolean
}

export interface ResumenBeneficios {
  totalBeneficios: number
  beneficiosElegibles: number
  beneficiosNoElegibles: number
  descuentoTotal: number
  montoTotal: number
  ahorroAnual: number
  ahorroTotal: number
  beneficiosPorTipo: {
    beca: number
    financiamiento: number
    financiero: number
  }
  beneficiosPorOrigen: {
    interno: number
    externo: number
  }
  beneficiosPorConcepto: {
    arancel: number
    matricula: number
  }
}

export interface FiltroBeneficios {
  tipoBeneficio?: ('BECA' | 'FINANCIAMIENTO' | 'FINANCIERO')[]
  origenBeneficio?: ('INTERNO' | 'EXTERNO')[]
  aplicacionConcepto?: ('A' | 'M')[]
  prioridad?: number[]
  vigente?: boolean
  elegible?: boolean
  texto?: string
}

export interface OrdenamientoBeneficios {
  campo: 'codigoBeneficio' | 'descripcion' | 'porcentajeMaximo' | 'montoMaximo' | 'prioridad' | 'tipoBeneficio'
  direccion: 'asc' | 'desc'
}

export interface PaginacionBeneficios {
  pagina: number
  limite: number
  total: number
  totalPaginas: number
}

export interface BusquedaBeneficios {
  filtros: FiltroBeneficios
  ordenamiento: OrdenamientoBeneficios
  paginacion: PaginacionBeneficios
}

export interface ResultadoBusquedaBeneficios {
  beneficios: BeneficioElegible[]
  resumen: ResumenBeneficios
  paginacion: PaginacionBeneficios
  tiempoConsulta: number
}

export interface EstadisticasBeneficios {
  totalBeneficios: number
  beneficiosActivos: number
  beneficiosInactivos: number
  beneficiosInternos: number
  beneficiosExternos: number
  beneficiosArancel: number
  beneficiosMatricula: number
  promedioPorcentaje: number
  promedioMonto: number
  beneficioMasComun: string
  beneficioMenosComun: string
}

export interface ComparacionBeneficios {
  beneficio1: BeneficioElegible
  beneficio2: BeneficioElegible
  diferencias: {
    campo: string
    valor1: any
    valor2: any
  }[]
  similitudes: {
    campo: string
    valor: any
  }[]
  recomendacion: string
}

export interface HistorialBeneficio {
  id: string
  beneficioId: string
  accion: 'creado' | 'actualizado' | 'activado' | 'desactivado' | 'eliminado'
  cambios?: {
    campo: string
    valorAnterior: any
    valorNuevo: any
  }[]
  usuario: string
  fecha: string
  razon?: string
}

export interface ExportacionBeneficios {
  formato: 'excel' | 'csv' | 'pdf' | 'json'
  filtros: FiltroBeneficios
  campos: string[]
  incluirEstadisticas: boolean
  incluirHistorial: boolean
  idioma: 'es' | 'en'
}
