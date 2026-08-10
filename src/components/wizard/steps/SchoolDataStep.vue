<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Input } from '@/components/ui/input'
import ValidationMessage from '@/components/ui/validation-message.vue'
import SchoolSelectionModal from '@/components/modals/SchoolSelectionModal.vue'
import { School } from 'lucide-vue-next'
import { useFormValidation } from '@/composables/useFormValidation'
import { useColegios, type Region, type Comuna, type Colegio } from '@/composables/useColegios'
import type { FormData } from '@/types/simulador'

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
const formData = ref<FormData>({
  ...props.formData,
  nivelEducativo: '' // Asegurar que no tenga valor por defecto
})

// Estado del modal
const isSchoolModalOpen = ref(false)

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

// Métodos del modal
const openSchoolModal = () => {
  isSchoolModalOpen.value = true
}

const closeSchoolModal = () => {
  isSchoolModalOpen.value = false
}

const handleSchoolSelectionComplete = (region: Region, comuna: Comuna, colegio: Colegio) => {
  console.log('Colegio seleccionado:', colegio)
  regionSeleccionada.value = region
  comunaSeleccionada.value = comuna
  colegioSeleccionado.value = colegio
  formData.value.colegio = colegio.nombre
  formData.value.regionResidencia = colegio.region_nombre
  formData.value.comunaResidencia = colegio.comuna_nombre
  console.log('FormData actualizado:', formData.value)
  isSchoolModalOpen.value = false
}

const isStepValid = computed(() => {
  const baseValid = !!(
    formData.value.nivelEducativo &&
    formData.value.colegio
  )

  console.log('SchoolDataStep validation:', {
    nivelEducativo: formData.value.nivelEducativo,
    colegio: formData.value.colegio,
    isValid: baseValid
  })

  return baseValid
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
  const baseFields = ['nivelEducativo', 'colegio']
  baseFields.forEach(field => validateField(field))

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
  <div class="school-data-step p-8 animate-fade-in min-h-full bg-white">
    <div class="step-content">
      <div class="step-header">
        <h2 class="step-title">Estado Académico</h2>
        <p class="step-subtitle">
          Cuéntanos sobre tu estado académico actual
        </p>
      </div>

      <div class="step-body">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Nivel Educativo -->
          <div class="form-field">
            <label for="nivelEducativo" class="form-label">
              ¿En qué estado te encuentras? *
            </label>
            <p class="text-sm text-gray-600 mb-4">
              Corresponde al año que estás cursando actualmente o si eres egresado de años o procesos anteriores.
            </p>

            <select
              id="nivelEducativo"
              v-model="formData.nivelEducativo"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uniacc-blue focus:border-uniacc-blue text-gray-900"
              @change="handleNivelEducativoChange"
            >
              <option value="">Selecciona tu curso</option>
              <option value="1ro Medio">1ro Medio</option>
              <option value="2do Medio">2do Medio</option>
              <option value="3ro Medio">3ro Medio</option>
              <option value="4to Medio">4to Medio</option>
              <option value="Egresado">Egresado</option>
            </select>

            <ValidationMessage
              v-if="hasFieldError('nivelEducativo')"
              :message="getFieldErrorMessage('nivelEducativo')"
              type="error"
            />
          </div>

          <!-- Selección de Colegio -->
          <div class="form-field">
            <label class="form-label">
              ¿Ingresa la información de tu colegio?
            </label>

            <!-- Botón para abrir modal -->
            <button
              type="button"
              @click="openSchoolModal"
              :class="[
                'w-full p-4 border-2 border-dashed rounded-lg transition-all duration-200',
                'hover:border-uniacc-blue hover:bg-uniacc-blue/5',
                'focus:outline-none focus:ring-2 focus:ring-uniacc-blue focus:border-uniacc-blue',
                colegioSeleccionado
                  ? 'border-green-300 bg-green-50'
                  : 'border-gray-300 bg-gray-50'
              ]"
            >
              <div class="flex items-center justify-center space-x-3">
                <School class="w-6 h-6 text-gray-400" />
                <div class="text-center">
                  <div v-if="colegioSeleccionado" class="text-green-800 font-medium">
                    {{ colegioSeleccionado.nombre }}
                  </div>
                  <div v-else class="text-gray-600">
                    Toca para seleccionar tu colegio
                  </div>
                  <div v-if="colegioSeleccionado" class="text-sm text-green-600 mt-1">
                    {{ comunaSeleccionada?.comuna_nombre }}, {{ regionSeleccionada?.region_nombre }}
                  </div>
                </div>
              </div>
            </button>

            <ValidationMessage
              v-if="hasFieldError('colegio')"
              :message="getFieldErrorMessage('colegio')"
              type="error"
            />
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de selección de colegio -->
    <SchoolSelectionModal
      :is-open="isSchoolModalOpen"
      :selected-region="regionSeleccionada"
      :selected-comuna="comunaSeleccionada"
      :selected-colegio="colegioSeleccionado"
      @update:is-open="isSchoolModalOpen = $event"
      @complete="handleSchoolSelectionComplete"
    />
  </div>
</template>

<style scoped>
.school-data-step {
  @apply h-full flex flex-col;
}

.step-content {
  @apply flex-1 flex flex-col;
}

.step-header {
  @apply mb-6 sm:mb-8;
}

.step-title {
  @apply text-xl sm:text-2xl font-bold text-gray-900 mb-2;
}

.step-subtitle {
  @apply text-sm sm:text-base text-gray-600;
}

.step-body {
  @apply flex-1;
}

.form-field {
  @apply space-y-2 sm:space-y-3;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}

/* Responsive spacing */
@media (max-width: 640px) {
  .step-body {
    @apply px-4;
  }

  .form-field {
    @apply space-y-3;
  }
}

/* Mejorar el select para móviles */
select {
  @apply appearance-none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right 0.5rem center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  padding-right: 2.5rem;
}

/* Mejorar el resumen de selección para móviles */
@media (max-width: 640px) {
  .resumen-seleccion {
    @apply p-3;
  }
}
</style>
