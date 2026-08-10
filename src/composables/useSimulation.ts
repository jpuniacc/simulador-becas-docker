// Composable para simulación de beneficios
import { ref, computed, watch } from 'vue'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type {
  FormData,
  SimulationResults,
  BeneficioElegible,
  ArancelInfo,
  DescuentoInfo,
  SimulationProgress,
  SimulationConfig
} from '../types/simulador'
import type {
  DecilInfo,
  BeneficioUniaccInfo,
  CalculoBeneficio,
  ResumenBeneficios
} from '../types/beneficios'
import {
  calculateDecilWithData,
  calculateFinalArancel,
  calculatePAESTotal,
  calculatePAESWeighted,
  calculateSelectionScore,
  calculateAnnualSavings,
  calculateTotalSavings,
  calculateTotalDiscountPercentage,
  calculateEligibilityScore,
  calculateBenefitOrder,
  calculateMaxDiscount,
  calculateEffectiveDiscount
} from '../utils/calculations'

export interface UseSimulationOptions {
  arancelBase?: number
  matriculaBase?: number
  duracionCarrera?: number
  salarioPromedio?: number
  tasaDescuento?: number
  maxDescuentoPorcentaje?: number
  maxDescuentoMonto?: number
  beneficiosActivos?: boolean
  calculoDecil?: boolean
  incluirPAES?: boolean
}

export function useSimulation(
  formData: FormData,
  beneficios: BeneficioUniaccInfo[],
  deciles: DecilInfo[],
  options: UseSimulationOptions = {}
) {
  const {
    arancelBase = 2500000,
    matriculaBase = 150000,
    duracionCarrera = 4,
    salarioPromedio = 800000,
    tasaDescuento = 0.05,
    maxDescuentoPorcentaje = 100,
    maxDescuentoMonto = 2500000,
    beneficiosActivos = true,
    calculoDecil = true,
    incluirPAES = true
  } = options

  // Estado de la simulación
  const isSimulating = ref(false)
  const progress = ref(0)
  const currentStep = ref('')
  const totalSteps = ref(0)
  const results = ref<SimulationResults | null>(null)
  const error = ref<string | null>(null)
  const lastSimulation = ref<Date | null>(null)
  
  // JPS: Estados para guardado de simulación
  // Modificación: Agregar estados para manejar el guardado de simulaciones en la base de datos
  // Funcionamiento: savedSimulationId almacena el ID de la simulación guardada, isSaving indica si se está guardando
  const savedSimulationId = ref<string | null>(null)
  const isSaving = ref(false)

  // Configuración de simulación
  const config = ref<SimulationConfig>({
    arancelBase,
    matriculaBase,
    maxDescuentoPorcentaje,
    maxDescuentoMonto,
    beneficiosActivos,
    calculoDecil,
    incluirPAES
  })

  // Computed
  const canSimulate = computed(() => {
    console.log('canSimulate computed:', {
      nombre: formData.nombre,
      apellido: formData.apellido,
      email: formData.email,
      carrera: formData.carrera
    })
    return formData.nombre &&
           formData.apellido &&
           formData.email &&
           formData.carrera
  })

  const decilCalculado = computed(() => {
    // Para el MVP, usar decil por defecto ya que no tenemos ingresoMensual e integrantes
    return formData.decil || 10
  })

  const paesTotal = computed(() => {
    if (!incluirPAES || !formData.rendioPAES || !formData.paes) {
      return 0
    }
    return calculatePAESTotal(formData.paes)
  })

  const paesWeighted = computed(() => {
    if (!incluirPAES || !formData.rendioPAES || !formData.paes) {
      return 0
    }
    return calculatePAESWeighted(formData.paes)
  })

  const selectionScore = computed(() => {
    return calculateSelectionScore(
      formData.nem,
      formData.ranking,
      paesWeighted.value
    )
  })

  // Simular beneficios elegibles
  const simulateEligibleBenefits = (): BeneficioElegible[] => {
    const elegibles: BeneficioElegible[] = []

    for (const beneficio of beneficios) {
      if (!beneficio.vigente) continue

      const elegible = checkBenefitEligibility(beneficio)
      elegibles.push(elegible)
    }

    return elegibles
  }

  // Verificar elegibilidad de un beneficio
  const checkBenefitEligibility = (beneficio: BeneficioUniaccInfo): BeneficioElegible => {
    let elegible = false
    let razonElegibilidad = ''

    // Verificar criterios básicos
    if (!beneficio.vigente) {
      razonElegibilidad = 'Beneficio no vigente'
    } else if (beneficio.tipoBeneficio === 'BECA' && decilCalculado.value > 7) {
      razonElegibilidad = 'Decil socioeconómico muy alto para becas'
    } else if (beneficio.tipoBeneficio === 'FINANCIAMIENTO' && decilCalculado.value > 8) {
      razonElegibilidad = 'Decil socioeconómico muy alto para financiamiento'
    } else if (beneficio.tipoBeneficio === 'FINANCIERO' && decilCalculado.value > 9) {
      razonElegibilidad = 'Decil socioeconómico muy alto para beneficios financieros'
    } else {
      elegible = true
      razonElegibilidad = 'Cumple criterios de elegibilidad'
    }

    // Verificar requisitos específicos si existen
    if (elegible && beneficio.requisitos) {
      const requisitos = beneficio.requisitos as any

      // Verificar NEM si es requerido
      if (requisitos.nemMinimo && formData.nem && formData.nem < requisitos.nemMinimo) {
        elegible = false
        razonElegibilidad = `NEM insuficiente (requerido: ${requisitos.nemMinimo})`
      }

      // Verificar ranking si es requerido
      if (requisitos.rankingMinimo && formData.ranking && formData.ranking < requisitos.rankingMinimo) {
        elegible = false
        razonElegibilidad = `Ranking insuficiente (requerido: ${requisitos.rankingMinimo})`
      }

      // Verificar PAES si es requerido
      if (requisitos.paesMinimo && formData.rendioPAES && paesTotal.value < requisitos.paesMinimo) {
        elegible = false
        razonElegibilidad = `PAES insuficiente (requerido: ${requisitos.paesMinimo})`
      }

      // Verificar tipo de colegio si es requerido
      if (requisitos.tipoColegio && formData.colegio) {
        const tipoColegio = formData.colegio.toLowerCase()
        if (requisitos.tipoColegio === 'municipal' && !tipoColegio.includes('municipal')) {
          elegible = false
          razonElegibilidad = 'Tipo de colegio no elegible'
        }
      }
    }

    return {
      id: beneficio.id,
      codigoBeneficio: beneficio.codigoBeneficio,
      descripcion: beneficio.descripcion,
      porcentajeMaximo: beneficio.porcentajeMaximo,
      montoMaximo: beneficio.montoMaximo,
      tipoBeneficio: beneficio.tipoBeneficio,
      origenBeneficio: beneficio.origenBeneficio,
      aplicacionConcepto: beneficio.aplicacionConcepto,
      aplicacion: beneficio.aplicacion,
      prioridad: beneficio.prioridad,
      vigente: beneficio.vigente,
      requisitos: beneficio.requisitos,
      elegible,
      razonElegibilidad,
      fechaModificacion: beneficio.fechaModificacion
    }
  }

  // Calcular descuentos aplicables
  const calculateApplicableDiscounts = (beneficiosElegibles: BeneficioElegible[]): DescuentoInfo[] => {
    const descuentos: DescuentoInfo[] = []

    for (const beneficio of beneficiosElegibles) {
      if (!beneficio.elegible) continue

      const descuento = calculateBenefitDiscount(beneficio, arancelBase, decilCalculado.value)
      descuentos.push(descuento)
    }

    return descuentos
  }

  // Calcular beneficio individual
  const calculateBenefitDiscount = (
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

  // Ejecutar simulación completa
  const simulate = async (): Promise<SimulationResults> => {
    if (!canSimulate.value) {
      throw new Error('No se puede simular: faltan datos requeridos')
    }

    isSimulating.value = true
    progress.value = 0
    currentStep.value = 'Iniciando simulación...'
    totalSteps.value = 5
    error.value = null

    try {
      // Paso 1: Calcular decil socioeconómico
      progress.value = 20
      currentStep.value = 'Calculando decil socioeconómico...'
      await new Promise(resolve => setTimeout(resolve, 100))

      const decil = decilCalculado.value

      // Paso 2: Simular beneficios elegibles
      progress.value = 40
      currentStep.value = 'Evaluando beneficios elegibles...'
      await new Promise(resolve => setTimeout(resolve, 200))

      const beneficiosElegibles = simulateEligibleBenefits()
      const beneficiosAplicables = beneficiosElegibles.filter(b => b.elegible)
      const beneficiosNoAplicables = beneficiosElegibles.filter(b => !b.elegible)

      // Paso 3: Calcular descuentos
      progress.value = 60
      currentStep.value = 'Calculando descuentos...'
      await new Promise(resolve => setTimeout(resolve, 200))

      const descuentos = calculateApplicableDiscounts(beneficiosAplicables)

      // Paso 4: Calcular arancel final
      progress.value = 80
      currentStep.value = 'Calculando arancel final...'
      await new Promise(resolve => setTimeout(resolve, 200))

      const arancelInfo = calculateFinalArancel(arancelBase, matriculaBase, beneficiosAplicables, decil)

      // Paso 5: Generar resultados
      progress.value = 100
      currentStep.value = 'Finalizando simulación...'
      await new Promise(resolve => setTimeout(resolve, 100))

      const resultados: SimulationResults = {
        arancelBase: arancelInfo.arancelBase,
        descuentoTotal: arancelInfo.totalDescuentos,
        arancelFinal: arancelInfo.arancelFinal,
        beneficiosAplicables: beneficiosAplicables.map(b => ({
          ...b,
          descuentoAplicado: descuentos.find(d => d.beneficio.id === b.id)?.descuentoCalculado || 0
        })),
        beneficiosNoAplicables,
        decilCalculado: decil,
        fechaSimulacion: new Date().toISOString()
      }

      results.value = resultados
      lastSimulation.value = new Date()

      return resultados

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error desconocido en la simulación'
      throw err
    } finally {
      isSimulating.value = false
      progress.value = 0
      currentStep.value = ''
    }
  }

  // Simular con configuración personalizada
  const simulateWithConfig = async (customConfig: Partial<SimulationConfig>): Promise<SimulationResults> => {
    const originalConfig = { ...config.value }
    config.value = { ...config.value, ...customConfig }

    try {
      return await simulate()
    } finally {
      config.value = originalConfig
    }
  }

  // Obtener resumen de beneficios
  const getBenefitsSummary = (): ResumenBeneficios => {
    if (!results.value) {
      return {
        totalBeneficios: 0,
        beneficiosElegibles: 0,
        beneficiosNoElegibles: 0,
        descuentoTotal: 0,
        montoTotal: 0,
        ahorroAnual: 0,
        ahorroTotal: 0,
        beneficiosPorTipo: { beca: 0, financiamiento: 0, financiero: 0 },
        beneficiosPorOrigen: { interno: 0, externo: 0 },
        beneficiosPorConcepto: { arancel: 0, matricula: 0 }
      }
    }

    const { beneficiosAplicables, beneficiosNoAplicables, descuentoTotal } = results.value

    return {
      totalBeneficios: beneficiosAplicables.length + beneficiosNoAplicables.length,
      beneficiosElegibles: beneficiosAplicables.length,
      beneficiosNoElegibles: beneficiosNoAplicables.length,
      descuentoTotal,
      montoTotal: descuentoTotal,
      ahorroAnual: calculateAnnualSavings(arancelBase, results.value.arancelFinal),
      ahorroTotal: calculateTotalSavings(arancelBase, results.value.arancelFinal, duracionCarrera),
      beneficiosPorTipo: {
        beca: beneficiosAplicables.filter(b => b.tipoBeneficio === 'BECA').length,
        financiamiento: beneficiosAplicables.filter(b => b.tipoBeneficio === 'FINANCIAMIENTO').length,
        financiero: beneficiosAplicables.filter(b => b.tipoBeneficio === 'FINANCIERO').length
      },
      beneficiosPorOrigen: {
        interno: beneficiosAplicables.filter(b => b.origenBeneficio === 'INTERNO').length,
        externo: beneficiosAplicables.filter(b => b.origenBeneficio === 'EXTERNO').length
      },
      beneficiosPorConcepto: {
        arancel: beneficiosAplicables.filter(b => b.aplicacionConcepto === 'A').length,
        matricula: beneficiosAplicables.filter(b => b.aplicacionConcepto === 'M').length
      }
    }
  }

  // Obtener progreso de simulación
  const getSimulationProgress = (): SimulationProgress => {
    return {
      isSimulating: isSimulating.value,
      progress: progress.value,
      currentStep: currentStep.value,
      totalSteps: totalSteps.value
    }
  }

  // JPS: Validar si existe una simulación válida para el mismo RUT y carrera
  // Modificación: Agregar método para verificar si ya existe una simulación válida (no expirada) para el mismo RUT y carrera
  // Funcionamiento: Consulta primero prospectos por RUT y carrera, luego busca simulaciones válidas para esos prospectos
  const checkExistingSimulation = async (rut: string, carreraId: number): Promise<boolean> => {
    if (!rut || !carreraId) {
      return false
    }

    try {
      // JPS: Primero buscar prospectos con el mismo RUT y carrera
      // Modificación: Buscar prospectos que tengan el mismo RUT y carrera para luego buscar sus simulaciones
      // Funcionamiento: Esto permite encontrar todas las simulaciones asociadas a prospectos con el mismo RUT y carrera
      const { data: prospectos, error: prospectosError } = await supabase
        .from('prospectos')
        .select('id')
        .eq('rut', rut)
        .eq('carrera', carreraId)

      if (prospectosError) {
        console.error('Error al buscar prospectos:', prospectosError)
        return false
      }

      if (!prospectos || prospectos.length === 0) {
        return false
      }

      // JPS: Buscar simulaciones válidas para estos prospectos
      // Modificación: Buscar simulaciones donde el prospecto tenga el mismo RUT y carrera, y la simulación no haya expirado
      // Funcionamiento: 
      // 1. Filtra por prospecto_id en la lista de prospectos encontrados
      // 2. Filtra por fecha_simulacion >= NOW() - INTERVAL '7 days'
      // 3. Verifica que la fecha de validez (en resultados->>'fechaValidez') no haya expirado
      const fechaLimite = new Date()
      fechaLimite.setDate(fechaLimite.getDate() - 7)
      const fechaLimiteISO = fechaLimite.toISOString()

      const prospectoIds = prospectos.map(p => p.id)

      const { data: simulaciones, error: simulacionesError } = await supabase
        .from('simulaciones')
        .select('id, fecha_simulacion, resultados')
        .in('prospecto_id', prospectoIds)
        .gte('fecha_simulacion', fechaLimiteISO)

      if (simulacionesError) {
        console.error('Error al verificar simulaciones existentes:', simulacionesError)
        return false
      }

      if (!simulaciones || simulaciones.length === 0) {
        return false
      }

      // JPS: Verificar que la fecha de validez no haya expirado
      // Modificación: Revisar el campo fechaValidez en el JSON de resultados para asegurar que la simulación sigue siendo válida
      // Funcionamiento: Si la fecha de validez es posterior a la fecha actual, la simulación es válida
      const ahora = new Date()
      for (const simulacion of simulaciones) {
        if (simulacion.resultados && typeof simulacion.resultados === 'object') {
          const resultados = simulacion.resultados as any
          if (resultados.fechaValidez) {
            const fechaValidez = new Date(resultados.fechaValidez)
            if (fechaValidez > ahora) {
              // Existe una simulación válida
              return true
            }
          }
        }
        // JPS: Si no tiene fechaValidez en resultados, usar fecha_simulacion + 7 días
        // Modificación: Calcular fecha de validez basada en fecha_simulacion si no está en resultados
        // Funcionamiento: Por defecto, las simulaciones tienen validez de 7 días desde fecha_simulacion
        if (simulacion.fecha_simulacion) {
          const fechaSimulacion = new Date(simulacion.fecha_simulacion)
          const fechaValidezCalculada = new Date(fechaSimulacion)
          fechaValidezCalculada.setDate(fechaValidezCalculada.getDate() + 7)
          if (fechaValidezCalculada > ahora) {
            return true
          }
        }
      }

      return false
    } catch (err: any) {
      console.error('Error en checkExistingSimulation:', err)
      return false
    }
  }

  // JPS: Guardar simulación en la base de datos con validez de 7 días
  // Modificación: Agregar método para guardar la simulación completa en la tabla simulaciones
  // Funcionamiento: 
  // 1. Valida que existan resultados de simulación
  // 2. Calcula fecha de validez (7 días desde hoy)
  // 3. Guarda datos_entrada, resultados (con metadata de validez), beneficios_aplicables
  // 4. Retorna el ID de la simulación guardada
  const saveSimulation = async (prospectoId: string): Promise<string | null> => {
    if (!results.value) {
      throw new Error('No hay resultados de simulación para guardar')
    }

    if (!prospectoId) {
      throw new Error('Se requiere el ID del prospecto para guardar la simulación')
    }

    isSaving.value = true
    error.value = null

    try {
      type SimulacionInsert = Database['public']['Tables']['simulaciones']['Insert']

      // JPS: Calcular fecha de validez (7 días desde hoy)
      // Modificación: Agregar metadata de validez a los resultados de simulación
      // Funcionamiento: La simulación tiene validez de 7 días, se guarda esta información en el JSON de resultados
      const fechaSimulacion = new Date()
      const fechaValidez = new Date(fechaSimulacion)
      fechaValidez.setDate(fechaValidez.getDate() + 7)

      // JPS: Agregar información de validez a los resultados
      // Modificación: Incluir fechaValidez y diasValidez en el objeto de resultados
      // Funcionamiento: Esto permite verificar fácilmente si una simulación sigue siendo válida
      const resultadosConValidez = {
        ...results.value,
        fechaValidez: fechaValidez.toISOString(),
        diasValidez: 7
      }

      const payload: SimulacionInsert = {
        prospecto_id: prospectoId,
        datos_entrada: formData as any,
        resultados: resultadosConValidez as any,
        beneficios_aplicables: results.value.beneficiosAplicables as any,
        fecha_simulacion: fechaSimulacion.toISOString()
      }

      const { data, error: insertError } = await supabase
        .from('simulaciones')
        .insert(payload)
        .select('id')
        .single()

      if (insertError) throw insertError

      savedSimulationId.value = data.id

      if (import.meta.env.DEV) {
        console.log('✅ Simulación guardada exitosamente:', { 
          id: data.id, 
          prospectoId,
          fechaValidez: fechaValidez.toISOString()
        })
      }

      return data.id
    } catch (err: any) {
      error.value = err?.message || 'Error al guardar la simulación'
      console.error('Error al guardar simulación:', err)
      return null
    } finally {
      isSaving.value = false
    }
  }

  // Limpiar resultados
  const clearResults = () => {
    results.value = null
    error.value = null
    lastSimulation.value = null
    // JPS: Limpiar también el ID de simulación guardada
    // Modificación: Agregar limpieza de savedSimulationId cuando se limpian los resultados
    // Funcionamiento: Al limpiar resultados, también se resetea el estado de simulación guardada
    savedSimulationId.value = null
  }

  // Actualizar configuración
  const updateConfig = (newConfig: Partial<SimulationConfig>) => {
    config.value = { ...config.value, ...newConfig }
  }

  // Watchers
  watch(formData, () => {
    // Limpiar resultados cuando cambien los datos
    if (results.value) {
      clearResults()
    }
  }, { deep: true })

  return {
    // Estado
    isSimulating,
    progress,
    currentStep,
    totalSteps,
    results,
    error,
    lastSimulation,
    config,
    // JPS: Exponer estados de guardado de simulación
    // Modificación: Agregar savedSimulationId e isSaving al return del composable
    // Funcionamiento: Permite a los componentes saber si la simulación fue guardada y si se está guardando
    savedSimulationId,
    isSaving,

    // Computed
    canSimulate,
    decilCalculado,
    paesTotal,
    paesWeighted,
    selectionScore,

    // Métodos
    simulate,
    simulateWithConfig,
    simulateEligibleBenefits,
    checkBenefitEligibility,
    calculateApplicableDiscounts,
    calculateBenefitDiscount,
    getBenefitsSummary,
    getSimulationProgress,
    clearResults,
    updateConfig,
    // JPS: Exponer métodos de guardado de simulación
    // Modificación: Agregar checkExistingSimulation y saveSimulation al return
    // Funcionamiento: Permite validar y guardar simulaciones desde los componentes
    checkExistingSimulation,
    saveSimulation
  }
}

// Composable específico para simulación de UNIACC
export function useUniaccSimulation(
  formData: FormData,
  beneficios: BeneficioUniaccInfo[],
  deciles: DecilInfo[]
) {
  return useSimulation(formData, beneficios, deciles, {
    arancelBase: 2500000,
    matriculaBase: 150000,
    duracionCarrera: 4,
    salarioPromedio: 800000,
    tasaDescuento: 0.05,
    maxDescuentoPorcentaje: 100,
    maxDescuentoMonto: 2500000,
    beneficiosActivos: true,
    calculoDecil: true,
    incluirPAES: true
  })
}
