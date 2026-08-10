// Store para beneficios y becas
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  BeneficioUniaccInfo,
  DecilInfo,
  NacionalidadInfo,
  ColegioInfo,
  BeneficioElegible,
  FiltroBeneficios,
  OrdenamientoBeneficios,
  PaginacionBeneficios,
  BusquedaBeneficios,
  ResultadoBusquedaBeneficios,
  EstadisticasBeneficios,
  ComparacionBeneficios,
  HistorialBeneficio,
  ExportacionBeneficios
} from '../types/beneficios'
import {
  calculateBenefitOrder,
  calculateEligibilityScore,
  calculateMaxDiscount,
  calculateEffectiveDiscount
} from '../utils/calculations'
import { formatBenefit, formatBenefitWithDiscount } from '../utils/formatters'

export const useBeneficiosStore = defineStore('beneficios', () => {
  // Estado principal
  const beneficios = ref<BeneficioUniaccInfo[]>([])
  const deciles = ref<DecilInfo[]>([])
  const nacionalidades = ref<NacionalidadInfo[]>([])
  const colegios = ref<ColegioInfo[]>([])

  // Estado de carga
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<Date | null>(null)

  // Estado de búsqueda y filtros
  const filtros = ref<FiltroBeneficios>({})
  const ordenamiento = ref<OrdenamientoBeneficios>({
    campo: 'codigoBeneficio',
    direccion: 'asc'
  })
  const paginacion = ref<PaginacionBeneficios>({
    pagina: 1,
    limite: 20,
    total: 0,
    totalPaginas: 0
  })

  // Estado de búsqueda
  const busqueda = ref<BusquedaBeneficios>({
    filtros: filtros.value,
    ordenamiento: ordenamiento.value,
    paginacion: paginacion.value
  })

  // Estado de resultados
  const resultados = ref<ResultadoBusquedaBeneficios | null>(null)
  const estadisticas = ref<EstadisticasBeneficios | null>(null)

  // Estado de selección
  const beneficiosSeleccionados = ref<Set<string>>(new Set())
  const beneficiosComparacion = ref<BeneficioUniaccInfo[]>([])

  // Computed
  const beneficiosActivos = computed(() =>
    beneficios.value.filter(b => b.vigente)
  )

  const beneficiosInactivos = computed(() =>
    beneficios.value.filter(b => !b.vigente)
  )

  const beneficiosInternos = computed(() =>
    beneficios.value.filter(b => b.origenBeneficio === 'INTERNO')
  )

  const beneficiosExternos = computed(() =>
    beneficios.value.filter(b => b.origenBeneficio === 'EXTERNO')
  )

  const beneficiosArancel = computed(() =>
    beneficios.value.filter(b => b.aplicacionConcepto === 'A')
  )

  const beneficiosMatricula = computed(() =>
    beneficios.value.filter(b => b.aplicacionConcepto === 'M')
  )

  const beneficiosPorTipo = computed(() => ({
    beca: beneficios.value.filter(b => b.tipoBeneficio === 'BECA'),
    financiamiento: beneficios.value.filter(b => b.tipoBeneficio === 'FINANCIAMIENTO'),
    financiero: beneficios.value.filter(b => b.tipoBeneficio === 'FINANCIERO')
  }))

  const beneficiosPorPrioridad = computed(() => ({
    prioridad1: beneficios.value.filter(b => b.prioridad === 1),
    prioridad2: beneficios.value.filter(b => b.prioridad === 2),
    prioridad3: beneficios.value.filter(b => b.prioridad === 3),
    sinPrioridad: beneficios.value.filter(b => !b.prioridad)
  }))

  const totalBeneficios = computed(() => beneficios.value.length)
  const totalBeneficiosActivos = computed(() => beneficiosActivos.value.length)
  const totalBeneficiosInactivos = computed(() => beneficiosInactivos.value.length)

  // Cargar datos
  const loadBeneficios = async (beneficiosData: BeneficioUniaccInfo[]) => {
    isLoading.value = true
    error.value = null

    try {
      beneficios.value = beneficiosData
      lastUpdate.value = new Date()

      // Actualizar estadísticas
      await updateEstadisticas()

      // Ejecutar búsqueda inicial
      await searchBeneficios()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar beneficios'
    } finally {
      isLoading.value = false
    }
  }

  const loadDeciles = async (decilesData: DecilInfo[]) => {
    deciles.value = decilesData
  }

  const loadNacionalidades = async (nacionalidadesData: NacionalidadInfo[]) => {
    nacionalidades.value = nacionalidadesData
  }

  const loadColegios = async (colegiosData: ColegioInfo[]) => {
    colegios.value = colegiosData
  }

  // Fetch desde Supabase
  const fetchBeneficios = async () => {
    isLoading.value = true
    error.value = null

    try {
      // Aquí iría la llamada a Supabase
      // Por ahora, retornamos un array vacío
      const beneficiosData: BeneficioUniaccInfo[] = []
      await loadBeneficios(beneficiosData)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar beneficios desde Supabase'
    } finally {
      isLoading.value = false
    }
  }

  const fetchDeciles = async () => {
    try {
      // Aquí iría la llamada a Supabase
      // Por ahora, retornamos un array vacío
      const decilesData: DecilInfo[] = []
      await loadDeciles(decilesData)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar deciles desde Supabase'
    }
  }

  const fetchNacionalidades = async () => {
    try {
      // Aquí iría la llamada a Supabase
      // Por ahora, retornamos un array vacío
      const nacionalidadesData: NacionalidadInfo[] = []
      await loadNacionalidades(nacionalidadesData)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar nacionalidades desde Supabase'
    }
  }

  const fetchColegios = async () => {
    try {
      // Aquí iría la llamada a Supabase
      // Por ahora, retornamos un array vacío
      const colegiosData: ColegioInfo[] = []
      await loadColegios(colegiosData)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar colegios desde Supabase'
    }
  }

  // Búsqueda y filtrado
  const searchBeneficios = async (): Promise<ResultadoBusquedaBeneficios> => {
    const startTime = Date.now()

    try {
      let filtered = [...beneficios.value]

      // Aplicar filtros
      if (filtros.value.tipoBeneficio && filtros.value.tipoBeneficio.length > 0) {
        filtered = filtered.filter(b => filtros.value.tipoBeneficio!.includes(b.tipoBeneficio))
      }

      if (filtros.value.origenBeneficio && filtros.value.origenBeneficio.length > 0) {
        filtered = filtered.filter(b => filtros.value.origenBeneficio!.includes(b.origenBeneficio))
      }

      if (filtros.value.aplicacionConcepto && filtros.value.aplicacionConcepto.length > 0) {
        filtered = filtered.filter(b => filtros.value.aplicacionConcepto!.includes(b.aplicacionConcepto))
      }

      if (filtros.value.prioridad && filtros.value.prioridad.length > 0) {
        filtered = filtered.filter(b => filtros.value.prioridad!.includes(b.prioridad || 0))
      }

      if (filtros.value.vigente !== undefined) {
        filtered = filtered.filter(b => b.vigente === filtros.value.vigente)
      }

      if (filtros.value.elegible !== undefined) {
        // Aquí se podría implementar lógica de elegibilidad
        // Por ahora, asumimos que todos son elegibles
        filtered = filtered.filter(b => true)
      }

      if (filtros.value.texto) {
        const texto = filtros.value.texto.toLowerCase()
        filtered = filtered.filter(b =>
          b.descripcion.toLowerCase().includes(texto) ||
          b.codigoBeneficio.toString().includes(texto)
        )
      }

      // Aplicar ordenamiento
      filtered.sort((a, b) => {
        const campo = ordenamiento.value.campo
        const direccion = ordenamiento.value.direccion

        let aValue: any
        let bValue: any

        switch (campo) {
          case 'codigoBeneficio':
            aValue = a.codigoBeneficio
            bValue = b.codigoBeneficio
            break
          case 'descripcion':
            aValue = a.descripcion
            bValue = b.descripcion
            break
          case 'porcentajeMaximo':
            aValue = a.porcentajeMaximo || 0
            bValue = b.porcentajeMaximo || 0
            break
          case 'montoMaximo':
            aValue = a.montoMaximo || 0
            bValue = b.montoMaximo || 0
            break
          case 'prioridad':
            aValue = a.prioridad || 999
            bValue = b.prioridad || 999
            break
          case 'tipoBeneficio':
            aValue = a.tipoBeneficio
            bValue = b.tipoBeneficio
            break
          default:
            aValue = a.codigoBeneficio
            bValue = b.codigoBeneficio
        }

        if (direccion === 'asc') {
          return aValue > bValue ? 1 : -1
        } else {
          return aValue < bValue ? 1 : -1
        }
      })

      // Aplicar paginación
      const total = filtered.length
      const totalPaginas = Math.ceil(total / paginacion.value.limite)
      const inicio = (paginacion.value.pagina - 1) * paginacion.value.limite
      const fin = inicio + paginacion.value.limite
      const paginados = filtered.slice(inicio, fin)

      // Actualizar paginación
      paginacion.value = {
        ...paginacion.value,
        total,
        totalPaginas
      }

      const tiempoConsulta = Date.now() - startTime

      const resultado: ResultadoBusquedaBeneficios = {
        beneficios: paginados,
        resumen: {
          totalBeneficios: total,
          beneficiosElegibles: paginados.length,
          beneficiosNoElegibles: 0,
          descuentoTotal: 0,
          montoTotal: 0,
          ahorroAnual: 0,
          ahorroTotal: 0,
          beneficiosPorTipo: {
            beca: paginados.filter(b => b.tipoBeneficio === 'BECA').length,
            financiamiento: paginados.filter(b => b.tipoBeneficio === 'FINANCIAMIENTO').length,
            financiero: paginados.filter(b => b.tipoBeneficio === 'FINANCIERO').length
          },
          beneficiosPorOrigen: {
            interno: paginados.filter(b => b.origenBeneficio === 'INTERNO').length,
            externo: paginados.filter(b => b.origenBeneficio === 'EXTERNO').length
          },
          beneficiosPorConcepto: {
            arancel: paginados.filter(b => b.aplicacionConcepto === 'A').length,
            matricula: paginados.filter(b => b.aplicacionConcepto === 'M').length
          }
        },
        paginacion: paginacion.value,
        tiempoConsulta
      }

      resultados.value = resultado
      return resultado

    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error en la búsqueda'
      throw err
    }
  }

  // Actualizar filtros
  const updateFiltros = (nuevosFiltros: Partial<FiltroBeneficios>) => {
    filtros.value = { ...filtros.value, ...nuevosFiltros }
    paginacion.value.pagina = 1 // Reset a primera página
  }

  const clearFiltros = () => {
    filtros.value = {}
    paginacion.value.pagina = 1
  }

  // Actualizar ordenamiento
  const updateOrdenamiento = (nuevoOrdenamiento: OrdenamientoBeneficios) => {
    ordenamiento.value = nuevoOrdenamiento
  }

  // Actualizar paginación
  const updatePaginacion = (nuevaPaginacion: Partial<PaginacionBeneficios>) => {
    paginacion.value = { ...paginacion.value, ...nuevaPaginacion }
  }

  // Navegación de páginas
  const goToPage = (pagina: number) => {
    if (pagina >= 1 && pagina <= paginacion.value.totalPaginas) {
      paginacion.value.pagina = pagina
    }
  }

  const nextPage = () => {
    if (paginacion.value.pagina < paginacion.value.totalPaginas) {
      paginacion.value.pagina++
    }
  }

  const prevPage = () => {
    if (paginacion.value.pagina > 1) {
      paginacion.value.pagina--
    }
  }

  // Estadísticas
  const updateEstadisticas = async () => {
    try {
      const total = beneficios.value.length
      const activos = beneficiosActivos.value.length
      const inactivos = beneficiosInactivos.value.length
      const internos = beneficiosInternos.value.length
      const externos = beneficiosExternos.value.length
      const arancel = beneficiosArancel.value.length
      const matricula = beneficiosMatricula.value.length

      const porcentajes = beneficios.value
        .filter(b => b.porcentajeMaximo)
        .map(b => b.porcentajeMaximo!)
      const montos = beneficios.value
        .filter(b => b.montoMaximo)
        .map(b => b.montoMaximo!)

      const promedioPorcentaje = porcentajes.length > 0
        ? porcentajes.reduce((sum, p) => sum + p, 0) / porcentajes.length
        : 0
      const promedioMonto = montos.length > 0
        ? montos.reduce((sum, m) => sum + m, 0) / montos.length
        : 0

      const tipos = beneficios.value.map(b => b.tipoBeneficio)
      const tipoMasComun = tipos.reduce((a, b, i, arr) =>
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
      )
      const tipoMenosComun = tipos.reduce((a, b, i, arr) =>
        arr.filter(v => v === a).length <= arr.filter(v => v === b).length ? a : b
      )

      estadisticas.value = {
        totalBeneficios: total,
        beneficiosActivos: activos,
        beneficiosInactivos: inactivos,
        beneficiosInternos: internos,
        beneficiosExternos: externos,
        beneficiosArancel: arancel,
        beneficiosMatricula: matricula,
        promedioPorcentaje,
        promedioMonto,
        beneficioMasComun: tipoMasComun,
        beneficioMenosComun: tipoMenosComun
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al calcular estadísticas'
    }
  }

  // Selección de beneficios
  const selectBeneficio = (beneficioId: string) => {
    beneficiosSeleccionados.value.add(beneficioId)
  }

  const deselectBeneficio = (beneficioId: string) => {
    beneficiosSeleccionados.value.delete(beneficioId)
  }

  const toggleBeneficio = (beneficioId: string) => {
    if (beneficiosSeleccionados.value.has(beneficioId)) {
      deselectBeneficio(beneficioId)
    } else {
      selectBeneficio(beneficioId)
    }
  }

  const selectAllBeneficios = () => {
    beneficios.value.forEach(b => beneficiosSeleccionados.value.add(b.id))
  }

  const deselectAllBeneficios = () => {
    beneficiosSeleccionados.value.clear()
  }

  const isBeneficioSelected = (beneficioId: string): boolean => {
    return beneficiosSeleccionados.value.has(beneficioId)
  }

  const getSelectedBeneficios = (): BeneficioUniaccInfo[] => {
    return beneficios.value.filter(b => beneficiosSeleccionados.value.has(b.id))
  }

  // Comparación de beneficios
  const addToComparison = (beneficio: BeneficioUniaccInfo) => {
    if (!beneficiosComparacion.value.find(b => b.id === beneficio.id)) {
      beneficiosComparacion.value.push(beneficio)
    }
  }

  const removeFromComparison = (beneficioId: string) => {
    beneficiosComparacion.value = beneficiosComparacion.value.filter(b => b.id !== beneficioId)
  }

  const clearComparison = () => {
    beneficiosComparacion.value = []
  }

  const compareBeneficios = (): ComparacionBeneficios[] => {
    const comparaciones: ComparacionBeneficios[] = []

    for (let i = 0; i < beneficiosComparacion.value.length; i++) {
      for (let j = i + 1; j < beneficiosComparacion.value.length; j++) {
        const beneficio1 = beneficiosComparacion.value[i]
        const beneficio2 = beneficiosComparacion.value[j]

        const diferencias = []
        const similitudes = []

        // Comparar campos
        const campos = ['codigoBeneficio', 'descripcion', 'tipoBeneficio', 'origenBeneficio', 'aplicacionConcepto', 'prioridad']

        campos.forEach(campo => {
          const valor1 = (beneficio1 as any)[campo]
          const valor2 = (beneficio2 as any)[campo]

          if (valor1 !== valor2) {
            diferencias.push({ campo, valor1, valor2 })
          } else {
            similitudes.push({ campo, valor: valor1 })
          }
        })

        comparaciones.push({
          beneficio1,
          beneficio2,
          diferencias,
          similitudes,
          recomendacion: generarRecomendacion(beneficio1, beneficio2, diferencias)
        })
      }
    }

    return comparaciones
  }

  const generarRecomendacion = (b1: BeneficioUniaccInfo, b2: BeneficioUniaccInfo, diferencias: any[]): string => {
    // Lógica simple de recomendación
    if (b1.prioridad && b2.prioridad) {
      if (b1.prioridad < b2.prioridad) {
        return `${b1.descripcion} tiene mayor prioridad`
      } else if (b2.prioridad < b1.prioridad) {
        return `${b2.descripcion} tiene mayor prioridad`
      }
    }

    if (b1.porcentajeMaximo && b2.porcentajeMaximo) {
      if (b1.porcentajeMaximo > b2.porcentajeMaximo) {
        return `${b1.descripcion} ofrece mayor descuento porcentual`
      } else if (b2.porcentajeMaximo > b1.porcentajeMaximo) {
        return `${b2.descripcion} ofrece mayor descuento porcentual`
      }
    }

    return 'Ambos beneficios son similares'
  }

  // Exportación
  const exportBeneficios = (opciones: ExportacionBeneficios) => {
    const beneficiosAExportar = resultados.value?.beneficios || beneficios.value

    if (opciones.formato === 'json') {
      return JSON.stringify(beneficiosAExportar, null, 2)
    }

    if (opciones.formato === 'csv') {
      const headers = ['Código', 'Descripción', 'Tipo', 'Origen', 'Aplicación', 'Prioridad', 'Vigente']
      const rows = beneficiosAExportar.map(b => [
        b.codigoBeneficio,
        b.descripcion,
        b.tipoBeneficio,
        b.origenBeneficio,
        b.aplicacionConcepto,
        b.prioridad || '',
        b.vigente ? 'Sí' : 'No'
      ])

      return [headers, ...rows].map(row => row.join(',')).join('\n')
    }

    return beneficiosAExportar
  }

  // Watchers
  watch([filtros, ordenamiento], () => {
    searchBeneficios()
  }, { deep: true })

  return {
    // Estado principal
    beneficios,
    deciles,
    nacionalidades,
    colegios,

    // Estado de carga
    isLoading,
    error,
    lastUpdate,

    // Estado de búsqueda
    filtros,
    ordenamiento,
    paginacion,
    busqueda,
    resultados,
    estadisticas,

    // Estado de selección
    beneficiosSeleccionados,
    beneficiosComparacion,

    // Computed
    beneficiosActivos,
    beneficiosInactivos,
    beneficiosInternos,
    beneficiosExternos,
    beneficiosArancel,
    beneficiosMatricula,
    beneficiosPorTipo,
    beneficiosPorPrioridad,
    totalBeneficios,
    totalBeneficiosActivos,
    totalBeneficiosInactivos,

    // Carga de datos
    loadBeneficios,
    loadDeciles,
    loadNacionalidades,
    loadColegios,

    // Fetch desde Supabase
    fetchBeneficios,
    fetchDeciles,
    fetchNacionalidades,
    fetchColegios,

    // Búsqueda y filtrado
    searchBeneficios,
    updateFiltros,
    clearFiltros,
    updateOrdenamiento,
    updatePaginacion,
    goToPage,
    nextPage,
    prevPage,

    // Estadísticas
    updateEstadisticas,

    // Selección
    selectBeneficio,
    deselectBeneficio,
    toggleBeneficio,
    selectAllBeneficios,
    deselectAllBeneficios,
    isBeneficioSelected,
    getSelectedBeneficios,

    // Comparación
    addToComparison,
    removeFromComparison,
    clearComparison,
    compareBeneficios,

    // Exportación
    exportBeneficios
  }
})
