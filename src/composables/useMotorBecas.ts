/**
 * Motor de becas del modal del paso 2 (VOU v4, fase 3).
 *
 * Es SOLO lectura y cálculo: carga becas/carreras (GET) y calcula con la MISMA lógica que el
 * resumen (becasStore.calcularBecas con el arancel por id + calcularResumen). No llama a
 * `simuladorStore.simulate()` ni a nada de lead/analytics: no hay escrituras hasta el resumen.
 */
import { ref } from 'vue'
import { useSimuladorStore } from '@/stores/simuladorStore'
import { useBecasStore } from '@/stores/becasStore'
import { useCarrerasStore } from '@/stores/carrerasStore'
import { formatCurrency } from '@/utils/formatters'
import { CUOTAS_POR_DEFECTO, calcularResumen, etiquetaBecaAplicada, type ResultadoResumen } from '@/utils/resumenPregrado'
import type { FormData } from '@/types/simulador'

export interface ResultadoMotor {
  carreraId: number
  nombre: string
  nivelAcademico: string
  modalidad: string
  duracion: string
  arancelReferencial: number
  matricula: number
  /** Monto del descuento de la beca UNIACC (0 si no aplica ninguna). */
  descuentoBeca: number
  hayBeca: boolean
  beca: null | {
    nombre: string
    /** % de descuento (null si la beca es de monto fijo). */
    porcentaje: number | null
    monto: number
    etiqueta: string
  }
  resumen: ResultadoResumen
}

export function useMotorBecas() {
  const simuladorStore = useSimuladorStore()
  const becasStore = useBecasStore()
  const carrerasStore = useCarrerasStore()

  const cargando = ref(false)
  const error = ref<string | null>(null)
  const resultado = ref<ResultadoMotor | null>(null)

  const calcular = async (formData: Partial<FormData>): Promise<ResultadoMotor | null> => {
    cargando.value = true
    error.value = null
    resultado.value = null
    try {
      if (!formData.carreraId) throw new Error('Falta seleccionar una carrera')
      if (carrerasStore.carreras.length === 0) await carrerasStore.cargarCarreras()
      if (becasStore.becas.length === 0) await becasStore.cargarBecas()

      // Igual que el resumen: el store recibe los datos del formulario y calcula sobre ellos
      simuladorStore.updateFormData(formData)

      const carrera = carrerasStore.obtenerCarreraPorId(formData.carreraId)
      if (!carrera) throw new Error('No encontramos la carrera seleccionada')
      const costos = becasStore.obtenerCostosCarrera(formData.carreraId)
      const arancelPorId = costos?.arancel || undefined
      const calculo = becasStore.calcularBecas(simuladorStore.formData as FormData, arancelPorId)

      const resumen = calcularResumen({
        arancelBase: calculo.arancel_base || 0,
        matricula: carrera.matricula || 0,
        descuentoBeca: calculo.descuento_total || 0,
        cuotas: CUOTAS_POR_DEFECTO
      })

      const principal: any = (calculo.becas_aplicadas || [])[0] ?? null
      resultado.value = {
        carreraId: formData.carreraId,
        nombre: carrera.nombre_programa,
        nivelAcademico: carrera.nivel_academico || '',
        modalidad: carrera.modalidad_programa || '',
        duracion: carrera.duracion_programa || '',
        arancelReferencial: resumen.arancelReferencial,
        matricula: resumen.matricula,
        descuentoBeca: resumen.descuentoBeca,
        hayBeca: !!principal,
        beca: principal
          ? {
              nombre: principal.beca?.nombre || 'Beca UNIACC',
              porcentaje: principal.beca?.tipo_descuento === 'monto_fijo' ? null : Number(principal.descuento_aplicado) || 0,
              monto: resumen.descuentoBeca,
              etiqueta: etiquetaBecaAplicada(principal, formatCurrency)
            }
          : null,
        resumen
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'No pudimos calcular tu beca'
      console.error('Motor de becas:', e)
    } finally {
      cargando.value = false
    }
    return resultado.value
  }

  return { cargando, error, resultado, calcular }
}
