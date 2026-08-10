import { ref } from 'vue'
import axios from 'axios'
import { supabase } from '@/lib/supabase/client'

/**
 * Composable para obtener datos JSON de una tabla de Supabase y enviarlos a un endpoint
 */
export function useSupabaseToEndpoint() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Obtiene datos de una tabla de Supabase y los envía a un endpoint
   *
   * @param tableName - Nombre de la tabla en Supabase
   * @param endpointUrl - URL del endpoint donde enviar los datos
   * @param filters - Filtros opcionales para la consulta (ej: { activo: true })
   * @param selectFields - Campos específicos a seleccionar (por defecto '*')
   * @param transformData - Función opcional para transformar los datos antes de enviarlos
   * @returns Los datos enviados y la respuesta del endpoint
   */
  const enviarDatosTablaAEndpoint = async <T = any>(
    tableName: string,
    endpointUrl: string,
    filters?: Record<string, any>,
    selectFields: string = '*',
    transformData?: (data: any[]) => T
  ) => {
    loading.value = true
    error.value = null

    try {
      // 1. Obtener datos de Supabase
      let query = supabase
        .from(tableName)
        .select(selectFields)

      // Aplicar filtros si existen
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value)
            } else {
              query = query.eq(key, value)
            }
          }
        })
      }

      const { data: supabaseData, error: supabaseError } = await query

      if (supabaseError) {
        throw new Error(`Error al obtener datos de Supabase: ${supabaseError.message}`)
      }

      if (!supabaseData || supabaseData.length === 0) {
        console.warn(`No se encontraron datos en la tabla ${tableName}`)
        return { data: null, response: null, message: 'No hay datos para enviar' }
      }

      // 2. Transformar datos si se proporciona una función de transformación
      const datosParaEnviar = transformData ? transformData(supabaseData) : supabaseData

      // 3. Enviar datos al endpoint
      const response = await axios.post(endpointUrl, datosParaEnviar, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return {
        data: datosParaEnviar,
        response: response.data,
        message: 'Datos enviados exitosamente'
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al enviar datos al endpoint'
      console.error('Error en enviarDatosTablaAEndpoint:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene un registro específico por ID y lo envía a un endpoint
   *
   * @param tableName - Nombre de la tabla en Supabase
   * @param endpointUrl - URL del endpoint donde enviar los datos
   * @param recordId - ID del registro a obtener
   * @param idColumn - Nombre de la columna ID (por defecto 'id')
   * @param transformData - Función opcional para transformar los datos antes de enviarlos
   */
  const enviarRegistroAEndpoint = async <T = any>(
    tableName: string,
    endpointUrl: string,
    recordId: string | number,
    idColumn: string = 'id',
    transformData?: (data: any) => T
  ) => {
    loading.value = true
    error.value = null

    try {
      // 1. Obtener registro específico de Supabase
      const { data: supabaseData, error: supabaseError } = await supabase
        .from(tableName)
        .select('*')
        .eq(idColumn, recordId)
        .single()

      if (supabaseError) {
        throw new Error(`Error al obtener registro de Supabase: ${supabaseError.message}`)
      }

      if (!supabaseData) {
        throw new Error(`No se encontró el registro con ${idColumn} = ${recordId}`)
      }

      // 2. Transformar datos si se proporciona una función de transformación
      const datosParaEnviar = transformData ? transformData(supabaseData) : supabaseData

      // 3. Enviar datos al endpoint
      const response = await axios.post(endpointUrl, datosParaEnviar, {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      return {
        data: datosParaEnviar,
        response: response.data,
        message: 'Registro enviado exitosamente'
      }
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Error al enviar registro al endpoint'
      console.error('Error en enviarRegistroAEndpoint:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Obtiene datos de Supabase sin enviarlos (útil para debugging o procesamiento local)
   *
   * @param tableName - Nombre de la tabla en Supabase
   * @param filters - Filtros opcionales para la consulta
   * @param selectFields - Campos específicos a seleccionar (por defecto '*')
   */
  const obtenerDatosTabla = async (
    tableName: string,
    filters?: Record<string, any>,
    selectFields: string = '*'
  ) => {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from(tableName)
        .select(selectFields)

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              query = query.in(key, value)
            } else {
              query = query.eq(key, value)
            }
          }
        })
      }

      const { data, error: supabaseError } = await query

      if (supabaseError) {
        throw new Error(`Error al obtener datos de Supabase: ${supabaseError.message}`)
      }

      return data
    } catch (e: any) {
      error.value = e?.message || 'Error al obtener datos'
      console.error('Error en obtenerDatosTabla:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    enviarDatosTablaAEndpoint,
    enviarRegistroAEndpoint,
    obtenerDatosTabla
  }
}

