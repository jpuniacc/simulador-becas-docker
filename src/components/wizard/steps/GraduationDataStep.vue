<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Input } from '@/components/ui/input'
import ValidationMessage from '@/components/ui/validation-message.vue'
import { Info, GraduationCap } from 'lucide-vue-next'
import { useFormValidation } from '@/composables/useFormValidation'
import { useCarreras, type Carrera } from '@/composables/useCarreras'
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
const formData = ref<FormData>({ ...props.formData })

// Composable de carreras
const {
  carrerasVigentes,
  loading: carrerasLoading,
  error: carrerasError,
  inicializar: inicializarCarreras,
  buscarCarreras
} = useCarreras()

// Estado para el dropdown de carreras
const carreraSeleccionada = ref<Carrera | null>(null)
const searchTerm = ref('')
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

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

// Computed para manejar values null en inputs numéricos
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

// Determinar las asignaturas PAES recomendadas según el área
const asignaturasRecomendadas = computed(() => {
  const area = 'TECNOLOGÍA'

  switch (area) {
    case 'TECNOLOGÍA':
      return {
        opciones: [
          { value: 'matematica2', label: 'Matemática 2', descripcion: 'Para carreras de ingeniería e informática' },
          { value: 'ciencias', label: 'Ciencias', descripcion: 'Para carreras tecnológicas y científicas' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Tecnología)'
      }

    case 'CIENCIAS SOCIALES':
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para psicología, sociología, trabajo social' },
          { value: 'ciencias', label: 'Ciencias', descripcion: 'Para carreras con enfoque científico-social' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Ciencias Sociales)'
      }

    case 'ADMINISTRACIÓN Y COMERCIO':
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para ingeniería comercial y administración' },
          { value: 'ciencias', label: 'Ciencias', descripcion: 'Para carreras de negocios con enfoque analítico' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Administración y Comercio)'
      }

    case 'DERECHO':
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para carreras jurídicas' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Derecho)'
      }

    case 'ARTE Y ARQUITECTURA':
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para arte, diseño y arquitectura' },
          { value: 'ciencias', label: 'Ciencias', descripcion: 'Para arquitectura e ingeniería en diseño' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Arte y Arquitectura)'
      }

    case 'HUMANIDADES':
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Para literatura, filosofía, educación' }
        ],
        titulo: 'Selecciona tu mejor puntaje (Humanidades)'
      }

    default:
      return {
        opciones: [
          { value: 'historia', label: 'Historia y CCSS', descripcion: 'Asignatura general' },
          { value: 'ciencias', label: 'Ciencias', descripcion: 'Asignatura general' }
        ],
        titulo: 'Selecciona tu mejor puntaje'
      }
  }
})

// Títulos dinámicos
const stepTitle = computed(() => {
  if (!formData.value.carrera) {
    return 'Selecciona tu Carrera'
  }
  return isEgresado.value ? 'Datos de Egreso' : 'Carrera de Interés'
})

const stepSubtitle = computed(() => {
  if (!formData.value.carrera) {
    return 'Para personalizar tus beneficios, necesitamos saber qué carrera te interesa'
  }
  return isEgresado.value
    ? `Para ${formData.value.carrera}, necesitamos algunos datos adicionales para calcular tus beneficios`
    : `Para ${formData.value.carrera}, cuéntanos más sobre tu perfil académico`
})

// Computed para carreras filtradas
const carrerasFiltradas = computed(() => {
  if (!searchTerm.value || !searchTerm.value.trim()) return carrerasVigentes.value
  return buscarCarreras(searchTerm.value)
})

const añosEgreso = computed(() => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear; year >= 2000; year--) {
    years.push(year)
  }
  return years
})

const isStepValid = computed(() => {
  if (!isEgresado.value) {
    // Si no es egresado, solo necesita carrera
    return !!formData.value.carrera
  }

  // Si es egresado, solo necesita carrera (NEM, ranking y año son opcionales)
  return !!formData.value.carrera
})

// Métodos
const selectCarrera = (carrera: Carrera) => {
  carreraSeleccionada.value = carrera
  formData.value.carrera = carrera.nombre_programa
  formData.value.carreraId = carrera.id
  searchTerm.value = carrera.nombre_programa
  showDropdown.value = false

  // Limpiar datos de PAES cuando cambie la carrera
  formData.value.paes.terceraAsignatura = null
  formData.value.paes.matematica2 = null
  formData.value.paes.historia = null
  formData.value.paes.ciencias = null

  // Validar paso
  emit('validate', 3, isStepValid.value)
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) {
    searchTerm.value = ''
    calculateDropdownPosition()
  }
}

const calculateDropdownPosition = () => {
  if (!dropdownRef.value) return

  const rect = dropdownRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = 384 // max-h-96 = 24rem = 384px

  // Calcular posición vertical
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top

  let top = rect.bottom + 4 // 4px de margen
  let maxHeight = dropdownHeight

  // Si no hay suficiente espacio abajo, posicionar arriba
  if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
    top = rect.top - dropdownHeight - 4
    maxHeight = Math.min(dropdownHeight, spaceAbove - 4)
  } else {
    maxHeight = Math.min(dropdownHeight, spaceBelow - 4)
  }

  dropdownStyle.value = {
    position: 'fixed',
    top: `${top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    maxHeight: `${maxHeight}px`,
    zIndex: '9999'
  }
}

const handleSearch = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchTerm.value = target.value
}

// Click outside para cerrar dropdown
const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  // No cerrar si el clic es dentro del dropdown o del botón
  if (!target.closest('.carrera-dropdown') && !target.closest('[data-dropdown-content]')) {
    showDropdown.value = false
  }
}

const handleSubmit = () => {
  // Validar campos según el nivel educativo
  if (isEgresado.value) {
    const egresadoFields = ['nem', 'ranking', 'añoEgreso']
    egresadoFields.forEach(field => validateField(field))

  } else {
    validateField('carrera')
  }

  // Emitir datos actualizados
  emit('update:form-data', formData.value)

  // Emitir validación
  emit('validate', 3, isStepValid.value)
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
    // Solo emitir si realmente hay cambios
    const hasChanges = Object.keys(newData).some(key =>
      (formData.value as unknown as Record<string, unknown>)[key] !== (props.formData as unknown as Record<string, unknown>)[key]
    )

    if (hasChanges) {
      emit('update:form-data', newData)
      emit('validate', 3, isStepValid.value)
    }
  }, 150) // Aumentar debounce a 150ms
}, { deep: true })

watch(() => props.formData, (newData) => {
  // Solo actualizar si hay diferencias reales y evitar loops
  const hasChanges = Object.keys(newData).some(key =>
    (formData.value as unknown as Record<string, unknown>)[key] !== (newData as unknown as Record<string, unknown>)[key]
  )

  if (hasChanges) {
    // Usar nextTick para evitar updates síncronos
    nextTick(() => {
      formData.value = { ...newData }
    })
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
onMounted(async () => {
  console.log('GraduationDataStep mounted, inicializando carreras...')

  // Inicializar carreras
  await inicializarCarreras()

  console.log('Carreras después de inicializar:', carrerasVigentes.value.length)
  console.log('Carreras vigentes:', carrerasVigentes.value)

  // Validar paso inicial
  emit('validate', 3, isStepValid.value)

  // Agregar event listeners
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', calculateDropdownPosition)
  window.addEventListener('scroll', calculateDropdownPosition)
})

onUnmounted(() => {
  // Remover event listeners
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', calculateDropdownPosition)
  window.removeEventListener('scroll', calculateDropdownPosition)
})
</script>

<template>
  <div class="graduation-data-step p-8 animate-fade-in min-h-full bg-white">
    <div class="step-content">
      <div class="step-header">
        <h2 class="step-title">{{ stepTitle }}</h2>
        <p class="step-subtitle">
          {{ stepSubtitle }}
        </p>
      </div>

      <div class="step-body">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Selección de Carrera (Siempre primero) -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-6">
            <div class="flex items-start space-x-3 mb-4">
              <GraduationCap class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 class="text-lg font-semibold text-green-900">Carrera de Interés</h3>
                <p class="text-sm text-green-700 mt-1">
                  Selecciona la carrera que te interesa para personalizar tus beneficios
                </p>
              </div>
            </div>

            <!-- Dropdown de carreras -->
            <div class="form-field">
              <label for="carrera" class="form-label">
                Carrera *
              </label>
              <div class="relative" ref="dropdownRef">
                <Input
                  id="carrera"
                  v-model="searchTerm"
                  type="text"
                  placeholder="Busca tu carrera..."
                  class="w-full pr-10"
                  @focus="showDropdown = true"
                  @input="handleSearch"
                  autocomplete="off"
                  autocorrect="off"
                />
                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                  <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>

                <!-- Dropdown de carreras -->
                <div
                  v-if="showDropdown"
                  class="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  :style="dropdownStyle"
                >
                  <div
                    v-for="carrera in carrerasFiltradas"
                    :key="carrera.id"
                    class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    @click="selectCarrera(carrera)"
                  >
                    <div class="font-medium text-gray-900">{{ carrera.nombre_programa }}</div>
                    <div class="text-sm text-gray-500">{{ carrera.nivel_academico }}</div>
                    <div class="text-xs text-blue-600 mt-1">{{ carrera.duracion_programa }}</div>
                  </div>
                </div>
              </div>
              <p class="text-sm text-gray-500 mt-1">
                Busca por nombre de carrera, facultad o área
              </p>
            </div>

            <!-- Indicador del área de la carrera seleccionada -->
            <!-- <div v-if="areaCarrera" class="mt-4 p-3 bg-green-100 border border-green-200 rounded-lg">
              <div class="flex items-center space-x-2">
                <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                <span class="text-sm font-medium text-green-900">
                  Área: {{ areaCarrera }}
                </span>
              </div>
            </div> -->

          </div>

          <!-- Mensaje para no egresados -->
          <div v-if="!isEgresado && formData.carrera" class="bg-green-100 border border-green-200 rounded-lg p-4">
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <span class="text-sm font-medium text-green-800">
                ¡Perfecto! Has seleccionado {{ formData.carrera }}
              </span>
            </div>
            <p class="text-sm text-green-700 mt-2">
              Continúa al siguiente paso para completar tu perfil socioeconómico.
            </p>
          </div>

          <!-- Datos de Egreso (Solo si es egresado y tiene carrera) -->
          <div v-if="isEgresado && formData.carrera" class="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-blue-900 mb-4">Datos de Egreso</h3>
            <p class="text-sm text-blue-700 mb-4">
              Para {{ formData.carrera }}, completa la información que tengas disponible. Solo la carrera es obligatoria.
            </p>

            <!-- NEM -->
            <div class="form-field">
              <label for="nem" class="form-label">
                NEM (Notas de Enseñanza Media)
              </label>
              <Input
                id="nem"
                v-model="nemValue"
                type="number"
                step="0.1"
                min="1.0"
                max="7.0"
                placeholder="Ej: 5.5"
                class="w-full"
              />
              <p class="text-sm text-gray-500 mt-1">
                Promedio de notas de 1º a 4º Medio (1.0 - 7.0) - Opcional
              </p>
              <ValidationMessage
                v-if="hasFieldError('nem')"
                :message="getFieldErrorMessage('nem')"
                type="error"
              />
            </div>

            <!-- Ranking -->
            <div class="form-field">
              <label for="ranking" class="form-label">
                Ranking de Notas
              </label>
              <Input
                id="ranking"
                v-model="rankingValue"
                type="number"
                min="0"
                max="1000"
                placeholder="Ej: 750"
                class="w-full"
              />
              <p class="text-sm text-gray-500 mt-1">
                Posición relativa en tu generación (0-1000) - Opcional
              </p>
              <ValidationMessage
                v-if="hasFieldError('ranking')"
                :message="getFieldErrorMessage('ranking')"
                type="error"
              />
            </div>

            <!-- Año de Egreso -->
            <div class="form-field">
              <label for="añoEgreso" class="form-label">
                Año de Egreso
              </label>
              <select
                id="añoEgreso"
                v-model="formData.añoEgreso"
                class="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uniacc-blue focus:border-uniacc-blue"
              >
                <option value="">Selecciona el año</option>
                <option
                  v-for="año in añosEgreso"
                  :key="año"
                  :value="año"
                >
                  {{ año }}
                </option>
              </select>
              <p class="text-sm text-gray-500 mt-1">
                Año en que egresaste de la enseñanza media - Opcional
              </p>
              <ValidationMessage
                v-if="hasFieldError('añoEgreso')"
                :message="getFieldErrorMessage('añoEgreso')"
                type="error"
              />
            </div>

            <!-- Mensaje para egresados -->
            <div class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-start space-x-3">
                <Info class="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p class="text-sm font-medium text-blue-900">
                    Como eres egresado, en el siguiente paso te pediremos:
                  </p>
                  <ul class="text-sm text-blue-800 mt-2 space-y-1">
                    <li>• NEM y Ranking (opcional)</li>
                    <li>• Año de egreso</li>
                    <li>• Puntajes PAES (si los tienes)</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.graduation-data-step {
  @apply h-full flex flex-col;
}

.step-content {
  @apply flex-1 flex flex-col;
}

.step-header {
  @apply mb-8;
}

.step-title {
  @apply text-2xl font-bold text-gray-900 mb-2;
}

.step-subtitle {
  @apply text-gray-600;
}

.step-body {
  @apply flex-1;
}

.form-field {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700;
}
</style>
