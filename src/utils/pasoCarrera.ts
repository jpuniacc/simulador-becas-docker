/**
 * Lógica pura del paso 2 de pregrado (VOU v4, fase 3): búsqueda de carreras,
 * validaciones por sub-step y campos faltantes. Sin dependencias de Vue ni de red.
 */

export const RANGO_PAES = { min: 150, max: 1000 } as const

export const NIVELES_EGRESADO = [
  'Educación media completa',
  'Educación superior incompleta',
  'Educación superior completa'
] as const

export interface CarreraBuscable {
  nombre_programa: string
  modalidad_programa?: string | null
  nivel_academico?: string | null
  duracion_programa?: string | null
}

/** Datos del paso 2 que se validan (subconjunto de FormData). */
export interface EstadoPaso2 {
  carrera?: string
  carreraId?: number
  /** Nivel educativo del paso 1: solo egresados responden PAES y financiamiento. */
  nivelEducativo?: string
  rendioPAES?: boolean
  paesRespondido?: boolean
  paes?: { lenguaje?: number | null; matematica?: number | null } | null
  usaFinanciamientoEstado?: boolean
  planeaUsarCAE?: boolean
  usaBecasEstado?: boolean
  decil?: number | null
}

export interface ErroresPaso2 {
  carrera?: string
  paes?: string
  lenguaje?: string
  matematica?: string
  estado?: string
  opciones?: string
  decil?: string
}

export const MENSAJES_PASO2 = {
  carrera: 'Selecciona una carrera para continuar.',
  paes: 'Indica si rendiste la PAES.',
  lenguaje: `Ingresa tu puntaje de Comprensión Lectora (entre ${RANGO_PAES.min} y ${RANGO_PAES.max}).`,
  matematica: `Ingresa tu puntaje de Matemática 1 (entre ${RANGO_PAES.min} y ${RANGO_PAES.max}).`,
  estado: 'Indica si piensas usar financiamiento del Estado.',
  opciones: 'Selecciona al menos una opción: CAE o Becas ministeriales.',
  decil: 'Selecciona tu tramo de renta mensual.'
} as const

export const esEgresado = (nivel?: string | null): boolean =>
  !!nivel && (NIVELES_EGRESADO as readonly string[]).includes(nivel)

/** Minúsculas y sin tildes, para buscar «psico» y encontrar «Psicología». */
export function normalizarTexto(s: string | null | undefined): string {
  return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
}

/** Filtra por texto (nombre o modalidad) y, si corresponde, deja solo las Online. */
export function filtrarCarreras<T extends CarreraBuscable>(carreras: T[], consulta: string, soloOnline: boolean): T[] {
  const q = normalizarTexto(consulta)
  return carreras.filter((c) => {
    if (soloOnline && normalizarTexto(c.modalidad_programa) !== 'online') return false
    if (!q) return true
    const texto = normalizarTexto(`${c.nombre_programa} ${c.modalidad_programa ?? ''}`)
    return q.split(/\s+/).every((parte) => texto.includes(parte))
  })
}

/** «Pregrado · Diurno · 10 semestres» */
export function detalleCarrera(c: CarreraBuscable | null | undefined): string {
  if (!c) return ''
  return [c.nivel_academico, c.modalidad_programa, c.duracion_programa].filter(Boolean).join(' · ')
}

const puntajeValido = (v: unknown): boolean =>
  typeof v === 'number' && Number.isFinite(v) && v >= RANGO_PAES.min && v <= RANGO_PAES.max

export function paesRespondida(e: EstadoPaso2): boolean {
  return e.paesRespondido === true || e.rendioPAES === true
}

export function estadoRespondido(e: EstadoPaso2): boolean {
  return e.usaFinanciamientoEstado !== undefined || !!e.planeaUsarCAE || !!e.usaBecasEstado
}

export function usaFinanciamiento(e: EstadoPaso2): boolean {
  return e.usaFinanciamientoEstado === true || (e.usaFinanciamientoEstado === undefined && (!!e.planeaUsarCAE || !!e.usaBecasEstado))
}

export function validarSubpasoCarrera(e: EstadoPaso2): ErroresPaso2 {
  const err: ErroresPaso2 = {}
  if (!e.carrera?.trim() || !e.carreraId || e.carreraId <= 0) err.carrera = MENSAJES_PASO2.carrera
  return err
}

export function validarSubpasoFinanciamiento(e: EstadoPaso2): ErroresPaso2 {
  const err: ErroresPaso2 = {}
  // Quien no es egresado no responde estas preguntas (igual que en el paso 2 anterior)
  if (!esEgresado(e.nivelEducativo)) return err

  if (!paesRespondida(e)) {
    err.paes = MENSAJES_PASO2.paes
  } else if (e.rendioPAES) {
    if (!puntajeValido(e.paes?.lenguaje)) err.lenguaje = MENSAJES_PASO2.lenguaje
    if (!puntajeValido(e.paes?.matematica)) err.matematica = MENSAJES_PASO2.matematica
  }

  if (!estadoRespondido(e)) {
    err.estado = MENSAJES_PASO2.estado
  } else if (usaFinanciamiento(e)) {
    if (!e.planeaUsarCAE && !e.usaBecasEstado) err.opciones = MENSAJES_PASO2.opciones
    if (e.decil === null || e.decil === undefined) err.decil = MENSAJES_PASO2.decil
  }
  return err
}

export function validarPaso2(e: EstadoPaso2): ErroresPaso2 {
  return { ...validarSubpasoCarrera(e), ...validarSubpasoFinanciamiento(e) }
}

export const esPaso2Valido = (e: EstadoPaso2): boolean => Object.keys(validarPaso2(e)).length === 0

/** Mismos rótulos que usaba el paso 2 anterior en el aviso de «Campos requeridos». */
export function camposFaltantesPaso2(e: EstadoPaso2): string[] {
  const err = validarPaso2(e)
  const out: string[] = []
  if (err.carrera) out.push('Carrera')
  if (err.paes) out.push('¿Rendiste la PAES?')
  if (err.lenguaje) out.push('Comprensión Lectora (PAES)')
  if (err.matematica) out.push('Matemática 1 (PAES)')
  if (err.estado) out.push('¿Piensas usar financiamiento del Estado?')
  if (err.opciones) out.push('Opciones de Financiamiento')
  if (err.decil) out.push('Tramo de Renta Mensual (Decil)')
  return out
}
