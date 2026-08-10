<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Autocomplete from 'primevue/autocomplete'
import Dropdown from 'primevue/dropdown'
import Checkbox from 'primevue/checkbox'
import { GraduationCap } from 'lucide-vue-next'
import { useCarreras, type Carrera } from '@/composables/useCarreras'
import { useInstitucionesStore, type Institucion } from '@/stores/institucionesStore'
import SelectInstitucion from '@/components/util/SelectInstitucion.vue'
import type { FormData } from '@/types/simulador'

// Props
interface Props {
  formData?: Partial<FormData>
}

const props = withDefaults(defineProps<Props>(), {
  formData: () => ({
    carreraTitulo: '',
    carreraInteres: '',
    carreraInteresId: 0
  })
})

// Emits
const emit = defineEmits<{
  'update:form-data': [data: Partial<FormData>]
  'validation-change': [isValid: boolean]
}>()

// Composable de carreras
const {
  carrerasVigentes,
  loading: carrerasLoading,
  inicializar: inicializarCarreras,
  buscarCarreras
} = useCarreras()

// Store de instituciones
const institucionesStore = useInstitucionesStore()

// Opciones para el dropdown de Origen
const origenOptions = [
  {
    label: 'Estoy trabajando actualmente',
    value: 'trabajando_actualmente'
  },
  {
    label: 'Recién titulado/a',
    value: 'recien_titulado'
  },
  {
    label: 'No estoy trabajando, pero busco especializarme',
    value: 'no_trabajando_especializarme'
  },
  {
    label: 'Trabajo en el área del programa que me interesa',
    value: 'trabajo_area_programa'
  },
  {
    label: 'Trabajo en un área distinta',
    value: 'trabajo_area_distinta'
  }
]

// Opciones de grado académico
const opcionesGradoAcademico = [
  { label: 'Sí', value: 'Sí' },
  { label: 'Estoy en proceso de obtención', value: 'Estoy en proceso de obtención' },
  { label: 'No (solo informativo)', value: 'No (solo informativo)' }
]

// Estado local del formulario
const formData = ref<Partial<FormData & { gradoAcademico: string }>>({
  origen: (props.formData as any)?.origen || '',
  carreraTitulo: props.formData?.carreraTitulo || '',
  carreraInteres: (props.formData as any)?.carreraInteres || '',
  carreraInteresId: (props.formData as any)?.carreraInteresId || 0,
  institucionId: (props.formData as any)?.institucionId || '',
  gradoAcademico: (props.formData as any)?.gradoAcademico || ''
})

// Estado para la institución seleccionada
const institucionSeleccionada = ref<Institucion | null>(null)

// Estado para el autocomplete de carreras
const carreraSeleccionada = ref<Carrera | null>(null)
const filteredCarreras = ref<Carrera[]>([])

// Estado para controlar cuándo mostrar errores
const submitted = ref(false)
const touched = ref({
  origen: false,
  carreraTitulo: false,
  institucion: false,
  carreraInteres: false,
  gradoAcademico: false
})

// Función para buscar carreras (usada por Autocomplete)
const searchCarreras = (event: { query: string }) => {
  let carreras: Carrera[] = []

  if (!event.query || !event.query.trim()) {
    carreras = carrerasVigentes.value
  } else {
    carreras = buscarCarreras(event.query)
  }

  filteredCarreras.value = carreras
}

// Función para manejar el focus del Autocomplete
const handleAutocompleteFocus = () => {
  touched.value.carreraInteres = true
  if (filteredCarreras.value.length === 0) {
    filteredCarreras.value = carrerasVigentes.value
  }
}

// Función para manejar cambio de institución
const handleInstitucionChange = (institucion: Institucion | null) => {
  institucionSeleccionada.value = institucion
  formData.value.institucionId = institucion?.id || ''
  touched.value.institucion = true
}

// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
  return !!formData.value.origen &&
    !!formData.value.carreraInteres &&
    (formData.value.carreraInteresId || 0) > 0 &&
    !!(formData.value as any).gradoAcademico
})

// Emitir cambios de validación
watch(isFormValid, (newValue) => {
  emit('validation-change', newValue)
}, { immediate: true })

// Métodos para el autocomplete de carreras
const selectCarrera = (carrera: Carrera) => {
  carreraSeleccionada.value = carrera
  formData.value.carreraInteres = carrera.nombre_programa
  formData.value.carreraInteresId = carrera.id
  touched.value.carreraInteres = true
}

// Función para marcar el formulario como submitted (cuando se intenta avanzar)
const markAsSubmitted = () => {
  submitted.value = true
  // Marcar todos los campos como touched
  Object.keys(touched.value).forEach(key => {
    touched.value[key as keyof typeof touched.value] = true
  })
}

// Exponer el estado de validación al componente padre
defineExpose({
  isFormValid,
  markAsSubmitted
})

// Flag para prevenir ciclos infinitos entre watchers
const isUpdatingFromProps = ref(false)

// Watcher para emitir cambios
watch(formData, (newData) => {
  // Solo emitir si no estamos actualizando desde props
  if (!isUpdatingFromProps.value) {
    emit('update:form-data', {
      origen: newData.origen,
      carreraTitulo: newData.carreraTitulo,
      institucionId: newData.institucionId,
      carreraInteres: newData.carreraInteres,
      carreraInteresId: newData.carreraInteresId,
      gradoAcademico: (newData as any).gradoAcademico
    } as any)
  }
}, { deep: true })

// Watcher para actualizar cuando cambien las props
watch(() => props.formData, (newData) => {
  if (newData) {
    const newDataAny = newData as any
    const hasChanges =
      formData.value.origen !== (newDataAny?.origen || '') ||
      formData.value.carreraTitulo !== (newData.carreraTitulo || '') ||
      formData.value.institucionId !== (newDataAny?.institucionId || '') ||
      formData.value.carreraInteres !== (newDataAny?.carreraInteres || '') ||
      formData.value.carreraInteresId !== (newDataAny?.carreraInteresId || 0) ||
      (formData.value as any).gradoAcademico !== (newDataAny?.gradoAcademico || '')

    if (hasChanges) {
      isUpdatingFromProps.value = true
      formData.value = {
        origen: newDataAny?.origen || '',
        carreraTitulo: newData.carreraTitulo || '',
        institucionId: newDataAny?.institucionId || '',
        carreraInteres: newDataAny?.carreraInteres || '',
        carreraInteresId: newDataAny?.carreraInteresId || 0,
        gradoAcademico: newDataAny?.gradoAcademico || ''
      }

      // Actualizar institución seleccionada si hay un institucionId válido
      if (newDataAny?.institucionId) {
        const institucion = institucionesStore.obtenerInstitucionPorId(newDataAny.institucionId)
        if (institucion) {
          institucionSeleccionada.value = institucion
        } else {
          institucionSeleccionada.value = null
        }
      } else {
        institucionSeleccionada.value = null
      }
      // Actualizar carrera seleccionada si hay un carreraInteresId válido
      if (newDataAny?.carreraInteresId && newDataAny.carreraInteresId > 0) {
        const carrera = carrerasVigentes.value.find(c => c.id === newDataAny.carreraInteresId)
        if (carrera) {
          carreraSeleccionada.value = carrera
        } else {
          carreraSeleccionada.value = null
        }
      } else {
        carreraSeleccionada.value = null
      }
      // Resetear el flag después de un pequeño delay
      setTimeout(() => {
        isUpdatingFromProps.value = false
      }, 0)
    }
  }
}, { deep: true })

// Lifecycle
onMounted(async () => {
  await inicializarCarreras(12)
  // Cargar instituciones si no están cargadas
  if (institucionesStore.instituciones.length === 0) {
    await institucionesStore.cargarInstituciones()
  }
  // Inicializar las carreras filtradas
  filteredCarreras.value = carrerasVigentes.value

  // Si hay una institución en las props, buscar y seleccionar
  const institucionId = (props.formData as any)?.institucionId
  if (institucionId) {
    const institucion = institucionesStore.obtenerInstitucionPorId(institucionId)
    if (institucion) {
      institucionSeleccionada.value = institucion
    }
  }

  // Si hay una carrera en las props, buscar y seleccionar
  const carreraInteresId = (props.formData as any)?.carreraInteresId
  if (carreraInteresId && carreraInteresId > 0) {
    const carrera = carrerasVigentes.value.find(c => c.id === carreraInteresId)
    if (carrera) {
      carreraSeleccionada.value = carrera
    }
  }
})
</script>

<template>
  <div class="magister-preferences-container">
    <div class="form-guide">
      <p class="guide-text">Queremos conocer tu formación y proyección profesional</p>
    </div>
    <form class="magister-preferences-form" @submit.prevent>
      <div class="form-grid">
        <!-- Campo Motivación Académica -->
        <div class="form-field col-span-1 md:col-span-1 div-enfasis--primary">
          <div class="flex flex-col gap-1">
            <label for="origen" class="block text-sm font-medium text-gray-700 mb-1">
              Objetivo / situación actual *
            </label>
            <p class="text-sm text-gray-600 italic mb-2">¿Cuál es tu situación profesional actual?</p>
            <Dropdown id="origen" v-model="formData.origen" :options="origenOptions" optionLabel="label"
              optionValue="value" class="w-full" placeholder="Selecciona una opción"
              :class="{ 'p-invalid': (submitted || touched.origen) && !formData.origen }"
              @change="touched.origen = true" />
            <Message v-if="(submitted || touched.origen) && !formData.origen" severity="error" variant="simple"
              size="small">
              Debes seleccionar tu motivación académica
            </Message>
          </div>
        </div>

        <!-- Campo Grado Académico -->
        <div class="form-field nivel-educativo-field col-span-1 md:col-span-1 div-enfasis--primary">
          <div class="flex flex-col gap-1">
            <label for="gradoAcademico" class="nivel-educativo-label">
              Grado Académico *
            </label>
            <p class="text-sm text-gray-600 italic mb-3">¿Tienes grado académico o título profesional?</p>
            <div class="nivel-educativo-checkboxes">
              <div
                v-for="opcion in opcionesGradoAcademico"
                :key="opcion.value"
                class="checkbox-option"
              >
                <Checkbox
                  :id="`gradoAcademico-${opcion.value}`"
                  :binary="true"
                  :modelValue="(formData as any).gradoAcademico === opcion.value"
                  @update:modelValue="(checked) => { (formData as any).gradoAcademico = checked ? opcion.value : ''; touched.gradoAcademico = true; }"
                />
                <label
                  :for="`gradoAcademico-${opcion.value}`"
                  class="checkbox-label"
                  @click="(formData as any).gradoAcademico = (formData as any).gradoAcademico === opcion.value ? '' : opcion.value; touched.gradoAcademico = true"
                >
                  {{ opcion.label }}
                </label>
              </div>
            </div>
            <Message
              v-if="(submitted || touched.gradoAcademico) && !(formData as any).gradoAcademico"
              severity="error"
              variant="simple"
              size="small"
            >
              Grado académico es requerido
            </Message>
          </div>
        </div>

        <!-- Campo Institución -->
        <div class="form-field col-span-1 md:col-span-2 div-enfasis--secondary">
          <SelectInstitucion v-model="institucionSeleccionada"
            label="Institución donde realizaste tu último estudio"
            microcopy="Si has estudiado antes, indícanos dónde. (Opcional)"
            placeholder="Busca una institución..." :required="false"
            :invalid="false"
            @change="handleInstitucionChange" />
        </div>

        <!-- Campo Carrera Título (Formación) -->
        <div class="form-field col-span-1 md:col-span-2 div-enfasis--tertiary">
          <div class="flex flex-col gap-1">
            <label for="carreraTitulo" class="block text-sm font-medium text-gray-700 mb-1">
              Carrera o título obtenido
            </label>
            <p class="text-sm text-gray-600 italic mb-2">Escribe el nombre de la carrera, título u grado académico</p>
            <InputText id="carreraTitulo" v-model="formData.carreraTitulo" placeholder="Ej: Técnico en Enfermería, Contador" class="form-input"
              @blur="touched.carreraTitulo = true" />
          </div>
        </div>

        <!-- Campo Carrera de Interés -->
        <div class="form-field col-span-1 md:col-span-2 carrera-field">
          <div class="carrera-container">
            <div class="flex items-start space-x-3 mb-4">
              <GraduationCap class="carrera-icon mt-0.5 flex-shrink-0" />
              <div>
                <h3 class="carrera-title">Programa de Interés</h3>
                <p class="carrera-subtitle italic mt-1">
                  Elige el programa que quieres obtener en UNIACC
                </p>
              </div>
            </div>

            <!-- Autocomplete de carreras -->
            <div class="form-field">
              <Autocomplete id="carreraInteres" v-model="carreraSeleccionada" :suggestions="filteredCarreras"
                @complete="searchCarreras" optionLabel="nombre_programa" placeholder="Busca programa..."
                class="w-full carrera-autocomplete"
                :class="{ 'p-invalid': (submitted || touched.carreraInteres) && (!formData.carreraInteres || formData.carreraInteresId === 0) }"
                :loading="carrerasLoading" @focus="handleAutocompleteFocus" @blur="touched.carreraInteres = true"
                @item-select="(event) => selectCarrera(event.value)" :dropdown="true" forceSelection autocomplete="off">
                <template #option="slotProps">
                  <div class="carrera-option-item">
                    <div class="carrera-option-nombre">{{ slotProps.option.nombre_programa }}</div>
                    <div class="carrera-option-details">{{ slotProps.option.nivel_academico }} - {{
                      slotProps.option.modalidad_programa }}</div>
                    <div class="carrera-option-duracion mt-1">{{ slotProps.option.duracion_programa }}</div>
                  </div>
                </template>
              </Autocomplete>
              <Message
                v-if="(submitted || touched.carreraInteres) && (!formData.carreraInteres || formData.carreraInteresId === 0)"
                severity="error" variant="simple" size="small" class="mt-2">
                Debes seleccionar una programa de interés
              </Message>
            </div>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
@import '@/assets/form-styles.css';

.magister-preferences-container {
  @apply form-container;
}

/* Grid configurado para permitir control total de col-span */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

/* En móvil, una sola columna */
@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

/* Asegurar que los form-field respeten las clases col-span */
.form-field {
  width: 100%;
  margin-top: 0;
}

/* Clases col-span personalizadas para control directo */
.form-field.col-span-1 {
  grid-column: span 1 / span 1;
}

.form-field.col-span-2 {
  grid-column: span 2 / span 2;
}

@media (min-width: 768px) {
  .form-field.md\:col-span-1 {
    grid-column: span 1 / span 1;
  }

  .form-field.md\:col-span-2 {
    grid-column: span 2 / span 2;
  }
}

.career-suggestions {
  @apply flex flex-wrap items-center gap-2;
}

.suggestions-label {
  @apply text-sm text-gray-600;
}

.suggestion-tag {
  @apply cursor-pointer;
}

.suggestion-tag:hover {
  @apply opacity-80;
}

/* Estilos para contenedor de carrera con tema UNIACC */
.carrera-container {
  @apply rounded-lg p-6;
  background-color: var(--p-primary-100);
  border: 2px solid var(--p-primary-300);
  box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.05);
}

.carrera-icon {
  @apply w-5 h-5;
  color: var(--p-primary-700);
}

.carrera-title {
  @apply text-lg font-semibold;
  color: var(--p-primary-900);
}

.carrera-subtitle {
  @apply text-sm;
  color: var(--p-primary-700);
}

/* Estilos para opciones del dropdown */
.carrera-option-item {
  @apply px-4 py-3 cursor-pointer border-b last:border-b-0;
  border-color: var(--p-primary-100);
}

.carrera-option-item:hover {
  background-color: var(--p-primary-100);
}

.carrera-option-nombre {
  @apply font-medium;
  color: var(--p-primary-900);
}

.carrera-option-details {
  @apply text-sm;
  color: var(--p-primary-700);
}

.carrera-option-duracion {
  @apply text-xs;
  color: var(--p-primary-500);
}

.carrera-help-text {
  @apply text-sm;
  color: var(--p-primary-700);
}

/* Estilos para el Autocomplete de carreras */
:deep(.carrera-autocomplete) {
  width: 100%;
}

:deep(.carrera-autocomplete .p-autocomplete-input) {
  @apply w-full;
}

:deep(.carrera-autocomplete .p-autocomplete-panel) {
  @apply border border-gray-200 rounded-lg shadow-lg;
  max-height: 15rem;
  width: 100%;
}

:deep(.carrera-autocomplete .p-autocomplete-items) {
  padding: 0;
}

/* Estilos para nivel educativo */
.nivel-educativo-field {
  grid-column: span 1 / span 1;
  margin-left: 1.5rem;
}

@media (min-width: 768px) {
  .nivel-educativo-field {
    grid-column: span 1 / span 1;
    margin-left: 1.5rem;
  }
}

@media (max-width: 768px) {
  .nivel-educativo-field {
    margin-left: 0;
  }
}

.nivel-educativo-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.nivel-educativo-checkboxes {
  @apply flex flex-col gap-3 ml-5 mb-2;
}

.checkbox-option {
  @apply flex items-center gap-2;
}

.checkbox-label {
  @apply text-sm text-gray-700 cursor-pointer;
  @apply flex-1;
}

/* Responsive */
@media (max-width: 768px) {
  .nivel-educativo-field {
    grid-column: span 1 / span 1 !important;
  }

  .nivel-educativo-checkboxes {
    @apply gap-2;
  }

  .form-grid {
    gap: 1rem;
  }

  /* En móvil, todos los campos ocupan el ancho completo */
  .form-field {
    grid-column: span 1 / span 1 !important;
  }
}
</style>

