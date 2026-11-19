import { describe, it, expect } from 'vitest'
import {
  camposFaltantesPaso2,
  detalleCarrera,
  esPaso2Valido,
  filtrarCarreras,
  normalizarTexto,
  validarSubpasoCarrera,
  validarSubpasoFinanciamiento,
  MENSAJES_PASO2,
  type EstadoPaso2
} from '../pasoCarrera'

const base: EstadoPaso2 = { carrera: 'Psicología', carreraId: 1, nivelEducativo: 'Educación media completa' }

const carreras = [
  { id: 1, nombre_programa: 'Psicología', modalidad_programa: 'Diurno', nivel_academico: 'Pregrado', duracion_programa: '10 semestres' },
  { id: 2, nombre_programa: 'Psicología', modalidad_programa: 'Vespertino', nivel_academico: 'Pregrado', duracion_programa: '10 semestres' },
  { id: 3, nombre_programa: 'Ingeniería Comercial', modalidad_programa: 'Online', nivel_academico: 'Pregrado', duracion_programa: '10 semestres' }
]

describe('búsqueda de carreras', () => {
  it('ignora tildes y mayúsculas y distingue homónimas por modalidad', () => {
    expect(normalizarTexto('  Psicología ')).toBe('psicologia')
    expect(filtrarCarreras(carreras, 'PSICO', false).map((c) => c.id)).toEqual([1, 2])
    expect(filtrarCarreras(carreras, 'psicologia diurno', false).map((c) => c.id)).toEqual([1])
    expect(filtrarCarreras(carreras, '', false)).toHaveLength(3)
    expect(filtrarCarreras(carreras, 'xyz', false)).toHaveLength(0)
  })
  it('extranjero fuera del país: solo carreras Online', () => {
    expect(filtrarCarreras(carreras, '', true).map((c) => c.id)).toEqual([3])
    expect(filtrarCarreras(carreras, 'psico', true)).toHaveLength(0)
  })
  it('detalle muestra nivel, modalidad y semestres', () => {
    expect(detalleCarrera(carreras[0])).toBe('Pregrado · Diurno · 10 semestres')
  })
})

describe('validaciones por sub-step', () => {
  it('sub-step 1: exige carrera', () => {
    expect(validarSubpasoCarrera({}).carrera).toBe(MENSAJES_PASO2.carrera)
    expect(validarSubpasoCarrera({ carrera: 'X', carreraId: 0 }).carrera).toBeTruthy()
    expect(validarSubpasoCarrera(base)).toEqual({})
  })

  it('sub-step 2: egresado debe responder PAES y financiamiento', () => {
    const e = validarSubpasoFinanciamiento(base)
    expect(e.paes).toBe(MENSAJES_PASO2.paes)
    expect(e.estado).toBe(MENSAJES_PASO2.estado)
  })

  it('PAES Sí exige ambos puntajes entre 150 y 1000', () => {
    const sinPuntajes = validarSubpasoFinanciamiento({ ...base, rendioPAES: true, paesRespondido: true, usaFinanciamientoEstado: false })
    expect(sinPuntajes.lenguaje).toBeTruthy()
    expect(sinPuntajes.matematica).toBeTruthy()
    const fuera = validarSubpasoFinanciamiento({ ...base, rendioPAES: true, paesRespondido: true, usaFinanciamientoEstado: false, paes: { lenguaje: 100, matematica: 1001 } })
    expect(fuera.lenguaje).toBeTruthy()
    expect(fuera.matematica).toBeTruthy()
    const ok = validarSubpasoFinanciamiento({ ...base, rendioPAES: true, paesRespondido: true, usaFinanciamientoEstado: false, paes: { lenguaje: 700, matematica: 650 } })
    expect(ok).toEqual({})
  })

  it('PAES No no pide puntajes', () => {
    expect(validarSubpasoFinanciamiento({ ...base, rendioPAES: false, paesRespondido: true, usaFinanciamientoEstado: false })).toEqual({})
  })

  it('financiamiento Sí exige al menos CAE o Becas ministeriales y el tramo de renta', () => {
    const e = validarSubpasoFinanciamiento({ ...base, paesRespondido: true, usaFinanciamientoEstado: true })
    expect(e.opciones).toBe(MENSAJES_PASO2.opciones)
    expect(e.decil).toBe(MENSAJES_PASO2.decil)
    const ok = validarSubpasoFinanciamiento({ ...base, paesRespondido: true, usaFinanciamientoEstado: true, planeaUsarCAE: true, decil: 3 })
    expect(ok).toEqual({})
  })

  it('quien no es egresado no responde PAES ni financiamiento', () => {
    const e: EstadoPaso2 = { ...base, nivelEducativo: 'Educación media incompleta' }
    expect(validarSubpasoFinanciamiento(e)).toEqual({})
    expect(esPaso2Valido(e)).toBe(true)
  })

  it('compatibilidad: datos del paso 2 anterior (CAE + decil sin banderas nuevas) siguen siendo válidos', () => {
    expect(esPaso2Valido({ ...base, rendioPAES: true, paes: { lenguaje: 700, matematica: 650 }, planeaUsarCAE: true, decil: 3 })).toBe(true)
  })

  it('campos faltantes con los mismos rótulos del toast anterior', () => {
    expect(camposFaltantesPaso2({ nivelEducativo: 'Educación media completa' })).toEqual([
      'Carrera',
      '¿Rendiste la PAES?',
      '¿Piensas usar financiamiento del Estado?'
    ])
    expect(
      camposFaltantesPaso2({ ...base, rendioPAES: true, paesRespondido: true, usaFinanciamientoEstado: true })
    ).toEqual(['Comprensión Lectora (PAES)', 'Matemática 1 (PAES)', 'Opciones de Financiamiento', 'Tramo de Renta Mensual (Decil)'])
  })
})
