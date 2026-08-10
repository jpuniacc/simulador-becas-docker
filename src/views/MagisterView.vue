<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import Stepper from 'primevue/stepper';
import StepList from 'primevue/steplist';
import StepPanels from 'primevue/steppanels';
import Step from 'primevue/step';
import StepPanel from 'primevue/steppanel';
import Button from 'primevue/button';
import Message from 'primevue/message';
import MagisterPreferences from '@/components/magister/MagisterPreferences.vue';
import PersonalAcademicData from '@/components/simulador/PersonalAcademicData.vue';
import Results from '@/components/simulador/Results.vue';
import { validateEmail, validateRUT } from '@/utils/validation';
import type { FormData } from '@/types/simulador';

// Estado del formulario
const formData = ref<Partial<FormData & { carreraInteres: string; carreraInteresId: number }>>({
    // Datos de magíster
    carreraTitulo: '',
    modalidadPreferencia: [],
    objetivo: [],
    carreraInteres: '',
    carreraInteresId: 0,
    // Datos personales
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    identificacion: '',
    tipoIdentificacion: 'rut',
    tieneRUT: true,
    nivelEducativo: '',
    regionResidencia: '',
    comunaResidencia: '',
    colegio: '',
    añoEgreso: '',
    ranking: null,
    nem: null
});

// Referencia al componente de magíster para acceder a la validación
const magisterPreferencesRef = ref<InstanceType<typeof MagisterPreferences> | null>(null);

// Referencia al componente de datos personales para acceder a la validación
const personalDataRef = ref<InstanceType<typeof PersonalAcademicData> | null>(null);

// Referencia al componente de resultados
const resultsRef = ref<InstanceType<typeof Results> | null>(null);

// Watcher para validar y loguear cambios en formData
watch(formData, (newValue, oldValue) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oldData = oldValue as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newData = newValue as any;

    console.log('=== formData Cambió ===');
    console.log('Valor anterior:', oldValue);
    console.log('Valor nuevo:', newValue);
    console.log('Cambios detectados:', {
        institucionId: {
            anterior: oldData?.institucionId,
            nuevo: newData?.institucionId,
            cambió: oldData?.institucionId !== newData?.institucionId
        },
        carreraInteres: {
            anterior: oldData?.carreraInteres,
            nuevo: newData?.carreraInteres,
            cambió: oldData?.carreraInteres !== newData?.carreraInteres
        },
        carreraInteresId: {
            anterior: oldData?.carreraInteresId,
            nuevo: newData?.carreraInteresId,
            cambió: oldData?.carreraInteresId !== newData?.carreraInteresId
        },
        carreraTitulo: {
            anterior: oldValue?.carreraTitulo,
            nuevo: newValue?.carreraTitulo,
            cambió: oldValue?.carreraTitulo !== newValue?.carreraTitulo
        },
        origen: {
            anterior: oldData?.origen,
            nuevo: newData?.origen,
            cambió: oldData?.origen !== newData?.origen
        }
    });
    console.log('formData completo:', JSON.stringify(newValue, null, 2));
    console.log('===================');
}, { deep: true });

// Computed para mapear formData a formato que espera Results.vue
const mappedFormDataForResults = computed(() => {
    const data = { ...formData.value };
    // Mapear carreraInteresId a carreraId para Results.vue
    if (data.carreraInteresId) {
        (data as any).carreraId = data.carreraInteresId;
        (data as any).carrera = data.carreraInteres;
    }
    return data;
});

// Toast de PrimeVue
const toast = useToast();

// Estado de validación del formulario
const isStep1Valid = ref(false);
const isStep2Valid = ref(false);

// Estado para bloquear los botones después de mostrar un toast
const isStep1ButtonBlocked = ref(false);
const isStep2ButtonBlocked = ref(false);

// Handler para actualizar formData desde el componente hijo
const handleFormDataUpdate = (data: Partial<FormData>) => {
    formData.value = { ...formData.value, ...data };
};

// Handler para cambios en la validación del paso 1
const handleValidationChange = (isValid: boolean) => {
    isStep1Valid.value = isValid;
};

// Handler para cambios en la validación del paso 2
const handleValidationChangeStep2 = (isValid: boolean) => {
    isStep2Valid.value = isValid;
};

// Función para recopilar campos faltantes del paso 1 (MagisterPreferences)
const getMissingFieldsStep1 = (): string[] => {
    const missing: string[] = []
    const formDataAny = formData.value as any

    if (!formData.value.origen?.trim()) missing.push('Objetivo / situación actual')

    if (!formDataAny?.gradoAcademico?.trim()) missing.push('Grado Académico')

    if (!formDataAny?.carreraInteres?.trim() || !formDataAny?.carreraInteresId || formDataAny.carreraInteresId === 0) {
        missing.push('Programa de Interés')
    }

    return missing
}

// Función para recopilar campos faltantes del paso 2 (PersonalAcademicData en modo postgrado)
const getMissingFieldsStep2 = (): string[] => {
    const missing: string[] = []

    // En modo postgrado, nivelEducativo y colegio NO son requeridos
    if (!formData.value.nombre?.trim()) missing.push('Nombre')
    if (!formData.value.apellido?.trim()) missing.push('Apellido')
    if (!formData.value.email?.trim()) missing.push('Email')
    if (!formData.value.telefono?.trim() || formData.value.telefono.replace(/[^0-9]/g, '').length !== 8) {
        missing.push('Teléfono')
    }
    if (!formData.value.identificacion?.trim()) {
        missing.push('RUT')
    }
    // Validar formato de email si está presente
    if (formData.value.email?.trim() && !validateEmail(formData.value.email)) {
        missing.push('Email válido')
    }
    // Validar formato de RUT si está presente
    if (formData.value.identificacion?.trim() && formData.value.tieneRUT !== false && !validateRUT(formData.value.identificacion)) {
        missing.push('RUT válido')
    }

    return missing
}

// Función helper para generar el texto con bullets de campos faltantes
const formatMissingFieldsAsBullets = (missingFields: string[]): string => {
    if (missingFields.length === 0) return ''
    return missingFields.map(field => `• ${field}`).join('\n')
}

// Función helper para bloquear un botón por 3 segundos
const blockButton = (step: 1 | 2, duration: number = 3000) => {
    if (step === 1) {
        isStep1ButtonBlocked.value = true
        setTimeout(() => {
            isStep1ButtonBlocked.value = false
        }, duration)
    } else {
        isStep2ButtonBlocked.value = true
        setTimeout(() => {
            isStep2ButtonBlocked.value = false
        }, duration)
    }
}

// Handler para avanzar al paso 3 y guardar prospecto
const handleNextToStep3 = async (activateCallback: (step: string) => void) => {
    // Marcar formulario como submitted si es necesario
    if (personalDataRef.value && 'markAsSubmitted' in personalDataRef.value && typeof personalDataRef.value.markAsSubmitted === 'function') {
        personalDataRef.value.markAsSubmitted()
    }

    // Esperar un tick para que se actualicen los errores antes de verificar validación
    await nextTick();

    // Verificar validación antes de avanzar
    if (!isStep2Valid.value) {
        console.warn('El formulario no es válido');
        return;
    }

    // Activar el paso 3
    activateCallback('3');

    // Esperar a que el componente Results se monte
    await nextTick();

    // Esperar un momento adicional para asegurar que el componente esté completamente montado
    await new Promise(resolve => setTimeout(resolve, 100));

    // Llamar a simulate en el componente Results
    if (resultsRef.value && 'simulate' in resultsRef.value && typeof resultsRef.value.simulate === 'function') {
        await resultsRef.value.simulate();
    }
};
</script>

<template>
    <div class="main-container">
        <div class="header-container">
            <h1>Postgrados UNIACC</h1>
        </div>
        <div class="content-container">
            <Stepper value="1" linear class="w-full sm:basis-[40rem] md:basis-[50rem] lg:basis-[72rem]">
                <StepList class="stepper-header sticky top-0 z-10 bg-white dark:bg-slate-900 py-4">
                    <Step value="1">
                        <!-- Corto en móvil -->
                        <span class="md:hidden">Preferencias</span>
                        <!-- Largo en desktop -->
                        <span class="hidden md:inline">Tus Preferencias</span>
                    </Step>

                    <Step value="2">
                        <span class="md:hidden">Datos</span>
                        <span class="hidden md:inline">Datos Personales</span>
                    </Step>

                    <Step value="3">
                        <span class="md:hidden">Resumen</span>
                        <span class="hidden md:inline">Resultados</span>
                    </Step>
                </StepList>
                <Message severity="info" :closable="true" size="small" class="mb-1">
                    <template #icon>
                        <i class="pi pi-shield"></i>
                    </template>
                    <span class="font-semibold"> Tus datos se usan sólo para este formulario</span>
                    <span class="text-gray-600">. Al continuar, aceptas su uso.</span>
                </Message>
                <StepPanels>
                    <StepPanel v-slot="{ activateCallback }" value="1">
                        <div class="stepper-panel flex flex-col">
                            <MagisterPreferences
                                ref="magisterPreferencesRef"
                                :form-data="formData"
                                @update:form-data="handleFormDataUpdate"
                                @validation-change="handleValidationChange"
                            />
                        </div>
                        <div class="flex pt-6 justify-end">
                            <div
                                class="m-4 button-wrapper"
                                :class="{ 'button-blocked': isStep1ButtonBlocked }"
                                @mousedown="() => {
                                    if (isStep1ButtonBlocked) return

                                    if (magisterPreferencesRef && 'markAsSubmitted' in magisterPreferencesRef && typeof magisterPreferencesRef.markAsSubmitted === 'function') {
                                        magisterPreferencesRef.markAsSubmitted()
                                    }
                                    // Esperar un tick para que se actualicen los errores antes de verificar validación
                                    nextTick(() => {
                                        if (isStep1Valid) {
                                            activateCallback('2')
                                        } else {
                                            const missingFields = getMissingFieldsStep1()
                                            if (missingFields.length > 0) {
                                                toast.add({
                                                    severity: 'error',
                                                    summary: 'Campos requeridos',
                                                    detail: formatMissingFieldsAsBullets(missingFields),
                                                    life: 3000
                                                })
                                                blockButton(1, 3000)
                                            }
                                        }
                                    })
                                }"
                            >
                                <Button
                                    label="Siguiente"
                                    icon="pi pi-arrow-right"
                                    :disabled="!isStep1Valid || isStep1ButtonBlocked"
                                />
                            </div>
                        </div>
                    </StepPanel>
                    <StepPanel v-slot="{ activateCallback }" value="2">
                        <div class="stepper-panel flex flex-col">
                            <PersonalAcademicData
                                ref="personalDataRef"
                                :form-data="formData"
                                modo="postgrado"
                                @update:form-data="handleFormDataUpdate"
                                @validation-change="handleValidationChangeStep2"
                            />
                        </div>
                        <div class="flex pt-6 justify-between">
                            <Button
                                label="Atras"
                                class="m-4"
                                severity="secondary"
                                icon="pi pi-arrow-left"
                                @click="activateCallback('1')"
                            />
                            <div
                                class="m-4 button-wrapper"
                                :class="{ 'button-blocked': isStep2ButtonBlocked }"
                                @mousedown="() => {
                                    if (isStep2ButtonBlocked) return

                                    if (personalDataRef && 'markAsSubmitted' in personalDataRef && typeof personalDataRef.markAsSubmitted === 'function') {
                                        personalDataRef.markAsSubmitted()
                                    }
                                    // Esperar un tick para que se actualicen los errores antes de verificar validación
                                    nextTick(() => {
                                        if (isStep2Valid) {
                                            handleNextToStep3(activateCallback)
                                        } else {
                                            const missingFields = getMissingFieldsStep2()
                                            if (missingFields.length > 0) {
                                                toast.add({
                                                    severity: 'error',
                                                    summary: 'Campos requeridos',
                                                    detail: formatMissingFieldsAsBullets(missingFields),
                                                    life: 3000
                                                })
                                                blockButton(2, 3000)
                                            } else {
                                                toast.add({
                                                    severity: 'error',
                                                    summary: 'Formulario incompleto',
                                                    detail: 'Por favor completa todos los campos requeridos antes de continuar',
                                                    life: 3000
                                                })
                                                blockButton(2, 3000)
                                            }
                                        }
                                    })
                                }"
                            >
                                <Button
                                    label="Ver resultados"
                                    icon="pi pi-arrow-right"
                                    iconPos="right"
                                    :disabled="!isStep2Valid || isStep2ButtonBlocked"
                                />
                            </div>
                        </div>
                    </StepPanel>
                    <StepPanel v-slot="{ activateCallback }" value="3">
                        <div class="flex flex-col">
                            <Results ref="resultsRef" :form-data="mappedFormDataForResults" segmentacion="postgrado" />
                        </div>
                        <div class="pt-6">
                            <Button
                                label="Atras"
                                class="m-4"
                                severity="secondary"
                                icon="pi pi-arrow-left"
                                @click="activateCallback('2')"
                            />
                        </div>
                    </StepPanel>
                </StepPanels>
            </Stepper>
        </div>
        <div class="footer-container">

        </div>
    </div>
</template>

<style scoped>
.main-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-height: 100vh;
}

.header-container {
    width: 100%;
    max-width: 72rem;
    background-color: #000000;
    color: #ffffff;
    padding: 2rem;
    position: relative;
    margin-bottom: 2rem;
}

.header-container::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(to right,
            var(--p-tertiary-500) 0%,
            var(--p-tertiary-500) 33.33%,
            var(--p-secondary-500) 33.33%,
            var(--p-secondary-500) 66.66%,
            var(--p-primary-500) 66.66%,
            var(--p-primary-500) 100%);
}

.header-container h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 600;
    text-align: center;
}

.content-container {
    width: 100%;
    max-width: 72rem;
    display: flex;
    justify-content: center;
}

.stepper-header {
    @apply rounded p-3 !important
}

.stepper-panel {
    @apply rounded !important
}

/* Estilos para el StepList sticky */
:deep(.p-steplist) {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: white;
    padding: 1rem 0;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

/* dark: estilos en main.css (html.dark .p-steplist) */

/* Estilos para el wrapper del botón deshabilitado */
.button-wrapper {
    position: relative;
    cursor: pointer;
}

.button-wrapper :deep(.p-button:disabled) {
    pointer-events: none;
}

.button-blocked {
    pointer-events: none;
    opacity: 0.6;
    cursor: not-allowed;
}
</style>

