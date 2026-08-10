<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import OverlayPanel from 'primevue/overlaypanel'
import Drawer from 'primevue/drawer'
import Dialog from 'primevue/dialog'
import Slider from 'primevue/slider'
import Select from 'primevue/select'
import { useSimuladorStore } from '@/stores/simuladorStore'
import { useDescuentosStore } from '@/stores/descuentosStore'
import { useBecasStore, type BecasInformativas } from '@/stores/becasStore'
import { formatCurrency, formatDate } from '@/utils/formatters'
import { trackSimulacionExitosa, linkSimulacionExitosa } from '@/utils/analytics'
import type { FormData } from '@/types/simulador'
import { useProspectos } from '@/composables/useProspectos'
import { useCRM } from '@/composables/useCRM'
import { ANIO_POSTULACION } from '@/utils/config'
import { Award, CheckCircle, FileText, Info, Clock } from 'lucide-vue-next'
import html2pdf from 'html2pdf.js'
import Button from 'primevue/button'
// JPS: Imports de componentes shadcn para versión mobile con accordion
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Props
interface Props {
  formData?: Partial<FormData>
  segmentacion?: string
}

const props = withDefaults(defineProps<Props>(), {
  segmentacion: 'pregrado'
})

// Store y servicios
const simuladorStore = useSimuladorStore()
const descuentosStore = useDescuentosStore()
const becasStore = useBecasStore()
const { insertarProspecto, error: prospectoError } = useProspectos()
const { enviarCRM, createJSONcrm } = useCRM()

// Estado
const isLoading = ref(false)
const error = ref<string | null>(null)
const pdfContentRef = ref<HTMLElement | null>(null)
const isGeneratingPDF = ref(false)
const windowWidth = ref(window.innerWidth)
const overlayPanel = ref<InstanceType<typeof OverlayPanel> | null>(null)
const selectedBeca = ref<any>(null)
let hideTimeout: ReturnType<typeof setTimeout> | null = null
const showCaeDialog = ref(false)
const descuentosInfoPanel = ref<InstanceType<typeof OverlayPanel> | null>(null)
const descuentosInfoIconRef = ref<HTMLElement | null>(null)
let descuentosHideTimeout: ReturnType<typeof setTimeout> | null = null
const numeroCuotas = ref(10)
const tipoPago = ref<string | null>(null)
const showBecaInfoDialog = ref(false)
const selectedBecaInfo = ref<BecasInformativas | null>(null)

// Opciones para el tipo de pago
const opcionesTipoPago = [
  { label: 'Seleccione', value: null },
  { label: 'Cheque', value: 'cheque' },
  { label: 'Al contado (Efectivo, Transferencia, Tarjeta de Crédito/Débito)', value: 'contado' },
  { label: 'Pagaré', value: 'pagare' }
]

// Computed para determinar si el slider debe estar deshabilitado
const isSliderDisabled = computed(() => {
  return tipoPago.value === 'contado'
})

// Computed para el texto de cuota/cuotas según el número
const textoCuota = computed(() => {
  return numeroCuotas.value === 1 ? 'cuota' : 'cuotas'
})

// Watcher para cambiar el número de cuotas cuando se selecciona "Al contado"
watch(tipoPago, (newValue) => {
  if (newValue === 'contado') {
    numeroCuotas.value = 1
  }
})

// Detectar si es un dispositivo móvil
const isMobile = ref(false)

// JPS: Computed mejorado para detección mobile que considera ancho, touch support y user agent
// Optimizado para iOS y Android
const isMobileView = computed(() => {
  if (typeof window === 'undefined') return false

  const width = window.innerWidth
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const userAgent = navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isAndroid = /android/.test(userAgent)
  const isMobileDevice = isIOS || isAndroid

  // Considerar mobile si: pantalla pequeña (≤768px) Y (tiene touch support O es dispositivo móvil)
  return width <= 768 && (hasTouchSupport || isMobileDevice)
})

// Computed para colspan responsive
// En desktop: Concepto + Tipo + Descuento = 3 columnas
// En mobile: Concepto + Tipo/Descuento = 2 columnas
const subtotalColspan = computed(() => {
  return windowWidth.value <= 1024 ? 2 : 3
})

// Actualizar ancho de ventana
const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth
}

const handleMobileResize = () => {
  const hasTouchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const isSmallScreen = window.innerWidth <= 768
  isMobile.value = hasTouchSupport && isSmallScreen
}

onMounted(() => {
  console.log('Results mounted - becas aplicadas:', becasAplicadas.value);
  window.addEventListener('resize', updateWindowWidth)
  updateWindowWidth()
  // Cargar descuentos de pago anticipado y modo de pago
  descuentosStore.cargarDescuentosPagoAnticipado()
  descuentosStore.cargarDescuentosModoPago()
  // Cargar becas informativas
  becasStore.cargarBecasInformativas()

  // Detectar si es móvil basándose en touch support y tamaño de pantalla
  handleMobileResize()
  window.addEventListener('resize', handleMobileResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateWindowWidth)
  window.removeEventListener('resize', handleMobileResize)
})

// Computed
const calculoBecas = computed(() => simuladorStore.calculoBecas)
const formData = computed(() => simuladorStore.formData)

// Computed para información de la carrera
const carreraInfo = computed(() => {
  if (!formData.value.carreraId) return null
  const carrera = simuladorStore.carrerasStore.obtenerCarreraPorId(formData.value.carreraId)
  console.log('Carrera:', carrera)
  return carrera
})

// Computed para becas aplicadas (internas)
const becasAplicadas = computed(() => {
  return calculoBecas.value?.becas_aplicadas || []
})

// Computed para becas informativas
const becasInformativas = computed(() => {
  return becasStore.becasInformativas || []
})

// Computed para arancel después de becas internas
// Calculado explícitamente: arancel base - descuento de becas internas solamente
const arancelDespuesBecasInternas = computed(() => {
  if (!calculoBecas.value) return 0
  return calculoBecas.value.arancel_base - calculoBecas.value.descuento_total
})

// Computed para descuento del CAE (el monto máximo que financia el CAE)
const descuentoCae = computed(() => {
  if (!formData.value?.planeaUsarCAE || !maximoFinanciamientoCae.value) {
    return 0
  }
  // El descuento del CAE es el máximo financiamiento CAE (el monto que financia el CAE)
  // Este monto se resta del arancel después de becas internas
  return maximoFinanciamientoCae.value
})

// Computed para descuento total (becas internas + descuento CAE si aplica)
const descuentoTotalRealConCae = computed(() => {
  if (!calculoBecas.value) return 0
  // Incluye descuentos de becas internas + descuento del CAE
  console.log('DESUENTOS - CAE', descuentoCae.value)
  console.log('DESUENTOS - TOTAL', calculoBecas.value.descuento_total)
  return calculoBecas.value.descuento_total + descuentoCae.value
})

// Computed para descuento total incluyendo descuentos adicionales
const descuentoTotalConAdicionales = computed(() => {
  return descuentoTotalRealConCae.value +
         descuentoPagoAnticipadoArancel.value +
         descuentoPagoAnticipadoMatricula.value +
         descuentoModoPagoArancel.value
})

// Computed para arancel final (aplica CAE si corresponde)
const arancelFinalReal = computed(() => {
  // Si planea usar CAE y hay máximo financiamiento CAE, restar ese valor del arancel después de becas
  if (formData.value?.planeaUsarCAE && maximoFinanciamientoCae.value) {
    // El arancel final es el arancel después de becas menos el máximo financiamiento CAE
    // Mínimo 0 (si el máximo CAE es mayor al arancel después de becas, el arancel final es 0)
    return Math.max(0, arancelDespuesBecasInternas.value - maximoFinanciamientoCae.value)
  }
  // Si no usa CAE, retornar el arancel después de becas internas
  return arancelDespuesBecasInternas.value
})

// Computed para descuentos de modo de pago que coinciden con el tipo seleccionado
const descuentoModoPagoAplicable = computed(() => {
  if (!tipoPago.value) return null
  // Mapear los valores del select a posibles nombres en los descuentos
  const tipoPagoMap: Record<string, string[]> = {
    'cheque': ['cheque'],
    'contado': ['contado', 'al contado', 'efectivo'],
    'pagare': ['pagaré', 'pagare', 'pagar']
  }
  const posiblesNombres = tipoPagoMap[tipoPago.value] || [tipoPago.value]

  return descuentosModoPagoActivos.value.find(descuento => {
    const nombreDescuento = descuento.nombre?.toLowerCase() || ''
    return posiblesNombres.some(nombre => nombreDescuento.includes(nombre.toLowerCase()))
  }) || null
})

// Computed para calcular descuento de pago anticipado sobre arancel y matrícula
const descuentoPagoAnticipadoArancel = computed(() => {
  if (!descuentoPagoAnticipadoVigente.value?.dscto_arancel) return 0
  return Math.round(arancelFinalReal.value * (descuentoPagoAnticipadoVigente.value.dscto_arancel / 100))
})

const descuentoPagoAnticipadoMatricula = computed(() => {
  if (!descuentoPagoAnticipadoVigente.value?.dscto_matricula) return 0
  const matricula = carreraInfo.value?.matricula || 0
  return Math.round(matricula * (descuentoPagoAnticipadoVigente.value.dscto_matricula / 100))
})

// Computed para calcular descuento de modo de pago sobre arancel
const descuentoModoPagoArancel = computed(() => {
  if (!descuentoModoPagoAplicable.value?.dscto_arancel) return 0
  return Math.round(arancelFinalReal.value * (descuentoModoPagoAplicable.value.dscto_arancel / 100))
})

// Computed para arancel final después de descuentos adicionales
const arancelFinalConDescuentosAdicionales = computed(() => {
  let arancel = arancelFinalReal.value
  // Aplicar descuento de pago anticipado si existe
  arancel -= descuentoPagoAnticipadoArancel.value
  // Aplicar descuento de modo de pago si existe
  arancel -= descuentoModoPagoArancel.value
  return Math.max(0, arancel)
})

// Computed para matrícula final después de descuentos adicionales
const matriculaFinalConDescuentosAdicionales = computed(() => {
  const matricula = carreraInfo.value?.matricula || 0
  return Math.max(0, matricula - descuentoPagoAnticipadoMatricula.value)
})

// Computed para arancel final + matrícula después de todos los descuentos
const arancelMasMatricula = computed(() => {
  return arancelFinalConDescuentosAdicionales.value + matriculaFinalConDescuentosAdicionales.value
})

// Computed para el valor mensual (dividido por numeroCuotas)
const valorMensual = computed(() => {
  return Math.round(arancelMasMatricula.value / numeroCuotas.value)
})

// Porcentaje total de descuento aplicado sobre el arancel base
const descuentoPorcentualTotal = computed(() => {
  if (!calculoBecas.value) return 0
  const base = calculoBecas.value.arancel_base
  if (!base || base <= 0) return 0
  // Incluir descuentos en arancel: becas internas + CAE + pago anticipado arancel + modo de pago arancel
  const descuentoTotalArancel = descuentoTotalRealConCae.value +
                                 descuentoPagoAnticipadoArancel.value +
                                 descuentoModoPagoArancel.value
  return Math.round((descuentoTotalArancel / base) * 100)
})

// Computed para obtener el arancel referencia CAE
const arancelReferenciaCae = computed(() => {
  return carreraInfo.value?.arancel_referencia || null
})

// Computed para calcular el máximo financiamiento CAE aplicable
// El CAE financia sobre el arancel después de becas internas, pero no puede exceder el arancel_referencia
const maximoFinanciamientoCae = computed(() => {
  if (!arancelReferenciaCae.value || arancelReferenciaCae.value <= 0) return null
  // El máximo financiamiento es el menor entre el arancel_referencia y el arancel después de becas internas
  return Math.min(arancelReferenciaCae.value, arancelDespuesBecasInternas.value)
})

// Computed para descuento de pago anticipado vigente
const descuentoPagoAnticipadoVigente = computed(() => {
  return descuentosStore.obtenerDescuentoPagoAnticipadoVigente()
})

// Computed para descuentos de modo de pago activos
const descuentosModoPagoActivos = computed(() => {
  return descuentosStore.descuentosModoPagoActivos
})

// Computed para verificar si hay descuentos disponibles
const tieneDescuentosDisponibles = computed(() => {
  return descuentoPagoAnticipadoVigente.value !== null || descuentosModoPagoActivos.value.length > 0
})

// Computed para formatear la fecha de término
const fechaTerminoFormateada = computed(() => {
  if (!descuentoPagoAnticipadoVigente.value?.fecha_termino) return ''
  return formatDate(descuentoPagoAnticipadoVigente.value.fecha_termino, { format: 'long' })
})

// Métodos
const handleSimulate = async () => {
  try {
    isLoading.value = true
    error.value = null

    // Actualizar formData en el store antes de simular
    if (props.formData) {
      simuladorStore.updateFormData(props.formData)
    }

    await simuladorStore.simulate()

        // GTM + BD: solo tras simulación exitosa (fallos CRM/prospecto no bloquean el evento)
        const analyticsEventId = await trackSimulacionExitosa({
          segmentacion: props.segmentacion,
          carrera: simuladorStore.formData.carrera
        })

        // JPS: Ejecutar primero el envío al CRM para obtener la respuesta
        // Modificación: Cambiar el orden para ejecutar primero enviarCRM y luego insertarProspecto con la respuesta
        // Funcionamiento: Se envía primero al CRM, se obtiene la respuesta, y luego se guarda el prospecto
        // con la respuesta del CRM incluida en el campo respuesta_crm
        const userAgent = navigator.userAgent
        const crmJson = createJSONcrm(simuladorStore.formData as FormData, carreraInfo.value, userAgent)

        // Enviar primero al CRM para obtener la respuesta
        let respuestaCRM = null
        try {
          respuestaCRM = await enviarCRM(simuladorStore.formData as FormData, carreraInfo.value, userAgent)
        } catch (error) {
          console.warn('No se pudo enviar al CRM:', error)
          // Continuar aunque falle el CRM, pero sin respuesta
        }

        // Guardar el prospecto con la respuesta del CRM (si existe)
        let prospectoGuardado = null
        try {
          prospectoGuardado = await insertarProspecto(
            simuladorStore.formData as FormData,
            props.segmentacion,
            becasAplicadas.value,
            crmJson,
            respuestaCRM
          )
        } catch (error) {
          console.warn('No se pudo guardar el prospecto:', error)
        }

        // Persistir simulación completa en tabla simulaciones (validez 7 días)
        let simulacionId: string | null = null
        if (prospectoGuardado?.id && simuladorStore.simulation?.value?.saveSimulation) {
          try {
            simulacionId = await simuladorStore.simulation.value.saveSimulation(prospectoGuardado.id)
          } catch (error) {
            console.warn('No se pudo guardar la simulación:', error)
          }
        }

        // Vincular evento analytics con prospecto y simulación (si existen)
        if (analyticsEventId) {
          await linkSimulacionExitosa(analyticsEventId, {
            prospectoId: prospectoGuardado?.id,
            simulacionId
          })
        }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al realizar la simulación'
    console.error('Error en simulación:', err)
  } finally {
    isLoading.value = false
  }
}

// Método para exportar PDF usando html2pdf.js
const handleExportPDF = async () => {
  try {
    if (!calculoBecas.value || !carreraInfo.value) {
      console.warn('No hay datos para generar el PDF')
      return
    }

    // Ocultar el botón durante la generación
    isGeneratingPDF.value = true

    // Esperar un momento para que el DOM se actualice
    await new Promise(resolve => setTimeout(resolve, 300))

    // Usar html2pdf.js para generar el PDF desde el contenido HTML
    if (pdfContentRef.value) {
      const element = pdfContentRef.value

      // JPS: Ocultar versión mobile (accordion) para PDF export
      const mobileVersion = element.querySelector('.mobile-version') as HTMLElement
      const originalMobileDisplay = mobileVersion?.style.display
      if (mobileVersion) {
        mobileVersion.style.display = 'none'
      }

      // Asegurar que la versión desktop esté visible
      const desktopVersion = element.querySelector('.desktop-version') as HTMLElement
      const originalDesktopDisplay = desktopVersion?.style.display
      if (desktopVersion) {
        desktopVersion.style.display = 'block'
      }

      // Remover temporalmente los Message de PrimeVue del DOM (causan problemas al renderizar el PDF)
      const toRemove = Array.from(
        element.querySelectorAll('.contact-message, .anticipado-message, .confirmation-message')
      ) as HTMLElement[]

      // Guardar referencias a los padres y posiciones para restaurar después
      const elementsData = toRemove.map(el => ({
        element: el,
        parent: el.parentNode,
        nextSibling: el.nextSibling
      }))

      // Remover elementos del DOM
      elementsData.forEach(({ element }) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      })

      // Agregar page break después de la tabla de detalle
      const summaryCard = element.querySelector('.summary-card') as HTMLElement
      let pageBreakElement: HTMLElement | null = null
      if (summaryCard && summaryCard.parentNode) {
        // Crear un div con la clase que html2pdf.js reconoce para page breaks
        pageBreakElement = document.createElement('div')
        pageBreakElement.className = 'html2pdf__page-break'
        pageBreakElement.style.height = '0'
        pageBreakElement.style.margin = '0'
        pageBreakElement.style.padding = '0'
        // Insertar después del summary-card
        summaryCard.parentNode.insertBefore(pageBreakElement, summaryCard.nextSibling)
      }

      // Esperar a que el DOM se actualice completamente
      await nextTick()
      await new Promise(resolve => setTimeout(resolve, 100))

      try {
        const opt: any = {
          // Márgenes más pequeños para aprovechar la página
          margin: [12, 20, 12, 20],
          filename: 'simulacion-uniacc.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        }

        await html2pdf().set(opt).from(element).save()
      } finally {
        // Remover el elemento de page break
        if (pageBreakElement && pageBreakElement.parentNode) {
          pageBreakElement.parentNode.removeChild(pageBreakElement)
        }

        // Restaurar elementos en su posición original
        elementsData.forEach(({ element, parent, nextSibling }) => {
          if (parent) {
            if (nextSibling) {
              parent.insertBefore(element, nextSibling)
            } else {
              parent.appendChild(element)
            }
          }
        })

        // JPS: Restaurar visibilidad de versión mobile después de exportar PDF
        if (mobileVersion) {
          mobileVersion.style.display = originalMobileDisplay || ''
        }
        if (desktopVersion) {
          desktopVersion.style.display = originalDesktopDisplay || ''
        }
      }
    }
  } catch (e) {
    console.error('No se pudo generar el PDF:', e)
    // Asegurar restaurar visibilidad en caso de error
    const element = pdfContentRef.value
    if (element) {
      const mobileVersion = element.querySelector('.mobile-version') as HTMLElement
      const desktopVersion = element.querySelector('.desktop-version') as HTMLElement
      if (mobileVersion) {
        mobileVersion.style.display = ''
      }
      if (desktopVersion) {
        desktopVersion.style.display = ''
      }
    }
  } finally {
    // Restaurar el botón después de la generación
    isGeneratingPDF.value = false
  }
}

// Método para mostrar overlay panel con descripción de beca en hover
const showBecaInfo = (event: Event, beca: any) => {
  // Ignorar en móvil, solo usar click
  if (isMobile.value) return
  // Cancelar cualquier timeout pendiente
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  selectedBeca.value = beca
  overlayPanel.value?.show(event)
}

// Método para ocultar overlay panel
const hideBecaInfo = () => {
  // Ignorar en móvil, solo usar click
  if (isMobile.value) return
  // Pequeño delay para permitir movimiento del mouse al overlay
  hideTimeout = setTimeout(() => {
    overlayPanel.value?.hide()
    hideTimeout = null
  }, 150)
}

// Método para toggle overlay panel (para mobile)
const toggleBecaInfo = (event: Event, beca: any) => {
  event.preventDefault()
  event.stopPropagation()
  // Cancelar cualquier timeout pendiente
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }

  // Si es la misma beca, hacer toggle (cerrar si está abierto, abrir si está cerrado)
  if (selectedBeca.value?.beca.id === beca.beca.id) {
    // Si ya está seleccionada, cerrar
    overlayPanel.value?.hide()
    selectedBeca.value = null
  } else {
    // Abrir el panel con la nueva beca
    selectedBeca.value = beca
    overlayPanel.value?.show(event)
  }
}

// Método para mantener el overlay visible cuando el mouse está sobre él
const keepBecaInfoVisible = () => {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

// Métodos para mostrar/ocultar overlay de información de descuentos
const showDescuentosInfo = (event: Event) => {
  if (isMobile.value) return
  if (descuentosHideTimeout) {
    clearTimeout(descuentosHideTimeout)
    descuentosHideTimeout = null
  }
  if (descuentosInfoIconRef.value && descuentosInfoPanel.value) {
    descuentosInfoPanel.value.show(event, descuentosInfoIconRef.value)
  }
}

const hideDescuentosInfo = () => {
  if (isMobile.value) return
  descuentosHideTimeout = setTimeout(() => {
    if (descuentosInfoPanel.value) {
      descuentosInfoPanel.value.hide()
    }
    descuentosHideTimeout = null
  }, 150)
}

const toggleDescuentosInfo = (event: Event) => {
  event.preventDefault()
  event.stopPropagation()
  if (descuentosHideTimeout) {
    clearTimeout(descuentosHideTimeout)
    descuentosHideTimeout = null
  }
  if (descuentosInfoIconRef.value && descuentosInfoPanel.value) {
    descuentosInfoPanel.value.toggle(event, descuentosInfoIconRef.value)
  }
}

const keepDescuentosInfoVisible = () => {
  if (descuentosHideTimeout) {
    clearTimeout(descuentosHideTimeout)
    descuentosHideTimeout = null
  }
}

// Métodos para mostrar/ocultar dialog de beca informativa
const openBecaInfoDialog = (beca: any) => {
  selectedBecaInfo.value = beca
  showBecaInfoDialog.value = true
}

const closeBecaInfoDialog = () => {
  showBecaInfoDialog.value = false
  selectedBecaInfo.value = null
}

// Método para obtener el texto del badge del proceso de evaluación
const getProcesoEvaluacionBadge = (proceso: string): string => {
  switch (proceso) {
    case 'Evaluacion':
      return 'Requiere evaluación'
    case 'Postulacion':
      return 'Requiere postulación'
    case 'Automatico':
      return 'Beneficio automático'
    default:
      return ''
  }
}

// Método para obtener la clase del badge según el proceso
const getProcesoEvaluacionBadgeClass = (proceso: string): string => {
  switch (proceso) {
    case 'Evaluacion':
      return 'beca-badge-evaluacion'
    case 'Postulacion':
      return 'beca-badge-postulacion'
    case 'Automatico':
      return 'beca-badge-automatico'
    default:
      return ''
  }
}

// Exponer método para ser llamado desde el padre
defineExpose({
  simulate: handleSimulate
})

</script>

<template>
  <div class="results-container">
    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-content">
        <p class="loading-message">Calculando beneficios...</p>
        <ProgressSpinner />
      </div>
    </div>

    <!-- Error -->
    <Message v-if="error" severity="error" :closable="false" class="mb-4">
      {{ error }}
    </Message>

    <!-- Contenido -->
    <div v-if="!isLoading && !error && calculoBecas" ref="pdfContentRef" class="space-y-6">
      <!-- JPS: Versión Desktop - Mantener estructura original con PrimeVue Cards -->
      <div class="hidden md:block desktop-version">
        <!-- Información de la carrera -->
      <Card v-if="carreraInfo" class="career-card">
        <template #title>
          <div class="flex items-center gap-2">
            <i class="pi pi-book"></i>
            <span class="career-title">Información de la Carrera</span>
          </div>
        </template>
        <template #content>
          <div class="career-info-content">
            <div class="career-name">{{ carreraInfo.nombre_programa }}</div>
            <div class="career-details">
              <Tag :value="'• ' + carreraInfo.nivel_academico" class="career-tag" />
              <Tag :value="'• ' + carreraInfo.modalidad_programa" class="career-tag" />
              <Tag :value="'• ' + carreraInfo.duracion_programa" class="career-tag" />
            </div>
          </div>
        </template>
      </Card>

      <!-- Tabla de resumen -->
      <Card class="detalle-card">
        <template #title>
          <div class="flex items-center gap-2 mb-2">
            <i class="pi pi-percentage"></i>
            <span class="detalle-title">Detalle de la simulación</span>
          </div>
        </template>
        <template #content>
          <div class="cards-container">
            <!-- Detalle de arancel -->
            <Card class="detalle-arancel-card">
              <template #content>
                <table class="table-arancel">
                  <thead>
                    <tr>
                      <th>Concepto</th>
                      <th>Tipo</th>
                      <th>Descuento</th>
                      <th>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Arancel Base</td>
                      <td>-</td>
                      <td>-</td>
                      <td>{{ formatCurrency(calculoBecas?.arancel_base || 0) }}</td>
                    </tr>
                    <tr>
                      <td>Matrícula</td>
                      <td>-</td>
                      <td>-</td>
                      <td>{{ formatCurrency(carreraInfo?.matricula || 0) }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </Card>

            <!-- Beneficios del Estado -->
            <Card v-if="formData?.usaBecasEstado" class="info-estado-card">
              <template #title>
                <i class="pi pi-star-fill"></i>
                <span>Becas Ministeriales</span>
              </template>
              <template #content>
                <p>las becas se asignan de acuerdo con la información entregada en la postulación al FUAS, donde el Estado otorga el beneficio en función de requisitos académicos y socioeconómicos.
 
                  <a href="https://www.beneficiosestudiantiles.cl" target="_blank">Más información en el
                    sitio Beneficios Estudiantiles.</a>
                </p>
              </template>
            </Card>

            <!-- Beneficios Internos (UNIACC) -->
            <Card v-if="becasAplicadas.length > 0" class="becas-internas-card">
              <template #title>
                <i class="pi pi-star-fill"></i>
                <span>Beneficios Internos (UNIACC)</span>
              </template>
              <template #content>
                <table class="table-becas-internas">
                  <tbody>
                    <tr v-for="beca in becasAplicadas" :key="`interno-${beca.beca.id}`" class="">
                      <td class="texto-info">{{ beca.beca.nombre }}</td>
                      <td>
                        <Tag class="info-tag">Porcentaje</Tag>
                      </td>
                      <td class="texto-info">{{ beca.descuento_aplicado }}%</td>
                      <td class="texto-info">-{{ formatCurrency(beca.monto_descuento) }}</td>
                    </tr>
                    <tr>
                      <td class="texto-descuento" colspan="3">Monto a pagar con beneficio aplicado</td>
                      <td class="texto-descuento">{{ formatCurrency(arancelDespuesBecasInternas) }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </Card>

            <!-- Arancel referencial CAE -->
            <Card v-if="formData?.planeaUsarCAE" class="cae-card">
              <template #title>
                <div>
                  <i class="pi pi-star-fill"></i>
                  <span>Arancel referencial CAE <span
                      v-if="carreraInfo?.anio_arancel_referencia && carreraInfo.anio_arancel_referencia < ANIO_POSTULACION">
                      {{ carreraInfo.anio_arancel_referencia }}*</span></span>
                </div>
                <div
                  v-if="carreraInfo?.anio_arancel_referencia && carreraInfo.anio_arancel_referencia < ANIO_POSTULACION">
                  <p>*Los valores mostrados corresponden al arancel de referencia CAE 2026. </p>
                </div>
              </template>
              <template #content>
                <table class="table-cae">
                  <tbody>
                    <tr>
                      <td class="texto-info">Máximo Financiamiento CAE</td>
                      <td>
                        <Tag class="info-tag">CAE</Tag>
                      </td>
                      <td></td>
                      <td class="texto-info">{{ formatCurrency(descuentoCae) }}</td>
                    </tr>
                    <tr>
                      <td class="texto-descuento">Monto a pagar con beneficio aplicado</td>
                      <td></td>
                      <td></td>
                      <td class="texto-descuento">{{ formatCurrency(arancelFinalReal) }}</td>
                    </tr>
                  </tbody>
                </table>
              </template>
            </Card>

            <!-- Total descuentos aplicados -->
             <Card v-if="descuentoTotalRealConCae !== 0" class="total-descuentos-card">
              <template #content>
                <span>Total descuentos aplicados</span>
                <span>-{{ formatCurrency(descuentoTotalRealConCae) }}</span>
              </template>
             </Card>

             <!-- Descuentos adicionales -->
             <Card v-if="descuentoPagoAnticipadoArancel > 0 || (descuentoModoPagoAplicable && descuentoModoPagoArancel > 0)" class="descuentos-adicionales-card">
                <template #title>
                  <i class="pi pi-star-fill"></i>
                  <span>Descuentos adicionales</span>
                </template>
                <template #content>
                  <table class="table-descuentos-adicionales">
                    <tbody>
                      <tr v-if="descuentoPagoAnticipadoArancel > 0">
                        <td class="texto-info">Descuento por pago anticipado (Arancel)</td>
                        <td><Tag class="info-tag">Porcentaje</Tag></td>
                        <td class="texto-info">{{ descuentoPagoAnticipadoVigente.dscto_arancel }}%</td>
                        <td class="texto-info">-{{ formatCurrency(descuentoPagoAnticipadoArancel) }}</td>
                      </tr>
                      <tr v-if="descuentoPagoAnticipadoMatricula > 0">
                        <td class="texto-info">Descuento por pago anticipado (Matrícula)</td>
                        <td><Tag class="info-tag">Porcentaje</Tag></td>
                        <td class="texto-info">{{ descuentoPagoAnticipadoVigente.dscto_matricula }}%</td>
                        <td class="texto-info">-{{ formatCurrency(descuentoPagoAnticipadoMatricula) }}</td>
                      </tr>
                      <tr v-if="descuentoModoPagoAplicable && descuentoModoPagoArancel > 0" class="fila-border">
                        <td class="texto-info">Descuento por medio de pago{{ descuentoModoPagoAplicable.nombre ? ` -
		  ${descuentoModoPagoAplicable.nombre}` : '' }}</td>
                        <td><Tag class="info-tag">Porcentaje</Tag></td>
                        <td class="texto-info">{{ descuentoModoPagoAplicable.dscto_arancel }}%</td>
                        <td class="texto-info">-{{ formatCurrency(descuentoModoPagoArancel) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </template>
             </Card>

             <!-- Total a pagar -->
              <Card class="total-a-pagar-card">
                <template #content>
                  <span class="texto-descuento">Arancel + Matrícula final a pagar</span>
                  <span class="texto-descuento">{{ formatCurrency(arancelMasMatricula) }}</span>
                </template>
              </Card>


          </div>
        </template>
      </Card>

      <!-- Simulación de cuotas y medios de pago -->
      <Card class="payment-simulation-card">
        <template #title>
            <i class="pi pi-credit-card"></i>
            <span>Simulación de cuotas y medios de pago</span>
        </template>
        <template #content>
          <div class="payment-simulation-content">
            <div class="payment-control-group">
              <label for="tipoPago" class="payment-label">Medio de pago</label>
              <Select id="tipoPago" v-model="tipoPago" :options="opcionesTipoPago" optionLabel="label"
                optionValue="value" placeholder="Seleccione un medio de pago" class="payment-select" />
            </div>
            <div class="payment-control-group">
              <label for="numeroCuotas" class="payment-label">Número de {{ textoCuota }}: <span class="slider-value">{{
                numeroCuotas }}</span></label>

              <div class="slider-container">
                <Slider id="numeroCuotas" v-model="numeroCuotas" :min="1" :max="12" :disabled="isSliderDisabled"
                  class="payment-slider" />
              </div>
            </div>

          </div>
        </template>
      </Card>

      <!-- Resumen financiero -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <div class="flex flex-col gap-4 h-full">
          <Card class="summary-item first-column-card flex-1">
            <template #content>
              <div class="text-center first-column-content h-full flex flex-col justify-center">
                <div class="text-sm text-black-700 mb-2 first-column-label font-bold">Arancel Original</div>
                <div class="text-sm text-gray-600 mb-0 font-semibold">{{ numeroCuotas }} {{ textoCuota }} de</div>
                <div class="text-2xl font-bold text-gray-900 first-column-value">
                  {{ formatCurrency(calculoBecas?.arancel_base / numeroCuotas || 0) }}
                </div>
              </div>
            </template>
          </Card>
          <Card class="summary-item matricula-card first-column-card flex-1">
            <template #content>
              <div class="text-center first-column-content h-full flex flex-col justify-center">
                <div class="text-sm text-black-700 mb-2 first-column-label font-bold">Matrícula</div>
                <div class="text-sm text-gray-600 mb-0 font-semibold">{{ numeroCuotas }} {{ textoCuota }} de</div>
                <div class="text-2xl font-bold text-gray-900 first-column-value">
                  {{ formatCurrency(carreraInfo?.matricula / numeroCuotas || 0) }}
                </div>
              </div>
            </template>
          </Card>
        </div>
        <Card class="summary-item discount">
          <template #content>
              <div class="discount-label">Descuento Total</div>
              <div class="discount-value">
                -{{ formatCurrency(descuentoTotalConAdicionales) }}
              </div>
              <div></div>

          </template>
        </Card>
        <Card class="summary-item final">
          <template #content>
            <div>
              <div class="final-label">Total Final a Pagar en Plan de</div>
              <div class="final-cuotas">{{ numeroCuotas }} {{ textoCuota }} de</div>
            </div>
            <div class="final-value">
              {{ formatCurrency(valorMensual) }}
            </div>
            <div class="final-details valor-anual">
              <div>* Arancel final: {{ formatCurrency(arancelFinalConDescuentosAdicionales) }}</div>
              <div>* Matrícula final: {{ formatCurrency(matriculaFinalConDescuentosAdicionales) }}</div>
              <div class="final-details-text">* Consulta con un asesor otros tipos de descuentos disponibles</div>
            </div>
          </template>
        </Card>
      </div>

      <div class="disclaimer-referencial mt-4">
        <div class="disclaimer-referencial-inner bg-gradient-to-br from-[#f0f8fb] to-[#e8f4f8] dark:from-slate-800 dark:to-slate-950 dark:border-slate-600 dark:border-l-blue-400">
          <Info class="disclaimer-referencial-icon text-[#1a3b66] dark:text-blue-300" aria-hidden="true" />
          <div class="disclaimer-referencial-text text-[#1a3b66] dark:text-slate-200">
            <span class="disclaimer-referencial-main text-[#001122] dark:text-white">*Simulación referencial:</span> Un asesor revisará tu caso y confirmará el monto final.
            <span class="disclaimer-referencial-duration">
              <Clock class="disclaimer-duration-icon" aria-hidden="true" />
              Esta simulación tiene una duración de 1 semana a contar de hoy. Una vez excedido ese plazo, deberás volver a simular
            </span>
          </div>
        </div>
      </div>

      <!-- Mensaje de contacto con descuento -->
      <Card v-if="descuentoPorcentualTotal > 0" class="contact-message">
        <template #content>
          <div class="contact-message-content">
            <div class="contact-message-text">
              <b class="simulation-question">¿Te gustó la simulación?</b>
              Podrías estudiar con hasta un <b>{{ descuentoPorcentualTotal }}% de descuento.</b>
              Para obtener información personalizada sobre tu beneficio, escríbenos a <a href="mailto:admision@uniacc.cl"
                class="contact-link">admision@uniacc.cl</a> o llámanos al <b>+56 22 640 6100</b>
            </div>
          </div>
        </template>
      </Card>

      <!-- Becas aplicadas -->
        <Card v-if="becasAplicadas.length" class="becas-aplicadas-card">
        <template #content>
    <div class="benefits-section">
            <h3 class="benefits-section-title">
              <Award class="w-6 h-6" />
              Becas Aplicadas
            </h3>

            <!-- Becas Internas Aplicadas -->
            <div class="benefits-subsection">
              <h4 class="subsection-title">
                <Award class="w-5 h-5 text-blue-600" />
                Beneficios Internos (UNIACC)
              </h4>
              <div class="benefits-grid">
                <div v-for="beca in becasAplicadas" :key="beca.beca.id" class="benefit-card benefit-card-interno">
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
                      <span class="applied-label">Descuento:</span>
                      <span class="applied-value">
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
                  <div v-if="beca.beca.requiere_documentacion && beca.beca.requiere_documentacion.length > 0"
                    class="benefit-documentation">
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
        </template>
        </Card>

      <!-- Becas Adicionales (Informativas) -->
      <Card v-if="becasInformativas.length > 0" class="becas-adicionales-card">
        <template #content>
          <div class="benefits-section">
            <h3 class="benefits-section-title">
              <Award class="w-6 h-6" />
              Becas Adicionales
            </h3>

            <!-- Becas Informativas -->
            <div class="benefits-subsection">
              <p class="becas-informativas-texto">
                Te invitamos a consultar por otras becas aplicables si ya eres parte de la familia UNIACC
              </p>
              <div class="benefits-grid">
                <div v-for="beca in becasInformativas" :key="beca.id" class="benefit-card benefit-card-interno benefit-card-compact">
                  <div class="benefit-header">
                    <div class="benefit-icon">
                      <Award class="w-5 h-5 text-blue-600" />
                    </div>
                    <div class="benefit-info">
                      <h4 class="benefit-title">{{ beca.nombre }}</h4>
                    </div>
                  </div>
                  <div v-if="beca.descripcion" class="benefit-description-compact">
                    <p class="description-text-compact">{{ beca.descripcion }}</p>
                  </div>
                  <div class="benefit-action">
                    <Button label="Ver más" icon="pi pi-arrow-right" iconPos="right"
                      @click="openBecaInfoDialog(beca)"
                      class="ver-mas-button"
                      outlined
                      severity="secondary" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
      </div>
      <!-- Fin versión Desktop -->

      <!-- JPS: Versión Mobile - Accordion con shadcn Cards -->
      <div class="block md:hidden mobile-version">
        <Accordion type="single" collapsible class="w-full space-y-2">
          <!-- Item 1: Información de la Carrera -->
          <AccordionItem value="career-info" class="mobile-accordion-item">
            <AccordionTrigger class="mobile-accordion-trigger">
              <div class="flex items-center gap-2">
                <i class="pi pi-book"></i>
                <span class="font-semibold">Información de la Carrera</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ShadcnCard v-if="carreraInfo" class="mobile-card">
                <CardHeader>
                  <CardTitle class="mobile-card-title">{{ carreraInfo.nombre_programa }}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="flex flex-wrap gap-2">
                    <Tag :value="'• ' + carreraInfo.nivel_academico" class="career-tag" />
                    <Tag :value="'• ' + carreraInfo.modalidad_programa" class="career-tag" />
                    <Tag :value="'• ' + carreraInfo.duracion_programa" class="career-tag" />
                  </div>
                </CardContent>
              </ShadcnCard>
            </AccordionContent>
          </AccordionItem>

          <!-- Item 2: Detalle de la Simulación -->
          <AccordionItem value="simulation-detail" class="mobile-accordion-item">
            <AccordionTrigger class="mobile-accordion-trigger">
              <div class="flex items-center gap-2">
                <i class="pi pi-percentage"></i>
                <span class="font-semibold">Detalle de la simulación</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div class="space-y-3">
                <!-- Arancel Base y Matrícula -->
                <ShadcnCard class="mobile-card">
                  <CardContent class="p-4">
                    <div class="space-y-2">
                      <div class="flex justify-between items-center py-2 border-b">
                        <span class="font-medium">Arancel Base</span>
                        <span class="font-bold text-blue-600">{{ formatCurrency(calculoBecas?.arancel_base || 0) }}</span>
                      </div>
                      <div class="flex justify-between items-center py-2">
                        <span class="font-medium">Matrícula</span>
                        <span class="font-bold text-blue-600">{{ formatCurrency(carreraInfo?.matricula || 0) }}</span>
                      </div>
                    </div>
                  </CardContent>
                </ShadcnCard>

                <!-- Beneficios del Estado -->
                <ShadcnCard v-if="formData?.usaBecasEstado" class="mobile-card bg-blue-50 border-blue-200">
                  <CardHeader class="pb-3">
                    <CardTitle class="mobile-card-title text-sm flex items-center gap-2">
                      <i class="pi pi-star-fill text-blue-600"></i>
                      Beneficios del Estado
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="pt-0">
                    <p class="text-sm text-gray-700">
                      Las Becas MINEDUC se asignan según la información que entregues en el FUAS.
                      La asignación la realiza el Estado y puede modificar el arancel final.
                      <a href="https://postulacion.beneficiosestudiantiles.cl/fuas/" target="_blank" class="text-blue-600 underline">Más información en el sitio FUAS.</a>
                    </p>
                  </CardContent>
                </ShadcnCard>

                <!-- Beneficios Internos (UNIACC) -->
                <ShadcnCard v-if="becasAplicadas.length > 0" class="mobile-card bg-blue-50 border-blue-200">
                  <CardHeader class="pb-3">
                    <CardTitle class="mobile-card-title text-sm flex items-center gap-2">
                      <i class="pi pi-star-fill text-blue-600"></i>
                      Beneficios Internos (UNIACC)
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="pt-0 space-y-3">
                    <div v-for="beca in becasAplicadas" :key="`mobile-interno-${beca.beca.id}`" class="space-y-2 pb-3 border-b last:border-b-0 last:pb-0">
                      <div class="flex justify-between items-start">
                        <span class="font-semibold text-blue-600 text-sm">{{ beca.beca.nombre }}</span>
                        <Tag class="info-tag text-xs">Porcentaje</Tag>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-600">{{ beca.descuento_aplicado }}%</span>
                        <span class="font-bold text-blue-600">-{{ formatCurrency(beca.monto_descuento) }}</span>
                      </div>
                    </div>
                    <div class="flex justify-between items-center pt-2 border-t">
                      <span class="font-semibold text-green-600">Monto a pagar con beneficio aplicado</span>
                      <span class="font-bold text-green-600">{{ formatCurrency(arancelDespuesBecasInternas) }}</span>
                    </div>
                  </CardContent>
                </ShadcnCard>

                <!-- Arancel referencial CAE -->
                <ShadcnCard v-if="formData?.planeaUsarCAE" class="mobile-card bg-orange-50 border-orange-200">
                  <CardHeader class="pb-3">
                    <CardTitle class="mobile-card-title text-sm flex items-center gap-2">
                      <i class="pi pi-star-fill text-orange-600"></i>
                      Arancel referencial CAE
                      <span v-if="carreraInfo?.anio_arancel_referencia && carreraInfo.anio_arancel_referencia < ANIO_POSTULACION" class="text-xs font-normal">
                        {{ carreraInfo.anio_arancel_referencia }}*
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="pt-0 space-y-2">
                    <p v-if="carreraInfo?.anio_arancel_referencia && carreraInfo.anio_arancel_referencia < ANIO_POSTULACION" class="text-xs text-gray-600 mb-2">
                      *Los valores mostrados corresponden al arancel de referencia CAE 2025. El Mineduc publicará los nuevos aranceles de referencia durante el mes de enero 2026
                    </p>
                    <div class="space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="font-semibold text-orange-600 text-sm">Máximo Financiamiento CAE</span>
                        <Tag class="info-tag text-xs">CAE</Tag>
                      </div>
                      <div class="flex justify-between items-center pt-2 border-t">
                        <span class="font-semibold text-green-600">Monto a pagar con beneficio aplicado</span>
                        <span class="font-bold text-green-600">{{ formatCurrency(arancelFinalReal) }}</span>
                      </div>
                    </div>
                  </CardContent>
                </ShadcnCard>

                <!-- Total descuentos aplicados -->
                <ShadcnCard class="mobile-card bg-blue-400 border-blue-500">
                  <CardContent class="p-4">
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-white">Total descuentos aplicados</span>
                      <span class="font-bold text-white">-{{ formatCurrency(descuentoTotalRealConCae) }}</span>
                    </div>
                  </CardContent>
                </ShadcnCard>

                <!-- Descuentos adicionales -->
                <ShadcnCard v-if="descuentoPagoAnticipadoArancel > 0" class="mobile-card bg-blue-50 border-blue-200">
                  <CardHeader class="pb-3">
                    <CardTitle class="mobile-card-title text-sm flex items-center gap-2">
                      <i class="pi pi-star-fill text-blue-600"></i>
                      Descuentos adicionales
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="pt-0 space-y-3">
                    <div class="space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="font-semibold text-blue-600 text-sm">Descuento por pago anticipado (Arancel)</span>
                        <div class="flex items-center gap-2">
                          <Tag class="info-tag text-xs">Porcentaje</Tag>
                          <span class="text-sm font-semibold">{{ descuentoPagoAnticipadoVigente.dscto_arancel }}%</span>
                        </div>
                      </div>
                      <div class="flex justify-end">
                        <span class="font-bold text-blue-600">-{{ formatCurrency(descuentoPagoAnticipadoArancel) }}</span>
                      </div>
                    </div>
                    <div class="space-y-2 pt-2 border-t">
                      <div class="flex justify-between items-center">
                        <span class="font-semibold text-blue-600 text-sm">Descuento por pago anticipado (Matrícula)</span>
                        <div class="flex items-center gap-2">
                          <Tag class="info-tag text-xs">Porcentaje</Tag>
                          <span class="text-sm font-semibold">{{ descuentoPagoAnticipadoVigente.dscto_matricula }}%</span>
                        </div>
                      </div>
                      <div class="flex justify-end">
                        <span class="font-bold text-blue-600">-{{ formatCurrency(descuentoPagoAnticipadoMatricula) }}</span>
                      </div>
                    </div>
                    <div v-if="descuentoModoPagoAplicable && descuentoModoPagoArancel > 0" class="space-y-2 pt-2 border-t">
                      <div class="flex justify-between items-center">
                        <span class="font-semibold text-blue-600 text-sm">Descuento por medio de pago{{ descuentoModoPagoAplicable.nombre ? ` - ${descuentoModoPagoAplicable.nombre}` : '' }}</span>
                        <div class="flex items-center gap-2">
                          <Tag class="info-tag text-xs">Porcentaje</Tag>
                          <span class="text-sm font-semibold">{{ descuentoModoPagoAplicable.dscto_arancel }}%</span>
                        </div>
                      </div>
                      <div class="flex justify-end">
                        <span class="font-bold text-blue-600">-{{ formatCurrency(descuentoModoPagoArancel) }}</span>
                      </div>
                    </div>
                  </CardContent>
                </ShadcnCard>

                <!-- Total a pagar -->
                <ShadcnCard class="mobile-card bg-green-100 border-green-300">
                  <CardContent class="p-4">
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-green-600">Arancel + Matrícula final a pagar</span>
                      <span class="font-bold text-green-600">{{ formatCurrency(arancelFinalReal) }}</span>
                    </div>
                  </CardContent>
                </ShadcnCard>
              </div>
            </AccordionContent>
          </AccordionItem>

          <!-- Item 3: Simulación de Cuotas y Medios de Pago -->
          <AccordionItem value="payment-simulation" class="mobile-accordion-item">
            <AccordionTrigger class="mobile-accordion-trigger">
              <div class="flex items-center gap-2">
                <i class="pi pi-credit-card"></i>
                <span class="font-semibold">Simulación de cuotas y medios de pago</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ShadcnCard class="mobile-card">
                <CardContent class="p-4 space-y-4">
                  <div class="space-y-2">
                    <label for="tipoPagoMobile" class="block text-sm font-semibold">Medio de pago</label>
                    <Select id="tipoPagoMobile" v-model="tipoPago" :options="opcionesTipoPago" optionLabel="label"
                      optionValue="value" placeholder="Seleccione un medio de pago" class="w-full" />
                  </div>
                  <div class="space-y-2">
                    <label for="numeroCuotasMobile" class="block text-sm font-semibold">
                      Número de {{ textoCuota }}: <span class="slider-value">{{ numeroCuotas }}</span>
                    </label>
                    <Slider id="numeroCuotasMobile" v-model="numeroCuotas" :min="1" :max="12" :disabled="isSliderDisabled" class="w-full" />
                  </div>
                </CardContent>
              </ShadcnCard>
            </AccordionContent>
          </AccordionItem>

          <!-- Item 4: Resumen Financiero -->
          <AccordionItem value="financial-summary" class="mobile-accordion-item">
            <AccordionTrigger class="mobile-accordion-trigger">
              <div class="flex items-center gap-2">
                <i class="pi pi-calculator"></i>
                <span class="font-semibold">Resumen Financiero</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div class="space-y-3">
                <!-- Arancel Original -->
                <ShadcnCard class="mobile-card bg-gray-100">
                  <CardContent class="p-4 text-center">
                    <div class="text-sm font-bold text-gray-700 mb-1">Arancel Original</div>
                    <div class="text-xs text-gray-600 mb-2">{{ numeroCuotas }} {{ textoCuota }} de</div>
                    <div class="text-xl font-bold text-gray-900">
                      {{ formatCurrency(calculoBecas?.arancel_base / numeroCuotas || 0) }}
                    </div>
                  </CardContent>
                </ShadcnCard>

                <!-- Matrícula -->
                <ShadcnCard class="mobile-card bg-gray-100">
                  <CardContent class="p-4 text-center">
                    <div class="text-sm font-bold text-gray-700 mb-1">Matrícula</div>
                    <div class="text-xs text-gray-600 mb-2">{{ numeroCuotas }} {{ textoCuota }} de</div>
                    <div class="text-xl font-bold text-gray-900">
                      {{ formatCurrency(carreraInfo?.matricula / numeroCuotas || 0) }}
                    </div>
                  </CardContent>
                </ShadcnCard>

                <!-- Descuento Total -->
                <ShadcnCard class="mobile-card bg-blue-400">
                  <CardContent class="p-4 text-center">
                    <div class="text-sm font-bold text-white mb-2">Descuento Total</div>
                    <div class="text-xl font-bold text-white">
                      -{{ formatCurrency(descuentoTotalRealConCae) }}
                    </div>
                  </CardContent>
                </ShadcnCard>

                <!-- Total Final a Pagar -->
                <ShadcnCard class="mobile-card bg-green-200">
                  <CardContent class="p-4 text-center">
                    <div class="text-sm font-bold text-green-600 mb-1">Total Final a Pagar en Plan de</div>
                    <div class="text-xs text-green-600 mb-2">{{ numeroCuotas }} {{ textoCuota }} de</div>
                    <div class="text-2xl font-bold text-green-600 mb-3">
                      {{ formatCurrency(valorMensual) }}
                    </div>
                    <div class="text-xs text-green-600 space-y-1 pt-2 border-t border-green-300">
                      <div>* Arancel final: {{ formatCurrency(arancelFinalConDescuentosAdicionales) }}</div>
                      <div>* Matrícula final: {{ formatCurrency(matriculaFinalConDescuentosAdicionales) }}</div>
                      <div class="final-details-text">* Consulta con un asesor otros tipos de descuentos disponibles</div>
                    </div>
                  </CardContent>
                </ShadcnCard>
              </div>
            </AccordionContent>
          </AccordionItem>

          <!-- Item 5: Becas Aplicadas -->
          <AccordionItem v-if="becasAplicadas.length > 0" value="applied-benefits" class="mobile-accordion-item">
            <AccordionTrigger class="mobile-accordion-trigger">
              <div class="flex items-center gap-2">
                <Award class="w-5 h-5" />
                <span class="font-semibold">Becas Aplicadas</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div class="space-y-3">
                <div v-for="beca in becasAplicadas" :key="`mobile-beca-${beca.beca.id}`" class="mobile-card bg-white border border-blue-200 rounded-lg p-4">
                  <div class="flex items-start gap-3 mb-3">
                    <CheckCircle class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <h4 class="font-semibold text-sm mb-1">{{ beca.beca.nombre }}</h4>
                      <p class="text-xs text-gray-500">{{ beca.beca.proceso_evaluacion }} • {{ beca.beca.tipo_descuento }}</p>
                    </div>
                  </div>
                  <div class="space-y-2 mb-3">
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-600">Descuento:</span>
                      <span class="font-semibold text-sm">
                        {{ beca.beca.tipo_descuento === 'porcentaje'
                          ? `${beca.descuento_aplicado}%`
                          : formatCurrency(beca.beca.descuento_monto_fijo || 0) }}
                      </span>
                    </div>
                    <div class="flex justify-between items-center">
                      <span class="text-xs text-gray-600">Aplicado:</span>
                      <span class="font-semibold text-sm">{{ formatCurrency(beca.monto_descuento) }}</span>
                    </div>
                  </div>
                  <div v-if="beca.beca.descripcion" class="text-xs text-gray-600 mb-2 pt-2 border-t">
                    <p>{{ beca.beca.descripcion }}</p>
                  </div>
                  <div v-if="beca.beca.requiere_documentacion && beca.beca.requiere_documentacion.length > 0" class="text-xs pt-2 border-t">
                    <div class="flex items-center gap-2 mb-2">
                      <FileText class="w-4 h-4 text-blue-600" />
                      <span class="font-semibold text-gray-700">Documentación Requerida:</span>
                    </div>
                    <ul class="list-disc list-inside space-y-1 text-gray-600">
                      <li v-for="(doc, index) in beca.beca.requiere_documentacion" :key="index">{{ doc }}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <!-- Item 6: Becas Adicionales -->
          <AccordionItem v-if="becasInformativas.length > 0" value="additional-benefits" class="mobile-accordion-item">
            <AccordionTrigger class="mobile-accordion-trigger">
              <div class="flex items-center gap-2">
                <Award class="w-5 h-5" />
                <span class="font-semibold">Becas Adicionales</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div class="space-y-3">
                <p class="becas-informativas-texto-mobile mb-3">
                  Te invitamos a consultar por otras becas aplicables si ya eres parte de la familia UNIACC
                </p>
                <div v-for="beca in becasInformativas" :key="`mobile-beca-info-${beca.id}`" class="mobile-card bg-white border border-blue-200 rounded-lg p-4">
                  <div class="flex items-start gap-3 mb-3">
                    <Award class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div class="flex-1">
                      <h4 class="font-semibold text-sm mb-1">{{ beca.nombre }}</h4>
                    </div>
                  </div>
                  <div v-if="beca.descripcion" class="text-xs text-gray-600 mb-3">
                    <p class="line-clamp-3">{{ beca.descripcion }}</p>
                  </div>
                  <Button label="Ver más" icon="pi pi-arrow-right" iconPos="right"
                    @click="openBecaInfoDialog(beca)"
                    class="w-full"
                    outlined
                    severity="secondary" />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <!-- Item 7: Mensaje de Contacto -->
          <AccordionItem v-if="descuentoPorcentualTotal > 0" value="contact-message" class="mobile-accordion-item">
            <AccordionTrigger class="mobile-accordion-trigger">
              <div class="flex items-center gap-2">
                <i class="pi pi-envelope"></i>
                <span class="font-semibold">Contacto</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <ShadcnCard class="mobile-card bg-blue-50 border-blue-200">
                <CardContent class="p-4">
                  <div class="text-sm text-gray-700">
                    <p class="font-bold mb-2">¿Te gustó la simulación?</p>
                    <p class="mb-2">Podrías estudiar con hasta un <b>{{ descuentoPorcentualTotal }}% de descuento.</b></p>
                    <p>Para obtener información personalizada sobre tu beneficio, escríbenos a <a href="mailto:admision@uniacc.cl" class="text-blue-600 underline">admision@uniacc.cl</a> o llámanos al <a href="tel:+56226406100" class="text-blue-600 underline font-bold">+56 22 640 6100</a> ó al <a href="tel:+56226406151" class="text-blue-600 underline font-bold">+56 22 640 6151</a></p>
                  </div>
                </CardContent>
              </ShadcnCard>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <!-- Texto referencial mobile -->
        <div class="disclaimer-referencial disclaimer-referencial-mobile mt-4">
          <div class="disclaimer-referencial-inner bg-gradient-to-br from-[#f0f8fb] to-[#e8f4f8] dark:from-slate-800 dark:to-slate-950 dark:border-slate-600 dark:border-l-blue-400">
            <Info class="disclaimer-referencial-icon text-[#1a3b66] dark:text-blue-300" aria-hidden="true" />
            <div class="disclaimer-referencial-text text-[#1a3b66] dark:text-slate-200">
              <span class="disclaimer-referencial-main text-[#001122] dark:text-white">*Simulación referencial:</span> Un asesor revisará tu caso y confirmará el monto final.
              <span class="disclaimer-referencial-duration">
                <Clock class="disclaimer-duration-icon" aria-hidden="true" />
                Duración: 1 semana
              </span>
            </div>
          </div>
        </div>
      </div>
      <!-- Fin versión Mobile -->

    </div>

    <!-- Botón de exportar PDF (fuera del contenido del PDF) -->
    <div v-if="!isLoading && !error && calculoBecas && !isGeneratingPDF" class="export-pdf-section">
      <Button label="Exportar PDF" icon="pi pi-download" @click="handleExportPDF" class="export-pdf-button"
        severity="secondary" outlined />
    </div>

    <!-- Overlay Panel para mostrar descripción de beca -->
    <OverlayPanel ref="overlayPanel" class="beca-info-overlay" :dismissable="false" @mouseenter="keepBecaInfoVisible"
      @mouseleave="hideBecaInfo">
      <div v-if="selectedBeca" class="beca-info-content">
        <!-- Header con título y badge -->
        <div class="beca-info-header">
          <h4 class="beca-info-title">{{ selectedBeca.beca.nombre }}</h4>
          <span v-if="selectedBeca.beca.proceso_evaluacion"
            :class="['beca-info-badge', getProcesoEvaluacionBadgeClass(selectedBeca.beca.proceso_evaluacion)]">
            {{ getProcesoEvaluacionBadge(selectedBeca.beca.proceso_evaluacion) }}
          </span>
        </div>
        <div
          v-if="selectedBeca.beca.descripcion || (selectedBeca.beca.requiere_documentacion && selectedBeca.beca.requiere_documentacion.length > 0)"
          class="beca-info-divider"></div>

        <!-- Descripción -->
        <div v-if="selectedBeca.beca.descripcion" class="beca-info-body">
          <div class="beca-info-description-section">
            <p class="beca-info-description">
              {{ selectedBeca.beca.descripcion }}
            </p>
          </div>
          <div v-if="selectedBeca.beca.requiere_documentacion && selectedBeca.beca.requiere_documentacion.length > 0"
            class="beca-info-divider"></div>
        </div>

        <!-- Documentación requerida -->
        <div v-if="selectedBeca.beca.requiere_documentacion && selectedBeca.beca.requiere_documentacion.length > 0"
          class="beca-info-footer">
          <h5 class="beca-info-subtitle">Documentación Requerida:</h5>
          <ul class="beca-info-list">
            <li v-for="(doc, index) in selectedBeca.beca.requiere_documentacion" :key="index" class="beca-info-item">
              {{ doc }}
            </li>
          </ul>
        </div>
      </div>
    </OverlayPanel>

    <!-- Overlay Panel para mostrar información de descuentos adicionales -->
    <OverlayPanel ref="descuentosInfoPanel" class="descuentos-info-overlay" :dismissable="false"
      @mouseenter="keepDescuentosInfoVisible" @mouseleave="hideDescuentosInfo">
      <div class="descuentos-info-content">
        <div class="descuentos-info-title">
          <b>Tenemos descuentos adicionales disponibles.</b>
        </div>
        <ul class="descuentos-info-list">
          <li v-if="descuentoPagoAnticipadoVigente" class="descuentos-info-item">
            <b>Por pago anticipado:</b>
            <ul class="descuentos-info-sublist">
              <li v-if="descuentoPagoAnticipadoVigente.dscto_matricula">
                <b>{{ descuentoPagoAnticipadoVigente.dscto_matricula }}%</b> en matrícula
              </li>
              <li v-if="descuentoPagoAnticipadoVigente.dscto_arancel">
                <b>{{ descuentoPagoAnticipadoVigente.dscto_arancel }}%</b> en arancel
              </li>
              <li v-if="fechaTerminoFormateada">
                Válido hasta el <b>{{ fechaTerminoFormateada }}</b>
              </li>
            </ul>
          </li>
          <li v-if="descuentosModoPagoActivos.length > 0" class="descuentos-info-item">
            <b>Por medio de pago:</b>
            <ul class="descuentos-info-sublist">
              <li v-for="descuento in descuentosModoPagoActivos" :key="descuento.id">
                <b>{{ descuento.dscto_arancel }}%</b> en arancel{{ descuento.nombre ? ` - ${descuento.nombre}` : '' }}
              </li>
            </ul>
          </li>
        </ul>
      </div>
    </OverlayPanel>

    <!-- Dialog para información completa de beca informativa -->
    <Dialog v-model:visible="showBecaInfoDialog" :style="{ width: '90vw', maxWidth: '800px' }"
      :modal="true" :closable="true" :draggable="false"
      :header="selectedBecaInfo?.nombre || 'Información de Beca'"
      class="beca-info-dialog">
      <template #header>
        <div class="dialog-header-content">
          <Award class="w-6 h-6 text-blue-600 mr-2" />
          <span class="dialog-header-title">{{ selectedBecaInfo?.nombre || 'Información de Beca' }}</span>
        </div>
      </template>
      <div v-if="selectedBecaInfo" class="beca-info-dialog-content">
        <div v-if="selectedBecaInfo.descripcion" class="beca-info-field">
          <span class="beca-info-label">Descripción:</span>
          <p class="beca-info-description">{{ selectedBecaInfo.descripcion }}</p>
        </div>
        <div v-if="selectedBecaInfo.porcentajes" class="beca-info-field">
          <div class="beca-info-section-header">
            <FileText class="w-5 h-5 text-blue-600 mr-2" />
            <span class="beca-info-label">Porcentajes:</span>
          </div>
          <ul class="beca-info-list">
            <li v-for="(porcentaje, index) in (Array.isArray(selectedBecaInfo.porcentajes) ? selectedBecaInfo.porcentajes : [selectedBecaInfo.porcentajes])"
              :key="index" class="beca-info-list-item">
              {{ porcentaje }}
            </li>
          </ul>
        </div>
        <div v-if="selectedBecaInfo.requisitos" class="beca-info-field">
          <div class="beca-info-section-header">
            <FileText class="w-5 h-5 text-blue-600 mr-2" />
            <span class="beca-info-label">Requisitos:</span>
          </div>
          <ul class="beca-info-list">
            <li v-for="(requisito, index) in (Array.isArray(selectedBecaInfo.requisitos) ? selectedBecaInfo.requisitos : [selectedBecaInfo.requisitos])"
              :key="index" class="beca-info-list-item">
              {{ requisito }}
            </li>
          </ul>
        </div>
      </div>
    </Dialog>

    <!-- Drawer para información del CAE -->
    <Drawer v-model:visible="showCaeDialog" position="bottom" :style="{ height: 'auto', maxHeight: '80vh' }"
      :modal="true">
      <template #header>
        <div class="flex items-center gap-2">
          <i class="pi pi-info-circle text-orange-600"></i>
          <span class="text-lg font-semibold">Consideraciones para la simulación del crédito CAE</span>
        </div>
      </template>
      <div class="cae-drawer-content p-4">
        <p class="mb-4">
          <strong>El monto financiado anualmente</strong> corresponde al 100% del arancel de referencia vigente a la
          fecha.
        </p>
        <p class="mb-4">
          Se ha considerado una <strong>tasa de interés de UF + 2% anual</strong>; un período de <strong>18
            meses</strong> a
          contar del egreso del estudiante, previo al inicio del cobro; y un plazo de <strong>120, 180 o 240
            meses</strong>
          para pagar el total del crédito, según el monto total adeudado.
        </p>
        <p class="mb-4">
          El <strong>financiamiento total</strong> entregado para tu carrera en esta simulación, se otorga por iguales
          montos cada año y por el número de años de financiamiento que solicitas, considerando como tope el número de
          años
          de duración de la respectiva carrera.
        </p>
        <p class="mb-4">
          El cálculo considera <strong>meses de 30 días</strong> y el <strong>año de 360 días</strong>.
        </p>
        <p class="mb-0 text-sm text-gray-600 italic">
          El resultado de este ejercicio constituye una estimación. No debe utilizarse para otros fines que no sean
          proyectar una cuota aproximada a pagar, considerando los supuestos y parámetros definidos. Atendido lo
          anterior,
          la cuota calculada tiene carácter referencial y no genera obligación ni restricción alguna para la Comisión
          Administradora del Sistema de Créditos para Estudios Superiores ni para los bancos participantes en el
          sistema.
        </p>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
.results-container {
  @apply w-full max-w-6xl mx-auto p-6;
}

.loading-container {
  @apply flex justify-center items-center py-16 px-6;
}

.loading-content {
  @apply flex flex-col items-center justify-center gap-6;
  @apply bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm;
  @apply px-12 py-10;
  min-width: 300px;
}

.loading-message {
  @apply text-lg font-medium text-gray-700 dark:text-slate-100 mb-0;
  margin: 0;
}

.career-card {
  @apply mb-6;
}



.career-info-content {
  @apply space-y-3;
}

.career-name {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 36px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #4D98C5;
}

.career-details {
  @apply flex items-center flex-wrap gap-2;
}

:deep(.career-tag) {
  background-color: #7AB2D4;
  border-radius: 10px;
  padding: 6px 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: -1%;
  color: #FFFFFF;
}

:global(html.dark) :deep(.career-tag) {
  background-color: #1e40af !important;
  color: #ffffff !important;
}

.summary-card {
  @apply mb-6;
}

.summary-item {
  @apply text-center;
}

.summary-item.discount {
  background-color: #99BFD5;
}

:deep(.summary-item.discount) {
  border-radius: 12px;
}

:deep(.summary-item.discount .p-card-content) {
  background-color: #99BFD5;
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

:deep(.summary-item.discount .p-card-body) {
  padding-top: 24px;
  padding-bottom: 24px;
}

.summary-item.final {
  background-color: #D1F4C4;
}

:deep(.summary-item.final) {
  border-radius: 12px;
  border: none;
  box-shadow: none;
}

:deep(.summary-item.final .p-card) {
  background-color: #D1F4C4;
  border-radius: 12px;
  border: none;
  box-shadow: none;
}

:deep(.summary-item.final .p-card-content) {
  background-color: #D1F4C4;
  border-radius: 12px;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

:deep(.summary-item.final .p-card-body) {
  padding-top: 24px;
  padding-bottom: 24px;
}


/* Card de Arancel Original */
.summary-item.first-column-card:not(.matricula-card) {
  background-color: #CCE0E8;
}

:deep(.summary-item.first-column-card:not(.matricula-card)) {
  border-radius: 12px;
}

:deep(.summary-item.first-column-card:not(.matricula-card) .p-card) {
  background-color: #CCE0E8;
  border-radius: 12px;
}

:deep(.summary-item.first-column-card:not(.matricula-card) .p-card-body) {
  padding-top: 24px;
  padding-bottom: 24px;
}

/* Card de Matrícula */
.summary-item.matricula-card {
  background-color: #CCE0E8;
}

:deep(.summary-item.matricula-card) {
  border-radius: 12px;
}

:deep(.summary-item.matricula-card .p-card) {
  background-color: #CCE0E8;
  border-radius: 12px;
}

:deep(.summary-item.matricula-card .p-card-body) {
  padding-top: 24px;
  padding-bottom: 24px;
}

/* Centrar verticalmente el contenido de las cards de descuento y final en desktop */
@media (min-width: 768px) {

  :deep(.summary-item.discount .p-card-body),
  :deep(.summary-item.final .p-card-body) {
    padding-top: 24px;
    padding-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100%;
  }

  :deep(.summary-item.discount .p-card-content),
  :deep(.summary-item.final .p-card-content) {
    width: 100%;
  }
}

/* Estilos generales para textos de las cards de la primera columna */
.first-column-label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
  margin-bottom: 8px;
}

.first-column-value {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 28px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
}

/* Estilos para el texto de cuotas en las cards de la primera columna */
:deep(.summary-item.first-column-card .first-column-content > div:nth-child(2)) {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-style: normal;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
  margin-bottom: 20px;
}

/* Estilos para la card final */
:deep(.final-label) {
  font-family: Montserrat, sans-serif;
  font-weight: 700;
  font-style: Bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #28B911;
  margin-bottom: 8px;
}

:deep(.final-cuotas) {
  font-family: Montserrat, sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 20px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #28B911;
  margin-bottom: 20px;
}

:deep(.final-value) {
  font-family: Montserrat, sans-serif;
  font-weight: 700;
  font-style: Bold;
  font-size: 27.39px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #28B911;
}

:deep(.final-details) {
  font-family: Montserrat, sans-serif;
  font-weight: 500;
  font-style: medium;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #28B911;
}

:deep(.final-details-text) {
  font-family: Montserrat, sans-serif;
  font-weight: 500;
  font-style: medium;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #155708;
  margin-top: 20px;
}

/* Estilos responsive para final-details-text en móvil */
@media (max-width: 768px) {
  :deep(.final-details-text) {
    font-size: 12px;
    line-height: 140%;
    margin-top: 12px;
  }
}

/* Estilos para la card de descuento */
:deep(.discount-label) {
  font-family: Montserrat, sans-serif;
  font-weight: 700;
  font-style: Bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
  margin-bottom: 8px;
}

:deep(.discount-value) {
  font-family: Montserrat, sans-serif;
  font-weight: 700;
  font-style: Bold;
  font-size: 27.39px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
}

/* Estilos para cards de la primera columna - solo en desktop */
@media (min-width: 768px) {
  :deep(.summary-item.first-column-card) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  :deep(.summary-item.first-column-card .p-card-body) {
    padding-top: 24px;
    padding-bottom: 24px;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    flex: 1;
  }

  :deep(.summary-item.first-column-card .p-card-content) {
    padding: 0.25rem 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .first-column-content {
    @apply py-0;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .first-column-label {
    margin-bottom: 8px;
  }
}

.table-container {
  @apply overflow-x-auto;
}

.results-table {
  @apply w-full border-collapse bg-white rounded-lg shadow-sm overflow-hidden;
}

.table-header {
  @apply px-4 py-3 text-xs font-semibold uppercase tracking-wide;
  background-color: #000000;
  color: #ffffff;
  border-bottom: 1px solid #000000;
}

.results-table tbody tr {
  @apply border-b border-gray-200 transition-colors;
}

.results-table tbody tr:hover:not(.section-header-row):not(.base-row):not(.matricula-row) {
  @apply bg-gray-50;
}

.table-row.base-row {
  background-color: #FF6B35;
  color: #ffffff;
  font-weight: 600;
}

.table-row.base-row .table-cell {
  color: #ffffff;
}

.table-row.matricula-row {
  background-color: var(--uniacc-purple);
  color: #ffffff;
  font-weight: 600;
}

.table-row.matricula-row .table-cell {
  color: #ffffff;
}

.table-row.section-header-row {
  background-color: #4A5568;
}

.table-row.section-header-row .table-cell {
  color: #ffffff;
  font-weight: 600;
}

.table-row.benefit-row {
  @apply bg-white;
}

.table-row.estado-row {
  @apply bg-purple-50;
}

.table-row.interno-row {
  @apply bg-blue-50;
}

.table-row.cae-row {
  @apply bg-orange-50;
}

.table-row.subtotal-row {
  @apply bg-gray-100;
}

.table-row.discount-total-row {
  @apply bg-green-50;
  border-top: 2px solid #FCA5A5;
}

.table-row.final-row {
  @apply bg-green-50;
  border-top: 2px solid #86EFAC;
}

.table-row.info-row {
  @apply bg-gray-50;
}

.table-row.estado-info-row {
  @apply bg-purple-50;
}

.table-row.cae-info-row {
  @apply bg-orange-50;
}

.table-cell {
  @apply px-4 py-3 text-sm;
}

/* Clases para responsive */
.desktop-only {
  display: table-cell;
}

.mobile-only {
  display: none;
}

/* Estilos responsive para pantallas pequeñas y medianas */
@media (max-width: 1024px) {
  .desktop-only {
    display: none;
  }

  .mobile-only {
    display: table-cell;
  }

  .table-header,
  .table-cell {
    @apply px-2 py-2 text-xs;
  }

  .table-cell.font-bold.text-lg {
    @apply text-base;
  }

  .benefit-name {
    @apply text-xs;
  }

  .benefit-name i {
    @apply mr-1;
    font-size: 0.75rem;
  }

  .section-title {
    @apply text-xs;
  }

  .discount-percentage {
    @apply text-xs;
  }
}

.table-cell.text-red-600 {
  color: #dc2626 !important;
}

.benefit-name {
  @apply flex items-center;
}

.badge-type {
  @apply inline-flex items-center justify-center px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800;
}

.badge-estado {
  @apply bg-purple-100 text-purple-800;
}

.badge-cae {
  @apply bg-orange-100 text-orange-800;
}

.discount-percentage {
  @apply font-semibold text-blue-600;
}

.section-title {
  @apply text-sm uppercase tracking-wide;
  @apply flex items-center gap-2;
}

.section-tooltip-icon {
  @apply ml-2 cursor-help;
  font-size: 0.875rem;
  opacity: 0.9;
  transition: opacity 0.2s;
}

.section-tooltip-icon:hover {
  opacity: 1;
}

/* Estilos para mensaje de contacto */
.contact-message {
  @apply mt-8;
}

:deep(.contact-message .p-card) {
  background-color: #F0F8FB;
  border: none;
  box-shadow: none;
  border-radius: 12px;
}

:deep(.contact-message .p-card-body) {
  background-color: #F0F8FB;
  padding: 1.5rem;
}

.contact-message-content {
  @apply flex flex-col;
}

.contact-message-text {
  font-family: Montserrat, sans-serif;
  font-weight: 500;
  font-style: normal;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
}

.contact-message-text .simulation-question {
  font-family: Montserrat, sans-serif;
  font-weight: 700;
  font-style: Bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
  display: block;
  margin-bottom: 0.5rem;
}

.contact-message-text b:not(.simulation-question) {
  font-family: Montserrat, sans-serif;
  font-weight: 500;
  font-style: normal;
}

.contact-link {
  @apply underline font-medium;
  color: inherit;
}

.contact-link:hover {
  @apply opacity-80;
}

.contact-phone {
  @apply font-semibold;
}

.confirmation-message {
  @apply mt-4;
}

.confirmation-message-content {
  @apply flex items-start gap-3;
}

.confirmation-message-icon {
  @apply flex-shrink-0 mt-0.5;
  width: 1.25rem;
  height: 1.25rem;
  color: var(--p-info-color);
}

.confirmation-message-text-wrapper {
  @apply flex flex-col;
}

.confirmation-message-title {
  @apply font-semibold mb-1 text-base;
}

.confirmation-message-text {
  @apply text-sm leading-relaxed;
}

.anticipado-message {
  @apply mt-6;
}

.anticipado-message-content {
  @apply flex flex-col;
}

.anticipado-message-title {
  @apply mb-2;
  font-size: 0.9375rem;
}

.anticipado-message-list {
  @apply list-disc pl-6 mt-2 space-y-2;
}

.anticipado-message-list li {
  @apply text-sm;
  line-height: 1.6;
}

.anticipado-message-list li b {
  font-weight: 600;
}

.anticipado-message-list .subtitle-item {
  @apply mb-1;
}

.anticipado-sublist {
  @apply list-disc pl-5 mt-1 space-y-1;
  font-size: 0.875rem;
}

.anticipado-sublist li {
  @apply text-xs;
  line-height: 1.5;
}

.subtotal-estado-row {
  @apply bg-purple-50 font-semibold;
}

.subtotal-interno-row {
  @apply bg-blue-50 font-semibold;
}

.subtotal-cae-row {
  @apply bg-orange-50 font-semibold;
}

/* Estilos para sección de becas aplicadas */
.benefits-section {
  @apply space-y-6 mt-8;
}

.benefits-subsection {
  @apply space-y-4 mt-6;
}

.benefits-section-title {
  @apply flex items-center space-x-2 text-xl font-bold text-gray-900 mb-4;
}

.subsection-title {
  @apply flex items-center space-x-2 text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200;
}

.benefits-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.benefit-card {
  @apply bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg p-4;
}

.benefit-card-estado {
  @apply border-purple-200 bg-purple-50/30 dark:border-purple-700 dark:bg-purple-950/40;
}

.benefit-card-interno {
  @apply border-blue-200 bg-blue-50/30 dark:border-slate-600 dark:bg-slate-800;
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
  @apply text-sm font-semibold text-gray-900 dark:text-white mb-1;
}

.benefit-type {
  @apply text-xs text-gray-500 dark:text-slate-400;
}

.benefit-details {
  @apply space-y-2;
}

.benefit-discount,
.benefit-applied {
  @apply flex justify-between items-center text-sm;
}

.applied-label {
  @apply text-gray-600;
}

.applied-value {
  @apply font-semibold text-gray-900;
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

/* Estilos para botón de exportar PDF */
.export-pdf-section {
  @apply flex justify-center mt-8 pt-6 border-t border-gray-200 dark:border-slate-600;
}

.export-pdf-button {
  @apply min-w-[200px];
}

/* Estilos para overlay panel de información de beca */
.beca-info-overlay {
  max-width: 320px;
}

.beca-info-overlay :deep(.p-overlaypanel-content) {
  padding: 0 !important;
}

.beca-info-content {
  display: flex;
  flex-direction: column;
}

.beca-info-header {
  @apply flex items-start justify-between gap-2 px-3 py-2 mb-0;
}

.beca-info-content>*:not(.beca-info-header):not(.beca-info-divider) {
  @apply px-3;
}

.beca-info-content>.beca-info-body,
.beca-info-content>.beca-info-footer {
  @apply py-2;
}

.beca-info-content>.beca-info-divider {
  @apply mx-3;
}

.beca-info-title {
  @apply text-sm font-semibold text-gray-900;
  flex: 1;
  margin: 0;
}

.beca-info-badge {
  @apply inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap;
  flex-shrink: 0;
}

.beca-badge-automatico {
  @apply bg-green-100 text-green-800;
}

.beca-badge-evaluacion {
  @apply bg-yellow-100 text-yellow-800;
}

.beca-badge-postulacion {
  @apply bg-blue-100 text-blue-800;
}

.beca-info-divider {
  @apply my-2;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.1);
  border: none;
  width: 100%;
}

.beca-info-body {
  @apply flex flex-col;
}

.beca-info-description-section {
  @apply mb-0;
}

.beca-info-description {
  @apply text-xs text-gray-700 leading-relaxed;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
}

.beca-info-footer {
  @apply mt-0;
}

.beca-info-subtitle {
  @apply text-xs font-semibold text-gray-800 mb-1.5;
  margin-top: 0;
}

.beca-info-list {
  @apply list-disc pl-4 space-y-1;
  margin: 0;
}

.beca-info-item {
  @apply text-xs text-gray-700 leading-relaxed;
}

/* Estilos para simulación de cuotas y medios de pago */
.payment-simulation-card {
  @apply mb-6;
}

.payment-simulation-content {
  @apply flex flex-col md:flex-row gap-6;
}

.payment-control-group {
  @apply flex-1 flex flex-col gap-2;
}

.payment-label {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #001122;
  margin-bottom: 12px;
}

:global(html.dark) .payment-label {
  color: #f8fafc !important;
}

:global(html.dark) .slider-value {
  background-color: #334155 !important;
  border-color: #64748b !important;
  color: #ffffff !important;
}

.slider-container {
  @apply w-full;
}

.payment-slider {
  @apply w-full;
}

:deep(.payment-slider .p-slider-range) {
  background: #668BB2;
}

.slider-value {
  @apply inline-flex items-center justify-center;
  @apply min-w-[2.5rem] px-2 py-0.5;
  @apply text-lg font-bold text-gray-900;
  @apply bg-gray-100 rounded-md;
  @apply border border-gray-200;
}

.payment-select {
  @apply w-full;
}

/* Estilos para overlay de información de descuentos */
.descuentos-info-overlay {
  max-width: 400px;
}

.descuentos-info-overlay :deep(.p-overlaypanel-content) {
  padding: 1rem !important;
}

.descuentos-info-content {
  display: flex;
  flex-direction: column;
}

.descuentos-info-title {
  @apply mb-3;
  font-size: 0.9375rem;
}

.descuentos-info-list {
  @apply list-disc pl-6 space-y-2;
  margin: 0;
}

.descuentos-info-item {
  @apply text-sm;
  line-height: 1.6;
}

.descuentos-info-item b {
  font-weight: 600;
}

.descuentos-info-sublist {
  @apply list-disc pl-5 mt-1 space-y-1;
  font-size: 0.875rem;
}

.descuentos-info-sublist li {
  @apply text-xs;
  line-height: 1.5;
}


.cards-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}


/* Ajustes Jacinta */

:deep(.career-card) {
  border: 1px solid #B6B6B6;
  background-color: #FFFFFF;
  border-radius: 20px;
  box-shadow: none;
}

.career-title {
  color: #001122;
  font-weight: 700;
  font-size: 18px;
  font-family: 'Montserrat', sans-serif;
  line-height: 125%;
  letter-spacing: 0%;
}

.detalle-title {
  color: #001122;
  font-weight: 700;
  font-size: 18px;
  font-family: 'Montserrat', sans-serif;
  line-height: 125%;
  letter-spacing: 0%;
}

:deep(.detalle-card) {
  border: 1px solid #B6B6B6;
  background-color: #FFFFFF;
  border-radius: 20px;
  box-shadow: none;
}

:deep(.detalle-arancel-card) {
  border: 1px solid #929292;
  background-color: #FFFFFF;
  border-radius: 12px;
  box-shadow: none;
}

:deep(.detalle-arancel-card .p-card-body) {
  padding: 0;
}

:deep(.info-estado-card) {
  border: 1px solid #ADADAD;
  background-color: #F0F8FB;
  border-radius: 12px;
  box-shadow: none;
  padding: 16px;
}

:deep(.info-estado-card .p-card-title) {
  gap: 8px;
  display: flex;
}

:deep(.info-estado-card .p-card-title span) {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
}

:deep(.info-estado-card .p-card-content p) {
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 18px;
  font-style: medium;
  line-height: 125%;
  letter-spacing: 0%;
  color: #797979;
}

:global(html.dark) :deep(.info-estado-card .p-card-content p) {
  color: #e2e8f0 !important;
}

:deep(.info-estado-card .p-card-content a) {
  font-family: 'Montserrat', sans-serif;
  font-weight: 600;
  font-size: 18px;
  font-style: semibold;
  line-height: 125%;
  letter-spacing: 0%;
  color: #797979;
  text-decoration: underline;
}

:global(html.dark) :deep(.info-estado-card .p-card-content a) {
  color: #93c5fd !important;
}

:global(html.dark) :deep(.info-estado-card .p-card-title span),
:global(html.dark) :deep(.becas-internas-card .p-card-title span) {
  color: #e0f2fe !important;
}

:deep(.becas-internas-card) {
  border: 1px solid #ADADAD;
  background-color: #F0F8FB;
  border-radius: 12px;
  box-shadow: none;
  padding: 16px;
}

:deep(.becas-internas-card .p-card-title) {
  gap: 8px;
  display: flex;
}

:deep(.becas-internas-card .p-card-title span) {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
}

:deep(.cae-card) {
  border: 1px solid #ADADAD;
  background-color: #F0F8FB;
  border-radius: 12px;
  box-shadow: none;
  padding: 16px;
}

:deep(.cae-card .p-card-title div:first-child) {
  gap: 8px;
  display: flex;
  margin-bottom: 12px;
}

:deep(.cae-card .p-card-title span) {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
}

:deep(.cae-card .p-card-title p) {
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
  font-size: 18px;
  font-style: medium;
  line-height: 125%;
  letter-spacing: 0%;
  color: #797979;
}

:deep(.total-descuentos-card) {
  border: none;
  box-shadow: none;
  border-radius: 12px;
  background-color: #99BFD5;
  padding: 10px 24px;
}

:deep(.total-descuentos-card .p-card-content) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
:deep(.total-descuentos-card .p-card-content span) {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #FFFFFF;
}

:deep(.descuentos-adicionales-card) {
  border: 1px solid #ADADAD;
  background-color: #F0F8FB;
  border-radius: 12px;
  box-shadow: none;
  padding: 16px;
}

:deep(.descuentos-adicionales-card .p-card-title) {
  gap: 8px;
  display: flex;
  margin-bottom: 12px;
}

:deep(.descuentos-adicionales-card .p-card-title span) {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #1A3B66;
}

.table-arancel {
  width: 100%;
  border-collapse: collapse;
}

.table-arancel thead tr {
  background-color: #E9E9E9;
}

.table-arancel thead th {
  padding: 12px;
  color: #797979;
  font-weight: 400;
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  line-height: 125%;
  letter-spacing: 0%;
}

.table-arancel thead th:first-child {
  text-align: left;
  border-top-left-radius: 12px;
  padding-left: 42px;
}

.table-arancel thead th:last-child {
  text-align: right;
  border-top-right-radius: 12px;
  padding-right: 42px;
}

.table-arancel tbody td {
  padding: 12px;
}

.table-arancel tbody tr:not(:last-child) td {
  border-bottom: 1px solid #E5E5E5;
}


.table-arancel tbody td:last-child {
  text-align: right;
  padding-right: 42px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #668BB2;
}

.table-arancel tbody td:first-child {
  text-align: left;
  padding-left: 42px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 100%;
  letter-spacing: 0%;
  color: #668BB2;
}

.table-arancel tbody td:not(:first-child):not(:last-child) {
  text-align: center;
}

.table-becas-internas {
  width: 100%;
  border-collapse: collapse;
}

.table-becas-internas tr td {
  padding: 20px 9px;
}

.table-becas-internas tr:first-child {
  border-bottom: 1px solid #A9A9A9;
}

.table-becas-internas tr td:first-child {
  text-align: left;
}

.table-becas-internas tr td:last-child {
  text-align: right;
}

.table-becas-internas tr td:not(:first-child):not(:last-child) {
  text-align: center;
}

.texto-info {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #668BB2;
}

:global(html.dark) .texto-info {
  color: #e2e8f0 !important;
}

.texto-descuento {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #52D931;
}

:global(html.dark) .texto-descuento {
  color: #86efac !important;
}

:deep(.info-tag) {
  background-color: #668BB2;
  border-radius: 12px;
  padding: 10px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #FFFFFF;
}

.table-cae {
  width: 100%;
  border-collapse: collapse;
}

.table-cae tr td {
  padding: 20px 9px;
}

.table-cae tr:first-child {
  border-bottom: 1px solid #A9A9A9;
}

.table-cae tr td:first-child {
  text-align: left;
}

.table-cae tr td:last-child {
  text-align: right;
}

.table-cae tr td:not(:first-child):not(:last-child) {
  text-align: center;
}


.table-descuentos-adicionales {
  width: 100%;
  border-collapse: collapse;
}

.table-descuentos-adicionales tr td {
  padding: 20px 9px;
}

.table-descuentos-adicionales tr:first-child {
  border-bottom: 1px solid #A9A9A9;
}

.table-descuentos-adicionales tr td:first-child {
  text-align: left;
}

.table-descuentos-adicionales tr td:last-child {
  text-align: right;
}

.table-descuentos-adicionales tr td:not(:first-child):not(:last-child) {
  text-align: center;
}

.fila-border {
  border-top: 1px solid #A9A9A9;
}

.total-a-pagar-card {
  border: 1px solid #28B911;
  background-color: #D1F4C4;
  box-shadow: none;
  padding: 10px 24px;
}

:deep(.total-a-pagar-card .p-card-content) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
:deep(.total-a-pagar-card .p-card-content span) {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #28B911;
}

:deep(.payment-simulation-card) {
  border: 1px solid #B6B6B6;
  border-radius: 12px;
  box-shadow: none;
}

:deep(.payment-simulation-card .p-card-title) {
  gap: 8px;
  display: flex;
  margin-bottom: 32px;
}

:deep(.payment-simulation-card .p-card-title span) {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-style: bold;
  font-size: 18px;
  line-height: 125%;
  letter-spacing: 0%;
  color: #001122;
}

/* Disclaimer referencial con estilo tipo info */
.disclaimer-referencial {
  font-family: 'Montserrat', sans-serif;
}

.disclaimer-referencial-inner {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border: 1px solid rgba(26, 59, 102, 0.15);
  border-left: 4px solid #1a3b66;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(26, 59, 102, 0.06);
}

:global(html.dark) .disclaimer-referencial-inner {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%) !important;
  border-color: rgba(148, 163, 184, 0.35) !important;
  border-left-color: #60a5fa !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35) !important;
}

.disclaimer-referencial-icon {
  flex-shrink: 0;
  width: 1.35rem;
  height: 1.35rem;
  margin-top: 0.15rem;
}

:global(html.dark) .disclaimer-referencial-icon {
  color: #93c5fd !important;
}

.disclaimer-referencial-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 0.9375rem;
  line-height: 1.5;
  font-weight: 500;
}

:global(html.dark) .disclaimer-referencial-text {
  color: #e2e8f0 !important;
}

.disclaimer-referencial-main {
  font-weight: 700;
}

:global(html.dark) .disclaimer-referencial-main {
  color: #f8fafc !important;
}

.disclaimer-referencial-duration {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.625rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #1a3b66 0%, #0f2847 100%);
  color: #fff;
  border: 2px solid #1a3b66;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.9375rem;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(26, 59, 102, 0.35);
  letter-spacing: 0.02em;
}

:global(html.dark) .disclaimer-referencial-duration {
  background: linear-gradient(135deg, #1e40af 0%, #1e3a5f 100%) !important;
  border-color: #3b82f6 !important;
  color: #f8fafc !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
}

.disclaimer-duration-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: #fff;
  flex-shrink: 0;
}

.disclaimer-referencial-mobile .disclaimer-referencial-inner {
  padding: 0.875rem 1rem;
  gap: 0.625rem;
}

.disclaimer-referencial-mobile .disclaimer-referencial-text {
  font-size: 0.875rem;
}

.disclaimer-referencial-mobile .disclaimer-referencial-duration {
  margin-top: 0.5rem;
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  white-space: normal;
}

/* JPS: Estilos Mobile - Optimizaciones para iOS y Android */
.mobile-version {
  padding: 0.5rem;
}

.mobile-accordion-item {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  margin-bottom: 0.75rem;
  overflow: hidden;
  background: white;
}

.mobile-accordion-trigger {
  padding: 1rem 1.25rem;
  min-height: 44px; /* iOS/Android touch target minimum */
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  font-size: 0.9375rem;
  color: #1a3b66;
  background: transparent;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent; /* iOS Safari */
  -webkit-touch-callout: none; /* iOS Safari */
  user-select: none;
  transition: background-color 0.2s ease;
}

.mobile-accordion-trigger:hover {
  background-color: #f3f4f6;
}

.mobile-accordion-trigger:active {
  background-color: #e5e7eb;
}

.mobile-accordion-trigger:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

/* Optimización para iOS safe areas */
@supports (padding: max(0px)) {
  .mobile-version {
    padding-left: max(0.5rem, env(safe-area-inset-left));
    padding-right: max(0.5rem, env(safe-area-inset-right));
  }
}

.mobile-card {
  margin-bottom: 0.75rem;
  border-radius: 12px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.mobile-card-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a3b66;
  line-height: 1.5;
}

/* Touch targets optimizados para mobile */
.mobile-version button,
.mobile-version a,
.mobile-version [role="button"] {
  min-height: 44px;
  min-width: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Scroll suave en mobile */
.mobile-version {
  -webkit-overflow-scrolling: touch; /* iOS smooth scrolling */
  scroll-behavior: smooth;
}

/* Optimizaciones específicas para Android */
@media (hover: none) and (pointer: coarse) {
  .mobile-accordion-trigger {
    -webkit-tap-highlight-color: rgba(59, 130, 246, 0.1); /* Android ripple effect */
  }
}

/* Ajustes de espaciado para mobile */
@media (max-width: 768px) {
  .results-container {
    padding: 0.75rem;
  }

  .mobile-version .slider-value {
    min-width: 2.5rem;
    padding: 0.25rem 0.5rem;
    font-size: 1rem;
    font-weight: 700;
    background: #f3f4f6;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
  }

  /* Asegurar que los selects y sliders sean fáciles de usar en mobile */
  .mobile-version :deep(.p-select),
  .mobile-version :deep(.p-slider) {
    min-height: 44px;
  }

  .mobile-version :deep(.p-slider-handle) {
    width: 20px;
    height: 20px;
    min-width: 20px;
    min-height: 20px;
  }
}

/* Ocultar versión mobile en PDF export */
@media print {
  .mobile-version {
    display: none !important;
  }

  .desktop-version {
    display: block !important;
  }
}

/* Estilos para texto informativo de becas informativas */
.becas-informativas-texto {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 0.95rem;
  color: #4B5563;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

:global(html.dark) .becas-informativas-texto,
:global(html.dark) .becas-informativas-texto-mobile {
  color: #cbd5e1 !important;
}

.becas-informativas-texto-mobile {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 0.875rem;
  color: #4B5563;
  line-height: 1.6;
  text-align: center;
}

/* Estilos para cards compactas de becas informativas */
.benefit-card-compact {
  @apply flex flex-col;
  min-height: 180px;
}

.benefit-description-compact {
  @apply mt-3 mb-4 flex-1;
}

.description-text-compact {
  @apply text-sm text-gray-600 dark:text-slate-300;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

:global(html.dark) .description-text,
:global(html.dark) .description-text-compact {
  color: #cbd5e1 !important;
}

.benefit-action {
  @apply mt-auto pt-3 border-t border-gray-200 dark:border-slate-600;
}

.ver-mas-button {
  @apply w-full;
}

/* Estilos para dialog de información de beca */
:deep(.beca-info-dialog) {
  border-radius: 12px;
}

:deep(.beca-info-dialog .p-dialog-header) {
  @apply pb-4 border-b border-gray-200;
  padding: 1.5rem 1.5rem 1rem 1.5rem;
}

:deep(.beca-info-dialog .p-dialog-content) {
  padding: 1.5rem;
  max-height: 70vh;
  overflow-y: auto;
}

.dialog-header-content {
  @apply flex items-center;
}

.dialog-header-title {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  color: #1A3B66;
}

.beca-info-dialog-content {
  @apply space-y-6;
}

.beca-info-field {
  @apply space-y-3;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.beca-info-field:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.beca-info-label {
  display: block;
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  font-size: 1rem;
  color: #1A3B66;
  margin-bottom: 0.75rem;
}

.beca-info-value {
  display: block;
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 1rem;
  color: #4B5563;
}

.beca-info-description {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 1rem;
  color: #374151;
  line-height: 1.7;
  margin: 0;
}

.beca-info-section-header {
  @apply flex items-center;
  margin-bottom: 1rem;
}

.beca-info-section-header .beca-info-label {
  margin-bottom: 0;
}

.beca-info-list {
  list-style: disc;
  padding-left: 2rem;
  margin: 0;
}

.beca-info-list-item {
  font-family: 'Inter', sans-serif;
  font-weight: 400;
  font-size: 1rem;
  color: #374151;
  line-height: 1.7;
  margin-bottom: 0.75rem;
}

.beca-info-list-item:last-child {
  margin-bottom: 0;
}

/* Tema oscuro — Results (clase .dark en html) */
:global(html.dark) .loading-content {
  background-color: #1e293b !important;
  border-color: #475569 !important;
}

:global(html.dark) .loading-message {
  color: #e2e8f0 !important;
}

:global(html.dark) .loading-container {
  background-color: transparent;
}

:global(html.dark) .career-name {
  color: #93c5fd !important;
}

:global(html.dark) .benefits-section-title {
  color: #f1f5f9 !important;
}

:global(html.dark) .subsection-title {
  color: #e2e8f0 !important;
  border-color: #475569 !important;
}

:global(html.dark) .benefit-card {
  background-color: #1e293b !important;
  border-color: #475569 !important;
}

:global(html.dark) .benefit-card-estado {
  border-color: #7c3aed !important;
  background-color: rgba(76, 29, 149, 0.35) !important;
}

:global(html.dark) .benefit-card-interno {
  border-color: #3b82f6 !important;
  background-color: #1e293b !important;
}

:global(html.dark) .benefit-title {
  color: #ffffff !important;
}

:global(html.dark) .benefit-card p,
:global(html.dark) .benefit-description,
:global(html.dark) .benefit-card .text-sm {
  color: #cbd5e1 !important;
}

:global(html.dark) .table-row.benefit-row {
  background-color: #1e293b !important;
}

:global(html.dark) .table-row.estado-row {
  background-color: rgba(76, 29, 149, 0.4) !important;
}

:global(html.dark) .table-row.interno-row {
  background-color: rgba(30, 58, 95, 0.6) !important;
}

:global(html.dark) .table-row.cae-row {
  background-color: rgba(124, 45, 18, 0.35) !important;
}

:global(html.dark) .table-row.subtotal-row {
  background-color: #334155 !important;
}

:global(html.dark) .table-row.discount-total-row,
:global(html.dark) .table-row.final-row {
  background-color: rgba(20, 83, 45, 0.35) !important;
}

:global(html.dark) .table-row.info-row {
  background-color: #1e293b !important;
}

:global(html.dark) .beca-info-description,
:global(html.dark) .beca-info-list-item {
  color: #cbd5e1 !important;
}

:global(html.dark) :deep(.p-card),
:global(html.dark) :deep(.p-drawer),
:global(html.dark) :deep(.p-dialog) {
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

/* Cards resumen financiero */
:global(html.dark) :deep(.summary-item.first-column-card .p-card),
:global(html.dark) :deep(.summary-item.matricula-card .p-card),
:global(html.dark) .summary-item.first-column-card,
:global(html.dark) .summary-item.matricula-card {
  background-color: #1e3a5f !important;
}

:global(html.dark) .first-column-label,
:global(html.dark) .first-column-value,
:global(html.dark) :deep(.summary-item.first-column-card .first-column-content > div),
:global(html.dark) :deep(.summary-item.first-column-card .text-gray-600),
:global(html.dark) :deep(.summary-item.first-column-card .text-gray-900) {
  color: #f8fafc !important;
}

:global(html.dark) :deep(.summary-item.discount),
:global(html.dark) :deep(.summary-item.discount .p-card),
:global(html.dark) :deep(.summary-item.discount .p-card-content) {
  background-color: #1e40af !important;
}

:global(html.dark) :deep(.discount-label),
:global(html.dark) :deep(.discount-value) {
  color: #ffffff !important;
}

:global(html.dark) :deep(.summary-item.final),
:global(html.dark) :deep(.summary-item.final .p-card),
:global(html.dark) :deep(.summary-item.final .p-card-content) {
  background-color: #14532d !important;
}

:global(html.dark) :deep(.final-label),
:global(html.dark) :deep(.final-cuotas),
:global(html.dark) :deep(.final-value),
:global(html.dark) :deep(.final-details),
:global(html.dark) :deep(.final-details-text) {
  color: #dcfce7 !important;
}

:global(html.dark) :deep(.final-value) {
  color: #86efac !important;
}

:global(html.dark) :deep(.contact-message .p-card),
:global(html.dark) .contact-message {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
}

:global(html.dark) .contact-message-text,
:global(html.dark) .simulation-question {
  color: #e2e8f0 !important;
}

:global(html.dark) .contact-link {
  color: #93c5fd !important;
}

:global(html.dark) .export-pdf-button,
:global(html.dark) :deep(.export-pdf-button) {
  background-color: #1e293b !important;
  border: 1px solid #94a3b8 !important;
  color: #f8fafc !important;
}

:global(html.dark) .results-table,
:global(html.dark) .detail-table,
:global(html.dark) table {
  background-color: #1e293b !important;
  color: #e2e8f0 !important;
}

:global(html.dark) .mobile-card {
  background-color: #1e293b !important;
  border-color: #475569 !important;
  color: #e2e8f0 !important;
}

</style>
