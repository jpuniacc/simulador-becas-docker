<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { Input } from '@/components/ui/input'
import FormField from '@/components/ui/form-field.vue'
import { User, Mail } from 'lucide-vue-next'
import { useFormValidation } from '@/composables/useFormValidation'
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
  ...props.formData
})

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
  return !!(
    formData.value.nombre &&
    formData.value.apellido &&
    formData.value.email
  )
})

// Métodos
const handleSubmit = () => {
  // Validar todos los campos
  const fields = ['nombre', 'apellido', 'email']
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

// Emitir validación inicial
onMounted(() => {
  emit('validate', 1, isStepValid.value)
})
</script>

<template>
  <div class="welcome-step p-8 animate-fade-in min-h-full bg-white">
    <!-- Formulario -->
    <form @submit.prevent="handleSubmit" class="form max-w-2xl mx-auto">
      <div class="form-grid grid grid-cols-1 gap-8">
        <!-- Nombre -->
        <FormField
          label="¿Cuál es tu primer nombre?"
          :icon="User"
          :required="true"
          :error="getFieldErrorMessage('nombre')"
          :has-error="hasFieldError('nombre')"
        >
          <Input
            id="nombre"
            v-model="formData.nombre"
            type="text"
            placeholder="Tu nombre"
            class="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-1 focus:ring-uniacc-blue focus:border-uniacc-blue transition-all duration-200 group-hover:border-gray-300"
            :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': hasFieldError('nombre') }"
            @blur="validateField('nombre')"
            @keydown.enter="validateField('nombre')"
            aria-describedby="nombre-error"
            :aria-invalid="hasFieldError('nombre')"
          />
        </FormField>

        <!-- Apellido -->
        <FormField
          label="¿Cuál es tu apellido?"
          :icon="User"
          :required="true"
          :error="getFieldErrorMessage('apellido')"
          :has-error="hasFieldError('apellido')"
        >
          <Input
            id="apellido"
            v-model="formData.apellido"
            type="text"
            placeholder="Tu apellido"
            class="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-1 focus:ring-uniacc-blue focus:border-uniacc-blue transition-all duration-200 group-hover:border-gray-300"
            :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': hasFieldError('apellido') }"
            @blur="validateField('apellido')"
          />
        </FormField>

        <!-- Email -->
        <FormField
          label="¿Cuál es tu correo electrónico?"
          :icon="Mail"
          :required="true"
          :error="getFieldErrorMessage('email')"
          :has-error="hasFieldError('email')"
        >
          <Input
            id="email"
            v-model="formData.email"
            type="email"
            placeholder="tu@email.com"
            class="w-full px-4 py-4 border border-gray-200 rounded-lg focus:ring-1 focus:ring-uniacc-blue focus:border-uniacc-blue transition-all duration-200 group-hover:border-gray-300"
            :class="{ 'border-red-500 focus:ring-red-500 focus:border-red-500': hasFieldError('email') }"
            @blur="validateField('email')"
          />
        </FormField>
      </div>
    </form>

    <!-- Espaciado inferior para scroll -->
    <div class="h-8"></div>
  </div>
</template>

<style scoped>
.welcome-step {
  @apply min-h-full bg-white;
}

.form {
  @apply max-w-2xl mx-auto;
}

.form-grid {
  @apply grid grid-cols-1 gap-8;
}

/* Animaciones */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
