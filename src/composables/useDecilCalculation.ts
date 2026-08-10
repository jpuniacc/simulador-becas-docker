// Composable para cálculos de decil socioeconómico
import { ref, computed, watch } from 'vue'
import type { DecilInfo } from '../types/beneficios'
import { calculateDecilWithData } from '../utils/calculations'
import { formatCurrency, formatDecil, formatDecilWithInfo } from '../utils/formatters'

export interface UseDecilCalculationOptions {
  ingresoMensual: number
  integrantes: number
  deciles: DecilInfo[]
  autoCalculate?: boolean
  showDetails?: boolean
  locale?: string
}

export function useDecilCalculation(options: UseDecilCalculationOptions) {
  const {
    ingresoMensual,
    integrantes,
    deciles,
    autoCalculate = true,
    showDetails = true,
    locale = 'es-CL'
  } = options

  // Estado
  const isCalculating = ref(false)
  const error = ref<string | null>(null)
  const lastCalculation = ref<Date | null>(null)

  // Computed
  const ingresoPerCapita = computed(() => {
    if (!ingresoMensual || !integrantes || ingresoMensual <= 0 || integrantes <= 0) {
      return 0
    }
    return ingresoMensual / integrantes
  })

  const decilCalculado = computed(() => {
    if (!ingresoMensual || !integrantes || ingresoMensual <= 0 || integrantes <= 0) {
      return 10 // Decil más alto por defecto
    }
    return calculateDecilWithData(ingresoMensual, integrantes, deciles)
  })

  const decilInfo = computed(() => {
    const decil = decilCalculado.value
    return deciles.find(d => d.decil === decil) || null
  })

  const decilFormatted = computed(() => {
    const decil = decilCalculado.value
    return formatDecil(decil)
  })

  const decilInfoFormatted = computed(() => {
    const info = decilInfo.value
    if (!info) return 'Información no disponible'
    return formatDecilWithInfo(info)
  })

  const ingresoPerCapitaFormatted = computed(() => {
    return formatCurrency(ingresoPerCapita.value, { showSymbol: true, showDecimals: false })
  })

  const ingresoMensualFormatted = computed(() => {
    return formatCurrency(ingresoMensual, { showSymbol: true, showDecimals: false })
  })

  const integrantesFormatted = computed(() => {
    return `${integrantes} ${integrantes === 1 ? 'persona' : 'personas'}`
  })

  // Calcular decil manualmente
  const calculateDecil = async (): Promise<number> => {
    if (!ingresoMensual || !integrantes || ingresoMensual <= 0 || integrantes <= 0) {
      error.value = 'Ingreso mensual e integrantes son requeridos'
      return 10
    }

    isCalculating.value = true
    error.value = null

    try {
      const decil = calculateDecilWithData(ingresoMensual, integrantes, deciles)
      lastCalculation.value = new Date()
      return decil
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al calcular decil'
      return 10
    } finally {
      isCalculating.value = false
    }
  }

  // Obtener información detallada del decil
  const getDecilDetails = () => {
    const decil = decilCalculado.value
    const info = decilInfo.value

    if (!info) {
      return {
        decil,
        descripcion: 'Información no disponible',
        descripcionCorta: 'N/A',
        rangoIngresoMin: 0,
        rangoIngresoMax: 0,
        porcentajePoblacion: 0,
        ingresoPerCapita: ingresoPerCapita.value,
        ingresoMensual,
        integrantes,
        esVulnerable: decil <= 3,
        esMedio: decil >= 4 && decil <= 7,
        esAlto: decil >= 8
      }
    }

    return {
      decil: info.decil,
      descripcion: info.descripcion,
      descripcionCorta: info.descripcionCorta,
      rangoIngresoMin: info.rangoIngresoMin,
      rangoIngresoMax: info.rangoIngresoMax,
      porcentajePoblacion: info.porcentajePoblacion,
      ingresoPerCapita: ingresoPerCapita.value,
      ingresoMensual,
      integrantes,
      esVulnerable: decil <= 3,
      esMedio: decil >= 4 && decil <= 7,
      esAlto: decil >= 8,
      cumpleRango: ingresoPerCapita.value >= info.rangoIngresoMin && ingresoPerCapita.value <= info.rangoIngresoMax
    }
  }

  // Obtener deciles cercanos
  const getNearbyDeciles = (range: number = 1) => {
    const currentDecil = decilCalculado.value
    const minDecil = Math.max(1, currentDecil - range)
    const maxDecil = Math.min(10, currentDecil + range)

    return deciles.filter(d => d.decil >= minDecil && d.decil <= maxDecil)
  }

  // Obtener deciles por vulnerabilidad
  const getDecilesByVulnerability = () => {
    return {
      vulnerables: deciles.filter(d => d.decil <= 3),
      medios: deciles.filter(d => d.decil >= 4 && d.decil <= 7),
      altos: deciles.filter(d => d.decil >= 8)
    }
  }

  // Obtener estadísticas de deciles
  const getDecilStatistics = () => {
    const totalDeciles = deciles.length
    const decilesActivos = deciles.filter(d => d.activo).length
    const decilesInactivos = totalDeciles - decilesActivos

    const porcentajeTotal = deciles.reduce((sum, d) => sum + d.porcentajePoblacion, 0)
    const porcentajePromedio = porcentajeTotal / totalDeciles

    const ingresoMinimo = Math.min(...deciles.map(d => d.rangoIngresoMin))
    const ingresoMaximo = Math.max(...deciles.map(d => d.rangoIngresoMax))

    return {
      totalDeciles,
      decilesActivos,
      decilesInactivos,
      porcentajeTotal,
      porcentajePromedio,
      ingresoMinimo,
      ingresoMaximo,
      rangoIngresos: ingresoMaximo - ingresoMinimo
    }
  }

  // Verificar si el decil es elegible para beneficios
  const isEligibleForBenefits = (tipoBeneficio: 'BECA' | 'FINANCIAMIENTO' | 'FINANCIERO'): boolean => {
    const decil = decilCalculado.value

    switch (tipoBeneficio) {
      case 'BECA':
        return decil <= 7
      case 'FINANCIAMIENTO':
        return decil <= 8
      case 'FINANCIERO':
        return decil <= 9
      default:
        return false
    }
  }

  // Obtener factor de descuento basado en decil
  const getDiscountFactor = (): number => {
    const decil = decilCalculado.value

    // Factor de 0.5 a 1.0 (deciles más bajos = más descuento)
    return Math.max(0.5, 1 - (decil - 1) * 0.05)
  }

  // Obtener porcentaje de descuento máximo basado en decil
  const getMaxDiscountPercentage = (): number => {
    const decil = decilCalculado.value

    // Porcentaje de 20% a 70% (deciles más bajos = más descuento)
    return Math.min(70, 20 + (10 - decil) * 5)
  }

  // Obtener monto de descuento máximo basado en decil
  const getMaxDiscountAmount = (arancelBase: number): number => {
    const porcentaje = getMaxDiscountPercentage()
    return (arancelBase * porcentaje) / 100
  }

  // Obtener recomendaciones basadas en decil
  const getRecommendations = () => {
    const decil = decilCalculado.value
    const details = getDecilDetails()

    const recomendaciones = []

    if (details.esVulnerable) {
      recomendaciones.push({
        tipo: 'beneficio',
        titulo: 'Becas disponibles',
        descripcion: 'Tienes acceso a becas completas y parciales',
        prioridad: 'alta'
      })
      recomendaciones.push({
        tipo: 'financiamiento',
        titulo: 'Financiamiento preferencial',
        descripcion: 'Puedes acceder a tasas de interés preferenciales',
        prioridad: 'alta'
      })
    } else if (details.esMedio) {
      recomendaciones.push({
        tipo: 'beneficio',
        titulo: 'Becas parciales',
        descripcion: 'Tienes acceso a becas parciales y descuentos',
        prioridad: 'media'
      })
      recomendaciones.push({
        tipo: 'financiamiento',
        titulo: 'Financiamiento estándar',
        descripcion: 'Puedes acceder a financiamiento con tasas estándar',
        prioridad: 'media'
      })
    } else {
      recomendaciones.push({
        tipo: 'beneficio',
        titulo: 'Descuentos limitados',
        descripcion: 'Tienes acceso a descuentos limitados',
        prioridad: 'baja'
      })
      recomendaciones.push({
        tipo: 'financiamiento',
        titulo: 'Financiamiento estándar',
        descripcion: 'Puedes acceder a financiamiento con tasas estándar',
        prioridad: 'baja'
      })
    }

    return recomendaciones
  }

  // Obtener comparación con otros deciles
  const getDecilComparison = () => {
    const currentDecil = decilCalculado.value
    const currentInfo = decilInfo.value

    if (!currentInfo) return null

    const decilesAnteriores = deciles.filter(d => d.decil < currentDecil)
    const decilesPosteriores = deciles.filter(d => d.decil > currentDecil)

    const decilAnterior = decilesAnteriores[decilesAnteriores.length - 1] || null
    const decilPosterior = decilesPosteriores[0] || null

    return {
      actual: currentInfo,
      anterior: decilAnterior,
      posterior: decilPosterior,
      diferenciaAnterior: decilAnterior ? currentInfo.rangoIngresoMin - decilAnterior.rangoIngresoMax : 0,
      diferenciaPosterior: decilPosterior ? decilPosterior.rangoIngresoMin - currentInfo.rangoIngresoMax : 0
    }
  }

  // Exportar datos del decil
  const exportDecilData = (format: 'json' | 'csv' = 'json') => {
    const details = getDecilDetails()
    const statistics = getDecilStatistics()
    const recommendations = getRecommendations()
    const comparison = getDecilComparison()

    const data = {
      calculo: {
        fecha: new Date().toISOString(),
        ingresoMensual,
        integrantes,
        ingresoPerCapita: ingresoPerCapita.value,
        decil: decilCalculado.value
      },
      detalles: details,
      estadisticas: statistics,
      recomendaciones: recommendations,
      comparacion: comparison
    }

    if (format === 'csv') {
      // Convertir a CSV (implementación básica)
      const csv = [
        'Campo,Valor',
        `Ingreso Mensual,${ingresoMensual}`,
        `Integrantes,${integrantes}`,
        `Ingreso Per Cápita,${ingresoPerCapita.value}`,
        `Decil,${decilCalculado.value}`,
        `Descripción,${details.descripcion}`,
        `Rango Mínimo,${details.rangoIngresoMin}`,
        `Rango Máximo,${details.rangoIngresoMax}`,
        `Porcentaje Población,${details.porcentajePoblacion}`
      ].join('\n')

      return csv
    }

    return data
  }

  // Limpiar cálculos
  const clearCalculations = () => {
    error.value = null
    lastCalculation.value = null
  }

  // Watchers - Deshabilitado temporalmente para evitar bucles
  // watch(() => [ingresoMensual, integrantes], () => {
  //   if (autoCalculate) {
  //     calculateDecil()
  //   }
  // })

  return {
    // Estado
    isCalculating,
    error,
    lastCalculation,

    // Computed
    ingresoPerCapita,
    decilCalculado,
    decilInfo,
    decilFormatted,
    decilInfoFormatted,
    ingresoPerCapitaFormatted,
    ingresoMensualFormatted,
    integrantesFormatted,

    // Métodos
    calculateDecil,
    getDecilDetails,
    getNearbyDeciles,
    getDecilesByVulnerability,
    getDecilStatistics,
    isEligibleForBenefits,
    getDiscountFactor,
    getMaxDiscountPercentage,
    getMaxDiscountAmount,
    getRecommendations,
    getDecilComparison,
    exportDecilData,
    clearCalculations
  }
}

// Composable específico para deciles de UNIACC
export function useUniaccDecilCalculation(
  ingresoMensual: number,
  integrantes: number,
  deciles: DecilInfo[]
) {
  return useDecilCalculation({
    ingresoMensual,
    integrantes,
    deciles,
    autoCalculate: true,
    showDetails: true,
    locale: 'es-CL'
  })
}
