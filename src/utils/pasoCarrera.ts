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

const ORDEN_MODALIDAD: Record<string, number> = { diurno: 0, vespertino: 1, semipresencial: 2, online: 3 }
const palabras = (t: string): string[] => t.split(/\s+/).filter(Boolean)

/**
 * Una palabra de la consulta coincide si inicia alguna palabra del nombre; desde 3 letras también si está dentro de una
 * palabra y puede coincidir con la jornada («diurno»). Con 1–2 letras no se mira la jornada, para no meter ruido («di» → Diurno).
 */
const coincideParte = (parte: string, nombre: string, modalidad: string): boolean => {
  const texto = parte.length >= 3 ? `${nombre} ${modalidad}`.trim() : nombre
  return palabras(texto).some((w) => w.startsWith(parte)) || (parte.length >= 3 && texto.includes(parte))
}

/**
 * Sugerencias del autocompletado: sin tildes ni mayúsculas, por cualquier palabra del nombre o la modalidad.
 * Orden: primero las que empiezan con lo escrito, luego las que lo tienen al inicio de alguna palabra,
 * y al final las que lo contienen dentro de una palabra; a igual relevancia, por nombre y jornada.
 * Con la consulta vacía no sugiere nada.
 */
export function sugerirCarreras<T extends CarreraBuscable>(carreras: T[], consulta: string, soloOnline = false): T[] {
  const q = normalizarTexto(consulta).replace(/\s+/g, ' ')
  if (!q) return []
  const partes = q.split(' ')
  const puntuadas: Array<{ c: T; nombre: string; mod: number; score: number }> = []
  for (const c of carreras) {
    const modalidad = normalizarTexto(c.modalidad_programa)
    if (soloOnline && modalidad !== 'online') continue
    const nombre = normalizarTexto(c.nombre_programa)
    if (!partes.every((p) => coincideParte(p, nombre, modalidad))) continue
    const score = nombre.startsWith(q) ? 0 : nombre.startsWith(partes[0]) ? 1 : partes.every((p) => palabras(`${nombre} ${modalidad}`).some((w) => w.startsWith(p))) ? 2 : 3
    puntuadas.push({ c, nombre, mod: ORDEN_MODALIDAD[modalidad] ?? 9, score })
  }
  return puntuadas
    .sort((a, b) => a.score - b.score || a.nombre.localeCompare(b.nombre, 'es') || a.mod - b.mod)
    .map((x) => x.c)
}

export interface TramoTexto {
  texto: string
  coincide: boolean
}

/** Parte `texto` en tramos y marca los que coinciden con la consulta (ignora tildes y mayúsculas). */
export function resaltarCoincidencias(texto: string, consulta: string): TramoTexto[] {
  const original = texto || ''
  const partes = normalizarTexto(consulta).split(/\s+/).filter(Boolean)
  if (!original || !partes.length) return [{ texto: original, coincide: false }]

  // Texto normalizado carácter a carácter, con el índice de origen de cada carácter normalizado
  let norm = ''
  const origen: number[] = []
  for (let i = 0; i < original.length; i++) {
    const n = original[i].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    for (const ch of n) { norm += ch; origen.push(i) }
  }

  const rangos: Array<[number, number]> = []
  for (const parte of partes) {
    let desde = 0
    let pos = -1
    while ((pos = norm.indexOf(parte, desde)) !== -1) {
      if (pos === 0 || norm[pos - 1] === ' ') break
      desde = pos + 1
    }
    if (pos === -1 && parte.length >= 3) pos = norm.indexOf(parte)
    if (pos !== -1) rangos.push([origen[pos], origen[pos + parte.length - 1] + 1])
  }
  if (!rangos.length) return [{ texto: original, coincide: false }]

  rangos.sort((a, b) => a[0] - b[0])
  const unidos: Array<[number, number]> = []
  for (const r of rangos) {
    const ult = unidos[unidos.length - 1]
    if (ult && r[0] <= ult[1]) ult[1] = Math.max(ult[1], r[1])
    else unidos.push([r[0], r[1]])
  }
  const out: TramoTexto[] = []
  let cursor = 0
  for (const [a, b] of unidos) {
    if (a > cursor) out.push({ texto: original.slice(cursor, a), coincide: false })
    out.push({ texto: original.slice(a, b), coincide: true })
    cursor = b
  }
  if (cursor < original.length) out.push({ texto: original.slice(cursor), coincide: false })
  return out
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
