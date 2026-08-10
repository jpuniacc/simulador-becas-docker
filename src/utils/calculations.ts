// Utilidades de cálculo
import type {
  FormData,
  BeneficioElegible,
  DecilInfo,
  ArancelInfo,
  DescuentoInfo,
  SimulationResults
} from '../types/simulador'

/**
 * Calcula el decil socioeconómico basado en ingreso mensual y número de integrantes
 */
export const calculateDecil = (ingresoMensual: number, integrantes: number): number => {
  if (!ingresoMensual || !integrantes || ingresoMensual <= 0 || integrantes <= 0) {
    return 10 // Decil más alto si no hay datos
  }

  const ingresoPerCapita = ingresoMensual / integrantes

  // Rangos de deciles basados en datos oficiales de Chile
  const decilRanges = [
    { min: 0, max: 150000, decil: 1 },
    { min: 150001, max: 250000, decil: 2 },
    { min: 250001, max: 350000, decil: 3 },
    { min: 350001, max: 450000, decil: 4 },
    { min: 450001, max: 600000, decil: 5 },
    { min: 600001, max: 800000, decil: 6 },
    { min: 800001, max: 1000000, decil: 7 },
    { min: 1000001, max: 1300000, decil: 8 },
    { min: 1300001, max: 1800000, decil: 9 },
    { min: 1800001, max: Infinity, decil: 10 }
  ]

  for (const range of decilRanges) {
    if (ingresoPerCapita >= range.min && ingresoPerCapita <= range.max) {
      return range.decil
    }
  }

  return 10 // Decil más alto por defecto
}

/**
 * Calcula el decil usando información de deciles de la base de datos
 */
export const calculateDecilWithData = (ingresoMensual: number, integrantes: number, deciles: DecilInfo[]): number => {
  if (!ingresoMensual || !integrantes || ingresoMensual <= 0 || integrantes <= 0) {
    return 10
  }

  const ingresoPerCapita = ingresoMensual / integrantes

  // Ordenar deciles por orden visual
  const sortedDeciles = deciles.sort((a, b) => a.ordenVisual - b.ordenVisual)

  for (const decil of sortedDeciles) {
    if (ingresoPerCapita >= decil.rangoIngresoMin && ingresoPerCapita <= decil.rangoIngresoMax) {
      return decil.decil
    }
  }

  return 10
}

/**
 * Calcula el descuento aplicable de un beneficio
 */
export const calculateBenefitDiscount = (
  beneficio: BeneficioElegible,
  arancelBase: number,
  decil: number
): DescuentoInfo => {
  let descuentoCalculado = 0
  let montoCalculado = 0
  let aplicadoA: 'arancel' | 'matricula' | 'total' = 'arancel'

  // Determinar a qué se aplica el beneficio
  if (beneficio.aplicacionConcepto === 'A') {
    aplicadoA = 'arancel'
  } else if (beneficio.aplicacionConcepto === 'M') {
    aplicadoA = 'matricula'
  } else {
    aplicadoA = 'total'
  }

  // Calcular descuento por porcentaje
  if (beneficio.porcentajeMaximo && beneficio.porcentajeMaximo > 0) {
    const porcentajeAplicable = Math.min(beneficio.porcentajeMaximo, 100)
    descuentoCalculado = (arancelBase * porcentajeAplicable) / 100
  }

  // Calcular descuento por monto fijo
  if (beneficio.montoMaximo && beneficio.montoMaximo > 0) {
    montoCalculado = Math.min(beneficio.montoMaximo, arancelBase)
  }

  // Aplicar el mayor descuento entre porcentaje y monto fijo
  const descuentoFinal = Math.max(descuentoCalculado, montoCalculado)

  // Aplicar límites por decil (deciles más bajos = más descuento)
  const factorDecil = Math.max(0.5, 1 - (decil - 1) * 0.05) // Factor de 0.5 a 1.0
  const descuentoConDecil = descuentoFinal * factorDecil

  return {
    beneficio,
    tipo: beneficio.porcentajeMaximo ? 'porcentaje' : 'monto_fijo',
    valor: beneficio.porcentajeMaximo || beneficio.montoMaximo || 0,
    aplicadoA,
    descuentoCalculado: descuentoConDecil,
    razonAplicacion: `Aplicado por ${beneficio.tipoBeneficio} - Decil ${decil}`
  }
}

/**
 * Calcula el arancel final con todos los descuentos aplicados
 */
export const calculateFinalArancel = (
  arancelBase: number,
  matriculaBase: number,
  beneficios: BeneficioElegible[],
  decil: number
): ArancelInfo => {
  const descuentos: DescuentoInfo[] = []
  let totalDescuentosArancel = 0
  let totalDescuentosMatricula = 0
  let totalDescuentosTotal = 0

  // Calcular descuentos para cada beneficio
  for (const beneficio of beneficios) {
    if (!beneficio.elegible) continue

    const descuento = calculateBenefitDiscount(beneficio, arancelBase, decil)
    descuentos.push(descuento)

    // Acumular descuentos por tipo
    if (descuento.aplicadoA === 'arancel') {
      totalDescuentosArancel += descuento.descuentoCalculado
    } else if (descuento.aplicadoA === 'matricula') {
      totalDescuentosMatricula += descuento.descuentoCalculado
    } else {
      totalDescuentosTotal += descuento.descuentoCalculado
    }
  }

  // Calcular totales
  const totalDescuentos = totalDescuentosArancel + totalDescuentosMatricula + totalDescuentosTotal
  const arancelFinal = Math.max(0, arancelBase - totalDescuentosArancel - totalDescuentosTotal)
  const matriculaFinal = Math.max(0, matriculaBase - totalDescuentosMatricula)
  const totalFinal = arancelFinal + matriculaFinal

  return {
    arancelBase,
    matriculaBase,
    totalBase: arancelBase + matriculaBase,
    descuentos,
    totalDescuentos,
    arancelFinal,
    matriculaFinal,
    totalFinal
  }
}

/**
 * Calcula el puntaje total PAES
 */
export const calculatePAESTotal = (puntajes: {
  matematica: number | null
  lenguaje: number | null
  ciencias: number | null
  historia: number | null
}): number => {
  const { matematica, lenguaje, ciencias, historia } = puntajes

  let total = 0
  let count = 0

  if (matematica && matematica >= 100 && matematica <= 1000) {
    total += matematica
    count++
  }

  if (lenguaje && lenguaje >= 100 && lenguaje <= 1000) {
    total += lenguaje
    count++
  }

  if (ciencias && ciencias >= 100 && ciencias <= 1000) {
    total += ciencias
    count++
  }

  if (historia && historia >= 100 && historia <= 1000) {
    total += historia
    count++
  }

  return count > 0 ? total : 0
}

/**
 * Calcula el puntaje ponderado PAES
 */
export const calculatePAESWeighted = (puntajes: {
  matematica: number | null
  lenguaje: number | null
  ciencias: number | null
  historia: number | null
}, ponderaciones: {
  matematica: number
  lenguaje: number
  ciencias: number
  historia: number
} = { matematica: 0.3, lenguaje: 0.3, ciencias: 0.2, historia: 0.2 }): number => {
  const { matematica, lenguaje, ciencias, historia } = puntajes
  const { matematica: pondMat, lenguaje: pondLen, ciencias: pondCien, historia: pondHist } = ponderaciones

  let total = 0

  if (matematica && matematica >= 100 && matematica <= 1000) {
    total += matematica * pondMat
  }

  if (lenguaje && lenguaje >= 100 && lenguaje <= 1000) {
    total += lenguaje * pondLen
  }

  if (ciencias && ciencias >= 100 && ciencias <= 1000) {
    total += ciencias * pondCien
  }

  if (historia && historia >= 100 && historia <= 1000) {
    total += historia * pondHist
  }

  return Math.round(total)
}

/**
 * Calcula el puntaje de selección (NEM + Ranking + PAES)
 */
export const calculateSelectionScore = (
  nem: number | null,
  ranking: number | null,
  paes: number | null,
  ponderaciones: {
    nem: number
    ranking: number
    paes: number
  } = { nem: 0.1, ranking: 0.1, paes: 0.8 }
): number => {
  const { nem: pondNem, ranking: pondRank, paes: pondPaes } = ponderaciones

  let total = 0

  if (nem && nem >= 1.0 && nem <= 7.0) {
    // Convertir NEM a escala 100-1000
    const nemEscalado = ((nem - 1.0) / 6.0) * 900 + 100
    total += nemEscalado * pondNem
  }

  if (ranking && ranking >= 0 && ranking <= 1000) {
    total += ranking * pondRank
  }

  if (paes && paes >= 100 && paes <= 1000) {
    total += paes * pondPaes
  }

  return Math.round(total)
}

/**
 * Calcula el ahorro anual en aranceles
 */
export const calculateAnnualSavings = (arancelBase: number, arancelFinal: number): number => {
  return Math.max(0, arancelBase - arancelFinal)
}

/**
 * Calcula el ahorro total en la carrera
 */
export const calculateTotalSavings = (arancelBase: number, arancelFinal: number, duracionCarrera: number): number => {
  const ahorroAnual = calculateAnnualSavings(arancelBase, arancelFinal)
  return ahorroAnual * duracionCarrera
}

/**
 * Calcula el porcentaje de descuento total
 */
export const calculateTotalDiscountPercentage = (arancelBase: number, arancelFinal: number): number => {
  if (arancelBase <= 0) return 0
  return Math.round(((arancelBase - arancelFinal) / arancelBase) * 100)
}

/**
 * Calcula el costo total de la carrera
 */
export const calculateTotalCareerCost = (
  arancelAnual: number,
  matriculaAnual: number,
  duracionCarrera: number
): number => {
  return (arancelAnual + matriculaAnual) * duracionCarrera
}

/**
 * Calcula el costo total con descuentos
 */
export const calculateTotalCareerCostWithDiscounts = (
  arancelBase: number,
  matriculaBase: number,
  duracionCarrera: number,
  descuentoAnual: number
): number => {
  const costoAnual = (arancelBase + matriculaBase) - descuentoAnual
  return costoAnual * duracionCarrera
}

/**
 * Calcula el ahorro total en la carrera
 */
export const calculateTotalCareerSavings = (
  arancelBase: number,
  matriculaBase: number,
  duracionCarrera: number,
  descuentoAnual: number
): number => {
  const costoTotalSinDescuento = calculateTotalCareerCost(arancelBase, matriculaBase, duracionCarrera)
  const costoTotalConDescuento = calculateTotalCareerCostWithDiscounts(arancelBase, matriculaBase, duracionCarrera, descuentoAnual)
  return costoTotalSinDescuento - costoTotalConDescuento
}

/**
 * Calcula el puntaje de elegibilidad para un beneficio
 */
export const calculateEligibilityScore = (
  beneficio: BeneficioElegible,
  formData: FormData,
  decil: number
): number => {
  let score = 0

  // Puntaje base por tipo de beneficio
  switch (beneficio.tipoBeneficio) {
    case 'BECA':
      score += 10
      break
    case 'FINANCIAMIENTO':
      score += 8
      break
    case 'FINANCIERO':
      score += 6
      break
  }

  // Puntaje por decil (deciles más bajos = más puntaje)
  score += (11 - decil) * 2

  // Puntaje por NEM
  if (formData.nem && formData.nem >= 6.0) {
    score += 5
  } else if (formData.nem && formData.nem >= 5.0) {
    score += 3
  }

  // Puntaje por ranking
  if (formData.ranking && formData.ranking >= 800) {
    score += 5
  } else if (formData.ranking && formData.ranking >= 600) {
    score += 3
  }

  // Puntaje por PAES
  if (formData.rendioPAES && formData.paes) {
    const paesTotal = calculatePAESTotal(formData.paes)
    if (paesTotal >= 800) {
      score += 5
    } else if (paesTotal >= 600) {
      score += 3
    }
  }

  // Puntaje por tipo de colegio
  if (formData.colegio) {
    // Asumir que colegios municipales dan más puntaje
    if (formData.colegio.toLowerCase().includes('municipal')) {
      score += 3
    }
  }

  return Math.min(score, 100) // Máximo 100 puntos
}

/**
 * Calcula el orden de aplicación de beneficios
 */
export const calculateBenefitOrder = (beneficios: BeneficioElegible[]): BeneficioElegible[] => {
  return beneficios.sort((a, b) => {
    // Ordenar por prioridad (menor número = mayor prioridad)
    if (a.prioridad !== b.prioridad) {
      return (a.prioridad || 999) - (b.prioridad || 999)
    }

    // Si tienen la misma prioridad, ordenar por tipo
    const tipoOrder = { 'BECA': 1, 'FINANCIAMIENTO': 2, 'FINANCIERO': 3 }
    return tipoOrder[a.tipoBeneficio] - tipoOrder[b.tipoBeneficio]
  })
}

/**
 * Calcula el descuento máximo aplicable
 */
export const calculateMaxDiscount = (
  arancelBase: number,
  beneficios: BeneficioElegible[],
  decil: number
): number => {
  let maxDiscount = 0

  for (const beneficio of beneficios) {
    if (!beneficio.elegible) continue

    const descuento = calculateBenefitDiscount(beneficio, arancelBase, decil)
    maxDiscount += descuento.descuentoCalculado
  }

  // No puede exceder el 100% del arancel
  return Math.min(maxDiscount, arancelBase)
}

/**
 * Calcula el descuento efectivo (considerando límites)
 */
export const calculateEffectiveDiscount = (
  arancelBase: number,
  beneficios: BeneficioElegible[],
  decil: number
): number => {
  const maxDiscount = calculateMaxDiscount(arancelBase, beneficios, decil)

  // Aplicar límite de descuento por decil
  const maxDiscountPercentage = Math.min(100, 20 + (10 - decil) * 5) // 20% a 70%
  const maxDiscountByDecil = (arancelBase * maxDiscountPercentage) / 100

  return Math.min(maxDiscount, maxDiscountByDecil)
}

/**
 * Calcula el ROI (Retorno de Inversión) de la carrera
 */
export const calculateROI = (
  costoTotal: number,
  salarioPromedio: number,
  duracionCarrera: number
): number => {
  if (costoTotal <= 0 || salarioPromedio <= 0) return 0

  const ingresosAnuales = salarioPromedio * 12
  const ingresosTotales = ingresosAnuales * duracionCarrera

  return ((ingresosTotales - costoTotal) / costoTotal) * 100
}

/**
 * Calcula el tiempo de recuperación de la inversión
 */
export const calculatePaybackPeriod = (
  costoTotal: number,
  salarioPromedio: number
): number => {
  if (costoTotal <= 0 || salarioPromedio <= 0) return 0

  const ingresosAnuales = salarioPromedio * 12
  return Math.ceil(costoTotal / ingresosAnuales)
}

/**
 * Calcula el valor presente neto (NPV) de la carrera
 */
export const calculateNPV = (
  costoTotal: number,
  salarioPromedio: number,
  duracionCarrera: number,
  tasaDescuento: number = 0.05
): number => {
  if (costoTotal <= 0 || salarioPromedio <= 0) return 0

  const ingresosAnuales = salarioPromedio * 12
  let npv = -costoTotal

  for (let año = 1; año <= duracionCarrera; año++) {
    const valorPresente = ingresosAnuales / Math.pow(1 + tasaDescuento, año)
    npv += valorPresente
  }

  return Math.round(npv)
}

/**
 * Calcula la tasa interna de retorno (IRR) de la carrera
 */
export const calculateIRR = (
  costoTotal: number,
  salarioPromedio: number,
  duracionCarrera: number
): number => {
  if (costoTotal <= 0 || salarioPromedio <= 0) return 0

  const ingresosAnuales = salarioPromedio * 12
  let irr = 0.01 // Empezar con 1%
  const precision = 0.0001
  const maxIterations = 1000

  for (let i = 0; i < maxIterations; i++) {
    let npv = -costoTotal

    for (let año = 1; año <= duracionCarrera; año++) {
      npv += ingresosAnuales / Math.pow(1 + irr, año)
    }

    if (Math.abs(npv) < precision) {
      return Math.round(irr * 100) / 100
    }

    // Ajustar IRR basado en el NPV
    if (npv > 0) {
      irr += 0.01
    } else {
      irr -= 0.01
    }

    if (irr <= 0) break
  }

  return Math.round(irr * 100) / 100
}
