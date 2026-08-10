<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Input } from '@/components/ui/input'
import ValidationMessage from '@/components/ui/validation-message.vue'
import {
  Calculator,
  BookOpen,
  FlaskConical,
  Globe,
  TrendingUp,
  Info,
  Shield,
  CheckCircle
} from 'lucide-vue-next'
import { useFormValidation } from '@/composables/useFormValidation'
import { useCarreras } from '@/composables/useCarreras'
import type { FormData } from '@/types/simulador'
import { calculatePAESTotal as calculatePAESTotalUtil } from '@/utils/calculations'

// Props
interface Props {
  formData: FormData
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:form-data': [data: Partial<FormData>]
  validate: [step: number, isValid: boolean]
}>()

// Estado local
const formData = ref<FormData>({ ...props.formData })

// Composable de carreras
const {
  carrerasVigentes,
  loading: carrerasLoading,
  error: carrerasError
} = useCarreras()

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
const paesTotal = computed(() => {
  if (!formData.value.rendioPAES || !formData.value.paes) return 0
  return calculatePAESTotalUtil(formData.value.paes)
})

const paesPromedio = computed(() => {
  if (paesTotal.value === 0) return 0
  const pruebasRendidas = Object.values(formData.value.paes).filter(p => typeof p === 'number' && p > 0).length
  return pruebasRendidas > 0 ? Math.round(paesTotal.value / pruebasRendidas) : 0
})

const pruebasRendidas = computed(() => {
  if (!formData.value.rendioPAES || !formData.value.paes) return 0
  return Object.values(formData.value.paes).filter(p => typeof p === 'number' && p > 0).length
})

const isStepValid = computed(() => {
  // El paso es siempre válido (PAES es opcional)
  return true
})

// Computed para manejar values null en inputs numéricos
const lenguajeValue = computed({
  get: () => formData.value.paes.lenguaje ?? '',
  set: (value: string | number) => {
    formData.value.paes.lenguaje = value === '' ? null : Number(value)
  }
})

const matematicaValue = computed({
  get: () => formData.value.paes.matematica ?? '',
  set: (value: string | number) => {
    formData.value.paes.matematica = value === '' ? null : Number(value)
  }
})

const terceraAsignaturaValue = computed({
  get: () => {
    if (!formData.value.paes.terceraAsignatura) return ''
    return formData.value.paes[formData.value.paes.terceraAsignatura] ?? ''
  },
  set: (value: string | number) => {
    if (!formData.value.paes.terceraAsignatura) return
    formData.value.paes[formData.value.paes.terceraAsignatura] = value === '' ? null : Number(value)
  }
})

// Computed para lógica dinámica de PAES según área de carrera
const areaCarrera = computed(() => {
  if (!formData.value.carrera) return null
  const carrera = carrerasVigentes.value.find(c => c.nombre_carrera === formData.value.carrera)
  return carrera?.area_actual || null
})

// Determinar las asignaturas PAES recomendadas según el área
const asignaturasRecomendadas = computed(() => {
  const area = areaCarrera.value
  switch (area) {
    case 'TECNOLOGÍA':
      return {
        opciones: [
          { value: 'matematica2', label: 'Matemática 2', descripcion: 'Para carreras tecnológicas e ingenierías' },
          { value: 'ciencias', label: 'Ciencias', descripcion: 'Para carreras científicas y de salud' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Tecnología)'
      }
    case 'CIENCIAS SOCIALES':
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para carreras sociales y políticas' },
          { value: 'ciencias', label: 'Ciencias', descripcion: 'Para carreras de salud y ciencias sociales' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Ciencias Sociales)'
      }
    case 'ADMINISTRACIÓN Y COMERCIO':
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para carreras de administración y comercio' },
          { value: 'ciencias', label: 'Ciencias', descripcion: 'Para carreras de economía y estadística' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Administración)'
      }
    case 'DERECHO':
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para carreras jurídicas y políticas' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Derecho)'
      }
    case 'ARTE Y ARQUITECTURA':
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para carreras artísticas y de diseño' },
          { value: 'ciencias', label: 'Ciencias', descripcion: 'Para arquitectura y diseño industrial' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Arte y Arquitectura)'
      }
    case 'HUMANIDADES':
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para carreras humanísticas y de comunicación' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Humanidades)'
      }
    default:
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para carreras sociales y humanísticas' },
          { value: 'ciencias', label: 'Ciencias', descripcion: 'Para carreras científicas y de salud' }
        ],
        titulo: 'Selecciona tu mejor puntaje'
      }
  }
})

// Métodos
const handlePAESToggle = () => {
  // Limpiar campos PAES si no rendió
  if (!formData.value.rendioPAES) {
    formData.value.paes = {
      matematica: null,
      lenguaje: null,
      ciencias: null,
      historia: null,
      matematica2: null,
      terceraAsignatura: null
    }
  }

  // Emitir datos actualizados
  emit('update:form-data', formData.value)

  // Emitir validación
  emit('validate', 4, isStepValid.value)
}


const handleSubmit = () => {
  // Validar campos PAES si los hay
  if (formData.value.rendioPAES) {
    const paesFields = ['paes.matematica', 'paes.lenguaje', 'paes.ciencias', 'paes.historia']
    paesFields.forEach(field => validateField(field))
  }

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
  }
}, { deep: true })

// Limpiar tercera asignatura cuando cambie la carrera
watch(() => formData.value.carrera, () => {
  formData.value.paes.terceraAsignatura = null
  formData.value.paes.matematica2 = null
  formData.value.paes.historia = null
  formData.value.paes.ciencias = null
})

// Lifecycle
onMounted(() => {
  // Validar paso inicial
  emit('validate', 4, isStepValid.value)
})
</script>

<template>
  <div class="paes-step p-8 animate-fade-in min-h-full bg-white">
    <div class="step-content">
      <!-- Información del paso -->
      <div class="step-info">
        <h3 class="step-title">PAES (Opcional)</h3>
        <p class="step-description">
          Agrega tus puntajes PAES si los tienes. UNIACC no exige PAES para el ingreso.
        </p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSubmit" class="form">
        <!-- Switch para rendir PAES -->
        <div class="paes-toggle">
          <div class="toggle-container">
            <label class="toggle">
              <input
                v-model="formData.rendioPAES"
                type="checkbox"
                @change="handlePAESToggle"
              />
              <span class="slider"></span>
            </label>
            <div class="toggle-content">
              <h4 class="toggle-title">
                {{ formData.rendioPAES ? 'Sí, rendí PAES' : 'No, no rendí PAES' }}
              </h4>
              <p class="toggle-description">
                {{ formData.rendioPAES
                  ? 'Completa tus puntajes PAES para obtener más beneficios'
                  : 'Puedes continuar sin PAES, UNIACC no lo exige'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Campos de PAES (solo si rendió PAES) -->
        <div v-if="formData.rendioPAES" class="paes-fields">
          <div class="paes-header">
            <h4 class="paes-title">Puntajes PAES</h4>
            <p class="paes-subtitle">
              Ingresa tus puntajes en la nueva escala (100 - 1000 puntos)
            </p>
          </div>

          <div class="paes-grid">
            <!-- Comprensión Lectora (obligatoria para todas) -->
            <div class="paes-field">
              <label for="lenguaje" class="paes-label">
                <BookOpen class="w-5 h-5" />
                Comprensión Lectora
              </label>
              <Input
                id="lenguaje"
                v-model="lenguajeValue"
                type="number"
                min="100"
                max="1000"
                placeholder="800"
                :class="{ 'error': hasFieldError('paes.lenguaje') }"
                @blur="validateField('paes.lenguaje')"
              />
              <ValidationMessage
                v-if="hasFieldError('paes.lenguaje')"
                :message="getFieldErrorMessage('paes.lenguaje')"
                type="error"
              />
            </div>

            <!-- Matemática 1 (obligatoria para todas) -->
            <div class="paes-field">
              <label for="matematica" class="paes-label">
                <Calculator class="w-5 h-5" />
                Matemática 1
              </label>
              <Input
                id="matematica"
                v-model="matematicaValue"
                type="number"
                min="100"
                max="1000"
                placeholder="750"
                :class="{ 'error': hasFieldError('paes.matematica') }"
                @blur="validateField('paes.matematica')"
              />
              <ValidationMessage
                v-if="hasFieldError('paes.matematica')"
                :message="getFieldErrorMessage('paes.matematica')"
                type="error"
              />
            </div>

            <!-- Tercera asignatura según área de la carrera -->
            <div v-if="areaCarrera" class="paes-field paes-field-full">
              <label class="paes-label mb-3">{{ asignaturasRecomendadas.titulo }}:</label>
              <div class="space-y-3">
                <label
                  v-for="opcion in asignaturasRecomendadas.opciones"
                  :key="opcion.value"
                  class="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    v-model="formData.paes.terceraAsignatura"
                    type="radio"
                    :value="opcion.value"
                    class="w-4 h-4 text-uniacc-blue border-gray-300 focus:ring-uniacc-blue mt-1"
                  />
                  <div class="flex-1">
                    <span class="text-sm font-medium text-gray-900">{{ opcion.label }}</span>
                    <p class="text-xs text-gray-500 mt-1">{{ opcion.descripcion }}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- Mensaje cuando no hay carrera seleccionada -->
            <!-- <div v-else class="paes-field paes-field-full">
              <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p class="text-sm text-yellow-800">
                  <strong>Selecciona una carrera</strong> para ver las asignaturas PAES recomendadas según tu área de estudio.
                </p>
              </div>
            </div> -->

            <!-- Campo dinámico para la tercera asignatura -->
            <div v-if="formData.paes.terceraAsignatura" class="paes-field">
              <label class="paes-label">
                <component
                  :is="formData.paes.terceraAsignatura === 'matematica2' ? Calculator :
                        formData.paes.terceraAsignatura === 'historia' ? Globe : FlaskConical"
                  class="w-5 h-5"
                />
                {{ formData.paes.terceraAsignatura === 'matematica2' ? 'Matemática 2' :
                    formData.paes.terceraAsignatura === 'historia' ? 'Historia y CCSS' : 'Ciencias' }}
              </label>
              <Input
                v-model="terceraAsignaturaValue"
                type="number"
                min="100"
                max="1000"
                :placeholder="`${formData.paes.terceraAsignatura === 'matematica2' ? '680' : '600'}`"
                :class="{ 'error': hasFieldError(`paes.${formData.paes.terceraAsignatura}`) }"
                @blur="validateField(`paes.${formData.paes.terceraAsignatura}`)"
              />
              <ValidationMessage
                v-if="hasFieldError(`paes.${formData.paes.terceraAsignatura}`)"
                :message="getFieldErrorMessage(`paes.${formData.paes.terceraAsignatura}`)"
                type="error"
              />
            </div>

            <!-- Indicador del área de carrera -->
            <div v-if="areaCarrera" class="paes-field paes-field-full">
              <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-center space-x-2">
                  <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span class="text-sm font-medium text-blue-900">
                    Área: {{ areaCarrera }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Resumen de PAES -->
          <div v-if="paesTotal > 0" class="paes-summary">
            <div class="summary-card">
              <div class="summary-header">
                <TrendingUp class="w-6 h-6 text-green-600" />
                <h4 class="summary-title">Resumen PAES</h4>
              </div>
              <div class="summary-content">
                <div class="summary-item">
                  <span class="summary-label">Puntaje Total:</span>
                  <span class="summary-value">{{ paesTotal }} puntos</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Promedio:</span>
                  <span class="summary-value">{{ paesPromedio }} puntos</span>
                </div>
                <!-- <div class="summary-item">
                  <span class="summary-label">Pruebas Rendidas:</span>
                  <span class="summary-value">{{ pruebasRendidas }}/4</span>
                </div> -->
              </div>
            </div>
          </div>
        </div>

        <!-- Información sobre PAES -->
        <div class="paes-info">
          <div class="info-card">
            <Info class="w-5 h-5 text-blue-600" />
            <div class="info-content">
              <h4 class="info-title">Información sobre PAES</h4>
              <ul class="info-list">
                <li>• UNIACC <strong>NO exige PAES</strong> para el ingreso</li>
                <li>• Los puntajes PAES pueden darte acceso a beneficios adicionales</li>
                <li>• La nueva escala va de 100 a 1000 puntos</li>
                <li>• Puedes rendir PAES en cualquier momento</li>
                <li>• Los beneficios se calculan con o sin PAES</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="form-info">
          <div class="info-card">
            <Shield class="w-5 h-5 text-blue-600" />
            <div class="info-content">
              <h4 class="info-title">Beneficios Disponibles</h4>
              <div class="benefits-grid">
                <div class="benefit-item">
                  <CheckCircle class="w-4 h-4 text-green-600" />
                  <span>Becas por mérito académico</span>
                </div>
                <div class="benefit-item">
                  <CheckCircle class="w-4 h-4 text-green-600" />
                  <span>Descuentos por puntajes altos</span>
                </div>
                <div class="benefit-item">
                  <CheckCircle class="w-4 h-4 text-green-600" />
                  <span>Programas especiales</span>
                </div>
                <div class="benefit-item">
                  <CheckCircle class="w-4 h-4 text-green-600" />
                  <span>Convenios con instituciones</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.paes-step {
  @apply max-w-4xl mx-auto;
}

.step-content {
  @apply space-y-8;
}

.step-info {
  @apply text-center mb-8;
}

.step-title {
  @apply text-xl font-bold text-gray-900 mb-2;
}

.step-description {
  @apply text-gray-600;
}

.form {
  @apply space-y-6;
}

.paes-toggle {
  @apply mb-8;
}

.toggle-container {
  @apply flex items-start space-x-4 p-6 bg-gray-50 rounded-lg border border-gray-200;
}

.toggle {
  @apply relative inline-block w-12 h-6 flex-shrink-0;
}

.toggle input {
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

.toggle-content {
  @apply flex-1;
}

.toggle-title {
  @apply text-lg font-semibold text-gray-900 mb-2;
}

.toggle-description {
  @apply text-sm text-gray-600;
}

.paes-fields {
  @apply space-y-6;
}

.paes-header {
  @apply text-center mb-6;
}

.paes-title {
  @apply text-xl font-bold text-gray-900 mb-2;
}

.paes-subtitle {
  @apply text-gray-600;
}

.paes-grid {
  @apply grid grid-cols-[1fr_1fr] gap-6;
}

.paes-field {
  @apply space-y-2;
}

.paes-field-full {
  @apply col-span-2;
}

.paes-label {
  @apply flex items-center space-x-2 text-sm font-medium text-gray-700;
}

.paes-summary {
  @apply mt-6;
}

.summary-card {
  @apply bg-green-50 border border-green-200 rounded-lg p-6;
}

.summary-header {
  @apply flex items-center space-x-2 mb-4;
}

.summary-title {
  @apply text-lg font-semibold text-green-900;
}

.summary-content {
  @apply space-y-2;
}

.summary-item {
  @apply flex justify-between items-center py-2 border-b border-green-100 last:border-b-0;
}

.summary-label {
  @apply text-sm font-medium text-green-800;
}

.summary-value {
  @apply text-sm font-bold text-green-900;
}

.paes-info {
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

.form-info {
  @apply mt-8;
}

.benefits-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-3;
}

.benefit-item {
  @apply flex items-center space-x-2 text-sm text-blue-800;
}

/* Animaciones */
.toggle-container {
  @apply transform transition-all duration-300;
}

.toggle-container:hover {
  @apply scale-105;
}

.summary-card {
  @apply transform transition-all duration-300;
}

.summary-card:hover {
  @apply scale-105;
}

/* Responsive */
@media (max-width: 768px) {
  .paes-grid {
    @apply grid-cols-1;
  }

  .toggle-container {
    @apply flex-col space-x-0 space-y-4;
  }

  .benefits-grid {
    @apply grid-cols-1;
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

  .toggle-container {
    @apply bg-gray-800 border-gray-700;
  }

  .toggle-title {
    @apply text-white;
  }

  .toggle-description {
    @apply text-gray-300;
  }

  .paes-title {
    @apply text-white;
  }

  .paes-subtitle {
    @apply text-gray-300;
  }

  .paes-label {
    @apply text-gray-300;
  }

  .summary-card {
    @apply bg-green-900 border-green-700;
  }

  .summary-title {
    @apply text-green-200;
  }

  .summary-label {
    @apply text-green-300;
  }

  .summary-value {
    @apply text-green-200;
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

  .benefit-item {
    @apply text-blue-300;
  }
}
</style>
