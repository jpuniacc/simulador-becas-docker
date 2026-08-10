<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import InputText from 'primevue/inputtext'
import FloatLabel from 'primevue/floatlabel'
import SelectButton from 'primevue/selectbutton'
import Select from 'primevue/select'
import Checkbox from 'primevue/checkbox'
import Message from 'primevue/message'
import type { FormData } from '@/types/simulador'

// Props
interface Props {
    formData?: Partial<FormData>
}

const props = withDefaults(defineProps<Props>(), {
    formData: () => ({
        carreraTitulo: '',
        area: '',
        modalidadPreferencia: [] as FormData['modalidadPreferencia'],
        objetivo: [] as FormData['objetivo']
    })
})

// Emits
const emit = defineEmits<{
    'update:form-data': [data: Partial<FormData>]
    'validation-change': [isValid: boolean]
}>()

// Opciones de modalidad
const opcionesModalidad = [
    { label: 'Online', value: 'Online' },
    { label: 'Semipresencial', value: 'Semipresencial' },
    { label: 'Presencial', value: 'Presencial' }
]

// Opciones de área de interés
const opcionesAreaInteres = [
    { label: 'Ciencias Sociales y Humanidades', value: 'Ciencias Sociales y Humanidades' },
    { label: 'Educación y Formación', value: 'Educación y Formación' },
    { label: 'Artes y Cultura', value: 'Artes y Cultura' },
    { label: 'Gestión y Negocios', value: 'Gestión y Negocios' },
    { label: 'Información y Bibliotecas', value: 'Información y Bibliotecas' }
]

// Opciones de objetivo
const opcionesObjetivo: Array<{ label: string; value: 'mejorar_habilidades' | 'cambiar_carrera' | 'mejorar_empleo' | 'otro' }> = [
    { label: 'Mejorar habilidades', value: 'mejorar_habilidades' },
    { label: 'Cambiar de carrera', value: 'cambiar_carrera' },
    { label: 'Mejorar empleo', value: 'mejorar_empleo' },
    { label: 'Otro', value: 'otro' }
]

// Estado local del formulario
const formData = ref<Partial<FormData>>({
    carreraTitulo: props.formData?.carreraTitulo || '',
    area: props.formData?.area || '',
    modalidadPreferencia: props.formData?.modalidadPreferencia || [],
    objetivo: props.formData?.objetivo || []
})

// Estado para controlar cuándo mostrar errores
const submitted = ref(false)
const touched = ref({
    carreraTitulo: false,
    area: false,
    modalidadPreferencia: false,
    objetivo: false
})


// Computed para verificar si el formulario es válido
const isFormValid = computed(() => {
    const hasRequiredFields = 
        formData.value.carreraTitulo?.trim() !== '' &&
        formData.value.area?.trim() !== '' &&
        (formData.value.modalidadPreferencia && formData.value.modalidadPreferencia.length > 0) &&
        (formData.value.objetivo && formData.value.objetivo.length > 0)
    
    return hasRequiredFields
})

// Emitir cambios de validación
watch(isFormValid, (newValue) => {
    emit('validation-change', newValue)
}, { immediate: true })

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
        emit('update:form-data', { ...newData })
    }
}, { deep: true })

// Watcher para actualizar cuando cambien las props
watch(() => props.formData, (newData) => {
    if (newData) {
        // Verificar si hay cambios reales antes de actualizar
        const objetivoChanged = JSON.stringify(formData.value.objetivo || []) !== JSON.stringify(newData.objetivo || [])
        
        const hasChanges = 
            formData.value.carreraTitulo !== (newData.carreraTitulo || '') ||
            formData.value.area !== (newData.area || '') ||
            JSON.stringify(formData.value.modalidadPreferencia || []) !== JSON.stringify(newData.modalidadPreferencia || []) ||
            objetivoChanged

        if (hasChanges) {
            isUpdatingFromProps.value = true
            formData.value = {
                carreraTitulo: newData.carreraTitulo || '',
                area: newData.area || '',
                modalidadPreferencia: newData.modalidadPreferencia || [],
                objetivo: newData.objetivo || []
            }
            // Resetear el flag después de un pequeño delay
            setTimeout(() => {
                isUpdatingFromProps.value = false
            }, 0)
        }
    }
}, { deep: true })
</script>

<template>
    <div class="career-postgrado-container">
        <div class="form-guide">
            <p class="guide-text">Cuéntanos sobre tu carrera y preferencias</p>
        </div>
        <form class="career-postgrado-form" @submit.prevent>
            <div class="form-grid">
                <!-- Campo Carrera Título -->
                <div class="form-field">
                    <div class="flex flex-col gap-1">
                        <FloatLabel>
                            <InputText 
                                id="carreraTitulo" 
                                v-model="formData.carreraTitulo" 
                                class="form-input"
                                :invalid="(submitted || touched.carreraTitulo) && (!formData.carreraTitulo || formData.carreraTitulo.trim() === '')"
                                @blur="touched.carreraTitulo = true"
                            />
                            <label for="carreraTitulo">Carrera o Título Profesional *</label>
                        </FloatLabel>
                        <Message 
                            v-if="(submitted || touched.carreraTitulo) && (!formData.carreraTitulo || formData.carreraTitulo.trim() === '')" 
                            severity="error" 
                            variant="simple" 
                            size="small"
                        >
                            Carrera o título es requerido
                        </Message>
                    </div>
                </div>

                <!-- Campo Área de Interés -->
                <div class="form-field">
                    <div class="flex flex-col gap-1">
                        <FloatLabel>
                            <Select 
                                id="area" 
                                v-model="formData.area" 
                                :options="opcionesAreaInteres" 
                                optionLabel="label" 
                                optionValue="value"
                                class="form-input w-full"
                                :invalid="(submitted || touched.area) && (!formData.area || formData.area.trim() === '')"
                                @blur="touched.area = true"
                            />
                            <label for="area">Área de interés *</label>
                        </FloatLabel>
                        <Message 
                            v-if="(submitted || touched.area) && (!formData.area || formData.area.trim() === '')" 
                            severity="error" 
                            variant="simple" 
                            size="small"
                        >
                            Área de interés es requerida
                        </Message>
                    </div>
                </div>

                <!-- Campo Modalidad Preferencia -->
                <div class="form-field modalidad-field">
                    <div class="flex flex-col gap-1">
                        <label for="modalidadPreferencia" class="modalidad-label">
                            Modalidad de Preferencia *
                        </label>
                        <SelectButton 
                            id="modalidadPreferencia" 
                            v-model="formData.modalidadPreferencia"
                            :options="opcionesModalidad" 
                            optionLabel="label" 
                            optionValue="value"
                            class="modalidad-select"
                            multiple
                            @change="touched.modalidadPreferencia = true"
                        />
                        <Message 
                            v-if="(submitted || touched.modalidadPreferencia) && (!formData.modalidadPreferencia || formData.modalidadPreferencia.length === 0)" 
                            severity="error" 
                            variant="simple" 
                            size="small"
                        >
                            Modalidad es requerida
                        </Message>
                    </div>
                </div>

                <!-- Campo Objetivo -->
                <div class="form-field objetivo-field">
                    <div class="flex flex-col gap-1">
                        <label class="objetivo-label">
                            ¿Cuál es tu objetivo principal? *
                        </label>
                        <div class="objetivo-checkboxes">
                            <div 
                                v-for="opcion in opcionesObjetivo" 
                                :key="opcion.value"
                                class="objetivo-checkbox-item"
                            >
                                <Checkbox 
                                    :inputId="`objetivo-${opcion.value}`"
                                    :value="opcion.value"
                                    v-model="formData.objetivo"
                                    @change="touched.objetivo = true"
                                />
                                <label 
                                    :for="`objetivo-${opcion.value}`" 
                                    class="objetivo-checkbox-label"
                                >
                                    {{ opcion.label }}
                                </label>
                            </div>
                        </div>
                        <Message 
                            v-if="(submitted || touched.objetivo) && (!formData.objetivo || formData.objetivo.length === 0)" 
                            severity="error" 
                            variant="simple" 
                            size="small"
                        >
                            Debes seleccionar al menos un objetivo
                        </Message>
                    </div>
                </div>
            </div>
        </form>
    </div>
</template>

<style scoped>
@import '@/assets/form-styles.css';

.career-postgrado-container {
    @apply form-container;
}

/* Estilos para SelectButton de modalidad */
.modalidad-field {
    @apply col-span-1 md:col-span-2;
}

.modalidad-label {
    @apply block text-sm font-medium text-gray-700 mb-3;
}

/* Estilos para SelectButton de objetivo */
.objetivo-field {
    @apply col-span-1 md:col-span-2;
}

.objetivo-label {
    @apply block text-sm font-medium text-gray-700 mb-3;
}

.objetivo-checkboxes {
    @apply flex flex-col gap-3;
}

.objetivo-checkbox-item {
    @apply flex items-center gap-2;
}

.objetivo-checkbox-label {
    @apply text-sm text-gray-700 cursor-pointer;
}

/* Responsive */
@media (max-width: 768px) {
    .modalidad-field {
        @apply col-span-1;
    }

    .objetivo-field {
        @apply col-span-1;
    }

    :deep(.modalidad-select .p-selectbutton) {
        @apply flex-col;
    }

    :deep(.objetivo-select .p-selectbutton) {
        @apply flex-col;
    }
}
</style>
