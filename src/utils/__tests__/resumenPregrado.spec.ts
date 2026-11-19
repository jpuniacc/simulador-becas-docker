import { describe, it, expect } from 'vitest'
import {
  OPCIONES_CUOTAS,
  calcularResumen,
  normalizarCuotas,
  pctContadoDesdeModosPago
} from '../resumenPregrado'

// Caso de la propuesta VOU: $3.298.000 / 10 = $329.800; / 12 = $274.833
// (arancel 3.810.000 − 20% = 3.048.000, + matrícula 250.000 = 3.298.000)
const base = { arancelBase: 3810000, matricula: 250000, descuentoBeca: 762000 }

describe('calcularResumen · valor cuota', () => {
  it('opciones de cuotas: 1 · 3 · 6 · 10 · 12', () => {
    expect([...OPCIONES_CUOTAS]).toEqual([1, 3, 6, 10, 12])
  })

  it('valor cuota = round(total / n) para cada opción', () => {
    const esperado: Record<number, number> = { 1: 3298000, 3: 1099333, 6: 549667, 10: 329800, 12: 274833 }
    for (const n of OPCIONES_CUOTAS) {
      const r = calcularResumen({ ...base, cuotas: n })
      expect(r.totalEstimado).toBe(3298000)
      expect(r.valorCuota).toBe(esperado[n])
    }
  })

  it('el total no cambia al cambiar las cuotas (si no hay pago al contado)', () => {
    const totales = OPCIONES_CUOTAS.filter((n) => n !== 1).map((n) => calcularResumen({ ...base, cuotas: n, pctContado: 5 }).totalEstimado)
    expect(new Set(totales).size).toBe(1)
  })

  it('cuotas inválidas vuelven al valor por defecto (10)', () => {
    expect(normalizarCuotas(7)).toBe(10)
    expect(calcularResumen({ ...base, cuotas: 0 }).cuotas).toBe(10)
  })
})

describe('calcularResumen · 5% contado solo con 1 cuota', () => {
  it('con 1 cuota aplica el % sobre el arancel con beca (no sobre la matrícula)', () => {
    const r = calcularResumen({ ...base, cuotas: 1, pctContado: 5 })
    // arancel con beca = 3.048.000 → 5% = 152.400
    expect(r.esContado).toBe(true)
    expect(r.descuentoContado).toBe(152400)
    expect(r.arancelFinal).toBe(2895600)
    expect(r.totalEstimado).toBe(2895600 + 250000)
    expect(r.valorCuota).toBe(3145600)
    expect(r.beneficioEstimado).toBe(762000 + 152400)
  })

  it('con 3, 6, 10 o 12 cuotas NO aplica descuento por contado', () => {
    for (const n of [3, 6, 10, 12]) {
      const r = calcularResumen({ ...base, cuotas: n, pctContado: 5 })
      expect(r.descuentoContado).toBe(0)
      expect(r.esContado).toBe(false)
    }
  })

  it('si no hay % de contado vigente, 1 cuota no descuenta nada', () => {
    expect(calcularResumen({ ...base, cuotas: 1, pctContado: null }).descuentoContado).toBe(0)
  })

  it('el % de contado sale del modo de pago «contado» activo (el cheque ya no se usa)', () => {
    expect(pctContadoDesdeModosPago([
      { nombre: 'Cheque', dscto_arancel: 3 },
      { nombre: 'Contado', dscto_arancel: 5 }
    ])).toBe(5)
    expect(pctContadoDesdeModosPago([{ nombre: 'Cheque', dscto_arancel: 3 }])).toBeNull()
  })
})

describe('calcularResumen · sin beca, CAE y pago anticipado', () => {
  it('sin beca: total = arancel + matrícula y beneficio 0', () => {
    const r = calcularResumen({ arancelBase: 4020000, matricula: 250000, descuentoBeca: 0, cuotas: 10 })
    expect(r.totalEstimado).toBe(4270000)
    expect(r.beneficioEstimado).toBe(0)
    expect(r.valorCuota).toBe(427000)
  })

  it('el CAE no es una entrada del cálculo: ningún total lo incluye', () => {
    const keys = Object.keys(calcularResumen({ ...base, cuotas: 10 }))
    expect(keys.some((k) => /cae/i.test(k))).toBe(false)
  })

  it('la beca nunca supera el arancel', () => {
    const r = calcularResumen({ arancelBase: 1000000, matricula: 100000, descuentoBeca: 5000000, cuotas: 10 })
    expect(r.arancelFinal).toBe(0)
    expect(r.totalEstimado).toBe(100000)
  })

  it('el pago anticipado vigente se mantiene como antes (arancel y matrícula)', () => {
    const r = calcularResumen({ ...base, cuotas: 10, pctAnticipadoArancel: 10, pctAnticipadoMatricula: 50 })
    expect(r.descuentoAnticipadoArancel).toBe(304800)
    expect(r.descuentoAnticipadoMatricula).toBe(125000)
    expect(r.totalEstimado).toBe(3048000 - 304800 + 125000)
  })

  it('total = arancel referencial + matrícula − beneficio estimado', () => {
    const r = calcularResumen({ ...base, cuotas: 1, pctContado: 5 })
    expect(r.totalEstimado).toBe(r.arancelReferencial + r.matricula - r.beneficioEstimado)
  })
})
