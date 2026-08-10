<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, Check, AlertCircle, Share } from 'lucide-vue-next'

// Props
interface Props {
  canGoBack: boolean
  canGoNext: boolean
  isLastStep?: boolean
  isLoading?: boolean
  loadingText?: string
  stepInfo?: string
  showSpecialAction?: boolean
  specialActionText?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLastStep: false,
  isLoading: false,
  loadingText: 'Procesando...',
  stepInfo: '',
  showSpecialAction: false,
  specialActionText: 'Compartir'
})

// Emits
const emit = defineEmits<{
  back: []
  next: []
  specialAction: []
}>()

// Computed
const buttonText = computed(() => {
  if (props.isLastStep) {
    return 'Ver Resultados'
  }
  return 'Siguiente'
})

const shortButtonText = computed(() => {
  if (props.isLastStep) {
    return 'Ver'
  }
  return 'Sig.'
})

// Métodos
const handleBack = () => {
  emit('back')
}

const handleNext = () => {
  emit('next')
}

const handleSpecialAction = () => {
  emit('specialAction')
}
</script>

<template>
  <div class="wizard-navigation-footer">
    <!-- Botón Anterior -->
    <div class="nav-button nav-previous">
      <Button
        v-if="canGoBack"
        variant="outline"
        size="lg"
        :disabled="isLoading"
        @click="handleBack"
        class="nav-btn px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        <ArrowLeft class="w-4 h-4 mr-2" />
        <span class="hidden sm:inline">Anterior</span>
      </Button>

      <!-- Espaciador cuando no hay botón anterior -->
      <div v-else class="nav-spacer"></div>
    </div>

    <!-- Información central -->
    <div class="nav-center flex-1 text-center">
      <!-- Mensaje de validación -->
      <div v-if="!canGoNext && !isLastStep" class="validation-message flex items-center justify-center text-red-600">
        <AlertCircle class="w-4 h-4 mr-2" />
        <span class="text-sm">Completa todos los campos requeridos</span>
      </div>

      <!-- Mensaje de carga -->
      <div v-else-if="isLoading" class="loading-message flex items-center justify-center text-uniacc-blue">
        <div class="loading-spinner w-4 h-4 border-2 border-uniacc-blue border-t-transparent rounded-full animate-spin mr-2"></div>
        <span class="text-sm">{{ loadingText }}</span>
      </div>

      <!-- Información del paso -->
      <div v-else-if="stepInfo" class="step-info">
        <span class="step-text text-sm text-gray-600">{{ stepInfo }}</span>
      </div>
    </div>

    <!-- Botón Siguiente -->
    <div class="nav-button nav-next">
      <Button
        v-if="canGoNext"
        size="lg"
        :disabled="isLoading"
        @click="handleNext"
        class="nav-btn px-6 py-3 bg-uniacc-blue hover:bg-uniacc-blue-hover text-white"
      >
        <span class="hidden sm:inline">{{ buttonText }}</span>
        <span class="sm:hidden">{{ shortButtonText }}</span>

        <!-- Icono del botón -->
        <ArrowRight v-if="!isLastStep" class="w-4 h-4 ml-2" />
        <Check v-else class="w-4 h-4 ml-2" />
      </Button>

      <!-- Botón de acción especial -->
      <Button
        v-else-if="isLastStep && showSpecialAction"
        variant="outline"
        size="lg"
        :disabled="isLoading"
        @click="handleSpecialAction"
        class="nav-btn"
      >
        <Share class="w-4 h-4 mr-2" />
        <span class="hidden sm:inline">{{ specialActionText }}</span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
.wizard-navigation-footer {
  @apply flex items-center justify-between mt-0 pt-0;
}

.nav-button {
  @apply flex-1;
}

.nav-previous {
  @apply flex justify-start;
}

.nav-next {
  @apply flex justify-end;
}

.nav-btn {
  @apply min-w-[120px] transition-all duration-200;
}

.nav-btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
}

.nav-btn-primary:hover {
  @apply transform scale-105 shadow-lg;
}

.nav-btn:disabled {
  @apply opacity-50 cursor-not-allowed transform-none;
}

.nav-spacer {
  @apply w-[120px];
}

.nav-center {
  @apply flex-1 flex items-center justify-center px-4;
}

.validation-message {
  @apply flex items-center text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg;
}

.loading-message {
  @apply flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg;
}

.loading-spinner {
  @apply w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-2;
}

.step-info {
  @apply text-sm text-gray-600 text-center;
}

.step-text {
  @apply font-medium;
}

/* Animaciones */
.nav-btn {
  @apply transform transition-all duration-200;
}

.nav-btn:hover:not(:disabled) {
  @apply scale-105;
}

.nav-btn:active {
  @apply scale-95;
}

/* Responsive */
@media (max-width: 640px) {
  .wizard-navigation {
    @apply flex-col space-y-4;
  }

  .nav-button {
    @apply w-full;
  }

  .nav-previous {
    @apply justify-center;
  }

  .nav-next {
    @apply justify-center;
  }

  .nav-center {
    @apply order-first px-0;
  }

  .nav-btn {
    @apply w-full;
  }

  .wizard-navigation-footer {
    @apply flex flex-col items-center justify-between mt-0 pt-0;
  }

  .wizard-navigation-footer > div {
    @apply mt-2;
  }
}

@media (max-width: 480px) {
  .nav-btn {
    @apply min-w-[100px] text-sm;
  }

  .validation-message,
  .loading-message {
    @apply text-xs px-2 py-1;
  }
}

/* Estados especiales */
.nav-btn-primary:focus {
  @apply ring-2 ring-blue-500 ring-offset-2;
}

.nav-btn:focus {
  @apply ring-2 ring-gray-500 ring-offset-2;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .wizard-navigation {
    @apply border-gray-700;
  }

  .validation-message {
    @apply bg-red-900 text-red-200;
  }

  .loading-message {
    @apply bg-blue-900 text-blue-200;
  }

  .step-info {
    @apply text-gray-300;
  }
}
</style>
