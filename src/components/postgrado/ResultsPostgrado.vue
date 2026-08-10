<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'
import Message from 'primevue/message'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useCarrerasStore } from '@/stores/carrerasStore'
import { formatCurrency } from '@/utils/formatters'
import { GraduationCap, BookOpen, Heart } from 'lucide-vue-next'
import type { Carrera } from '@/stores/carrerasStore'

// Props
interface Props {
    area?: string
    modalidadPreferencia?: ('Presencial' | 'Online' | 'Semipresencial')[] | null
}

const props = withDefaults(defineProps<Props>(), {
    area: '',
    modalidadPreferencia: null
})

// Store
const carrerasStore = useCarrerasStore()

// ConfirmDialog
const confirm = useConfirm()

// Estado
const isLoading = ref(false)
const selectedCarrera = ref<Carrera | null>(null)
const isModalOpen = ref(false)
const mostrarTodasLasCarreras = ref(false)

// Tipo para carrera con puntaje
interface CarreraConPuntaje extends Carrera {
    puntaje: number
}

// Función para calcular puntaje de una carrera
const calcularPuntaje = (carrera: Carrera): number => {
    let puntaje = 0

    // +1 punto si coincide con el área de interés
    if (props.area && carrera.area && carrera.area.trim() === props.area.trim()) {
        puntaje += 1
    }

    // +1 punto si coincide con alguna de las modalidades preferidas
    if (props.modalidadPreferencia && props.modalidadPreferencia.length > 0 && carrera.modalidad_programa) {
        const modalidadCarrera = carrera.modalidad_programa.trim().toLowerCase()

        // Verificar si alguna de las modalidades preferidas coincide
        const coincide = props.modalidadPreferencia.some(modalidad =>
            modalidad.trim().toLowerCase() === modalidadCarrera
        )

        if (coincide) {
            puntaje += 1
        }
    }

    return puntaje
}

// Computed para todas las carreras con puntajes y ordenadas
const todasLasCarrerasConPuntaje = computed(() => {
    const todasLasCarreras = carrerasStore.carrerasVigentes || []

    // Calcular puntajes para cada carrera
    const carrerasConPuntaje: CarreraConPuntaje[] = todasLasCarreras.map(carrera => ({
        ...carrera,
        puntaje: calcularPuntaje(carrera)
    }))

    // Ordenar por puntaje (mayor a menor)
    return carrerasConPuntaje.sort((a, b) => b.puntaje - a.puntaje)
})

// Computed para las top 4 carreras
const carrerasPostgrado = computed(() => {
    return todasLasCarrerasConPuntaje.value.slice(0, 4)
})

// Computed para el resto de carreras (después del top 4)
const restoCarreras = computed(() => {
    return todasLasCarrerasConPuntaje.value.slice(4)
})

// Función para abrir modal con detalle de carrera
const openCarreraDetail = (carrera: Carrera) => {
    selectedCarrera.value = carrera
    isModalOpen.value = true
}

// Función para cerrar modal
const closeModal = () => {
    isModalOpen.value = false
    selectedCarrera.value = null
}

// Función para descargar la malla curricular
const descargarMalla = () => {
    if (selectedCarrera.value?.malla) {
        // Abrir la URL de la malla en una nueva pestaña para descargar
        window.open(selectedCarrera.value.malla, '_blank')
    }
}

// Función para manejar "Me interesa"
const handleMeInteresa = () => {
    if (selectedCarrera.value) {
        confirm.require({
            message: `Gracias por tu interés en ${selectedCarrera.value.nombre_programa}. Te contactaremos pronto.`,
            header: 'Contactar',
            icon: 'pi pi-check-circle',
            acceptLabel: 'Aceptar',
            rejectProps: {
                style: { display: 'none' }
            },
            accept: () => {
                console.log('TODO: contactar')
                closeModal()
            }
        })
    }
}

// Cargar carreras al montar el componente
onMounted(async () => {
    isLoading.value = true
    try {
        await carrerasStore.cargarCarreras()
    } catch (error) {
        console.error('Error al cargar carreras de postgrado:', error)
    } finally {
        isLoading.value = false
    }
})
</script>

<template>
    <div class="results-postgrado-container">
        <!-- Loading State -->
        <div v-if="isLoading || carrerasStore.loading" class="loading-container">
            <ProgressSpinner />
            <p class="loading-text">Cargando programas de postgrado...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="carrerasStore.error" class="error-container">
            <Message severity="error" :closable="false">
                {{ carrerasStore.error }}
            </Message>
        </div>

        <!-- Content -->
        <div v-else class="results-content">
            <!-- Carreras de Postgrado -->
            <div v-if="carrerasPostgrado.length" class="carreras-subsection">
                <h4 class="subsection-title">
                    <GraduationCap class="w-5 h-5 text-blue-600 mr-2" />
                     Programas de Postgrado Disponibles
                </h4>

                <!-- Subtítulo -->
                <p class="suggestions-subtitle">
                    Te sugerimos estos 4 programas según tus intereses
                </p>

                <!-- Top 4 Carreras -->
                <div class="carreras-grid">
                    <div
                        v-for="carrera in carrerasPostgrado"
                        :key="carrera.id"
                        class="carrera-card carrera-card-postgrado"
                    >
                        <div class="carrera-header">
                            <div class="carrera-icon">
                                <BookOpen class="w-5 h-5 text-blue-600" />
                            </div>
                            <div class="carrera-info">
                                <h4 class="carrera-title">{{ carrera.nombre_programa }}</h4>
                                <div class="carrera-badges">
                                    <Tag
                                        v-if="carrera.modalidad_programa"
                                        :value="carrera.modalidad_programa"
                                        severity="info"
                                        class="badge-modalidad"
                                    />
                                    <Tag
                                        v-if="carrera.duracion_programa"
                                        :value="`Duración: ${carrera.duracion_programa}`"
                                        severity="success"
                                        class="badge-duracion"
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="carrera-details">
                            <div class="carrera-cost">
                                <span class="cost-label">Arancel Anual:</span>
                                <span class="cost-value">{{ formatCurrency(carrera.arancel || 0) }}</span>
                            </div>
                            <div class="carrera-matricula">
                                <span class="matricula-label">Matrícula:</span>
                                <span class="matricula-value">{{ formatCurrency(carrera.matricula || 0) }}</span>
                            </div>
                        </div>
                        <div v-if="carrera.descripcion_programa" class="carrera-description">
                            <p class="description-text">{{ carrera.descripcion_programa }}</p>
                            <button
                                class="ver-mas-button"
                                @click="openCarreraDetail(carrera)"
                            >
                                Ver más
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Link para ver todas las carreras -->
                <div v-if="restoCarreras.length > 0" class="ver-todas-container">
                    <button
                        class="ver-todas-link"
                        @click="mostrarTodasLasCarreras = !mostrarTodasLasCarreras"
                    >
                        {{ mostrarTodasLasCarreras ? 'Ocultar' : 'Ver todas las carreras' }}
                    </button>
                </div>

                <!-- Resto de carreras (después del top 4) -->
                <div v-if="mostrarTodasLasCarreras && restoCarreras.length > 0" class="resto-carreras-section">
                    <h5 class="resto-carreras-title">
                        Otros programas disponibles
                    </h5>
                    <div class="carreras-grid">
                        <div
                            v-for="carrera in restoCarreras"
                            :key="carrera.id"
                            class="carrera-card carrera-card-postgrado"
                        >
                            <div class="carrera-header">
                                <div class="carrera-icon">
                                    <BookOpen class="w-5 h-5 text-blue-600" />
                                </div>
                                <div class="carrera-info">
                                    <h4 class="carrera-title">{{ carrera.nombre_programa }}</h4>
                                    <div class="carrera-badges">
                                        <Tag
                                            v-if="carrera.modalidad_programa"
                                            :value="carrera.modalidad_programa"
                                            severity="info"
                                            class="badge-modalidad"
                                        />
                                        <Tag
                                            v-if="carrera.duracion_programa"
                                            :value="`Duración: ${carrera.duracion_programa}`"
                                            severity="success"
                                            class="badge-duracion"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div class="carrera-details">
                                <div class="carrera-cost">
                                    <span class="cost-label">Arancel Anual:</span>
                                    <span class="cost-value">{{ formatCurrency(carrera.arancel || 0) }}</span>
                                </div>
                                <div class="carrera-matricula">
                                    <span class="matricula-label">Matrícula:</span>
                                    <span class="matricula-value">{{ formatCurrency(carrera.matricula || 0) }}</span>
                                </div>
                            </div>
                            <div v-if="carrera.descripcion_programa" class="carrera-description">
                                <p class="description-text">{{ carrera.descripcion_programa }}</p>
                                <button
                                    class="ver-mas-button"
                                    @click="openCarreraDetail(carrera)"
                                >
                                    Ver más
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mensaje si no hay carreras -->
            <div v-else class="no-carreras-message">
                <Message severity="info" :closable="false">
                    No hay programas de postgrado disponibles en este momento.
                </Message>
            </div>
        </div>

        <!-- Modal de Detalle de Carrera -->
        <Dialog
            v-model:visible="isModalOpen"
            :modal="true"
            :closable="true"
            :style="{ width: '90vw', maxWidth: '800px' }"
            header="Detalle del Programa"
            @hide="closeModal"
        >
            <div v-if="selectedCarrera" class="modal-content">
                <div class="modal-header-info">
                    <div class="modal-icon">
                        <BookOpen class="w-6 h-6 text-blue-600" />
                    </div>
                    <div class="modal-title-section">
                        <h3 class="modal-title">{{ selectedCarrera.nombre_programa }}</h3>
                        <div class="modal-badges">
                            <Tag
                                v-if="selectedCarrera.modalidad_programa"
                                :value="selectedCarrera.modalidad_programa"
                                severity="info"
                            />
                            <Tag
                                v-if="selectedCarrera.duracion_programa"
                                :value="`Duración: ${selectedCarrera.duracion_programa}`"
                                severity="success"
                            />
                        </div>
                    </div>
                </div>

                <div class="modal-details-grid">
                    <div class="modal-detail-item">
                        <span class="detail-label">Arancel Anual:</span>
                        <span class="detail-value">{{ formatCurrency(selectedCarrera.arancel || 0) }}</span>
                    </div>
                    <div class="modal-detail-item">
                        <span class="detail-label">Matrícula:</span>
                        <span class="detail-value">{{ formatCurrency(selectedCarrera.matricula || 0) }}</span>
                    </div>
                </div>

                <div v-if="selectedCarrera.descripcion_programa" class="modal-description px-4">
                    <h4 class="description-title">Descripción</h4>
                    <p class="description-full-text text-justify">{{ selectedCarrera.descripcion_programa }}</p>
                </div>

                <div v-if="selectedCarrera.requisitos_ingreso" class="modal-requirements">
                    <h4 class="requirements-title">Requisitos de Ingreso</h4>
                    <p class="requirements-text">{{ selectedCarrera.requisitos_ingreso }}</p>
                </div>

                <div v-if="selectedCarrera.malla" class="modal-malla">
                    <h4 class="malla-title">Malla Curricular</h4>
                    <Button
                        label="Descargar Malla Curricular (PDF)"
                        icon="pi pi-download"
                        class="malla-button"
                        outlined
                        @click="descargarMalla"
                    />
                </div>

                <div class="modal-actions">
                    <Button
                        label="Me interesa"
                        icon="pi pi-heart"
                        class="me-interesa-button"
                        @click="handleMeInteresa"
                    />
                </div>
            </div>
        </Dialog>

        <!-- ConfirmDialog -->
        <ConfirmDialog />
    </div>
</template>

<style scoped>
.results-postgrado-container {
    @apply w-full max-w-6xl mx-auto px-4 py-6 md:px-6 md:py-8;
}

.loading-container {
    @apply flex flex-col items-center justify-center py-12;
}

.loading-text {
    @apply mt-4 text-gray-600;
}

.error-container {
    @apply mb-4;
}

.results-content {
    @apply space-y-6;
}

.subsection-title {
    @apply flex items-center space-x-2 text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-200;
}

.suggestions-subtitle {
    @apply text-sm text-gray-700 font-medium mb-6;
}

.ver-todas-container {
    @apply flex justify-center mt-6 mb-4;
}

.ver-todas-link {
    @apply text-blue-600 hover:text-blue-800 font-medium text-sm underline cursor-pointer transition-colors;
}

.resto-carreras-section {
    @apply mt-8 pt-6 border-t border-gray-200;
}

.resto-carreras-title {
    @apply text-lg font-semibold text-gray-800 mb-4;
}

.carreras-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.carrera-card {
    @apply bg-white border border-gray-200 rounded-lg p-5 transition-all hover:shadow-lg hover:border-blue-300;
}

:global(html.dark) .carrera-card {
    @apply bg-slate-800 border-slate-600 hover:border-blue-400;
}

:global(html.dark) .resto-carreras-title,
:global(html.dark) .carrera-title {
    @apply text-gray-100;
}

:global(html.dark) .carrera-details {
    @apply border-slate-600;
}

.carrera-card-postgrado {
    @apply border-blue-200 bg-blue-50/30;
}

.carrera-header {
    @apply flex items-start space-x-3 mb-4;
}

.carrera-icon {
    @apply flex-shrink-0 mt-1;
}

.carrera-info {
    @apply flex-1 min-w-0;
}

.carrera-title {
    @apply text-lg font-bold text-gray-900 mb-3 leading-tight;
}

.carrera-badges {
    @apply flex flex-wrap gap-2 mt-2;
}

.badge-modalidad,
.badge-duracion {
    @apply text-xs;
}

.carrera-details {
    @apply flex flex-col space-y-1 mb-4 pt-4 border-t border-gray-200;
}

.carrera-cost,
.carrera-matricula {
    @apply flex justify-between items-center;
}

.cost-label,
.matricula-label {
    @apply text-sm font-medium text-gray-700;
}

.cost-value,
.matricula-value {
    @apply text-base font-bold text-gray-900;
}

.carrera-description {
    @apply mt-4 pt-4 border-t border-gray-200;
}

.description-text {
    @apply text-sm text-gray-700 leading-relaxed;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    max-height: 3em;
    line-height: 1.5em;
}

.ver-mas-button {
    @apply mt-3 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer;
    @apply underline decoration-blue-600 hover:decoration-blue-800;
}

.ver-mas-button:hover {
    @apply text-blue-800;
}

.no-carreras-message {
    @apply mt-4;
}

/* Modal Styles */
.modal-content {
    @apply space-y-6;
}

.modal-header-info {
    @apply flex items-start space-x-4 pb-4 border-b border-gray-200;
}

.modal-icon {
    @apply flex-shrink-0;
}

.modal-title-section {
    @apply flex-1;
}

.modal-title {
    @apply text-2xl font-bold text-gray-900 mb-2;
}

.modal-badges {
    @apply flex flex-wrap gap-2 mt-2;
}

.modal-details-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4 py-4 border-b border-gray-200;
}

.modal-detail-item {
    @apply flex flex-col space-y-1;
}

.detail-label {
    @apply text-sm font-medium text-gray-600;
}

.detail-value {
    @apply text-lg font-bold text-gray-900;
}

.modal-description,
.modal-requirements {
    @apply space-y-2;
}

.description-title,
.requirements-title {
    @apply text-lg font-semibold text-gray-900 mb-2;
}

.description-full-text,
.requirements-text {
    @apply text-base text-gray-700 leading-relaxed;
}

.modal-malla {
    @apply space-y-2 pt-4 border-t border-gray-200;
}

.malla-title {
    @apply text-lg font-semibold text-gray-900 mb-3;
}

.malla-button {
    @apply w-full justify-center;
}

.modal-actions {
    @apply flex justify-center pt-4 border-t border-gray-200;
}

.me-interesa-button {
    @apply bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-semibold;
}

/* Responsive */
@media (max-width: 768px) {
    .carreras-grid {
        @apply grid-cols-1 gap-4;
    }

    .carrera-card {
        @apply p-4;
    }

    .modal-details-grid {
        @apply grid-cols-1 gap-3;
    }
}
</style>
