import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type CarreraRow = Database['public']['Tables']['carreras_uniacc']['Row']

export type Carrera = CarreraRow

export function useCarreras() {
  const carreras = ref<Carrera[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed para carreras filtradas por vigencia
  const carrerasVigentes = computed(() => {
    return carreras.value // en tabla nueva no hay vigencia
  })

  // Función para inicializar carreras
  const inicializar = async (version?: number) => {
    try {
      loading.value = true
      error.value = null
      const versionSimulador = version ?? 10
      console.log('Inicializando carreras desde Supabase...')

      const { data, error: supabaseError } = await supabase
        .from('carreras_uniacc')
        .select('*')
        .eq('version_simulador', versionSimulador)
        .order('nombre_programa')

      if (supabaseError) {
        throw supabaseError
      }

      carreras.value = data || []
      console.log('Carreras cargadas:', carreras.value.length)
      console.log('Primera carrera:', carreras.value[0])
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar carreras'
      console.error('Error cargando carreras:', err)
    } finally {
      loading.value = false
    }
  }

  // Función para buscar carreras por término
  const buscarCarreras = (termino: string) => {
    if (!termino || !termino.trim()) return carrerasVigentes.value

    const terminoLower = termino.toLowerCase()
    return carrerasVigentes.value.filter(carrera =>
      carrera.nombre_programa.toLowerCase().includes(terminoLower)
    )
  }

  // Función para obtener arancel de una carrera específica
  const obtenerArancelCarrera = (nombreCarrera: string) => {
    const carrera = carrerasVigentes.value.find(c => c.nombre_programa === nombreCarrera)
    return carrera?.arancel || 0
  }

  // Función para obtener matrícula de una carrera específica
  const obtenerMatriculaCarrera = (nombreCarrera: string) => {
    const carrera = carrerasVigentes.value.find(c => c.nombre_programa === nombreCarrera)
    return carrera?.matricula || 0
  }

  // Función para obtener información completa de una carrera
  const obtenerCarreraPorNombre = (nombreCarrera: string) => {
    return carrerasVigentes.value.find(c => c.nombre_programa === nombreCarrera)
  }

  // Función para obtener información completa de una carrera por ID
  const obtenerCarreraPorId = (idCarrera: number) => {
    return carrerasVigentes.value.find(c => c.id === idCarrera)
  }

  // Función para extraer nivel académico y modalidad de una carrera
  const obtenerNivelYModalidad = (carrera: Carrera): Record<string, string> => {
    return {
      nivel_academico: carrera.nivel_academico || '',
      modalidad_programa: carrera.modalidad_programa || ''
    }
  }

  // Computed para carreras con aranceles definidos
  const carrerasConArancel = computed(() => {
    return carrerasVigentes.value.filter(carrera =>
      carrera.arancel && carrera.arancel > 0
    )
  })

  // Computed para rango de aranceles
  const rangoAranceles = computed(() => {
    const aranceles = carrerasConArancel.value
      .map(c => c.arancel!)
      .filter(arancel => arancel > 0)
      .sort((a, b) => a - b)

    if (aranceles.length === 0) return { min: 0, max: 0 }

    return {
      min: aranceles[0],
      max: aranceles[aranceles.length - 1]
    }
  })

  return {
    // Estado
    carreras,
    carrerasVigentes,
    carrerasConArancel,
    rangoAranceles,
    loading,
    error,

    // Métodos
    inicializar,
    buscarCarreras,
    obtenerArancelCarrera,
    obtenerMatriculaCarrera,
    obtenerCarreraPorNombre,
    obtenerCarreraPorId,
    obtenerNivelYModalidad
  }
}
