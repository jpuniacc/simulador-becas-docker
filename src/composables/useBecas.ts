import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase/client'
import type { FormData } from '@/types/simulador'
import { useCarreras } from './useCarreras'

// Tipos para becas
export interface BecasUniacc {
  id: string
  codigo_beca: string
  nombre: string
  descripcion: string
  descuento_porcentaje: number | null
  descuento_monto_fijo: number | null
  descuento_mixto: {
    default: number
    rules: Array<{
      when: {
        nivel_academico?: string[]
        modalidad_programa?: string[]
      }
      porcentaje: number
    }>
  } | null
  tipo_descuento: 'porcentaje' | 'monto_fijo' | 'mixto'
  requiere_nem: boolean
  nem_minimo: number | null
  requiere_paes: boolean
  paes_minimo: number | null
  requiere_ranking: boolean | null
  ranking_minimo: number | null
  requiere_beca_estado: boolean | null
  requiere_region_especifica: boolean
  region_excluida: string | null
  region_requerida: string | null
  requiere_genero: 'Masculino' | 'Femenino' | null
  requiere_nacionalidad: boolean | null
  nacionalidad_requerida: string | null
  requiere_extranjeria: boolean | null
  requiere_residencia_chile: boolean | null
  edad_requerida: number | null
  carreras_aplicables: string[] | null
  programas_excluidos: string[] | null
  max_anos_egreso: number | null
  max_anos_paes: number | null
  vigencia_desde: string
  vigencia_hasta: string | null
  modalidades_aplicables: string[]
  nivel_aplicable: 'Pregrado' | 'Postgrado' | 'Educacion_Continua'
  duracion_tipo: 'Anual' | 'Semestral' | 'Variable'
  duracion_meses: number | null
  proceso_evaluacion: 'Automatico' | 'Evaluacion' | 'Postulacion'
  cupos_disponibles: number | null
  cupos_utilizados: number
  requiere_documentacion: string[]
  es_combinable: boolean
  becas_incompatibles: string[] | null
  activa: boolean
  prioridad: number
  requiere_institucion: boolean
  institucion_requerida: string | null
  created_at: string
  updated_at: string
}

export interface BecasElegibles {
  beca: BecasUniacc
  elegible: boolean
  razon: string
  descuento_aplicado: number
  monto_descuento: number
}

export interface CalculoBecas {
  arancel_base: number
  becas_aplicadas: BecasElegibles[]
  descuento_total: number
  arancel_final: number
  ahorro_total: number
}

// Tipos para becas del estado
export interface BecasEstado {
  id: number
  codigo_beca: string | null
  nombre: string | null
  descripcion: string | null
  descuento_porcentaje: number | null
  descuento_monto: number | null
  tipo_descuento: string | null
  requiere_nem: boolean | null
  nem_minimo: number | null
  requiere_paes: boolean | null
  paes_minimo: number | null
  requeire_decil: boolean | null
  decil_maximo: number | null
  created_at: string
}

export function useBecas() {
  const becas = ref<BecasUniacc[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Estado para becas del estado
  const becasEstado = ref<BecasEstado[]>([])
  const loadingEstado = ref(false)
  const errorEstado = ref<string | null>(null)

  // Integrar con useCarreras para obtener aranceles
  const { obtenerArancelCarrera, obtenerCarreraPorId, obtenerNivelYModalidad } = useCarreras()

  // Función para resolver descuento mixto basado en reglas
  // Evalúa dinámicamente todas las condiciones del objeto 'when' sin hardcodear campos
  const resuelveDescuentoMixto = (
    descuentoMixto: BecasUniacc['descuento_mixto'],
    contextoCarrera: Record<string, string>
  ): number => {
    if (!descuentoMixto) {
      return 0
    }

    // Recorrer las reglas en orden
    for (const rule of descuentoMixto.rules) {
      let cumpleTodasLasCondiciones = true

      // Iterar dinámicamente sobre todas las keys del objeto 'when'
      for (const campo in rule.when) {
        const valoresEsperados = rule.when[campo as keyof typeof rule.when]

        // Si el campo tiene valores esperados (array no vacío)
        if (valoresEsperados && Array.isArray(valoresEsperados) && valoresEsperados.length > 0) {
          // Obtener el valor actual del contexto de la carrera
          const valorActual = contextoCarrera[campo] || ''

          // Verificar si el valor actual coincide con alguno de los valores esperados
          const cumpleCondicion = valoresEsperados.some(valorEsperado =>
            valorEsperado.trim().toLowerCase() === valorActual.trim().toLowerCase()
          )

          // Si no cumple esta condición, la regla completa no se cumple
          if (!cumpleCondicion) {
            cumpleTodasLasCondiciones = false
            break // Salir del loop de campos, esta regla no aplica
          }
        }
      }

      // Si todas las condiciones se cumplen, devolver el porcentaje de esta regla
      if (cumpleTodasLasCondiciones) {
        return rule.porcentaje
      }
    }

    // Si ninguna regla coincide, devolver el default
    return descuentoMixto.default
  }

  // Cargar becas desde Supabase
  const cargarBecas = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase
        .from('becas_uniacc')
        .select('*')
        .eq('activa', true)
        .order('prioridad', { ascending: true })

      if (supabaseError) {
        throw supabaseError
      }
      becas.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar becas'
      console.error('Error cargando becas:', err)
    } finally {
      loading.value = false
    }
  }

  // Cargar becas del estado desde Supabase
  const cargarBecasEstado = async () => {
    try {
      loadingEstado.value = true
      errorEstado.value = null

      const { data, error: supabaseError } = await supabase
        .from('becas_estado')
        .select('*')
        .eq('activa', true)
        .order('id', { ascending: true })

        console.log('COMPOSABLE - becasEstado cargadas:', data)

      if (supabaseError) {
        throw supabaseError
      }
      becasEstado.value = data || []
    } catch (err) {
      errorEstado.value = err instanceof Error ? err.message : 'Error al cargar becas del estado'
      console.error('Error cargando becas del estado:', err)
    } finally {
      loadingEstado.value = false
    }
  }

  // Verificar elegibilidad de una beca específica
  const verificarElegibilidad = (beca: BecasUniacc, formData: FormData): BecasElegibles => {
    let elegible = true
    let razon = ''
    let descuento_aplicado = 0
    let monto_descuento = 0

    // 1. Verificar NEM
    if (beca.requiere_nem && beca.nem_minimo) {
      if (!formData.nem || formData.nem < beca.nem_minimo) {
        elegible = false
        razon = `Requiere NEM mínimo ${beca.nem_minimo}`
      }
    }

    // 2. Verificar PAES
    if (beca.requiere_paes && beca.paes_minimo) {
      const puntajePAES = formData.paes?.matematica || formData.paes?.lenguaje || 0
      if (!formData.rendioPAES || puntajePAES < beca.paes_minimo) {
        elegible = false
        razon = `Requiere PAES mínimo ${beca.paes_minimo}`
      }
    }

    // 3. Verificar ranking
    if (beca.requiere_ranking && beca.ranking_minimo) {
      if (!formData.ranking || formData.ranking < beca.ranking_minimo) {
        elegible = false
        razon = `Requiere ranking mínimo ${beca.ranking_minimo}`
      }
    }

    // 4. Verificar región
    if (beca.requiere_region_especifica) {
      // Si requiere región específica y no hay región de residencia, no es elegible
      if (!formData.regionResidencia || formData.regionResidencia.trim() === '') {
        elegible = false
        razon = `Requiere región de residencia`
      } else if (beca.region_excluida && formData.regionResidencia === beca.region_excluida) {
        elegible = false
        razon = `No aplica para región ${beca.region_excluida}`
      }
    }

    // 5. Verificar género
    if (beca.requiere_genero) {
      if (formData.genero !== beca.requiere_genero) {
        elegible = false
        razon = `Requiere género ${beca.requiere_genero}`
      }
    }

    // 6. Verificar extranjería y residencia
    // Verificar si requiere ser extranjero
    if (beca.requiere_extranjeria !== null && beca.requiere_extranjeria !== undefined) {
      const esExtranjero = formData.extranjero === true
      if (beca.requiere_extranjeria && !esExtranjero) {
        elegible = false
        razon = `Requiere ser extranjero`
      } else if (!beca.requiere_extranjeria && esExtranjero) {
        elegible = false
        razon = `No aplica para extranjeros`
      }
    }

    // Verificar si requiere residencia en Chile
    if (beca.requiere_residencia_chile !== null && beca.requiere_residencia_chile !== undefined) {
      const resideEnChile = formData.residencia_chilena === true
      if (beca.requiere_residencia_chile && !resideEnChile) {
        elegible = false
        razon = `Requiere residir en Chile`
      } else if (!beca.requiere_residencia_chile && resideEnChile) {
        elegible = false
        razon = `No aplica para residentes en Chile`
      }
    }

    // 7. Verificar carrera
    if (beca.carreras_aplicables && beca.carreras_aplicables.length > 0) {
      if (!formData.carrera || !beca.carreras_aplicables.includes(formData.carrera)) {
        // Caso especial para Beca STEM: aplicar solo a Ingeniería Informática Multimedia para mujeres
        if (beca.nombre.toLowerCase().includes('stem') && formData.genero === 'Femenino') {
          // Verificar si la carrera es específicamente "Ingeniería Informática Multimedia"
          const carreraLower = formData.carrera.toLowerCase()
          const esIngenieriaInformaticaMultimedia = carreraLower.includes('ingeniería') &&
                                                   carreraLower.includes('informática') &&
                                                   carreraLower.includes('multimedia')

          if (!esIngenieriaInformaticaMultimedia) {
            elegible = false
            razon = `Beca STEM solo aplica para Ingeniería Informática Multimedia`
          }
        } else {
          elegible = false
          razon = `No aplica para la carrera seleccionada`
        }
      }
    }

    // 8. Verificar programas excluidos
    if (beca.programas_excluidos && beca.programas_excluidos.length > 0) {
      if (formData.tipoPrograma && beca.programas_excluidos.includes(formData.tipoPrograma)) {
        elegible = false
        razon = `No aplica para programa ${formData.tipoPrograma}`
      }
    }

    // 8. Verificar programas excluidos
    if (beca.programas_excluidos && beca.programas_excluidos.length > 0) {
      if (formData.tipoPrograma && beca.programas_excluidos.includes(formData.tipoPrograma)) {
        elegible = false
        razon = `No aplica para programa ${formData.tipoPrograma}`
      }
    }

    // 9. Verificar modalidades aplicables
    if (beca.modalidades_aplicables && beca.modalidades_aplicables.length > 0) {
      if (formData.carreraId) {
        const carrera = obtenerCarreraPorId(formData.carreraId)
        if (!carrera) {
          elegible = false
          razon = `No se encontró la carrera seleccionada`
        } else {
          // Verificar si la modalidad de la carrera está en las modalidades aplicables
          if (!carrera.modalidad_programa) {
            elegible = false
            razon = `No aplica para la modalidad de la carrera seleccionada`
          } else {
            const modalidadCarrera = carrera.modalidad_programa.trim()
            const esCompatible = beca.modalidades_aplicables.some(modalidad =>
              modalidad.trim().toLowerCase() === modalidadCarrera.toLowerCase()
            )
            if (!esCompatible) {
              elegible = false
              razon = `No aplica para la modalidad de la carrera seleccionada`
            }
          }
        }
      } else {
        // Si no hay carreraId pero hay modalidades aplicables, no es elegible
        elegible = false
        razon = `Requiere una carrera seleccionada para verificar modalidad`
      }
    }

    // 10. Verificar años de egreso
    if (beca.max_anos_egreso) {
      const anoActual = new Date().getFullYear()
      const anoEgreso = formData.añoEgreso ? parseInt(formData.añoEgreso) : null
      if (anoEgreso && (anoActual - anoEgreso) > beca.max_anos_egreso) {
        elegible = false
        razon = `Máximo ${beca.max_anos_egreso} años desde egreso`
      }
    }

    // 11. Verificar años PAES
    if (beca.max_anos_paes) {
      const anoActual = new Date().getFullYear()
      // Para PAES, usamos el año de egreso como proxy ya que no tenemos año específico de PAES
      const anoPAES = formData.añoEgreso ? parseInt(formData.añoEgreso) : null
      if (anoPAES && (anoActual - anoPAES) > beca.max_anos_paes) {
        elegible = false
        razon = `Máximo ${beca.max_anos_paes} años desde PAES`
      }
    }

    // 12. Verificar edad requerida (aplica para mayores o iguales a esa edad)
    if (beca.edad_requerida !== null && beca.edad_requerida !== undefined) {
      if (!formData.anio_nacimiento) {
        elegible = false
        razon = `Requiere edad mínima ${beca.edad_requerida} años (año de nacimiento no proporcionado)`
      } else {
        const anoActual = new Date().getFullYear()
        const edad = anoActual - formData.anio_nacimiento
        if (edad < beca.edad_requerida) {
          elegible = false
          razon = `Requiere edad mínima ${beca.edad_requerida} años (edad actual: ${edad} años)`
        }
      }
    }

    // 13. Verificar vigencia
    const hoy = new Date()
    const vigenciaDesde = new Date(beca.vigencia_desde)
    const vigenciaHasta = beca.vigencia_hasta ? new Date(beca.vigencia_hasta) : null

    if (hoy < vigenciaDesde) {
      elegible = false
      razon = `Beca no vigente hasta ${vigenciaDesde.toLocaleDateString()}`
    }

    if (vigenciaHasta && hoy > vigenciaHasta) {
      elegible = false
      razon = `Beca vencida desde ${vigenciaHasta.toLocaleDateString()}`
    }

    // 14. Verificar cupos
    if (beca.cupos_disponibles && beca.cupos_utilizados >= beca.cupos_disponibles) {
      elegible = false
      razon = `No hay cupos disponibles`
    }

    // 15. Verificar institución requerida
    if (beca.requiere_institucion && beca.institucion_requerida) {
      if (!formData.institucionId || formData.institucionId !== beca.institucion_requerida) {
        elegible = false
        razon = `Requiere institución específica`
      }
    }

    // Si es elegible, calcular descuento inicial
    if (elegible) {
      if (beca.tipo_descuento === 'porcentaje' && beca.descuento_porcentaje) {
        descuento_aplicado = beca.descuento_porcentaje
      } else if (beca.tipo_descuento === 'monto_fijo' && beca.descuento_monto_fijo) {
        monto_descuento = beca.descuento_monto_fijo
      } else if (beca.tipo_descuento === 'mixto' && beca.descuento_mixto && formData.carreraId) {
        // Obtener la carrera y extraer su contexto (nivel, modalidad, etc.)
        const carrera = obtenerCarreraPorId(formData.carreraId)
        if (carrera) {
          const contextoCarrera = obtenerNivelYModalidad(carrera)
          descuento_aplicado = resuelveDescuentoMixto(beca.descuento_mixto, contextoCarrera)
        }
      }
    }


    return {
      beca,
      elegible,
      razon,
      descuento_aplicado,
      monto_descuento
    }
  }

  // Calcular becas elegibles para un estudiante
  const calcularBecasElegibles = (formData: FormData): BecasElegibles[] => {
    return becas.value.map(beca => verificarElegibilidad(beca, formData))
  }

  // Aplicar algoritmo de prelación de becas
  const aplicarPrelacion = (becasElegibles: BecasElegibles[], arancelBase: number): CalculoBecas => {
    // Filtrar solo becas elegibles
    const becasAplicables = becasElegibles.filter(b => b.elegible)

    // Ordenar por prioridad (menor número = mayor prioridad)
    becasAplicables.sort((a, b) => a.beca.prioridad - b.beca.prioridad)

    let arancelActual = arancelBase
    let descuentoTotal = 0
    const becasAplicadas: BecasElegibles[] = []
    const becasIncompatibles = new Set<string>()

    for (const becaElegible of becasAplicables) {
      const beca = becaElegible.beca

      // Verificar si es compatible con becas ya aplicadas
      if (becasIncompatibles.has(beca.codigo_beca)) {
        continue
      }

      // Verificar incompatibilidades
      if (beca.becas_incompatibles) {
        const tieneIncompatibilidad = beca.becas_incompatibles.some(codigoIncompatible =>
          becasAplicadas.some(b => b.beca.codigo_beca === codigoIncompatible)
        )
        if (tieneIncompatibilidad) {
          continue
        }
      }

      // Aplicar descuento
      let montoDescuento = 0
      if (beca.tipo_descuento === 'porcentaje' && becaElegible.descuento_aplicado > 0) {
        // Usar el descuento_aplicado calculado en verificarElegibilidad
        montoDescuento = (arancelActual * becaElegible.descuento_aplicado) / 100
      } else if (beca.tipo_descuento === 'mixto' && becaElegible.descuento_aplicado > 0) {
        // Para descuento mixto, usar el porcentaje resuelto dinámicamente
        montoDescuento = (arancelActual * becaElegible.descuento_aplicado) / 100
      } else if (beca.tipo_descuento === 'monto_fijo' && becaElegible.monto_descuento > 0) {
        // Usar el monto_descuento calculado en verificarElegibilidad
        montoDescuento = becaElegible.monto_descuento
      }

      // Actualizar arancel
      arancelActual -= montoDescuento
      descuentoTotal += montoDescuento

      // Agregar a becas aplicadas
      becasAplicadas.push({
        ...becaElegible,
        monto_descuento: montoDescuento
      })

      // Marcar becas incompatibles
      if (beca.becas_incompatibles) {
        beca.becas_incompatibles.forEach(codigo => becasIncompatibles.add(codigo))
      }
    }

    return {
      arancel_base: arancelBase,
      becas_aplicadas: becasAplicadas,
      descuento_total: descuentoTotal,
      arancel_final: arancelActual,
      ahorro_total: descuentoTotal
    }
  }

  // Calcular becas completas para un estudiante
  const calcularBecas = (formData: FormData, arancelBase?: number): CalculoBecas => {
    // Si no se proporciona arancel, obtenerlo de la carrera seleccionada
    let arancelCalculado = arancelBase || 0

    if (!arancelBase && formData.carrera) {
      arancelCalculado = obtenerArancelCarrera(formData.carrera)
    }

    const becasElegibles = calcularBecasElegibles(formData)
    return aplicarPrelacion(becasElegibles, arancelCalculado)
  }

  // Obtener información completa de costos de una carrera
  const obtenerCostosCarrera = (idCarrera: number) => {
    const carrera = obtenerCarreraPorId(idCarrera)
    if (!carrera) return null

    return {
      arancel: carrera.arancel || 0,
      arancelReferenciaCae: carrera.arancel_referencia || 0,
      matricula: carrera.matricula || 0,
      duracion: carrera.duracion_programa || '',
      anio: carrera.anio || new Date().getFullYear(),
      totalAnual: (carrera.arancel || 0) + (carrera.matricula || 0)
    }
  }

  // Obtener becas por tipo
  const becasPorTipo = computed(() => {
    const porTipo: Record<string, BecasUniacc[]> = {}
    becas.value.forEach(beca => {
      const tipo = beca.proceso_evaluacion
      if (!porTipo[tipo]) {
        porTipo[tipo] = []
      }
      porTipo[tipo].push(beca)
    })
    return porTipo
  })

  // Obtener becas por prioridad
  const becasPorPrioridad = computed(() => {
    return becas.value.reduce((acc, beca) => {
      if (!acc[beca.prioridad]) {
        acc[beca.prioridad] = []
      }
      acc[beca.prioridad].push(beca)
      return acc
    }, {} as Record<number, BecasUniacc[]>)
  })

  return {
    becas,
    loading,
    error,
    cargarBecas,
    verificarElegibilidad,
    calcularBecasElegibles,
    aplicarPrelacion,
    calcularBecas,
    obtenerCostosCarrera,
    becasPorTipo,
    becasPorPrioridad,
    // Becas del estado
    becasEstado,
    loadingEstado,
    errorEstado,
    cargarBecasEstado
  }
}
