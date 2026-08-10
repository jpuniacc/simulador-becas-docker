import { describe, it, expect } from 'vitest'
import {
  slugFilename,
  buildSimulacionPdfFilename,
  buildSimulacionPdfDefinition
} from '../pdfSimulacion'

describe('pdfSimulacion', () => {
  it('slugFilename normaliza acentos y espacios', () => {
    expect(slugFilename('Juan Pablo Silva')).toBe('Juan_Pablo_Silva')
    expect(slugFilename('Ingeniería Comercial')).toBe('Ingenieria_Comercial')
  })

  it('buildSimulacionPdfFilename usa patrón YYYYMMDD_alumno_carrera_simulador_uniacc', () => {
    const name = buildSimulacionPdfFilename({
      nombre: 'Juan Pablo',
      apellido: 'Silva',
      carrera: 'Ingeniería Comercial',
      date: new Date(2026, 7, 10)
    })
    expect(name).toBe('20260810_Juan_Pablo_Silva_Ingenieria_Comercial_simulador_uniacc.pdf')
  })

  it('buildSimulacionPdfDefinition incluye logo, RUT y secciones web', () => {
    const def = buildSimulacionPdfDefinition({
      nombre: 'Juan',
      apellido: 'Silva',
      identificacion: '12345678K',
      tipoIdentificacion: 'rut',
      email: 'juan@test.com',
      carreraNombre: 'Ingeniería Comercial',
      nivelAcademico: 'Pregrado',
      modalidadPrograma: 'Diurna',
      duracionPrograma: '10 semestres',
      arancelBase: 5000000,
      matricula: 200000,
      planeaUsarCAE: true,
      descuentoCae: 1000000,
      arancelFinal: 4000000,
      totalPagar: 4200000,
      numeroCuotas: 10,
      valorMensual: 420000,
      descuentoPorcentualTotal: 20,
      medioPagoLabel: 'Pagaré'
    })

    const json = JSON.stringify(def)
    expect(def.images).toBeTruthy()
    expect((def.images as Record<string, string>).uniaccLogo).toContain('data:image/png;base64,')
    expect(json).toContain('Simulador de Becas UNIACC')
    expect(json).toContain('Información de la Carrera')
    expect(json).toContain('Total Final a Pagar en Plan de')
    expect(json).toContain('Simulación referencial')
    expect(json).toContain('RUT')
  })
})
