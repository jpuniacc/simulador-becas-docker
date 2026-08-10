import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type InstitucionRow = Database['public']['Tables']['instituciones_superior']['Row']
export type Institucion = InstitucionRow

export const useInstitucionesStore = defineStore('instituciones', () => {
  // Estado
  const instituciones = ref<Institucion[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed para instituciones activas
  const institucionesActivas = computed(() => {
    return instituciones.value.filter(inst => inst.estado === 'activa' || inst.estado === null)
  })

  // Computed para instituciones por tipo
  const institucionesPorTipo = computed(() => {
    const porTipo: Record<string, Institucion[]> = {}
    instituciones.value.forEach(inst => {
      const tipo = inst.tipo_institucion
      if (!porTipo[tipo]) {
        porTipo[tipo] = []
      }
      porTipo[tipo].push(inst)
    })
    return porTipo
  })

  // Acciones
  const cargarInstituciones = async () => {
    try {
      loading.value = true
      error.value = null

      const { data, error: supabaseError } = await supabase
        .from('instituciones_superior')
        .select('*')
        .order('nombre')

      if (supabaseError) {
        throw supabaseError
      }

      instituciones.value = data || []
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error al cargar instituciones'
      console.error('Error cargando instituciones:', err)
    } finally {
      loading.value = false
    }
  }

  const buscarInstituciones = (termino: string) => {
    if (!termino || !termino.trim()) return instituciones.value

    const terminoLower = termino.toLowerCase()
    return instituciones.value.filter(inst =>
      inst.nombre.toLowerCase().includes(terminoLower) ||
      inst.tipo_institucion.toLowerCase().includes(terminoLower)
    )
  }

  const obtenerInstitucionPorId = (id: string) => {
    return instituciones.value.find(inst => inst.id === id)
  }

  const obtenerInstitucionPorNombre = (nombre: string) => {
    return instituciones.value.find(inst => inst.nombre === nombre)
  }

  return {
    // Estado
    instituciones,
    institucionesActivas,
    institucionesPorTipo,
    loading,
    error,

    // Acciones
    cargarInstituciones,
    buscarInstituciones,
    obtenerInstitucionPorId,
    obtenerInstitucionPorNombre
  }
})

