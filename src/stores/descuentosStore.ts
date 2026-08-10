import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'

// Tipos basados en las tablas de Supabase
type DescuentoModoPagoRow = Database['public']['Tables']['descuento_modo_pago']['Row']
export type DescuentoModoPago = DescuentoModoPagoRow

type DescuentoPagoAnticipadoRow = Database['public']['Tables']['descuento_pago_anticipado']['Row']
export type DescuentoPagoAnticipado = DescuentoPagoAnticipadoRow

export const useDescuentosStore = defineStore('descuentos', () => {
  // Estado para descuento_modo_pago
  const descuentosModoPago = ref<DescuentoModoPago[]>([])
  const loadingModoPago = ref(false)
  const errorModoPago = ref<string | null>(null)

  // Estado para descuento_pago_anticipado
  const descuentosPagoAnticipado = ref<DescuentoPagoAnticipado[]>([])
  const loadingPagoAnticipado = ref(false)
  const errorPagoAnticipado = ref<string | null>(null)

  // Computed para descuentos activos de modo de pago
  const descuentosModoPagoActivos = computed(() => {
    return descuentosModoPago.value.filter(descuento => descuento.activa === true)
  })

  // Computed para descuentos de pago anticipado vigentes (activos y en rango de fechas)
  const descuentosPagoAnticipadoVigentes = computed(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0) // Normalizar a inicio del día

    return descuentosPagoAnticipado.value.filter(descuento => {
      // Verificar que esté activo
      if (descuento.activa !== true) return false

      // Verificar que tenga fechas definidas
      if (!descuento.fecha_inicio || !descuento.fecha_termino) return false

      // Convertir fechas a objetos Date y normalizar
      const fechaInicio = new Date(descuento.fecha_inicio)
      fechaInicio.setHours(0, 0, 0, 0)

      const fechaTermino = new Date(descuento.fecha_termino)
      fechaTermino.setHours(23, 59, 59, 999) // Incluir todo el día de término

      // Verificar que la fecha actual esté entre inicio y término
      return hoy >= fechaInicio && hoy <= fechaTermino
    })
  })

  // Función para cargar descuentos de modo de pago
  const cargarDescuentosModoPago = async () => {
    try {
      loadingModoPago.value = true
      errorModoPago.value = null

      const { data, error: supabaseError } = await supabase
        .from('descuento_modo_pago')
        .select('*')
        .eq('activa', true)
        .order('nombre', { ascending: true })

      if (supabaseError) {
        throw supabaseError
      }

      descuentosModoPago.value = data || []
    } catch (err) {
      errorModoPago.value = err instanceof Error ? err.message : 'Error al cargar descuentos de modo de pago'
      console.error('Error cargando descuentos de modo de pago:', err)
    } finally {
      loadingModoPago.value = false
    }
  }

  // Función para cargar descuentos de pago anticipado con filtro de fecha
  const cargarDescuentosPagoAnticipado = async () => {
    try {
      loadingPagoAnticipado.value = true
      errorPagoAnticipado.value = null

      const hoy = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD

      const { data, error: supabaseError } = await supabase
        .from('descuento_pago_anticipado')
        .select('*')
        .eq('activa', true)
        .lte('fecha_inicio', hoy) // fecha_inicio <= hoy
        .gte('fecha_termino', hoy) // fecha_termino >= hoy
        .order('fecha_inicio', { ascending: true })

      if (supabaseError) {
        throw supabaseError
      }

      descuentosPagoAnticipado.value = data || []
    } catch (err) {
      errorPagoAnticipado.value = err instanceof Error ? err.message : 'Error al cargar descuentos de pago anticipado'
      console.error('Error cargando descuentos de pago anticipado:', err)
    } finally {
      loadingPagoAnticipado.value = false
    }
  }

  // Función para obtener descuento de modo de pago por ID
  const obtenerDescuentoModoPagoPorId = (id: string): DescuentoModoPago | undefined => {
    return descuentosModoPago.value.find(descuento => descuento.id === id)
  }

  // Función para obtener descuento de pago anticipado por ID
  const obtenerDescuentoPagoAnticipadoPorId = (id: string): DescuentoPagoAnticipado | undefined => {
    return descuentosPagoAnticipado.value.find(descuento => descuento.id === id)
  }

  // Función para obtener el descuento de pago anticipado vigente actual
  const obtenerDescuentoPagoAnticipadoVigente = (): DescuentoPagoAnticipado | null => {
    const vigentes = descuentosPagoAnticipadoVigentes.value
    if (vigentes.length === 0) return null
    // Si hay múltiples, retornar el primero (o se podría agregar lógica para prioridad)
    return vigentes[0]
  }

  // Función para cargar todos los descuentos
  const cargarTodosLosDescuentos = async () => {
    await Promise.all([
      cargarDescuentosModoPago(),
      cargarDescuentosPagoAnticipado()
    ])
  }

  return {
    // Estado - Modo de Pago
    descuentosModoPago,
    descuentosModoPagoActivos,
    loadingModoPago,
    errorModoPago,

    // Estado - Pago Anticipado
    descuentosPagoAnticipado,
    descuentosPagoAnticipadoVigentes,
    loadingPagoAnticipado,
    errorPagoAnticipado,

    // Acciones - Modo de Pago
    cargarDescuentosModoPago,
    obtenerDescuentoModoPagoPorId,

    // Acciones - Pago Anticipado
    cargarDescuentosPagoAnticipado,
    obtenerDescuentoPagoAnticipadoPorId,
    obtenerDescuentoPagoAnticipadoVigente,

    // Acciones generales
    cargarTodosLosDescuentos
  }
})
