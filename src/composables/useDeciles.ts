import { ref } from 'vue'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

type DecilRow = Database['public']['Tables']['deciles']['Row']
export interface Decil extends DecilRow {}

export function useDeciles() {
  const deciles = ref<Decil[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const cargarDeciles = async () => {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('deciles')
        .select('id, decil, rango_ingreso_min, rango_ingreso_max, descripcion, descripcion_corta, porcentaje_poblacion, activo, orden_visual, created_at, updated_at')
        .eq('activo', true)
        .order('orden_visual', { ascending: true })

      if (fetchError) throw fetchError

      // Debug: ver qué datos están llegando
      console.log('Deciles cargados desde Supabase:', data)
      if (data && data.length > 0) {
        console.log('Primer decil:', data[0])
        console.log('Tipo de rango_ingreso_min:', typeof data[0].rango_ingreso_min)
        console.log('Tipo de rango_ingreso_max:', typeof data[0].rango_ingreso_max)
        console.log('Porcentaje población:', data[0].porcentaje_poblacion, 'tipo:', typeof data[0].porcentaje_poblacion)
        console.log('Campos del primer decil:', Object.keys(data[0]))
      }

      deciles.value = data || []
    } catch (err: any) {
      console.error('Error al cargar deciles:', err.message)
      error.value = 'Error al cargar los deciles. Intenta de nuevo más tarde.'
    } finally {
      loading.value = false
    }
  }

  const buscarDecilPorRango = (ingreso: number): Decil | null => {
    return deciles.value.find(decil => {
      const min = typeof decil.rango_ingreso_min === 'string'
        ? parseFloat(decil.rango_ingreso_min)
        : Number(decil.rango_ingreso_min)

      const max = typeof decil.rango_ingreso_max === 'string'
        ? parseFloat(decil.rango_ingreso_max)
        : Number(decil.rango_ingreso_max)

      return !isNaN(min) && !isNaN(max) && ingreso >= min && ingreso <= max
    }) || null
  }

  const formatearRango = (decil: Decil): string => {
    try {
      // Debug: ver qué valores tenemos
      console.log('Formateando decil:', decil)
      console.log('rango_ingreso_min:', decil.rango_ingreso_min, 'tipo:', typeof decil.rango_ingreso_min)
      console.log('rango_ingreso_max:', decil.rango_ingreso_max, 'tipo:', typeof decil.rango_ingreso_max)

      // Convertir a números y manejar casos donde puedan ser strings
      const min = typeof decil.rango_ingreso_min === 'string'
        ? parseFloat(decil.rango_ingreso_min)
        : Number(decil.rango_ingreso_min)

      const max = typeof decil.rango_ingreso_max === 'string'
        ? parseFloat(decil.rango_ingreso_max)
        : Number(decil.rango_ingreso_max)

      console.log('Valores convertidos - min:', min, 'max:', max)

      // Verificar que los valores sean válidos
      if (isNaN(min) || isNaN(max)) {
        console.error('Valores inválidos en decil:', decil)
        return 'Rango no disponible'
      }

      const result = `$${min.toLocaleString('es-CL')} - $${max.toLocaleString('es-CL')}`
      console.log('Resultado formateado:', result)
      return result
    } catch (error) {
      console.error('Error al formatear rango:', error, decil)
      return 'Error en formato'
    }
  }

  return {
    deciles,
    loading,
    error,
    cargarDeciles,
    buscarDecilPorRango,
    formatearRango
  }
}
