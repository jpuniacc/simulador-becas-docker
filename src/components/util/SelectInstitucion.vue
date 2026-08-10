<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import Autocomplete from 'primevue/autocomplete'
import Message from 'primevue/message'
import { useInstitucionesStore, type Institucion } from '@/stores/institucionesStore'

// Props
interface Props {
    modelValue?: Institucion | null
    placeholder?: string
    invalid?: boolean
    required?: boolean
    label?: string
    microcopy?: string
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: null,
    placeholder: 'Buscar institución...',
    invalid: false,
    required: false,
    label: 'Institución de Educación Superior',
    microcopy: undefined
})

// Emits
const emit = defineEmits<{
    'update:modelValue': [value: Institucion | null]
    'change': [value: Institucion | null]
}>()

// Store de instituciones
const institucionesStore = useInstitucionesStore()

// Estado local
const institucionSeleccionada = ref<Institucion | null>(props.modelValue || null)
const filteredInstituciones = ref<Institucion[]>([])
const touched = ref(false)
// Flag para prevenir loops infinitos entre watchers
const isUpdatingFromProps = ref(false)

// Función para buscar instituciones (usada por Autocomplete)
const searchInstituciones = (event: { query: string }) => {
    if (!event.query || !event.query.trim()) {
        filteredInstituciones.value = institucionesStore.instituciones
    } else {
        filteredInstituciones.value = institucionesStore.buscarInstituciones(event.query)
    }
}

// Función para manejar el focus del Autocomplete
const handleAutocompleteFocus = () => {
    touched.value = true
    if (filteredInstituciones.value.length === 0) {
        filteredInstituciones.value = institucionesStore.instituciones
    }
}

// Función para seleccionar institución
const selectInstitucion = (institucion: Institucion) => {
    // El watcher se encargará de emitir los eventos
    isUpdatingFromProps.value = false
    institucionSeleccionada.value = institucion
    touched.value = true
}

// Watcher para sincronizar con props
watch(() => props.modelValue, (newValue) => {
    if (institucionSeleccionada.value?.id !== newValue?.id) {
        isUpdatingFromProps.value = true
        institucionSeleccionada.value = newValue || null
        // Resetear el flag después de un pequeño delay
        setTimeout(() => {
            isUpdatingFromProps.value = false
        }, 0)
    }
}, { immediate: true })

// Watcher para emitir cambios cuando cambia el valor local (desde el Autocomplete)
watch(institucionSeleccionada, (newValue, oldValue) => {
    // Solo emitir si el cambio no viene de las props (evitar loops)
    if (!isUpdatingFromProps.value && newValue?.id !== oldValue?.id) {
        emit('update:modelValue', newValue)
        emit('change', newValue)
        touched.value = true
    }
}, { deep: true })

// Lifecycle
onMounted(async () => {
    // Cargar instituciones si no están cargadas
    if (institucionesStore.instituciones.length === 0) {
        await institucionesStore.cargarInstituciones()
    }
    // Inicializar las instituciones filtradas
    filteredInstituciones.value = institucionesStore.instituciones

    // Si hay una institución en las props, buscar y seleccionar
    if (props.modelValue) {
        institucionSeleccionada.value = props.modelValue
    }
})

// Computed para validación
const showError = computed(() => {
    return props.invalid || (props.required && touched.value && !institucionSeleccionada.value)
})
</script>

<template>
    <div class="select-institucion-container">
        <label v-if="label" :for="`institucion-${$attrs.id || 'default'}`" class="block text-sm font-medium text-gray-700 mb-1">
            {{ label }}<span v-if="required" class="text-red-500 ml-1">*</span>
        </label>
        <p v-if="microcopy" class="text-sm text-gray-600 italic mb-2">{{ microcopy }}</p>
        <Autocomplete
            :id="`institucion-${$attrs.id || 'default'}`"
            v-model="institucionSeleccionada"
            :suggestions="filteredInstituciones"
            @complete="searchInstituciones"
            optionLabel="nombre"
            :placeholder="placeholder"
            class="w-full institucion-autocomplete"
            :class="{ 'p-invalid': showError }"
            :loading="institucionesStore.loading"
            @focus="handleAutocompleteFocus"
            @blur="touched = true"
            @item-select="(event) => selectInstitucion(event.value)"
            :dropdown="true"
            forceSelection
            autocomplete="off"
        >
            <template #option="slotProps">
                <div class="institucion-option-item">
                    <div class="institucion-option-nombre">{{ slotProps.option.nombre }}</div>
                    <div class="institucion-option-details">{{ slotProps.option.tipo_institucion }}</div>
                    <div v-if="slotProps.option.estado" class="institucion-option-estado mt-1">
                        Estado: {{ slotProps.option.estado }}
                    </div>
                </div>
            </template>
        </Autocomplete>
        <p class="institucion-help-text mt-1">
            Busca por nombre de institución o tipo
        </p>
        <Message
            v-if="showError"
            severity="error"
            variant="simple"
            size="small"
            class="mt-2"
        >
            {{ required && !institucionSeleccionada ? 'Debes seleccionar una institución' : 'Institución inválida' }}
        </Message>
    </div>
</template>

<style scoped>
.select-institucion-container {
    @apply w-full;
}

.institucion-help-text {
    @apply text-sm;
    color: var(--p-primary-700);
}

/* Estilos para el Autocomplete de instituciones */
:deep(.institucion-autocomplete) {
    width: 100%;
}

:deep(.institucion-autocomplete .p-autocomplete-input) {
    @apply w-full;
}

:deep(.institucion-autocomplete .p-autocomplete-panel) {
    @apply border border-gray-200 rounded-lg shadow-lg;
    max-height: 15rem;
    width: 100%;
    min-width: 100%;
}

:deep(.institucion-autocomplete .p-autocomplete-items) {
    padding: 0;
    width: 100%;
}

:deep(.institucion-autocomplete .p-autocomplete-list) {
    width: 100%;
}

/* Estilos para opciones del autocomplete */
.institucion-option-item {
    @apply px-4 py-3 cursor-pointer border-b last:border-b-0;
    border-color: var(--p-primary-100);
    width: 100%;
    box-sizing: border-box;
}

.institucion-option-item:hover {
    background-color: var(--p-primary-100);
}

.institucion-option-nombre {
    @apply font-medium;
    color: var(--p-primary-900);
}

.institucion-option-details {
    @apply text-sm;
    color: var(--p-primary-700);
}

.institucion-option-estado {
    @apply text-xs;
    color: var(--p-primary-500);
}
</style>

