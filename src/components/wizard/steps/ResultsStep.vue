<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  DollarSign,
  Minus,
  TrendingUp,
  Award,
  Info,
  XCircle,
  RotateCcw,
  Share,
  Download,
  GraduationCap,
  BookOpen,
  Calendar,
  MapPin,
  FileText,
  Save,
  Clock
} from 'lucide-vue-next'
import type { SimulationResults } from '@/types/simulador'
import { formatCurrency } from '@/utils/formatters'
import { useSimuladorStore } from '@/stores/simuladorStore'
import { useProspectos } from '@/composables/useProspectos'
import { useCRM } from '@/composables/useCRM'
import html2pdf from 'html2pdf.js'

// Props
interface Props {
  results: SimulationResults | null
  error?: string | null
}

defineProps<Props>()

// Emits
const emit = defineEmits<{
  'new-simulation': []
  share: []
  'export-pdf': []
}>()

// Store
const simuladorStore = useSimuladorStore()
const { insertarProspecto, error: insertError } = useProspectos()
const { createJSONcrm, enviarCRM } = useCRM()

// Ref para el elemento a capturar
const pdfContentRef = ref<HTMLElement | null>(null)

// JPS: Estados para guardado de simulación
// Modificación: Agregar estados para manejar el proceso de guardado de simulación
// Funcionamiento: Estos estados controlan el flujo de guardado y muestran mensajes al usuario
const prospectoId = ref<string | null>(null)
const isSavingSimulation = ref(false)
const simulationSaved = ref(false)
const savingError = ref<string | null>(null)
const hasExistingSimulation = ref(false)

// Computed
const calculoBecas = computed(() => simuladorStore.calculoBecas)
const formData = computed(() => simuladorStore.formData)

// Computed para información de la carrera
const carreraInfo = computed(() => {
  if (!formData.value.carreraId) return null
  return simuladorStore.carrerasStore.obtenerCarreraPorId(formData.value.carreraId)
})

// Computed para becas aplicadas (internas)
const becasAplicadas = computed(() => {
  return calculoBecas.value?.becas_aplicadas || []
})

// Computed para becas del estado aplicadas con montos calculados (para mostrar en tarjetas)
const becasEstadoAplicadasConDetalle = computed(() => {
  return becasEstadoConMontos.value
})

// Computed para becas del estado elegibles
const becasEstadoElegibles = computed(() => {
  return simuladorStore.becasStore.becasElegiblesEstado || []
})

// Computed para becas del estado aplicadas (solo las elegibles)
const becasEstadoAplicadas = computed(() => {
  return becasEstadoElegibles.value.filter(b => b.elegible)
})

// Computed para becas del estado con montos calculados
const becasEstadoConMontos = computed(() => {
  if (!calculoBecas.value || becasEstadoAplicadas.value.length === 0) return []

  let arancelActual = calculoBecas.value.arancel_base
  const becasConMontos = becasEstadoAplicadas.value.map(becaEstado => {
    let montoDescuento = 0
    if (becaEstado.beca.tipo_descuento === 'porcentaje' && becaEstado.descuento_aplicado) {
      montoDescuento = (arancelActual * becaEstado.descuento_aplicado) / 100
    } else if (becaEstado.beca.tipo_descuento === 'monto_fijo' && becaEstado.monto_descuento) {
      montoDescuento = becaEstado.monto_descuento
    }
    arancelActual -= montoDescuento
    return {
      ...becaEstado,
      monto_descuento: montoDescuento
    }
  })

  return becasConMontos
})

// Computed para calcular descuento total de becas del estado
const descuentoBecasEstado = computed(() => {
  return becasEstadoConMontos.value.reduce((total, beca) => total + beca.monto_descuento, 0)
})

// Computed para arancel después de aplicar becas del estado
const arancelDespuesBecasEstado = computed(() => {
  if (!calculoBecas.value) return 0
  return calculoBecas.value.arancel_base - descuentoBecasEstado.value
})

// Computed para descuento total (becas del estado + becas internas) - sin CAE
const descuentoTotalReal = computed(() => {
  if (!calculoBecas.value) return 0
  return descuentoBecasEstado.value + calculoBecas.value.descuento_total
})

// Computed para obtener arancel referencia CAE
const arancelReferenciaCae = computed(() => {
  if (!formData.value.carrera || !formData.value.planeaUsarCAE) return 0
  return simuladorStore.carrerasStore.obtenerArancelReferenciaCae(formData.value.carrera) || 0
})

// Computed para arancel después de becas internas (remanente antes de CAE)
const arancelDespuesBecasInternas = computed(() => {
  if (!calculoBecas.value) return 0
  // Usar el arancel_final que ya tiene el arancel después de aplicar becas internas
  return calculoBecas.value.arancel_final
})

// Computed para descuento CAE aplicado
const descuentoCae = computed(() => {
  if (arancelReferenciaCae.value === 0) return 0
  // El descuento es el monto del arancel_referencia_cae, pero no puede ser mayor al remanente
  return Math.min(arancelReferenciaCae.value, arancelDespuesBecasInternas.value)
})

// Computed para arancel después de aplicar CAE
const arancelDespuesCae = computed(() => {
  return Math.max(0, arancelDespuesBecasInternas.value - descuentoCae.value)
})

// Computed para arancel final real (incluye descuento CAE)
const arancelFinalReal = computed(() => {
  return arancelDespuesCae.value
})

// Computed para descuento total real (incluye CAE)
const descuentoTotalRealConCae = computed(() => {
  if (!calculoBecas.value) return 0
  return descuentoBecasEstado.value + calculoBecas.value.descuento_total + descuentoCae.value
})

// Computed para becas no elegibles
const becasNoElegibles = computed(() => {
  if (!simuladorStore.becasStore.becas) return []
  const aplicadas = becasAplicadas.value.map(b => b.beca.codigo_beca)
  return simuladorStore.becasStore.becas
    .filter(beca => !aplicadas.includes(beca.codigo_beca))
    .map(beca => ({
      beca,
      elegible: false,
      razon: 'No cumple con los requisitos',
      descuento_aplicado: 0,
      monto_descuento: 0
    }))
})

// Computed para becas disponibles para estudiantes de enseñanza media
const becasDisponiblesMedia = computed(() => {
  if (!esEstudianteSinResultados.value) return []

  // Filtrar becas que podrían aplicar para estudiantes de enseñanza media
  return simuladorStore.becasStore.becas
    .filter(beca => {
      // Beca Apoyo Regional - aplica automáticamente si está fuera de RM
      if (beca.nombre.toLowerCase().includes('apoyo regional') || beca.nombre.toLowerCase().includes('regional')) {
        return formData.value.regionId !== 13
      }

      // Beca STEM - aplica para mujeres en Ingeniería Informática Multimedia
      if (beca.nombre.toLowerCase().includes('stem')) {
        return formData.value.genero === 'Femenino' &&
               formData.value.carrera.toLowerCase().includes('ingeniería') &&
               formData.value.carrera.toLowerCase().includes('informática') &&
               formData.value.carrera.toLowerCase().includes('multimedia')
      }

      // Beca Egresados UNIACC - no aplica para estudiantes de enseñanza media
      if (beca.nombre.toLowerCase().includes('egresados uniacc')) {
        return false
      }

      // Otras becas que no requieren NEM/PAES
      return !beca.nombre.toLowerCase().includes('mérito') &&
             !beca.nombre.toLowerCase().includes('paes') &&
             !beca.nombre.toLowerCase().includes('nem')
    })
    .map(beca => {
      let razon = ''
      let elegible = false

      // Beca Apoyo Regional
      if (beca.nombre.toLowerCase().includes('apoyo regional') || beca.nombre.toLowerCase().includes('regional')) {
        if (formData.value.regionId !== 13) {
          elegible = true
          razon = 'Elegible por residir fuera de Región Metropolitana'
        } else {
          razon = 'Solo aplica para estudiantes de regiones (fuera de RM)'
        }
      }

      // Beca STEM
      else if (beca.nombre.toLowerCase().includes('stem')) {
        if (formData.value.genero === 'Femenino' &&
            formData.value.carrera.toLowerCase().includes('ingeniería') &&
            formData.value.carrera.toLowerCase().includes('informática') &&
            formData.value.carrera.toLowerCase().includes('multimedia')) {
          elegible = true
          razon = 'Elegible por ser mujer en Ingeniería Informática Multimedia'
        } else {
          razon = 'Solo aplica para mujeres en Ingeniería Informática Multimedia'
        }
      }

      // Otras becas
      else {
        elegible = true
        razon = 'Disponible para tu perfil actual'
      }

      return {
        beca,
        elegible,
        razon,
        descuento_aplicado: elegible ? beca.descuento_porcentaje : 0,
        monto_descuento: 0
      }
    })
})

// Computed para porcentaje de ahorro (incluye becas del estado y CAE)
const porcentajeAhorro = computed(() => {
  if (!calculoBecas.value) return 0
  const { arancel_base } = calculoBecas.value
  const ahorroTotal = descuentoTotalRealConCae.value
  return arancel_base > 0 ? Math.round((ahorroTotal / arancel_base) * 100) : 0
})

// Computed para ahorro total (incluye becas del estado y CAE)
const ahorroTotalReal = computed(() => {
  return descuentoTotalRealConCae.value
})

// JPS: Computed values para datos de simulación
// Modificación: Agregar computed values para calcular los montos de simulación necesarios para guardar
// Funcionamiento: Estos valores se calculan basándose en los datos disponibles (calculoBecas, carreraInfo)
// y se usan al guardar la simulación en la base de datos
const arancelOriginalComputed = computed(() => {
  return calculoBecas.value?.arancel_base || 0
})

const matriculaOriginalComputed = computed(() => {
  return carreraInfo.value?.matricula || 0
})

const descuentoTotalComputed = computed(() => {
  return descuentoTotalRealConCae.value
})

// JPS: Arancel final después de todos los descuentos
// Modificación: Calcular arancel final considerando todos los descuentos aplicados
// Funcionamiento: Arancel base menos descuento total (becas internas + becas estado + CAE)
const arancelFinalComputed = computed(() => {
  if (!calculoBecas.value) return 0
  return Math.max(0, calculoBecas.value.arancel_base - descuentoTotalRealConCae.value)
})

// JPS: Matrícula final (sin descuentos adicionales por ahora)
// Modificación: Calcular matrícula final (por ahora sin descuentos adicionales de modo de pago)
// Funcionamiento: Matrícula original sin descuentos adicionales
const matriculaFinalComputed = computed(() => {
  return matriculaOriginalComputed.value
})

// JPS: Total final (arancel + matrícula después de descuentos)
// Modificación: Calcular el total final a pagar
// Funcionamiento: Suma de arancel final y matrícula final
const totalFinalComputed = computed(() => {
  return arancelFinalComputed.value + matriculaFinalComputed.value
})

// JPS: Valor mensual según número de cuotas
// Modificación: Calcular el valor mensual dividiendo el total final por el número de cuotas
// Funcionamiento: Total final dividido por número de cuotas del store (por defecto 10)
const valorMensualComputed = computed(() => {
  const cuotas = simuladorStore.numeroCuotas || 10
  if (cuotas <= 0) return totalFinalComputed.value
  return Math.round(totalFinalComputed.value / cuotas)
})

// Computed para detectar si es estudiante sin NEM/PAES
const esEstudianteSinResultados = computed(() => {
  return formData.value.nivelEducativo !== 'Egresado' ||
         (!formData.value.nem && !formData.value.rendioPAES)
})

// Computed para mensaje personalizado
const mensajePersonalizado = computed(() => {
  if (esEstudianteSinResultados.value) {
    const esEstudianteMedia = formData.value.nivelEducativo !== 'Egresado'

    return {
      titulo: '¡HAS FINALIZADO!',
      saludo: `¡Felicidades, ${formData.value.nombre}!`,
      email: formData.value.email,
      mensaje: esEstudianteMedia
        ? '¡Felicidades! Con los datos que ingresaste, podrías optar a las siguientes becas y beneficios. ¡Mantén tu motivación y sigue estudiando!'
        : 'Según los datos que nos brindaste, cuentas con los requisitos para postular. Pregunta tu beca o beneficio al 600 401 00 60',
      puntaje: null,
      explicacion: esEstudianteMedia
        ? 'Basándonos en tu perfil actual, te mostramos las becas a las que podrías acceder. Cuando tengas tus resultados NEM y PAES, podrás realizar una simulación más completa con todas las becas disponibles.'
        : 'Como aún no tienes NEM ni PAES, no podemos calcular con precisión todas las becas disponibles. Te invitamos a realizar una nueva simulación cuando tengas estos resultados para obtener un cálculo más completo.'
    }
  }
  return null
})

// Métodos
const handleNewSimulation = () => {
  emit('new-simulation')
}

const handleShare = () => {
  emit('share')
}

const handleExportPDF = async () => {
  try {
    if (!pdfContentRef.value) {
      console.warn('No se encontró el elemento a capturar')
      return
    }

    // Configuración para html2pdf.js
    const options = {
      margin: [10, 10, 10, 10],
      filename: 'simulacion-uniacc.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        letterRendering: true
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const,
        compress: true
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
        before: '.page-break-before',
        after: '.page-break-after',
        avoid: ['.no-break', 'table', 'tr']
      }
    }

    // Generar PDF directamente desde HTML
    await html2pdf().set(options).from(pdfContentRef.value).save()
  } catch (e) {
    console.error('No se pudo generar el PDF:', e)
  }
}

// JPS: Guardar prospecto al montar el step de resultados
// Modificación: COMENTADO - Ya no se guarda automáticamente, ahora se guarda al hacer clic en "Guardar Simulación"
// Funcionamiento: El guardado ahora es manual mediante el botón "Guardar Simulación" que ejecuta handleSaveSimulation
// onMounted(async () => {
//   try {
//     // Generar el JSON del CRM si hay consentimiento de contacto
//     let crmJson = null
//     let respuestaCRM = null
//     
//     if (formData.value.consentimiento_contacto) {
//       const userAgent = navigator.userAgent
//       const carreraInfoValue = carreraInfo.value
//       crmJson = createJSONcrm(formData.value, carreraInfoValue, userAgent)
//       
//       // Enviar al CRM para obtener la respuesta
//       try {
//         respuestaCRM = await enviarCRM(formData.value, carreraInfoValue, userAgent)
//       } catch (error) {
//         console.warn('No se pudo enviar al CRM:', error)
//         // Continuar aunque falle el CRM, pero sin respuesta
//       }
//     }
//
//     // Insertar usando los datos actuales del formulario con la respuesta del CRM
//     await insertarProspecto(formData.value, undefined, undefined, crmJson, respuestaCRM)
//     if (insertError.value) {
//       console.warn('No se pudo guardar el prospecto:', insertError.value)
//     }
//   } catch (e) {
//     console.warn('Fallo al guardar prospecto:', e)
//   }
// })

// JPS: Función para guardar simulación con validación y flujo completo
// Modificación: Agregar función que valida simulación existente, guarda prospecto, simulación y envía al CRM
// Funcionamiento: 
// 1. Valida si existe simulación válida para el mismo RUT + carrera
// 2. Si no existe, guarda prospecto con datos de simulación
// 3. Guarda simulación en BD con validez de 7 días
// 4. Envía al CRM si hay consentimiento
const handleSaveSimulation = async () => {
  // JPS: Validar que existan resultados de simulación
  // Modificación: Verificar que haya resultados antes de guardar
  // Funcionamiento: Solo se puede guardar si hay resultados de simulación disponibles
  if (!simuladorStore.results) {
    savingError.value = 'No hay resultados de simulación para guardar. Por favor, completa la simulación primero.'
    return
  }

  isSavingSimulation.value = true
  savingError.value = null
  hasExistingSimulation.value = false

  try {
    // JPS: Paso 0: Validar si existe simulación válida
    // Modificación: Verificar si ya existe una simulación válida para el mismo RUT y carrera en los últimos 7 días
    // Funcionamiento: Previene guardar simulaciones duplicadas antes de que expire la validez
    const rut = formData.value.tipoIdentificacion === 'rut' ? formData.value.identificacion : null
    const carreraId = formData.value.carreraId

    // JPS: Acceder a simulation.value porque es un ref
    // Modificación: Acceder correctamente a simulation que ahora es un ref en el store
    // Funcionamiento: simulation es un ref, por lo que se accede con .value
    if (rut && carreraId && simuladorStore.simulation?.value) {
      try {
        const existeSimulacion = await simuladorStore.simulation.value.checkExistingSimulation(rut, carreraId)
        if (existeSimulacion) {
          hasExistingSimulation.value = true
          savingError.value = 'Ya existe una simulación válida para este RUT y carrera. La simulación tiene una validez de 7 días. Debes esperar hasta que expire para crear una nueva simulación.'
          return
        }
      } catch (error) {
        console.warn('Error al verificar simulación existente:', error)
        // Continuar aunque falle la validación
      }
    }

    // JPS: Paso 1: Obtener datos de simulación y guardar prospecto
    // Modificación: Capturar datos de simulación actuales y guardar prospecto con estos datos
    // Funcionamiento: Los datos se capturan al hacer clic en "Guardar", usando valores del store o computed
    const datosSimulacion = {
      medioPago: simuladorStore.medioPago || null,
      numeroCuotas: simuladorStore.numeroCuotas || 10,
      arancelOriginal: arancelOriginalComputed.value,
      matriculaOriginal: matriculaOriginalComputed.value,
      descuentoTotal: descuentoTotalComputed.value,
      arancelFinal: arancelFinalComputed.value,
      matriculaFinal: matriculaFinalComputed.value,
      totalFinal: totalFinalComputed.value,
      valorMensual: valorMensualComputed.value
    }

    // JPS: Guardar prospecto con datos de simulación
    // Modificación: Llamar a insertarProspecto incluyendo los datos de simulación
    // Funcionamiento: Guarda el prospecto con todos los datos incluyendo medio de pago, cuotas y montos
    let prospectoGuardado = null
    try {
      prospectoGuardado = await insertarProspecto(
        formData.value,
        undefined,
        undefined,
        null, // crmJson se enviará después
        null, // respuestaCRM se obtendrá después
        datosSimulacion.medioPago,
        datosSimulacion.numeroCuotas,
        datosSimulacion.arancelOriginal,
        datosSimulacion.matriculaOriginal,
        datosSimulacion.descuentoTotal,
        datosSimulacion.arancelFinal,
        datosSimulacion.matriculaFinal,
        datosSimulacion.totalFinal,
        datosSimulacion.valorMensual
      )
      
      if (!prospectoGuardado || !prospectoGuardado.id) {
        throw new Error('No se pudo obtener el ID del prospecto guardado')
      }
      
      prospectoId.value = prospectoGuardado.id
    } catch (error) {
      console.error('Error al guardar prospecto:', error)
      savingError.value = 'Error al guardar el prospecto. Por favor, intente nuevamente.'
      return
    }

    // JPS: Paso 2: Guardar simulación en BD
    // Modificación: Guardar la simulación completa en la tabla simulaciones con validez de 7 días
    // Funcionamiento: Guarda datos_entrada, resultados (con metadata de validez), beneficios_aplicables
    try {
      // JPS: Acceder a simulation.value porque es un ref
      // Modificación: Acceder correctamente a simulation que ahora es un ref en el store
      // Funcionamiento: simulation es un ref, por lo que se accede con .value
      if (simuladorStore.simulation?.value && simuladorStore.simulation.value.saveSimulation) {
        const simulacionId = await simuladorStore.simulation.value.saveSimulation(prospectoId.value)
        if (!simulacionId) {
          throw new Error('No se pudo obtener el ID de la simulación guardada')
        }
        simulationSaved.value = true
      } else {
        throw new Error('No se encontró el método saveSimulation')
      }
    } catch (error) {
      console.error('Error al guardar simulación:', error)
      savingError.value = 'Error al guardar la simulación. Por favor, intente nuevamente.'
      return
    }

    // JPS: Paso 3: Enviar al CRM (solo si hay consentimiento)
    // Modificación: Enviar al CRM después de guardar la simulación exitosamente
    // Funcionamiento: Si hay consentimiento, se envía al CRM y se actualiza el prospecto con la respuesta
    if (formData.value.consentimiento_contacto && prospectoId.value) {
      try {
        const userAgent = navigator.userAgent
        const carreraInfoValue = carreraInfo.value
        const crmJson = createJSONcrm(formData.value, carreraInfoValue, userAgent)
        
        // JPS: Enviar al CRM
        // Modificación: Enviar datos al CRM después de guardar la simulación
        // Funcionamiento: Obtiene la respuesta del CRM para guardarla en el prospecto
        const respuestaCRM = await enviarCRM(formData.value, carreraInfoValue, userAgent)
        
        if (import.meta.env.DEV) {
          console.log('✅ CRM enviado exitosamente:', respuestaCRM)
        }
      } catch (error) {
        console.warn('No se pudo enviar al CRM:', error)
        // Continuar aunque falle el CRM
      }
    }

  } catch (err: any) {
    savingError.value = err?.message || 'Error al guardar la simulación'
    console.error('Error en handleSaveSimulation:', err)
  } finally {
    isSavingSimulation.value = false
  }
}
</script>

<template>
  <div class="results-step p-8 animate-fade-in min-h-full bg-white">
    <div ref="pdfContentRef" class="step-content">
      <!-- JPS: Botón y mensajes de guardado de simulación -->
      <!-- Modificación: Agregar UI para guardar simulación con botón, mensajes de éxito/error y validación -->
      <!-- Funcionamiento: Permite al usuario guardar la simulación manualmente, con validación de simulación existente -->
      
      <!-- Mensaje de simulación existente -->
      <div v-if="hasExistingSimulation" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
        <Clock class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-yellow-800 font-semibold mb-1">Simulación ya guardada</p>
          <p class="text-yellow-700 text-sm">{{ savingError || 'Ya existe una simulación válida para este RUT y carrera. La simulación tiene una validez de 7 días. Debes esperar hasta que expire para crear una nueva simulación.' }}</p>
        </div>
      </div>

      <!-- JPS: Botón de guardar simulación -->
      <!-- Modificación: Botón siempre visible para guardar la simulación manualmente -->
      <!-- Funcionamiento: Permite al usuario guardar la simulación cuando lo desee, con estados de carga y deshabilitado -->
      <div class="mb-6 flex justify-center">
        <Button
          @click="handleSaveSimulation"
          :disabled="isSavingSimulation || simulationSaved || hasExistingSimulation || !simuladorStore.results"
          variant="default"
          size="lg"
          class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save class="w-5 h-5" />
          <span>{{ isSavingSimulation ? 'Guardando...' : simulationSaved ? 'Simulación Guardada' : 'Guardar Simulación' }}</span>
        </Button>
      </div>

      <!-- Mensaje de éxito -->
      <div v-if="simulationSaved" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
        <CheckCircle class="w-5 h-5 text-green-600 flex-shrink-0" />
        <div class="flex-1">
          <p class="text-green-800 font-semibold">Simulación guardada exitosamente</p>
          <p class="text-green-700 text-sm">Tu simulación ha sido guardada y tiene una validez de 7 días a contar de hoy.</p>
        </div>
      </div>

      <!-- Mensaje de error -->
      <div v-if="savingError && !hasExistingSimulation" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
        <XCircle class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="text-red-800 font-semibold mb-1">Error al guardar</p>
          <p class="text-red-700 text-sm">{{ savingError }}</p>
        </div>
      </div>

      <!-- Header de resultados -->
      <div class="results-header">
        <div v-if="mensajePersonalizado" class="personalized-header">
          <div class="banner">
            <span class="banner-text">{{ mensajePersonalizado.titulo }}</span>
          </div>
          <h2 class="personalized-title">{{ mensajePersonalizado.saludo }}</h2>
          <p class="personalized-email">{{ mensajePersonalizado.email }}</p>
          <p class="personalized-message">{{ mensajePersonalizado.mensaje }}</p>
          <div class="explanation-card">
            <Info class="w-5 h-5 text-blue-600" />
            <p class="explanation-text">{{ mensajePersonalizado.explicacion }}</p>
          </div>
        </div>
        <div v-else class="standard-header">
          <div class="success-icon">
            <CheckCircle class="w-16 h-16 text-green-600" />
          </div>
          <h2 class="results-title">¡Simulación Completada!</h2>
          <p class="results-description">
            Aquí tienes los beneficios y descuentos que puedes obtener en UNIACC
          </p>
        </div>
      </div>

      <!-- Información de la carrera -->
      <div v-if="carreraInfo" class="career-info">
        <h3 class="section-title">
          <GraduationCap class="w-6 h-6" />
          Información de la Carrera
        </h3>
        <div class="career-card">
          <div class="career-header">
            <div class="career-title">
              <h4 class="career-name">{{ carreraInfo.nombre_programa }}</h4>
              <p class="career-degree">{{ carreraInfo.nivel_academico }}</p>
            </div>
            <div class="career-faculty">
              <BookOpen class="w-5 h-5 text-blue-600" />
              <span>{{ carreraInfo.modalidad_programa }}</span>
            </div>
          </div>
          <div class="career-details">
            <div class="career-detail">
              <Calendar class="w-4 h-4" />
              <span>{{ carreraInfo.duracion_programa }}</span>
            </div>

          </div>
        </div>
      </div>

      <!-- Tabla de resultados detallada -->
      <div v-if="calculoBecas" class="results-table-section">
        <h3 class="section-title">
          <DollarSign class="w-6 h-6" />
          Detalle de la Simulación
        </h3>
        <div class="table-container">
          <table class="results-table">
            <thead>
              <tr>
                <th class="table-header">Concepto</th>
                <th class="table-header text-right">Tipo</th>
                <th class="table-header text-right">Descuento</th>
                <th class="table-header text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              <!-- Matricula -->
              <!-- <tr class="table-row base-row">
                <td class="table-cell font-semibold">
                  Matrícula
                </td>
                <td class="table-cell text-center text-gray-500">-</td>
                <td class="table-cell text-center text-gray-500">-</td>
                <td class="table-cell text-right font-semibold">
                  {{ formatCurrency(carreraInfo.matricula) }}
                </td>
              </tr> -->
              <!-- Arancel base -->
              <tr class="table-row base-row">
                <td class="table-cell font-semibold">
                  Arancel Base
                </td>
                <td class="table-cell text-center text-gray-500">-</td>
                <td class="table-cell text-center text-gray-500">-</td>
                <td class="table-cell text-right font-semibold">
                  {{ formatCurrency(calculoBecas.arancel_base) }}
                </td>
              </tr>

              <!-- Sección: Beneficios del Estado -->
              <template v-if="becasEstadoConMontos.length > 0">
                <tr class="table-row section-header-row">
                  <td class="table-cell font-bold text-purple-700" colspan="4">
                    Becas Estatales
                  </td>
                </tr>
                <tr
                  v-for="becaEstado in becasEstadoConMontos"
                  :key="`estado-${becaEstado.beca.id}`"
                  class="table-row benefit-row estado-row"
                >
                  <td class="table-cell">
                    <div class="benefit-name">
                      <Award class="w-4 h-4 text-purple-600 inline mr-2" />
                      {{ becaEstado.beca.nombre || 'Beca del Estado' }}
                    </div>
                  </td>
                  <td class="table-cell text-center">
                    <span class="badge-type badge-estado">
                      {{ becaEstado.beca.tipo_descuento === 'porcentaje' ? 'Porcentaje' :
                         becaEstado.beca.tipo_descuento === 'monto_fijo' ? 'Monto Fijo' : 'Mixto' }}
                    </span>
                  </td>
                  <td class="table-cell text-center">
                    <span v-if="becaEstado.beca.tipo_descuento === 'porcentaje'" class="discount-percentage">
                      {{ becaEstado.descuento_aplicado }}%
                    </span>
                    <span v-else-if="becaEstado.beca.tipo_descuento === 'monto_fijo'" class="text-gray-500">
                      -
                    </span>
                    <span v-else class="discount-percentage">
                      {{ becaEstado.descuento_aplicado }}%
                    </span>
                  </td>
                  <td class="table-cell text-right font-semibold text-green-600">
                    -{{ formatCurrency(becaEstado.monto_descuento) }}
                  </td>
                </tr>
                <tr class="table-row subtotal-row">
                  <td class="table-cell font-semibold text-purple-700" colspan="3">
                    Subtotal después de Becas Estatales
                  </td>
                  <td class="table-cell text-right font-semibold text-purple-700">
                    {{ formatCurrency(arancelDespuesBecasEstado) }}
                  </td>
                </tr>
              </template>

              <!-- Sección: Beneficios Internos -->
              <template v-if="becasAplicadas.length > 0">
                <tr class="table-row section-header-row">
                  <td class="table-cell font-bold text-blue-700" colspan="4">
                    Beneficios Internos (UNIACC)
                  </td>
                </tr>
                <tr
                  v-for="beca in becasAplicadas"
                  :key="beca.beca.id"
                  class="table-row benefit-row interno-row"
                >
                  <td class="table-cell">
                    <div class="benefit-name">
                      <Award class="w-4 h-4 text-blue-600 inline mr-2" />
                      {{ beca.beca.nombre }}
                    </div>
                  </td>
                  <td class="table-cell text-center">
                    <span class="badge-type">
                      {{ beca.beca.tipo_descuento === 'porcentaje' ? 'Porcentaje' :
                         beca.beca.tipo_descuento === 'monto_fijo' ? 'Monto Fijo' : 'Mixto' }}
                    </span>
                  </td>
                  <td class="table-cell text-center">
                    <span v-if="beca.beca.tipo_descuento === 'porcentaje'" class="discount-percentage">
                      {{ beca.descuento_aplicado }}%
                    </span>
                    <span v-else-if="beca.beca.tipo_descuento === 'monto_fijo'" class="text-gray-500">
                      Monto Fijo
                    </span>
                    <span v-else class="discount-percentage">
                      {{ beca.descuento_aplicado }}%
                    </span>
                  </td>
                  <td class="table-cell text-right font-semibold text-green-600">
                    -{{ formatCurrency(beca.monto_descuento) }}
                  </td>
                </tr>
                <tr class="table-row subtotal-row">
                  <td class="table-cell font-semibold text-blue-700" colspan="3">
                    Subtotal después de Beneficios Internos
                  </td>
                  <td class="table-cell text-right font-semibold text-blue-700">
                    {{ formatCurrency(arancelDespuesBecasInternas) }}
                  </td>
                </tr>
              </template>

              <!-- Sección: Arancel Referencia CAE -->
              <template v-if="arancelReferenciaCae > 0">
                <tr class="table-row section-header-row">
                  <td class="table-cell font-bold text-orange-700" colspan="4">
                    Arancel Referencia CAE
                  </td>
                </tr>
                <tr class="table-row benefit-row cae-row">
                  <td class="table-cell">
                    <div class="benefit-name">
                      <DollarSign class="w-4 h-4 text-orange-600 inline mr-2" />
                      Descuento por Arancel Referencia CAE
                    </div>
                  </td>
                  <td class="table-cell text-center">
                    <span class="badge-type badge-cae">
                      Monto Fijo
                    </span>
                  </td>
                  <td class="table-cell text-center text-gray-500">
                    -
                  </td>
                  <td class="table-cell text-right font-semibold text-green-600">
                    -{{ formatCurrency(descuentoCae) }}
                  </td>
                </tr>
                <tr class="table-row subtotal-row">
                  <td class="table-cell font-semibold text-orange-700" colspan="3">
                    Subtotal después de Arancel Referencia CAE
                  </td>
                  <td class="table-cell text-right font-semibold text-orange-700">
                    {{ formatCurrency(arancelDespuesCae) }}
                  </td>
                </tr>
              </template>

              <!-- Mensaje si no hay becas estatales elegibles pero el usuario marcó que usa -->
              <template v-if="formData.usaBecasEstado && becasEstadoElegibles.length > 0 && becasEstadoAplicadas.length === 0">
                <tr class="table-row section-header-row">
                  <td class="table-cell font-bold text-purple-700" colspan="4">
                    Becas Estatales
                  </td>
                </tr>
                <tr class="table-row info-row">
                  <td class="table-cell text-sm text-gray-600 italic" colspan="4">
                    No cumples con los requisitos para las becas estatales disponibles
                  </td>
                </tr>
              </template>

              <!-- Total descuentos -->
              <tr class="table-row discount-total-row">
                <td class="table-cell font-semibold" colspan="3">
                  Total Descuentos Aplicados
                </td>
                <td class="table-cell text-right font-bold text-red-600">
                  -{{ formatCurrency(descuentoTotalRealConCae) }}
                </td>
              </tr>

              <!-- Arancel final -->
              <tr class="table-row final-row">
                <td class="table-cell font-bold text-lg" colspan="3">
                  Arancel Final a Pagar
                </td>
                <td class="table-cell text-right font-bold text-lg text-green-600">
                  {{ formatCurrency(arancelFinalReal) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Resumen financiero -->
      <div class="financial-summary">
        <h3 class="summary-title">Resumen Financiero</h3>
        <div class="summary-grid">
          <div class="summary-card">
            <div class="card-header">
              <DollarSign class="w-6 h-6 text-blue-600" />
              <h4 class="card-title">Arancel Original</h4>
            </div>
            <div class="card-value">
              {{ formatCurrency(calculoBecas?.arancel_base || 0) }}
            </div>
          </div>

          <div class="summary-card discount">
            <div class="card-header">
              <Minus class="w-6 h-6 text-red-600" />
              <h4 class="card-title">Descuento Total</h4>
            </div>
            <div class="card-value">
              -{{ formatCurrency(descuentoTotalReal) }}
            </div>
          </div>

          <div class="summary-card final">
            <div class="card-header">
              <CheckCircle class="w-6 h-6 text-green-600" />
              <h4 class="card-title">Arancel Final</h4>
            </div>
            <div class="card-value">
              {{ formatCurrency(arancelFinalReal) }}
            </div>
          </div>
        </div>

        <!-- Ahorro total -->
        <div class="savings-card">
          <div class="savings-content">
            <div class="savings-icon">
              <TrendingUp class="w-8 h-8 text-green-600" />
            </div>
            <div class="savings-text">
              <h4 class="savings-title">¡Ahorras {{ formatCurrency(ahorroTotalReal) }}!</h4>
              <p class="savings-subtitle">
                {{ porcentajeAhorro }}% de descuento total
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Becas aplicadas -->
      <div v-if="becasAplicadas.length || becasEstadoAplicadasConDetalle.length" class="benefits-section">
        <h3 class="section-title">
          <Award class="w-6 h-6" />
          Becas Aplicadas
        </h3>

        <!-- Becas del Estado Aplicadas -->
        <div v-if="becasEstadoAplicadasConDetalle.length" class="benefits-subsection">
          <h4 class="subsection-title">
            <Award class="w-5 h-5 text-purple-600" />
            Beneficios del Estado
          </h4>
          <div class="benefits-grid">
            <div
              v-for="becaEstado in becasEstadoAplicadasConDetalle"
              :key="`estado-${becaEstado.beca.id}`"
              class="benefit-card benefit-card-estado"
            >
              <div class="benefit-header">
                <div class="benefit-icon">
                  <CheckCircle class="w-5 h-5 text-purple-600" />
                </div>
                <div class="benefit-info">
                  <h4 class="benefit-title">{{ becaEstado.beca.nombre || 'Beca del Estado' }}</h4>
                  <p class="benefit-type">{{ becaEstado.beca.tipo_descuento || 'Descuento' }}</p>
                </div>
              </div>
              <div class="benefit-details">
                <div class="benefit-discount">
                  <span class="discount-label">Descuento:</span>
                  <span class="discount-value">
                    {{ becaEstado.beca.tipo_descuento === 'porcentaje'
                        ? `${becaEstado.descuento_aplicado}%`
                        : formatCurrency(becaEstado.beca.descuento_monto || 0) }}
                  </span>
                </div>
                <div class="benefit-applied">
                  <span class="applied-label">Aplicado:</span>
                  <span class="applied-value">{{ formatCurrency(becaEstado.monto_descuento) }}</span>
                </div>
              </div>
              <div v-if="becaEstado.beca.descripcion" class="benefit-description">
                <p class="description-text">{{ becaEstado.beca.descripcion }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Becas Internas Aplicadas -->
        <div v-if="becasAplicadas.length" class="benefits-subsection">
          <h4 class="subsection-title">
            <Award class="w-5 h-5 text-blue-600" />
            Beneficios Internos (UNIACC)
          </h4>
          <div class="benefits-grid">
            <div
              v-for="beca in becasAplicadas"
              :key="beca.beca.id"
              class="benefit-card benefit-card-interno"
            >
              <div class="benefit-header">
                <div class="benefit-icon">
                  <CheckCircle class="w-5 h-5 text-green-600" />
                </div>
                <div class="benefit-info">
                  <h4 class="benefit-title">{{ beca.beca.nombre }}</h4>
                  <p class="benefit-type">{{ beca.beca.proceso_evaluacion }} • {{ beca.beca.tipo_descuento }}</p>
                </div>
              </div>
              <div class="benefit-details">
                <div class="benefit-discount">
                  <span class="discount-label">Descuento:</span>
                  <span class="discount-value">
                    {{ beca.beca.tipo_descuento === 'porcentaje'
                        ? `${beca.descuento_aplicado}%`
                        : formatCurrency(beca.beca.descuento_monto_fijo || 0) }}
                  </span>
                </div>
                <div class="benefit-applied">
                  <span class="applied-label">Aplicado:</span>
                  <span class="applied-value">{{ formatCurrency(beca.monto_descuento) }}</span>
                </div>
              </div>
              <div v-if="beca.beca.descripcion" class="benefit-description">
                <p class="description-text">{{ beca.beca.descripcion }}</p>
              </div>
              <div v-if="beca.beca.requiere_documentacion && beca.beca.requiere_documentacion.length > 0" class="benefit-documentation">
                <div class="documentation-header">
                  <FileText class="w-4 h-4 text-blue-600" />
                  <span class="documentation-title">Documentación Requerida:</span>
                </div>
                <ul class="documentation-list">
                  <li v-for="(doc, index) in beca.beca.requiere_documentacion" :key="index" class="documentation-item">
                    {{ doc }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje cuando no hay becas aplicadas -->
      <div v-else-if="esEstudianteSinResultados" class="no-benefits-section">
        <div class="no-benefits-card">
          <div class="no-benefits-icon">
            <Info class="w-12 h-12 text-blue-600" />
          </div>
          <h3 class="no-benefits-title">Información Importante</h3>
          <p class="no-benefits-message">
            Para calcular con precisión las becas y descuentos disponibles, necesitamos tus resultados académicos (NEM y PAES).
            Una vez que tengas estos datos, podrás realizar una simulación más completa.
          </p>
          <div class="no-benefits-actions">
            <Button
              variant="outline"
              size="lg"
              @click="handleNewSimulation"
              class="retry-button"
            >
              <RotateCcw class="w-5 h-5 mr-2" />
              Simular cuando tenga mis resultados
            </Button>
          </div>
        </div>
      </div>

      <!-- Becas disponibles para estudiantes de enseñanza media -->
      <div v-if="esEstudianteSinResultados && becasDisponiblesMedia.length" class="benefits-section">
        <h3 class="section-title">
          <Award class="w-6 h-6" />
          Becas Disponibles para Ti
        </h3>
        <div class="benefits-grid">
          <div
            v-for="beca in becasDisponiblesMedia"
            :key="beca.beca.id"
            :class="['benefit-card', beca.elegible ? 'available' : 'disabled']"
          >
            <div class="benefit-header">
              <div class="benefit-icon">
                <CheckCircle v-if="beca.elegible" class="w-5 h-5 text-green-500" />
                <XCircle v-else class="w-5 h-5 text-gray-400" />
              </div>
              <div class="benefit-info">
                <h4 class="benefit-title">{{ beca.beca.nombre }}</h4>
                <p class="benefit-type">{{ beca.beca.proceso_evaluacion }} • {{ beca.beca.tipo_descuento }}</p>
                <p v-if="beca.elegible" class="benefit-discount">
                  {{ beca.descuento_aplicado }}% de descuento
                </p>
              </div>
            </div>
            <div class="benefit-reason">
              <span class="reason-label">{{ beca.elegible ? '¡Elegible!' : 'Requisito:' }}</span>
              <span class="reason-text">{{ beca.razon }}</span>
            </div>
            <div v-if="beca.beca.descripcion" class="benefit-description">
              <p class="description-text">{{ beca.beca.descripcion }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Becas no elegibles para egresados -->
      <div v-else-if="!esEstudianteSinResultados && becasNoElegibles.length" class="benefits-section">
        <h3 class="section-title">
          <Info class="w-6 h-6" />
          Otras Becas Disponibles
        </h3>
        <div class="benefits-grid">
          <div
            v-for="beca in becasNoElegibles"
            :key="beca.beca.id"
            class="benefit-card disabled"
          >
            <div class="benefit-header">
              <div class="benefit-icon">
                <XCircle class="w-5 h-5 text-gray-400" />
              </div>
              <div class="benefit-info">
                <h4 class="benefit-title">{{ beca.beca.nombre }}</h4>
                <p class="benefit-type">{{ beca.beca.proceso_evaluacion }} • {{ beca.beca.tipo_descuento }}</p>
              </div>
            </div>
            <div class="benefit-reason">
              <span class="reason-label">Razón:</span>
              <span class="reason-text">{{ beca.razon }}</span>
            </div>
            <div v-if="beca.beca.descripcion" class="benefit-description">
              <p class="description-text">{{ beca.beca.descripcion }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Información del decil -->
      <div v-if="formData.decil" class="decil-info">
        <div class="decil-card">
          <div class="decil-header">
            <TrendingUp class="w-6 h-6 text-blue-600" />
            <h4 class="decil-title">Tu Decil Socioeconómico</h4>
          </div>
          <div class="decil-content">
            <div class="decil-number">{{ formData.decil }}° Decil</div>
            <p class="decil-description">
              Este decil se utilizó para calcular tus beneficios y descuentos disponibles
            </p>
          </div>
        </div>
      </div>

      <!-- Acciones -->
      <div class="actions-section">
        <div class="actions-grid">
          <Button
            variant="outline"
            size="lg"
            @click="handleNewSimulation"
            class="action-button"
          >
            <RotateCcw class="w-5 h-5 mr-2" />
            Nueva Simulación
          </Button>

          <Button
            variant="outline"
            size="lg"
            @click="handleShare"
            class="action-button"
          >
            <Share class="w-5 h-5 mr-2" />
            Compartir
          </Button>

          <Button
            variant="outline"
            size="lg"
            @click="handleExportPDF"
            class="action-button"
          >
            <Download class="w-5 h-5 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      <!-- Información adicional -->
      <div class="additional-info">
        <div class="info-card">
          <Info class="w-5 h-5 text-blue-600" />
          <div class="info-content">
            <h4 class="info-title">Próximos Pasos</h4>
            <ul v-if="esEstudianteSinResultados" class="info-list">
              <li>• Contacta a admisiones para validar tu perfil</li>
              <li>• Prepara la documentación necesaria</li>
              <li>• Postula a UNIACC en el período correspondiente</li>
              <li>• Realiza una nueva simulación cuando tengas tus resultados NEM y PAES</li>
            </ul>
            <ul v-else class="info-list">
              <li>• Contacta a admisiones para validar tu perfil</li>
              <li>• Revisa los requisitos específicos de cada beneficio</li>
              <li>• Prepara la documentación necesaria</li>
              <li>• Postula a UNIACC en el período correspondiente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-step {
  @apply max-w-6xl mx-auto;
}

.step-content {
  @apply space-y-8;
}

.results-header {
  @apply text-center py-8;
}

.standard-header {
  @apply text-center;
}

.success-icon {
  @apply mb-4;
}

.results-title {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.results-description {
  @apply text-lg text-gray-600;
}

.personalized-header {
  @apply text-center space-y-4;
}

.banner {
  @apply bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg font-bold text-lg;
}

.personalized-title {
  @apply text-3xl font-bold text-gray-900 mb-2;
}

.personalized-email {
  @apply text-lg text-gray-600 mb-4;
}

.personalized-message {
  @apply text-lg text-gray-700 mb-6;
}

.explanation-card {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3 max-w-2xl mx-auto;
}

.explanation-text {
  @apply text-sm text-blue-800 flex-1;
}

.financial-summary {
  @apply space-y-6;
}

.summary-title {
  @apply text-2xl font-bold text-gray-900 text-center mb-6;
}

.summary-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.summary-card {
  @apply bg-white border border-gray-200 rounded-lg p-6 text-center;
}

.summary-card.discount {
  @apply border-red-200 bg-red-50;
}

.summary-card.final {
  @apply border-green-200 bg-green-50;
}

.card-header {
  @apply flex items-center justify-center space-x-2 mb-4;
}

.card-title {
  @apply text-sm font-medium text-gray-600;
}

.card-value {
  @apply text-2xl font-bold text-gray-900;
}

.summary-card.discount .card-value {
  @apply text-red-600;
}

.summary-card.final .card-value {
  @apply text-green-600;
}

.savings-card {
  @apply bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6;
}

.savings-content {
  @apply flex items-center space-x-4;
}

.savings-icon {
  @apply flex-shrink-0;
}

.savings-text {
  @apply flex-1;
}

.savings-title {
  @apply text-xl font-bold text-green-900 mb-1;
}

.savings-subtitle {
  @apply text-sm text-green-700;
}

.results-table-section {
  @apply space-y-6;
}

.table-container {
  @apply overflow-x-auto;
}

.results-table {
  @apply w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden;
}

.table-header {
  @apply bg-gray-50 px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200;
}

.table-row {
  @apply border-b border-gray-200 transition-colors;
}

.table-row:hover {
  @apply bg-gray-50;
}

.table-row.base-row {
  @apply bg-blue-50;
}

.table-row.benefit-row {
  @apply bg-white;
}

.table-row.discount-total-row {
  @apply bg-red-50 border-t-2 border-red-200;
}

.table-row.final-row {
  @apply bg-green-50 border-t-2 border-green-200;
}

.table-row.section-header-row {
  @apply bg-gray-100 border-t-2 border-gray-300;
}

.table-row.subtotal-row {
  @apply bg-purple-50 border-t border-purple-200;
}

.table-row.estado-row {
  @apply bg-purple-50/30;
}

.table-row.interno-row {
  @apply bg-blue-50/30;
}

.table-row.cae-row {
  @apply bg-orange-50/30;
}

.table-row.info-row {
  @apply bg-gray-50;
}

.table-cell {
  @apply px-4 py-3 text-sm text-gray-900;
}

.badge-estado {
  @apply bg-purple-100 text-purple-800;
}

.badge-cae {
  @apply bg-orange-100 text-orange-800;
}

.benefit-name {
  @apply flex items-center;
}

.badge-type {
  @apply inline-block px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800;
}

.discount-percentage {
  @apply font-semibold text-blue-600;
}

.career-info {
  @apply space-y-6;
}

.career-card {
  @apply bg-white border border-gray-200 rounded-lg p-6;
}

.career-header {
  @apply flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4;
}

.career-title {
  @apply flex-1;
}

.career-name {
  @apply text-xl font-bold text-gray-900 mb-1;
}

.career-degree {
  @apply text-sm text-gray-600;
}

.career-faculty {
  @apply flex items-center space-x-2 text-sm text-blue-600;
}

.career-details {
  @apply flex flex-wrap gap-4 mt-4;
}

.career-detail {
  @apply flex items-center space-x-2 text-sm text-gray-600;
}

.benefits-section {
  @apply space-y-6;
}

.benefits-subsection {
  @apply space-y-4 mt-6;
}

.subsection-title {
  @apply flex items-center space-x-2 text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200;
}

.benefit-card-estado {
  @apply border-purple-200 bg-purple-50/30;
}

.benefit-card-interno {
  @apply border-blue-200 bg-blue-50/30;
}

.no-benefits-section {
  @apply space-y-6;
}

.no-benefits-card {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-8 text-center;
}

.no-benefits-icon {
  @apply mb-4;
}

.no-benefits-title {
  @apply text-xl font-bold text-blue-900 mb-4;
}

.no-benefits-message {
  @apply text-lg text-blue-800 mb-6 max-w-2xl mx-auto;
}

.no-benefits-actions {
  @apply flex justify-center;
}

.retry-button {
  @apply bg-blue-600 text-white hover:bg-blue-700 border-blue-600;
}

.section-title {
  @apply flex items-center space-x-2 text-xl font-bold text-gray-900 mb-4;
}

.benefits-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.benefit-card {
  @apply bg-white border border-gray-200 rounded-lg p-4;
}

.benefit-card.disabled {
  @apply bg-gray-50 border-gray-200;
}

.benefit-card.available {
  @apply bg-green-50 border-green-200;
}

.benefit-discount {
  @apply text-green-600 font-semibold text-sm mt-1;
}

.benefit-header {
  @apply flex items-start space-x-3 mb-3;
}

.benefit-icon {
  @apply flex-shrink-0 mt-1;
}

.benefit-info {
  @apply flex-1;
}

.benefit-title {
  @apply text-sm font-semibold text-gray-900 mb-1;
}

.benefit-type {
  @apply text-xs text-gray-500;
}

.benefit-details {
  @apply space-y-2;
}

.benefit-discount,
.benefit-applied {
  @apply flex justify-between items-center text-sm;
}

.discount-label,
.applied-label {
  @apply text-gray-600;
}

.discount-value,
.applied-value {
  @apply font-semibold text-gray-900;
}

.benefit-reason {
  @apply text-sm;
}

.reason-label {
  @apply font-medium text-gray-600;
}

.reason-text {
  @apply text-gray-500;
}

.benefit-description {
  @apply mt-3 pt-3 border-t border-gray-200;
}

.description-text {
  @apply text-sm text-gray-600;
}

.benefit-documentation {
  @apply mt-3 pt-3 border-t border-gray-200;
}

.documentation-header {
  @apply flex items-center space-x-2 mb-2;
}

.documentation-title {
  @apply text-sm font-semibold text-gray-700;
}

.documentation-list {
  @apply list-none space-y-1.5 pl-0;
}

.documentation-item {
  @apply text-sm text-gray-600 flex items-start;
}

.documentation-item::before {
  content: '•';
  @apply text-blue-600 font-bold mr-2 mt-0.5;
}

.decil-info {
  @apply mt-8;
}

.decil-card {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-6;
}

.decil-header {
  @apply flex items-center space-x-3 mb-4;
}

.decil-title {
  @apply text-lg font-semibold text-blue-900;
}

.decil-content {
  @apply text-center;
}

.decil-number {
  @apply text-3xl font-bold text-blue-900 mb-2;
}

.decil-description {
  @apply text-sm text-blue-800;
}

.actions-section {
  @apply mt-8;
}

.actions-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.action-button {
  @apply w-full justify-center;
}

.additional-info {
  @apply mt-8;
}

.info-card {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3;
}

.info-content {
  @apply flex-1;
}

.info-title {
  @apply text-sm font-semibold text-blue-900 mb-3;
}

.info-list {
  @apply space-y-1 text-sm text-blue-800;
}

/* Animaciones */
.summary-card {
  @apply transform transition-all duration-300;
}

.summary-card:hover {
  @apply scale-105 shadow-lg;
}

.benefit-card {
  @apply transform transition-all duration-200;
}

.benefit-card:hover {
  @apply scale-105;
}

.action-button {
  @apply transform transition-all duration-200;
}

.action-button:hover {
  @apply scale-105;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-grid {
    @apply grid-cols-1;
  }

  .benefits-grid {
    @apply grid-cols-1;
  }

  .actions-grid {
    @apply grid-cols-1;
  }

  .savings-content {
    @apply flex-col text-center space-x-0 space-y-3;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .results-title {
    @apply text-white;
  }

  .results-description {
    @apply text-gray-300;
  }

  .summary-title {
    @apply text-white;
  }

  .summary-card {
    @apply bg-gray-800 border-gray-700;
  }

  .card-title {
    @apply text-gray-300;
  }

  .card-value {
    @apply text-white;
  }

  .savings-card {
    @apply bg-gradient-to-r from-green-900 to-emerald-900 border-green-700;
  }

  .savings-title {
    @apply text-green-200;
  }

  .savings-subtitle {
    @apply text-green-300;
  }

  .section-title {
    @apply text-white;
  }

  .benefit-card {
    @apply bg-gray-800 border-gray-700;
  }

  .benefit-card.disabled {
    @apply bg-gray-900 border-gray-600;
  }

  .benefit-card.available {
    @apply bg-green-900/20 border-green-700;
  }

  .benefit-card-estado {
    @apply border-purple-700 bg-purple-900/20;
  }

  .benefit-card-interno {
    @apply border-blue-700 bg-blue-900/20;
  }

  .subsection-title {
    @apply text-gray-200 border-gray-600;
  }

  .benefit-discount {
    @apply text-green-400;
  }

  .benefit-title {
    @apply text-white;
  }

  .benefit-type {
    @apply text-gray-400;
  }

  .discount-label,
  .applied-label {
    @apply text-gray-300;
  }

  .discount-value,
  .applied-value {
    @apply text-white;
  }

  .reason-label {
    @apply text-gray-300;
  }

  .reason-text {
    @apply text-gray-400;
  }

  .decil-card {
    @apply bg-blue-900 border-blue-700;
  }

  .decil-title {
    @apply text-blue-200;
  }

  .decil-number {
    @apply text-blue-200;
  }

  .decil-description {
    @apply text-blue-300;
  }

  .info-card {
    @apply bg-blue-900 border-blue-700;
  }

  .info-title {
    @apply text-blue-200;
  }

  .info-list {
    @apply text-blue-300;
  }

  .career-card {
    @apply bg-gray-800 border-gray-700;
  }

  .career-name {
    @apply text-white;
  }

  .career-degree {
    @apply text-gray-300;
  }

  .career-faculty {
    @apply text-blue-400;
  }

  .career-detail {
    @apply text-gray-300;
  }

  .results-table {
    @apply bg-gray-800;
  }

  .table-header {
    @apply bg-gray-700 text-gray-200 border-gray-600;
  }

  .table-row {
    @apply border-gray-700;
  }

  .table-row:hover {
    @apply bg-gray-700;
  }

  .table-row.base-row {
    @apply bg-blue-900/20;
  }

  .table-row.benefit-row {
    @apply bg-gray-800;
  }

  .table-row.discount-total-row {
    @apply bg-red-900/20 border-red-700;
  }

  .table-row.final-row {
    @apply bg-green-900/20 border-green-700;
  }

  .table-row.section-header-row {
    @apply bg-gray-700 border-gray-500;
  }

  .table-row.subtotal-row {
    @apply bg-purple-900/30 border-purple-700;
  }

  .table-row.estado-row {
    @apply bg-purple-900/20;
  }

  .table-row.interno-row {
    @apply bg-blue-900/20;
  }

  .table-row.cae-row {
    @apply bg-orange-900/20;
  }

  .table-row.info-row {
    @apply bg-gray-800;
  }

  .table-cell {
    @apply text-gray-200;
  }

  .badge-estado {
    @apply bg-purple-900 text-purple-200;
  }

  .badge-cae {
    @apply bg-orange-900 text-orange-200;
  }

  .badge-type {
    @apply bg-blue-900 text-blue-200;
  }

  .discount-percentage {
    @apply text-blue-400;
  }

  .benefit-description {
    @apply border-gray-600;
  }

  .description-text {
    @apply text-gray-300;
  }

  .benefit-documentation {
    @apply border-gray-600;
  }

  .documentation-title {
    @apply text-gray-200;
  }

  .documentation-item {
    @apply text-gray-300;
  }

  .documentation-item::before {
    @apply text-blue-400;
  }

  .personalized-title {
    @apply text-white;
  }

  .personalized-email {
    @apply text-gray-300;
  }

  .personalized-message {
    @apply text-gray-200;
  }

  .explanation-card {
    @apply bg-blue-900 border-blue-700;
  }

  .explanation-text {
    @apply text-blue-200;
  }

  .no-benefits-card {
    @apply bg-blue-900 border-blue-700;
  }

  .no-benefits-title {
    @apply text-blue-200;
  }

  .no-benefits-message {
    @apply text-blue-300;
  }

  .retry-button {
    @apply bg-blue-600 text-white hover:bg-blue-700 border-blue-600;
  }
}
</style>
