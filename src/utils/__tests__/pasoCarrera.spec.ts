import { describe, it, expect } from 'vitest'
import {
  camposFaltantesPaso2,
  detalleCarrera,
  esPaso2Valido,
  filtrarCarreras,
  normalizarTexto,
  resaltarCoincidencias,
  sugerirCarreras,
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

describe('autocompletado: sugerirCarreras', () => {
  const catalogo = [
    { id: 10, nombre_programa: 'Ingeniería Comercial', modalidad_programa: 'Online', nivel_academico: 'Pregrado', duracion_programa: '10 semestres' },
    { id: 11, nombre_programa: 'Ingeniería Comercial', modalidad_programa: 'Diurno', nivel_academico: 'Pregrado', duracion_programa: '10 semestres' },
    { id: 12, nombre_programa: 'Psicología', modalidad_programa: 'Vespertino', nivel_academico: 'Pregrado', duracion_programa: '10 semestres' },
    { id: 13, nombre_programa: 'Psicología', modalidad_programa: 'Diurno', nivel_academico: 'Pregrado', duracion_programa: '10 semestres' },
    { id: 14, nombre_programa: 'Diseño Gráfico', modalidad_programa: 'Diurno', nivel_academico: 'Pregrado', duracion_programa: '8 semestres' },
    { id: 15, nombre_programa: 'Publicidad y Comunicación Digital', modalidad_programa: 'Online', nivel_academico: 'Pregrado', duracion_programa: '8 semestres' },
    { id: 16, nombre_programa: 'Administración Comercial', modalidad_programa: 'Diurno', nivel_academico: 'Pregrado', duracion_programa: '8 semestres' }
  ]
  const ids = (q: string, online = false) => sugerirCarreras(catalogo, q, online).map((c) => c.id)

  it('sin texto no sugiere nada y sugiere desde la primera letra', () => {
    expect(ids('')).toEqual([])
    expect(ids('   ')).toEqual([])
    expect(ids('p')).toEqual([13, 12, 15]) // Psicología (x2) y Publicidad; ninguna con «p» a mitad de palabra
  })
  it('ignora tildes y mayúsculas', () => {
    expect(ids('psicologia')).toEqual([13, 12])
    expect(ids('PSICOLOGÍA')).toEqual([13, 12])
    expect(ids('ingenieria')).toEqual([11, 10])
  })
  it('encuentra por cualquier palabra del nombre', () => {
    expect(ids('comer')).toEqual([16, 11, 10]) // Administración Comercial, Ingeniería Comercial (Diurno, Online)
    expect(ids('comercial')).toEqual([16, 11, 10])
    expect(ids('com')).toEqual([16, 11, 10, 15]) // + «Comunicación»
    expect(ids('comunicacion')).toEqual([15])
  })
  it('la que empieza con lo escrito va antes que la que lo trae en otra palabra', () => {
    const lista = [
      { id: 1, nombre_programa: 'Administración Comercial', modalidad_programa: 'Diurno' },
      { id: 2, nombre_programa: 'Comercio Exterior', modalidad_programa: 'Diurno' }
    ]
    expect(sugerirCarreras(lista, 'com').map((c) => c.id)).toEqual([2, 1])
  })
  it('varias palabras: todas deben coincidir (también con la jornada)', () => {
    expect(ids('psicologia diurno')).toEqual([13])
    expect(ids('comercial online')).toEqual([10])
    expect(ids('psi online')).toEqual([])
  })
  it('distingue jornadas de una misma carrera y las ordena Diurno, Vespertino, Online', () => {
    expect(sugerirCarreras(catalogo, 'psico').map((c) => c.modalidad_programa)).toEqual(['Diurno', 'Vespertino'])
    expect(sugerirCarreras(catalogo, 'ingenieria comercial').map((c) => c.modalidad_programa)).toEqual(['Diurno', 'Online'])
  })
  it('extranjero fuera del país: solo Online', () => {
    expect(ids('comercial', true)).toEqual([10])
    expect(ids('psico', true)).toEqual([])
  })
  it('con una o dos letras solo mira el inicio de las palabras del nombre (la jornada no mete ruido)', () => {
    expect(ids('is')).toEqual([]) // nada empieza con «is» (Diseño no cuenta)
    expect(ids('di')).toEqual([14, 15]) // Diseño Gráfico y Publicidad y Comunicación «Digital»; no todas las Diurno
    expect(ids('diurno')).toEqual([16, 14, 11, 13])
  })
})

describe('autocompletado: resaltarCoincidencias', () => {
  const unir = (t: ReturnType<typeof resaltarCoincidencias>) => t.map((x) => (x.coincide ? `[${x.texto}]` : x.texto)).join('')
  it('marca lo que coincide respetando tildes y mayúsculas originales', () => {
    expect(unir(resaltarCoincidencias('Psicología', 'psico'))).toBe('[Psico]logía')
    expect(unir(resaltarCoincidencias('Psicología', 'PSICOLOGIA'))).toBe('[Psicología]')
    expect(unir(resaltarCoincidencias('Ingeniería Comercial', 'comer'))).toBe('Ingeniería [Comer]cial')
    expect(unir(resaltarCoincidencias('Ingeniería Comercial', 'ingenieria com'))).toBe('[Ingeniería] [Com]ercial')
  })
  it('sin coincidencia o sin consulta devuelve el texto entero sin marcar', () => {
    expect(resaltarCoincidencias('Danza', 'xyz')).toEqual([{ texto: 'Danza', coincide: false }])
    expect(resaltarCoincidencias('Danza', '')).toEqual([{ texto: 'Danza', coincide: false }])
    expect(resaltarCoincidencias('', 'a')).toEqual([{ texto: '', coincide: false }])
  })
  it('también resalta la jornada en el detalle', () => {
    expect(unir(resaltarCoincidencias('Pregrado · Diurno · 10 semestres', 'diur'))).toBe('Pregrado · [Diur]no · 10 semestres')
  })
  it('prefiere el inicio de palabra y no mezcla tramos que se solapan', () => {
    expect(unir(resaltarCoincidencias('Administración Comercial', 'com'))).toBe('Administración [Com]ercial')
    expect(unir(resaltarCoincidencias('Comercial', 'com comer'))).toBe('[Comer]cial')
  })
})
