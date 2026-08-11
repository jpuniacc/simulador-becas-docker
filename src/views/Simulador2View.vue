<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import Stepper from 'primevue/stepper';
import StepList from 'primevue/steplist';
import StepPanels from 'primevue/steppanels';
import StepItem from 'primevue/stepitem';
import Step from 'primevue/step';
import StepPanel from 'primevue/steppanel';
import Button from 'primevue/button';
import Message from 'primevue/message';
import PersonalAcademicData from '@/components/simulador/PersonalAcademicData.vue';
import CareerFinancing from '@/components/simulador/CareerFinancing.vue';
import Results from '@/components/simulador/Results.vue';
import type { FormData } from '@/types/simulador';

// Estado del formulario
const formData = ref<Partial<FormData>>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    identificacion: '',
    tipoIdentificacion: 'rut',
    nivelEducativo: '',
    regionResidencia: '',
    comunaResidencia: '',
    colegio: '',
    añoEgreso: '',
    ranking: null,
    carrera: '',
    carreraId: 0,
    tipoPrograma: 'Regular',
    rendioPAES: false,
    planeaUsarCAE: false,
    usaBecasEstado: false,
    decil: null
});

// Route para acceder a los query parameters
const route = useRoute();

// Computed para obtener el RUT desde los query parameters
const rut = computed(() => {
    const rutParam = route.query.rut;
    return rutParam ? String(rutParam) : undefined;
});

// Referencia al componente de datos personales para acceder a la validación
const personalDataRef = ref<InstanceType<typeof PersonalAcademicData> | null>(null);

// Función helper para procesar el RUT en el componente hijo
const processRUTInChild = (rutValue: string) => {
    nextTick(() => {
        if (personalDataRef.value && 'processRUT' in personalDataRef.value && typeof personalDataRef.value.processRUT === 'function') {
            personalDataRef.value.processRUT(rutValue);
        }
    });
};

// Watch para actualizar formData.identificacion cuando el computed cambie
watch(rut, (newRut) => {
    if (newRut !== undefined && newRut !== '') {
        // Actualizar formData
        formData.value.identificacion = newRut;

        // Disparar el procesamiento del RUT en el componente hijo (formateo y validación)
        processRUTInChild(newRut);
    }
}, { immediate: true });

// Watch adicional para procesar el RUT cuando el componente hijo esté disponible
watch(personalDataRef, (ref) => {
    if (ref && rut.value !== undefined && rut.value !== '') {
        processRUTInChild(rut.value);
    }
});

// Referencia al componente de carrera y financiamiento
const careerFinancingRef = ref<InstanceType<typeof CareerFinancing> | null>(null);

// Referencia al componente de resultados
const resultsRef = ref<InstanceType<typeof Results> | null>(null);

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

// Función para recopilar campos faltantes del paso 1
const getMissingFieldsStep1 = (): string[] => {
    const missing: string[] = []

    if (!formData.value.nombre?.trim()) missing.push('Nombre')
    if (!formData.value.apellido?.trim()) missing.push('Apellido')
    if (!formData.value.email?.trim()) missing.push('Email')
    if (!formData.value.telefono?.trim() || formData.value.telefono.replace(/[^0-9]/g, '').length !== 8) {
        missing.push('Teléfono')
    }
    if (!formData.value.identificacion?.trim()) {
        missing.push(formData.value.tieneRUT === false ? 'Identificación (Pasaporte)' : 'RUT')
    }
    if (!formData.value.nivelEducativo) {
        missing.push('Nivel Educativo')
    }
    if (!formData.value.colegio?.trim() && formData.value.tieneRUT !== false) {
        missing.push('Colegio')
    }
    if (formData.value.tieneRUT === false && formData.value.tipoIdentificacion === 'pasaporte' && !(formData.value as any).paisPasaporte?.trim()) {
        missing.push('País de Origen')
    }

    return missing
}

// Función para recopilar campos faltantes del paso 2
const getMissingFieldsStep2 = (): string[] => {
    const missing: string[] = []

    if (!formData.value.carrera?.trim() || formData.value.carreraId === 0) {
        missing.push('Carrera')
    }
    if (formData.value.rendioPAES) {
        if (formData.value.paes?.lenguaje === null || formData.value.paes?.lenguaje === undefined) {
            missing.push('Comprensión Lectora (PAES)')
        }
        if (formData.value.paes?.matematica === null || formData.value.paes?.matematica === undefined) {
            missing.push('Matemática 1 (PAES)')
        }
    }
    // Si tiene alguna opción de financiamiento seleccionada, debe tener decil
    if ((formData.value.planeaUsarCAE || formData.value.usaBecasEstado) && (formData.value.decil === null || formData.value.decil === undefined)) {
        missing.push('Tramo de Renta Mensual (Decil)')
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

// Handler para avanzar al paso 3 y ejecutar simulación
const handleNextToStep3 = async (activateCallback: (step: string) => void) => {
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
            <img
                src="/logo_uniacc_simulador.png"
                alt="Universidad UNIACC"
                class="header-logo"
            />
            <h1>Simulador de Becas</h1>
        </div>
        <div class="content-container">
            <Stepper value="1" linear class="w-full sm:basis-[40rem] md:basis-[50rem] lg:basis-[72rem]">
                <StepList class="stepper-header sticky top-0 z-10 bg-white dark:bg-slate-900 py-4">
                    <Step value="1">
                        <!-- Corto en móvil -->
                        <span class="md:hidden">Datos</span>
                        <!-- Largo en desktop -->
                        <span class="hidden md:inline">Datos Personales</span>
                    </Step>

                    <Step value="2">
                        <span class="md:hidden">Carrera</span>
                        <span class="hidden md:inline">Tu Carrera</span>
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
                    <span class="font-semibold"> Tus datos se usan sólo para esta simulación</span>
                    <span class="text-gray-600">. Al continuar, aceptas su uso.</span>
                </Message>
                <StepPanels>
                    <StepPanel v-slot="{ activateCallback }" value="1">
                        <div class="stepper-panel flex flex-col">
                            <PersonalAcademicData ref="personalDataRef" :form-data="formData"
                                @update:form-data="handleFormDataUpdate" @validation-change="handleValidationChange" />
                        </div>
                        <div class="flex pt-6 justify-end">
                            <div
                                class="m-4 button-wrapper"
                                :class="{ 'button-blocked': isStep1ButtonBlocked }"
                                @mousedown="() => {
                                    if (isStep1ButtonBlocked) return

                                    if (personalDataRef && 'markAsSubmitted' in personalDataRef && typeof personalDataRef.markAsSubmitted === 'function') {
                                        personalDataRef.markAsSubmitted()
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
                                <Button label="Siguiente" icon="pi pi-arrow-right" :disabled="!isStep1Valid || isStep1ButtonBlocked" />
                            </div>
                        </div>
                    </StepPanel>
                    <StepPanel v-slot="{ activateCallback }" value="2">
                        <div class="flex flex-col">
                            <CareerFinancing ref="careerFinancingRef" :form-data="formData"
                                @update:form-data="handleFormDataUpdate"
                                @validation-change="handleValidationChangeStep2" />
                        </div>
                        <div class="flex pt-6 justify-between">
                            <Button label="Atras" class="m-4" severity="secondary" icon="pi pi-arrow-left"
                                @click="activateCallback('1')" />
                            <div
                                class="m-4 button-wrapper"
                                :class="{ 'button-blocked': isStep2ButtonBlocked }"
                                @mousedown="() => {
                                    if (isStep2ButtonBlocked) return

                                    if (careerFinancingRef && 'markAsSubmitted' in careerFinancingRef && typeof careerFinancingRef.markAsSubmitted === 'function') {
                                        careerFinancingRef.markAsSubmitted()
                                    }
                                    // Esperar un tick para que se actualicen los errores antes de verificar validación
                                    nextTick(() => {
                                        if (isStep2Valid) {
                                            handleNextToStep3(activateCallback)
                                        } else {
                                            // Intentar obtener los campos faltantes del componente hijo si está disponible
                                            let missingFields: string[] = []
                                            if (careerFinancingRef && 'getMissingFields' in careerFinancingRef && typeof careerFinancingRef.getMissingFields === 'function') {
                                                missingFields = careerFinancingRef.getMissingFields()
                                            } else {
                                                // Fallback a la función local si el componente hijo no está disponible
                                                missingFields = getMissingFieldsStep2()
                                            }

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
                                <Button label="Ver resultados" icon="pi pi-arrow-right" iconPos="right"
                                    :disabled="!isStep2Valid" />
                            </div>
                        </div>
                    </StepPanel>
                    <StepPanel v-slot="{ activateCallback }" value="3">
                        <div class="flex flex-col">
                            <Results ref="resultsRef" :form-data="formData" segmentacion="pregrado" />
                        </div>
                        <div class="pt-6">
                            <Button label="Atras" class="m-4" severity="secondary" icon="pi pi-arrow-left"
                                @click="activateCallback('2')" />
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
    padding: 1.5rem 2rem 2rem;
    position: relative;
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
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

.header-logo {
    height: 48px;
    width: auto;
    max-width: min(240px, 70vw);
    object-fit: contain;
    display: block;
}

.header-container h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 600;
    text-align: center;
}

@media (min-width: 768px) {
    .header-logo {
        height: 56px;
        max-width: 280px;
    }
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
