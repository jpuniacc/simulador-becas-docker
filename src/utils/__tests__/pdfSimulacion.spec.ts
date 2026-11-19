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

describe('pdfSimulacion · modoReferencial (pregrado VOU v4)', () => {
  const payload = {
    modoReferencial: true,
    nombre: 'Juan', apellido: 'Silva', identificacion: '12345678K', tipoIdentificacion: 'rut' as const,
    email: 'juan@test.com', carreraNombre: 'Psicología', nivelAcademico: 'Pregrado',
    modalidadPrograma: 'Diurno', duracionPrograma: '10 semestres',
    arancelBase: 4190000, matricula: 250000,
    becasInternas: [{ nombre: 'Beca Mérito Académico PAES', descuentoAplicado: 25, montoDescuento: 1047500 }],
    usaBecasEstado: true, planeaUsarCAE: true, arancelReferenciaCae: 3315987, anioArancelReferencia: 2026,
    beneficioEstimado: 1047500, arancelFinalConDescuentos: 3142500, matriculaFinalConDescuentos: 250000,
    totalPagar: 3392500, numeroCuotas: 10, valorMensual: 339250
  }

  it('muestra montos, cuotas y disclaimers de la propuesta, sin «hasta X%»', () => {
    const json = JSON.stringify(buildSimulacionPdfDefinition(payload))
    expect(json).toContain('Simulación referencial · sujeta a validación')
    expect(json).toContain('Sujeta a requisitos')
    expect(json).toContain('Valor cuota estimado')
    expect(json).toContain('Total estimado')
    expect(json).toContain('preselección y selección')
    expect(json).toContain('admision@uniacc.cl')
    expect(json).not.toMatch(/hasta un \d+%/)
    expect(json).not.toContain('Podrías estudiar')
  })

  it('el CAE aparece solo como referencia y no se resta ni se suma', () => {
    const json = JSON.stringify(buildSimulacionPdfDefinition(payload))
    expect(json).toContain('Financiamiento del Estado · Referencial')
    expect(json).toContain('no se suma al total estimado')
    expect(json).not.toContain('Monto máximo financiable con CAE')
    expect(json).not.toContain('Total Final a Pagar en Plan de')
  })

  it('sin beca usa el texto neutro', () => {
    const json = JSON.stringify(buildSimulacionPdfDefinition({ ...payload, becasInternas: [], beneficioEstimado: 0 }))
    expect(json).toContain('Con tus datos no identificamos una beca UNIACC; Admisión puede revisar tu caso')
  })

  it('con 1 cuota indica contado y refleja el descuento por contado', () => {
    const json = JSON.stringify(buildSimulacionPdfDefinition({
      ...payload, numeroCuotas: 1, valorMensual: 3235375, totalPagar: 3235375,
      descuentoModoPagoArancel: 157125, descuentoModoPagoPct: 5
    }))
    expect(json).toContain('en 1 pago (contado)')
    expect(json).toContain('Descuento por pago al contado')
  })
})
