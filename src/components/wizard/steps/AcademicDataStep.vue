<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Input } from '@/components/ui/input'
import ValidationMessage from '@/components/ui/validation-message.vue'
import RegionDropdown from '@/components/ui/dropdown/RegionDropdown.vue'
import ComunaDropdown from '@/components/ui/dropdown/ComunaDropdown.vue'
import ColegioDropdown from '@/components/ui/dropdown/ColegioDropdown.vue'
import { Info, School } from 'lucide-vue-next'
import { useFormValidation } from '@/composables/useFormValidation'
import { useColegios, type Region, type Comuna, type Colegio } from '@/composables/useColegios'
import type { FormData, ColegioInfo } from '@/types/simulador'

// Props
interface Props {
  formData: FormData
  colegios: ColegioInfo[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:form-data': [data: Partial<FormData>]
  validate: [step: number, isValid: boolean]
}>()

// Estado local
const formData = ref<FormData>({ ...props.formData })

// Composable de colegios
const {
  regiones,
  comunasFiltradas,
  colegiosFiltrados,
  regionSeleccionada,
  comunaSeleccionada,
  colegioSeleccionado,
  loading: colegiosLoading,
  error: colegiosError,
  seleccionarRegion,
  seleccionarComuna,
  seleccionarColegio,
  buscarColegios,
  inicializar: inicializarColegios
} = useColegios()

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
const isEgresado = computed(() => formData.value.nivelEducativo === 'Egresado')

// Computed para manejar valores null en inputs numéricos
const nemValue = computed({
  get: () => formData.value.nem ?? '',
  set: (value: string | number) => {
    formData.value.nem = value === '' ? null : Number(value)
  }
})

const rankingValue = computed({
  get: () => formData.value.ranking ?? '',
  set: (value: string | number) => {
    formData.value.ranking = value === '' ? null : Number(value)
  }
})

const añosEgreso = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= 2000; year--) {
    years.push(year)
  }
  return years
})

// Métodos para manejar selección de colegios
const handleRegionChange = async (region: Region | null) => {
  if (region) {
    await seleccionarRegion(region)
    // Limpiar selecciones dependientes
    formData.value.colegio = ''
  }
}

const handleComunaChange = async (comuna: Comuna | null) => {
  if (comuna) {
    await seleccionarComuna(comuna)
    // Limpiar selección de colegio
    formData.value.colegio = ''
  }
}

const handleColegioChange = (colegio: Colegio | null) => {
  if (colegio) {
    seleccionarColegio(colegio)
    formData.value.colegio = colegio.nombre
  }
}

const handleColegioSearch = async (term: string) => {
  if (comunaSeleccionada.value && term.length >= 2) {
    await buscarColegios(comunaSeleccionada.value.comuna_id, term)
  }
}

const isStepValid = computed(() => {
  const baseValid = !!(
    formData.value.nivelEducativo &&
    formData.value.carrera
  )

  // Solo requiere colegio si está seleccionado
  const colegioValid = !colegioSeleccionado.value || !!formData.value.colegio

  if (isEgresado.value) {
    return baseValid && colegioValid && !!(
      formData.value.nem &&
      formData.value.ranking &&
      formData.value.añoEgreso
    )
  }

  return baseValid && colegioValid
})

// Métodos
const handleNivelEducativoChange = () => {
  // Limpiar campos de egresado si no es egresado
  if (!isEgresado.value) {
    formData.value.nem = null
    formData.value.ranking = null
    formData.value.añoEgreso = ''
  }

  // Validar paso
  emit('validate', 2, isStepValid.value)
}


const handleSubmit = () => {
  // Validar campos base
  const baseFields = ['nivelEducativo', 'colegio', 'carrera']
  baseFields.forEach(field => validateField(field))

  // Validar campos de egresado si aplica
  if (isEgresado.value) {
    const egresadoFields = ['nem', 'ranking', 'añoEgreso']
    egresadoFields.forEach(field => validateField(field))
  }

  // Emitir datos actualizados
  emit('update:form-data', formData.value)

  // Emitir validación
  emit('validate', 2, isStepValid.value)
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
    emit('validate', 2, isStepValid.value)
  }, 100) // Debounce de 100ms
}, { deep: true })

watch(() => props.formData, (newData) => {
  // Solo actualizar si hay diferencias reales
  const hasChanges = Object.keys(newData).some(key =>
    (formData.value as unknown as Record<string, unknown>)[key] !== (newData as unknown as Record<string, unknown>)[key]
  )

  if (hasChanges) {
    formData.value = { ...newData }
  }
}, { deep: true })


// Lifecycle
onMounted(async () => {
  // Inicializar datos de colegios
  await inicializarColegios()

  // Validar paso inicial
  emit('validate', 2, isStepValid.value)
})

onUnmounted(() => {
  // Cleanup si es necesario
})
</script>

<template>
  <div class="academic-data-step p-8 animate-fade-in min-h-full bg-white">
    <div class="step-content">
      <!-- Información del paso -->
      <div class="step-info">
        <h3 class="step-title">Información Académica</h3>
        <p class="step-description">
          Cuéntanos sobre tu situación académica para calcular los beneficios aplicables
        </p>
      </div>

      <!-- Formulario -->
      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-grid">
          <!-- Nivel Educativo -->
          <div class="form-field">
            <label for="nivelEducativo" class="form-label">
              Nivel Educativo *
            </label>
            <select
              id="nivelEducativo"
              v-model="formData.nivelEducativo"
              class="form-select"
              :class="{ 'error': hasFieldError('nivelEducativo') }"
              @change="handleNivelEducativoChange"
              @blur="validateField('nivelEducativo')"
            >
              <option value="">Selecciona tu nivel educativo</option>
              <option value="1ro Medio">1° Medio</option>
              <option value="2do Medio">2° Medio</option>
              <option value="3ro Medio">3° Medio</option>
              <option value="4to Medio">4° Medio</option>
              <option value="Egresado">Egresado</option>
            </select>
            <ValidationMessage
              v-if="hasFieldError('nivelEducativo')"
              :message="getFieldErrorMessage('nivelEducativo')"
              type="error"
            />
          </div>

          <!-- Selección de Colegio (Estilo UGM) -->
          <div class="form-field">
            <label class="form-label">
              ¿Ingresa la información de tu colegio?
            </label>

            <!-- Región -->
            <div v-if="!regionSeleccionada" class="mb-4">
              <RegionDropdown
                v-model="regionSeleccionada"
                :regions="regiones"
                :disabled="colegiosLoading"
                :error="colegiosError || undefined"
                placeholder="Selecciona Región"
                @change="handleRegionChange"
              />
            </div>

            <!-- Comuna -->
            <div v-if="regionSeleccionada && !comunaSeleccionada" class="mb-4">
              <ComunaDropdown
                v-model="comunaSeleccionada"
                :comunas="comunasFiltradas"
                :disabled="colegiosLoading"
                placeholder="Selecciona Comuna"
                @change="handleComunaChange"
              />
            </div>

            <!-- Colegio -->
            <div v-if="comunaSeleccionada && !colegioSeleccionado">
              <ColegioDropdown
                v-model="colegioSeleccionado"
                :colegios="colegiosFiltrados"
                :disabled="colegiosLoading"
                placeholder="Selecciona Colegio"
                @change="handleColegioChange"
                @search="handleColegioSearch"
              />
            </div>

            <!-- Resumen de selección -->
            <div v-if="colegioSeleccionado" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center space-x-2 text-green-800">
                <School class="w-5 h-5" />
                <span class="font-medium">{{ colegioSeleccionado.nombre }}</span>
              </div>
              <div class="text-sm text-green-600 mt-1">
                {{ comunaSeleccionada?.comuna_nombre }}, {{ regionSeleccionada?.region_nombre }}
              </div>
            </div>

            <ValidationMessage
              v-if="hasFieldError('colegio')"
              :message="getFieldErrorMessage('colegio')"
              type="error"
            />
          </div>

          <!-- Carrera -->
          <div class="form-field">
            <label for="carrera" class="form-label">
              Carrera de Interés *
            </label>
            <select
              id="carrera"
              v-model="formData.carrera"
              class="form-select"
              :class="{ 'error': hasFieldError('carrera') }"
              @blur="validateField('carrera')"
            >
              <option value="">Selecciona una carrera</option>
              <option value="Ingeniería Comercial">Ingeniería Comercial</option>
              <option value="Ingeniería en Informática">Ingeniería en Informática</option>
              <option value="Psicología">Psicología</option>
              <option value="Derecho">Derecho</option>
              <option value="Arquitectura">Arquitectura</option>
              <option value="Periodismo">Periodismo</option>
              <option value="Publicidad">Publicidad</option>
              <option value="Diseño Gráfico">Diseño Gráfico</option>
              <option value="Ingeniería en Construcción">Ingeniería en Construcción</option>
              <option value="Trabajo Social">Trabajo Social</option>
            </select>
            <ValidationMessage
              v-if="hasFieldError('carrera')"
              :message="getFieldErrorMessage('carrera')"
              type="error"
            />
          </div>
        </div>

        <!-- Campos condicionales para egresados -->
        <div v-if="isEgresado" class="egresado-section">
          <div class="section-header">
            <h4 class="section-title">Datos de Egreso</h4>
            <p class="section-description">
              Como egresado, necesitamos algunos datos adicionales para calcular tus beneficios
            </p>
          </div>

          <div class="form-grid">
            <!-- NEM -->
            <div class="form-field">
              <label for="nem" class="form-label">
                NEM (Notas de Enseñanza Media) *
              </label>
              <Input
                id="nem"
                v-model="nemValue"
                type="number"
                step="0.01"
                min="1.0"
                max="7.0"
                placeholder="5.5"
                :class="{ 'error': hasFieldError('nem') }"
                @blur="validateField('nem')"
              />
              <p class="field-help">Promedio de notas de 1° a 4° Medio (1.0 - 7.0)</p>
              <ValidationMessage
                v-if="hasFieldError('nem')"
                :message="getFieldErrorMessage('nem')"
                type="error"
              />
            </div>

            <!-- Ranking -->
            <div class="form-field">
              <label for="ranking" class="form-label">
                Ranking de Notas *
              </label>
              <Input
                id="ranking"
                v-model="rankingValue"
                type="number"
                step="1"
                min="0"
                max="1000"
                placeholder="750"
                :class="{ 'error': hasFieldError('ranking') }"
                @blur="validateField('ranking')"
              />
              <p class="field-help">Posición relativa en tu generación (0 - 1000)</p>
              <ValidationMessage
                v-if="hasFieldError('ranking')"
                :message="getFieldErrorMessage('ranking')"
                type="error"
              />
            </div>

            <!-- Año de Egreso -->
            <div class="form-field">
              <label for="añoEgreso" class="form-label">
                Año de Egreso *
              </label>
              <select
                id="añoEgreso"
                v-model="formData.añoEgreso"
                class="form-select"
                :class="{ 'error': hasFieldError('añoEgreso') }"
                @blur="validateField('añoEgreso')"
              >
                <option value="">Selecciona el año</option>
                <option
                  v-for="año in añosEgreso"
                  :key="año"
                  :value="año.toString()"
                >
                  {{ año }}
                </option>
              </select>
              <ValidationMessage
                v-if="hasFieldError('añoEgreso')"
                :message="getFieldErrorMessage('añoEgreso')"
                type="error"
              />
            </div>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="form-info">
          <div class="info-card">
            <Info class="w-5 h-5 text-blue-600" />
            <div class="info-content">
              <h4 class="info-title">Información Importante</h4>
              <ul class="info-list">
                <li v-if="!isEgresado">
                  • Si estás en 1° a 4° Medio, no necesitas NEM ni Ranking
                </li>
                <li v-else>
                  • El NEM y Ranking son importantes para calcular becas académicas
                </li>
                <li>• Puedes buscar tu colegio escribiendo el nombre</li>
                <li>• La carrera seleccionada afecta los beneficios disponibles</li>
              </ul>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.academic-data-step {
  @apply max-w-4xl mx-auto;
}

.step-content {
  @apply space-y-8;
}

.step-info {
  @apply text-center mb-8;
}

.step-title {
  @apply text-2xl font-bold text-gray-900 mb-2;
}

.step-description {
  @apply text-gray-600;
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

.search-container {
  @apply relative;
}

.search-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
}

.dropdown {
  @apply absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto;
}

.dropdown-item {
  @apply px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0;
}

.colegio-info {
  @apply space-y-1;
}

.colegio-nombre {
  @apply text-sm font-medium text-gray-900;
}

.colegio-details {
  @apply text-xs text-gray-500;
}

.egresado-section {
  @apply mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg;
}

.section-header {
  @apply mb-6;
}

.section-title {
  @apply text-lg font-semibold text-blue-900 mb-2;
}

.section-description {
  @apply text-sm text-blue-800;
}

.field-help {
  @apply text-xs text-gray-500;
}

.form-info {
  @apply mt-8;
}

.info-card {
  @apply bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3;
}

.info-content {
  @apply flex-1;
}

.info-title {
  @apply text-sm font-semibold text-blue-900 mb-2;
}

.info-list {
  @apply space-y-1 text-sm text-blue-800;
}

/* Responsive */
@media (max-width: 768px) {
  .form-grid {
    @apply grid-cols-1;
  }

  .egresado-section {
    @apply p-4;
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

  .form-select,
  .search-input {
    @apply bg-gray-800 border-gray-600 text-white;
  }

  .dropdown {
    @apply bg-gray-800 border-gray-600;
  }

  .dropdown-item {
    @apply hover:bg-gray-700 border-gray-600;
  }

  .colegio-nombre {
    @apply text-white;
  }

  .colegio-details {
    @apply text-gray-400;
  }

  .egresado-section {
    @apply bg-blue-900 border-blue-700;
  }

  .section-title {
    @apply text-blue-200;
  }

  .section-description {
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
}
</style>
