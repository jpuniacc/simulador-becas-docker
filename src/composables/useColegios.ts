// Composable para manejar datos de colegios desde Supabase
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

// Tipos extraídos de la base de datos
type ColegioRow = Database['public']['Tables']['colegios3']['Row']

export interface Region {
  region_id: number
  region_nombre: string
}

export interface Comuna {
  comuna_nombre: string
}

export interface Colegio extends ColegioRow {
  // Hereda todos los campos de ColegioRow
}

export function useColegios() {
  // Estado reactivo
  const regiones = ref<Region[]>([])
  const comunas = ref<Comuna[]>([])
  const colegios = ref<Colegio[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Estado de selección
  const regionSeleccionada = ref<Region | null>(null)
  const comunaSeleccionada = ref<Comuna | null>(null)
  const colegioSeleccionado = ref<Colegio | null>(null)

  // Computed
  const comunasFiltradas = computed(() => {
    if (!regionSeleccionada.value) return []
    return comunas.value
  })

  const colegiosFiltrados = computed(() => {
    if (!comunaSeleccionada.value) return []
    return colegios.value.filter(colegio => colegio.comuna_nombre === comunaSeleccionada.value?.comuna_nombre)
  })

  // Métodos
  const cargarRegiones = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase
        .rpc('get_regiones_unicas')

      if (supabaseError) throw supabaseError

      regiones.value = (data as unknown as Region[]) || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar regiones'
      console.error('Error cargando regiones:', err)
    } finally {
      loading.value = false
    }
  }

  const cargarComunas = async (regionId: number) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase
        .rpc('get_comunas_por_region', { region: regionId })

      if (supabaseError) throw supabaseError

      comunas.value = (data as unknown as Comuna[]) || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar comunas'
      console.error('Error cargando comunas:', err)
    } finally {
      loading.value = false
    }
  }

  const cargarColegios = async (comunaNombre: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase
        .from('colegios3')
        .select('*')
        .eq('comuna_nombre', comunaNombre)
        .order('nombre')

      if (supabaseError) throw supabaseError

      colegios.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar colegios'
      console.error('Error cargando colegios:', err)
    } finally {
      loading.value = false
    }
  }

  const buscarColegios = async (comunaNombre: string, termino: string) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase
        .from('colegios3')
        .select('*')
        .eq('comuna_nombre', comunaNombre)
        .ilike('nombre', `%${termino}%`)
        .order('nombre')
        .limit(50) // Limitar resultados para mejor rendimiento

      if (supabaseError) throw supabaseError

      colegios.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al buscar colegios'
      console.error('Error buscando colegios:', err)
    } finally {
      loading.value = false
    }
  }

  // Métodos de selección
  const seleccionarRegion = async (region: Region) => {
    regionSeleccionada.value = region
    comunaSeleccionada.value = null
    colegioSeleccionado.value = null
    comunas.value = []
    colegios.value = []

    if (region) {
      await cargarComunas(region.region_id)
    }
  }

  const seleccionarComuna = async (comuna: Comuna) => {
    comunaSeleccionada.value = comuna
    colegioSeleccionado.value = null
    colegios.value = []

    if (comuna) {
      await cargarColegios(comuna.comuna_nombre)
    }
  }

  const seleccionarColegio = (colegio: Colegio) => {
    colegioSeleccionado.value = colegio
  }

  const resetearSeleccion = () => {
    regionSeleccionada.value = null
    comunaSeleccionada.value = null
    colegioSeleccionado.value = null
    comunas.value = []
    colegios.value = []
  }

  // Inicializar
  const inicializar = async () => {
    await cargarRegiones()
  }

  return {
    // Estado
    regiones,
    comunas,
    colegios,
    loading,
    error,
    regionSeleccionada,
    comunaSeleccionada,
    colegioSeleccionado,

    // Computed
    comunasFiltradas,
    colegiosFiltrados,

    // Métodos
    cargarRegiones,
    cargarComunas,
    cargarColegios,
    buscarColegios,
    seleccionarRegion,
    seleccionarComuna,
    seleccionarColegio,
    resetearSeleccion,
    inicializar
  }
}
