<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import FormField from '@/components/ui/form-field.vue'
import ValidationMessage from '@/components/ui/validation-message.vue'
import { Shield, User, Mail, Phone, CreditCard, Calendar, Flag } from 'lucide-vue-next'
import { useFormValidation } from '@/composables/useFormValidation'
import type { FormData, NacionalidadInfo } from '@/types/simulador'
import { formatRUT, cleanRUT } from '@/utils/formatters'

// Props
interface Props {
  formData: FormData
  nacionalidades: NacionalidadInfo[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  'update:form-data': [data: Partial<FormData>]
  validate: [step: number, isValid: boolean]
}>()

// Estado local
const formData = ref<FormData>({
  ...props.formData
})

const showPassport = ref(false)

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
const isStepValid = computed(() => {
  const valid = !!(
    formData.value.identificacion &&
    formData.value.telefono 
  )
  console.log('PersonalDataStep validation:', {
    identificacion: formData.value.identificacion,
    telefono: formData.value.telefono,
    isValid: valid
  })
  return valid
})

// Establecer tipo de identificación basado en el modo
const setTipoIdentificacion = () => {
  formData.value.tipoIdentificacion = showPassport.value ? 'pasaporte' : 'rut'
}

// Métodos
const handleIdentificacionInput = () => {
  // Formatear RUT automáticamente solo si no está en modo pasaporte
  if (!showPassport.value) {
    const clean = cleanRUT(formData.value.identificacion)
    if (clean.length >= 8) {
      const formatted = formatRUT(formData.value.identificacion)
      // Solo actualizar si el valor formateado es diferente
      if (formatted !== formData.value.identificacion) {
        formData.value.identificacion = formatted
      }
    }
  }
}

const handleSubmit = () => {
  // Validar todos los campos
  const fields = ['identificacion', 'telefono']
  fields.forEach(field => validateField(field))

  // Emitir datos actualizados
  emit('update:form-data', formData.value)

  // Emitir validación
  emit('validate', 1, isStepValid.value)
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
    emit('validate', 1, isStepValid.value)
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

// Watcher para actualizar tipo de identificación
watch(showPassport, () => {
  setTipoIdentificacion()
})

// Lifecycle
onMounted(() => {
  // Establecer tipo de identificación inicial
  setTipoIdentificacion()

  // Validar paso inicial
  emit('validate', 1, isStepValid.value)
})
</script>

<template>
  <div class="personal-data-step p-8 animate-fade-in min-h-full bg-white">
    <!-- Saludo personalizado -->
    <div class="welcome-message text-center mb-8">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">
        ¡Hola {{ formData.nombre }}! 👋
      </h2>
      <p class="text-gray-600 text-lg">
        El mundo universitario te está esperando, por favor introduce estos datos personales para seguir con la simulación
      </p>
    </div>

    <!-- Formulario -->
    <form @submit.prevent="handleSubmit" class="form max-w-2xl mx-auto">
      <div class="form-grid grid grid-cols-1 gap-8">
        <!-- RUT por defecto -->
        <div v-if="!showPassport" class="form-field">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            ¿Y cuál es tu RUT?
          </label>
          <Input
            id="identificacion"
            v-model="formData.identificacion"
            type="text"
            placeholder="12.345.678-9"
            class="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-1 focus:ring-uniacc-blue focus:border-uniacc-blue transition-all duration-200"
            :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': hasFieldError('identificacion') }"
            @blur="validateField('identificacion')"
            @input="handleIdentificacionInput"
          />
          <p class="text-sm text-gray-500 mt-2">Puedes utilizar un RUT provisorio</p>
          <button
            type="button"
            @click="showPassport = true"
            class="text-uniacc-blue text-sm font-medium mt-2 hover:underline"
          >
            No tengo RUT
          </button>
        </div>

        <!-- Pasaporte (si no tiene RUT) -->
        <div v-if="showPassport" class="form-field">
          <label class="block text-sm font-medium text-gray-700 mb-3">
            Déjanos tu número de pasaporte
          </label>
          <Input
            id="identificacion"
            v-model="formData.identificacion"
            type="text"
            placeholder="AB123456"
            class="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-1 focus:ring-uniacc-blue focus:border-uniacc-blue transition-all duration-200"
            :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': hasFieldError('identificacion') }"
            @blur="validateField('identificacion')"
          />
          <p class="text-sm text-gray-500 mt-2">Puedes utilizar un RUT provisorio</p>
          <button
            type="button"
            @click="showPassport = false"
            class="text-uniacc-blue text-sm font-medium mt-2 hover:underline"
          >
            Sí, tengo RUT
          </button>
        </div>

        <!-- Teléfono -->
        <FormField
          label="¿Cuál es tu teléfono?"
          :icon="Phone"
          :required="true"
          :error="getFieldErrorMessage('telefono')"
          :has-error="hasFieldError('telefono')"
        >
          <Input
            id="telefono"
            v-model="formData.telefono"
            type="tel"
            placeholder="+56 9 1234 5678"
            class="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-1 focus:ring-uniacc-blue focus:border-uniacc-blue transition-all duration-200 group-hover:border-gray-300"
            :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': hasFieldError('telefono') }"
            @blur="validateField('telefono')"
          />
        </FormField>

        
      </div>
    </form>

    <!-- Información adicional -->
    <div class="form-info mt-16 p-6 bg-gray-50 rounded-xl">
      <div class="info-card flex items-start space-x-4">
        <div class="info-icon flex-shrink-0">
          <div class="w-8 h-8 bg-uniacc-blue/10 rounded-lg flex items-center justify-center">
            <Shield class="w-4 h-4 text-uniacc-blue" />
          </div>
        </div>
        <div class="info-content">
          <h4 class="info-title text-lg font-semibold text-gray-900 mb-2">Tu privacidad es importante</h4>
          <p class="info-text text-gray-600 leading-relaxed">
            Toda la información que proporciones se mantiene confidencial y solo se utiliza
            para calcular tus beneficios. No compartimos tus datos con terceros.
          </p>
        </div>
      </div>
    </div>

    <!-- Espaciado inferior para scroll -->
    <div class="h-8"></div>
  </div>
</template>

<style scoped>
.personal-data-step {
  @apply min-h-full bg-white;
}

.form {
  @apply max-w-4xl mx-auto;
}

.form-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-6;
}

.radio-group {
  @apply flex space-x-6;
}

.radio-option {
  @apply flex items-center cursor-pointer;
}

.radio-label {
  @apply ml-3 text-sm font-medium text-gray-700 group-hover:text-uniacc-blue transition-colors;
}

.form-info {
  @apply mt-16 p-6 bg-gray-50 rounded-xl;
}

.info-card {
  @apply flex items-start space-x-4;
}

.info-icon {
  @apply flex-shrink-0;
}

.info-title {
  @apply text-lg font-semibold text-gray-900 mb-2;
}

.info-text {
  @apply text-gray-600 leading-relaxed;
}

/* Animaciones */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

.animate-slide-down {
  animation: slideDown 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .form-grid {
    @apply grid-cols-1;
  }

  .radio-group {
    @apply flex-col space-x-0 space-y-2;
  }
}
</style>
