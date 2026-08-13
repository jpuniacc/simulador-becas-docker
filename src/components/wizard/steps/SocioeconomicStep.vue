<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Input } from '@/components/ui/input'
import ValidationMessage from '@/components/ui/validation-message.vue'
import { TrendingUp, Info, CheckCircle, Shield } from 'lucide-vue-next'
import { useFormValidation } from '@/composables/useFormValidation'
import { useDecilCalculation } from '@/composables/useDecilCalculation'
import { useSimuladorStore } from '@/stores/simuladorStore'
import type { FormData, DecilInfo } from '@/types/simulador'
import { formatCurrency } from '@/utils/formatters'

// Props
interface Props {
  formData: FormData
  deciles: DecilInfo[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:form-data': [data: Partial<FormData>]
  validate: [step: number, isValid: boolean]
}>()

// Estado local
const formData = ref<FormData>({ ...props.formData })
const selectedDecil = ref<number | null>(null)

// Store
const simuladorStore = useSimuladorStore()

// Computed para mostrar selección de decil
const showDecilSelection = computed(() => {
  return formData.value.planeaUsarCAE || formData.value.usaBecasEstado
})

const showFinanciamientoPaesWarning = computed(() => {
  return formData.value.planeaUsarCAE === true || formData.value.usaBecasEstado === true
})

// Validación
const {
  validateField,
  hasFieldError,
  getFieldErrorMessage,
  isValid
} = useFormValidation(formData.value, {}, {
  validationMode: 'onBlur',
  debounceMs: 300
})

// Computed
const selectedDecilInfo = computed(() => {
  if (!selectedDecil.value) return null

  console.log('Buscando decil con valor:', selectedDecil.value)
  console.log('Deciles disponibles:', simuladorStore.decilesFromSupabase.map(d => ({ id: d.id, decil: d.decil, rango_min: d.rango_ingreso_min, rango_max: d.rango_ingreso_max })))

  const found = simuladorStore.decilesFromSupabase.find(d => d.decil === selectedDecil.value) || null
  console.log('Decil encontrado:', found)

  return found
})

const isStepValid = computed(() => {
  // Si no selecciona ninguna opción de financiamiento, es válido
  if (!formData.value.planeaUsarCAE && !formData.value.usaBecasEstado) {
    return true
  }
  // Si selecciona alguna opción, debe seleccionar decil
  return !!selectedDecil.value
})

// Métodos

const handleDecilChange = () => {
  console.log('Decil seleccionado:', selectedDecil.value)
  console.log('Tipo de selectedDecil.value:', typeof selectedDecil.value)

  // Actualizar datos del formulario
  formData.value.decil = selectedDecil.value
  formData.value.ingresoMensual = '0'

  // Validar campo
  validateField('decil')

  // Emitir validación
  emit('validate', 4, isStepValid.value)
}

const handleFinancingChange = () => {
  // Si deselecciona ambas opciones, limpiar decil
  if (!formData.value.planeaUsarCAE && !formData.value.usaBecasEstado) {
    selectedDecil.value = null
    formData.value.decil = null
  }

  // Emitir datos actualizados
  emit('update:form-data', formData.value)
  emit('validate', 4, isStepValid.value)
}

const handleSubmit = () => {
  // Validar campos
  validateField('decil')
  validateField('ingresoMensual')
  validateField('integrantes')

  // Emitir datos actualizados
  emit('update:form-data', formData.value)

  // Emitir validación
  emit('validate', 4, isStepValid.value)
}

// Watchers con debounce para evitar bucles
let updateTimeout: NodeJS.Timeout | null = null

watch(formData, (newData) => {
  // Limpiar timeout anterior
  if (updateTimeout) {
    clearTimeout(updateTimeout)
  }

  // Debounce para emitir actualizaciones
  updateTimeout = setTimeout(() => {
    emit('update:form-data', newData)
    emit('validate', 4, isStepValid.value)
  }, 100) // Debounce de 100ms
}, { deep: true })

watch(() => props.formData, (newData) => {
  // Solo actualizar si hay diferencias reales
  const hasChanges = Object.keys(newData).some(key =>
    (formData.value as any)[key] !== (newData as any)[key]
  )

  if (hasChanges) {
    formData.value = { ...newData }
    selectedDecil.value = newData.decil || null
  }
}, { deep: true })

// Lifecycle
onMounted(async () => {
  // Cargar deciles desde Supabase si no están cargados
  if (simuladorStore.decilesFromSupabase.length === 0) {
    await simuladorStore.loadDecilesFromSupabase()
  }

  // Inicializar decil seleccionado
  selectedDecil.value = formData.value.decil || null

  // Validar paso inicial
  emit('validate', 4, isStepValid.value)
})
</script>

<template>
  <div class="socioeconomic-step p-8 animate-fade-in min-h-full bg-white">
    <div class="step-content">
      <!-- Información del paso -->
      <div class="step-info">
        <p class="step-description">
          Selecciona si utilizarás CAE o becas del estado para calcular los beneficios aplicables
        </p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSubmit" class="form">
        <!-- Opciones de financiamiento -->
        <div class="financing-options">
          <h4 class="section-title">¿Qué tipo de financiamiento planeas utilizar?</h4>
          <div class="options-grid">
            <!-- CAE -->
            <div class="option-card" :class="{ 'selected': formData.planeaUsarCAE }">
              <label class="option-label">
                <input
                  v-model="formData.planeaUsarCAE"
                  type="checkbox"
                  @change="handleFinancingChange"
                  class="option-checkbox"
                />
                <div class="option-content">
                  <div class="option-icon">
                    <TrendingUp class="w-6 h-6" />
                  </div>
                  <div class="option-text">
                    <h5>CAE (Crédito con Aval del Estado)</h5>
                    <p>Crédito para financiar tu carrera universitaria</p>
                  </div>
                </div>
              </label>
            </div>

            <!-- Becas del Estado -->
            <div class="option-card" :class="{ 'selected': formData.usaBecasEstado }">
              <label class="option-label">
                <input
                  v-model="formData.usaBecasEstado"
                  type="checkbox"
                  @change="handleFinancingChange"
                  class="option-checkbox"
                />
                <div class="option-content">
                  <div class="option-icon">
                    <CheckCircle class="w-6 h-6" />
                  </div>
                  <div class="option-text">
                    <h5>Becas del Estado</h5>
                    <p>Becas estatales.</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
          <div v-if="showFinanciamientoPaesWarning" class="financiamiento-paes-warning">
            <div class="mb-3">
              <p class="font-semibold mb-1">Becas Ministeriales:</p>
              <p class="text-sm">
                En general, se solicita que hayas obtenido un puntaje igual o superior a 510 puntos en el promedio de las pruebas obligatorias (pruebas Competencia Lectora y Competencia Matemática) en las PAES del año de admisión a la carrera.
              </p>
            </div>
            <div class="mb-3">
              <p class="font-semibold mb-1">CAE (Crédito con Aval del Estado):</p>
              <p class="text-sm">
                Un puntaje igual o superior a 485 puntos en el promedio de las pruebas obligatorias (Competencia Lectora y Competencia Matemática 1), considerando, para estos efectos, el mejor puntaje obtenido en los instrumentos de evaluación vigentes para el Proceso de Admisión 2026, que son: 1) Prueba de Acceso a la Educación Superior (PAES) Regular (rendida en diciembre 2025); 2) PAES Invierno 2025 (rendida en junio 2025); 3) PAES Regular 2024 (rendida en diciembre 2024); y 4) PAES Invierno 2024 (rendida en junio 2024).
              </p>
            </div>
            <div>
              <p class="font-semibold mb-1">Revisa el detalle oficial:</p>
              <ul class="text-sm list-disc pl-5 space-y-1">
                <li>
                  <a
                    href="https://portal.ingresa.cl/como-postular/requisitos-para-postular/"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="underline font-medium"
                  >
                    Crédito con Garantía Estatal (CAE)
                  </a>
                </li>
                <li>
                  <a
                    href="https://portal.beneficiosestudiantiles.cl/becas/becas-de-arancel"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="underline font-medium"
                  >
                    Becas de arancel
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Decil Socioeconómico (solo si selecciona alguna opción) -->
        <div v-if="showDecilSelection" class="decil-section">
          <div class="section-divider"></div>
          <h4 class="section-title">¿Cuál es el ingreso mensual?</h4>
          <p class="section-description">
            Para el cálculo debes considerar el total de ingresos de tu hogar y dividirlo por la cantidad de personas que viven en él.
          </p>

          <div class="form-field">
            <label for="decil" class="form-label">
              Rango de Ingresos *
            </label>
            <select
              id="decil"
              v-model="selectedDecil"
              class="form-select"
              :class="{ 'error': hasFieldError('decil') }"
              @change="handleDecilChange"
              @blur="validateField('decil')"
            >
              <option value="">Selecciona rango</option>
              <option
                v-for="decil in simuladorStore.decilesFromSupabase"
                :key="decil.id"
                :value="decil.decil"
              >
                {{ simuladorStore.formatearRango(decil) }}
              </option>
            </select>
            <!-- Loading state -->
            <div v-if="simuladorStore.decilesLoading" class="mt-2 text-sm text-gray-500">
              Cargando rangos de ingresos...
            </div>

            <!-- Error state -->
            <div v-else-if="simuladorStore.decilesError" class="mt-2 text-sm text-red-500">
              {{ simuladorStore.decilesError }}
            </div>

            <ValidationMessage
              v-if="hasFieldError('decil')"
              :message="getFieldErrorMessage('decil')"
              type="error"
            />
          </div>
        </div>

        <!-- Información del decil seleccionado -->
        <div v-if="selectedDecilInfo" class="decil-info-section">
          <div class="decil-card">
            <div class="decil-header">
              <div class="decil-icon">
                <TrendingUp class="w-6 h-6" />
              </div>
              <div class="decil-title">
                <h4>{{ selectedDecilInfo.decil }}° Decil</h4>
                <p>{{ selectedDecilInfo.descripcion_corta }}</p>
              </div>
            </div>

            <div class="decil-details">
              <div class="detail-item">
                <span class="detail-label">Descripción:</span>
                <span class="detail-value">{{ selectedDecilInfo.descripcion }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Rango de ingresos:</span>
                <span class="detail-value">
                  {{ simuladorStore.formatearRango(selectedDecilInfo) }}
                </span>
              </div>
            </div>
          </div>
        </div>


        <!-- Información sobre beneficios -->
        <div class="benefits-info">
          <div class="info-card">
            <Info class="w-5 h-5 text-blue-600" />
            <div class="info-content">
              <h4 class="info-title">Beneficios Disponibles</h4>
              <div class="benefits-list">
                <div class="benefit-item">
                  <CheckCircle class="w-4 h-4 text-green-600" />
                  <span>Becas internas y externas</span>
                </div>
                <div class="benefit-item">
                  <CheckCircle class="w-4 h-4 text-green-600" />
                  <span>Descuentos en arancel y matrícula</span>
                </div>
                <div class="benefit-item">
                  <CheckCircle class="w-4 h-4 text-green-600" />
                  <span>Financiamiento preferencial</span>
                </div>
                <div class="benefit-item">
                  <CheckCircle class="w-4 h-4 text-green-600" />
                  <span>Convenios especiales</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="form-info">
          <div class="info-card">
            <Shield class="w-5 h-5 text-blue-600" />
            <div class="info-content">
              <h4 class="info-title">Información Importante</h4>
              <ul class="info-list">
                <li>• Los deciles se basan en datos oficiales de Chile</li>
                <li>• Deciles más bajos tienen acceso a más beneficios</li>
                <li>• El CAE puede complementar otros beneficios</li>
                <li>• Los resultados son estimativos y pueden variar</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.socioeconomic-step {
  @apply max-w-4xl mx-auto;
}

.step-content {
  @apply space-y-8;
}

.step-info {
  @apply text-center mb-6;
}

.step-description {
  @apply text-gray-600 text-lg;
}

.financing-options {
  @apply mb-8;
}

.section-title {
  @apply text-xl font-semibold text-gray-900 mb-4;
}

.section-description {
  @apply text-gray-600 mb-4;
}

.section-divider {
  @apply border-t border-gray-200 my-6;
}

.options-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.financiamiento-paes-warning {
  @apply mt-4 p-4 rounded-lg border border-amber-300 bg-amber-50 text-amber-900;
}

.option-card {
  @apply border-2 border-gray-200 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:border-blue-300 hover:shadow-md;
}

.option-card.selected {
  @apply border-blue-500 bg-blue-50;
}

.option-label {
  @apply cursor-pointer;
}

.option-checkbox {
  @apply sr-only;
}

.option-content {
  @apply flex items-start space-x-3;
}

.option-icon {
  @apply w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600;
}

.option-card.selected .option-icon {
  @apply bg-blue-500 text-white;
}

.option-text h5 {
  @apply font-semibold text-gray-900 mb-1;
}

.option-text p {
  @apply text-sm text-gray-600;
}

.decil-section {
  @apply mt-8;
}

.form {
  @apply space-y-6;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.form-field {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

.form-select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.form-select.error {
  @apply border-red-500 focus:ring-red-500 focus:border-red-500;
}

.switch-container {
  @apply flex items-center space-x-3;
}

.switch {
  @apply relative inline-block w-12 h-6;
}

.switch input {
  @apply opacity-0 w-0 h-0;
}

.slider {
  @apply absolute cursor-pointer top-0 left-0 right-0 bottom-0 bg-gray-300 rounded-full transition-all duration-300;
}

.slider:before {
  @apply absolute content-[''] h-5 w-5 left-0.5 bottom-0.5 bg-white rounded-full transition-all duration-300;
}

input:checked + .slider {
  @apply bg-blue-600;
}

input:checked + .slider:before {
  @apply transform translate-x-6;
}

.switch-label {
  @apply text-sm font-medium text-gray-700;
}

.field-help {
  @apply text-xs text-gray-500;
}

.decil-info-section {
  @apply mt-8;
}

.additional-info-section {
  @apply mt-8 p-6 bg-gradient-to-r from-slate-50 to-gray-100 border border-slate-200 rounded-lg;
}

.section-title {
  @apply text-lg font-semibold text-slate-900 mb-2;
}

.section-description {
  @apply text-sm text-slate-600 mb-6;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.decil-card {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6;
}

.decil-header {
  @apply flex items-center space-x-4 mb-4;
}

.decil-icon {
  @apply w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center;
}

.decil-title h4 {
  @apply text-xl font-bold text-gray-900;
}

.decil-title p {
  @apply text-sm text-gray-600;
}

.decil-details {
  @apply space-y-2;
}

.detail-item {
  @apply flex justify-between items-center py-2 border-b border-blue-100 last:border-b-0;
}

.detail-label {
  @apply text-sm font-medium text-gray-700;
}

.detail-value {
  @apply text-sm text-gray-900 font-medium;
}

.benefits-info {
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

.benefits-list {
  @apply space-y-2;
}

.benefit-item {
  @apply flex items-center space-x-2 text-sm text-blue-800;
}

.form-info {
  @apply mt-8;
}

.info-list {
  @apply space-y-1 text-sm text-blue-800;
}

/* Animaciones */
.decil-card {
  @apply transform transition-all duration-300;
}

.decil-card:hover {
  @apply scale-105 shadow-lg;
}

.switch {
  @apply transform transition-all duration-200;
}

.switch:hover {
  @apply scale-105;
}

/* Responsive */
@media (max-width: 768px) {
  .form-grid {
    @apply grid-cols-1;
  }

  .decil-header {
    @apply flex-col text-center space-x-0 space-y-3;
  }

  .detail-item {
    @apply flex-col items-start space-y-1;
  }

  .switch-container {
    @apply flex-col items-start space-x-0 space-y-2;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .step-title {
    @apply text-white;
  }

  .step-description {
    @apply text-gray-300;
  }

  .form-label {
    @apply text-gray-300;
  }

  .form-select {
    @apply bg-gray-800 border-gray-600 text-white;
  }

  .switch-label {
    @apply text-gray-300;
  }

  .decil-card {
    @apply bg-gradient-to-r from-blue-900 to-indigo-900 border-blue-700;
  }

  .decil-title h4 {
    @apply text-white;
  }

  .decil-title p {
    @apply text-gray-300;
  }

  .detail-label {
    @apply text-gray-300;
  }

  .detail-value {
    @apply text-white;
  }

  .info-card {
    @apply bg-blue-900 border-blue-700;
  }

  .info-title {
    @apply text-blue-200;
  }

  .benefit-item {
    @apply text-blue-300;
  }

  .info-list {
    @apply text-blue-300;
  }
}
</style>
