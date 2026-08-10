<template>
  <div class="form-field">
    <!-- Label -->
    <label
      v-if="label"
      :for="id"
      class="form-label flex items-center gap-2 text-sm font-medium text-gray-900 mb-2"
    >
      <!-- Icono -->
      <component
        v-if="icon"
        :is="icon"
        class="w-4 h-4 text-gray-600"
      />
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Contenido del campo -->
    <div class="relative">
      <slot />
    </div>

    <!-- Mensaje de error -->
    <ValidationMessage
      v-if="hasError && error"
      :message="error"
      :id="`${id}-error`"
    />

    <!-- Mensaje de ayuda -->
    <div
      v-if="help && !hasError"
      class="mt-1 text-sm text-gray-500"
      :id="`${id}-help`"
    >
      <slot name="help">
        {{ help }}
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import ValidationMessage from './validation-message.vue'

interface Props {
  label?: string
  icon?: unknown
  required?: boolean
  error?: string
  hasError?: boolean
  help?: string
  id?: string
}

withDefaults(defineProps<Props>(), {
  required: false,
  hasError: false,
  id: 'field'
})

defineSlots<{
  default: unknown
  help?: unknown
}>()
</script>

<style scoped>
.form-field {
  @apply space-y-1;
}

.form-label {
  @apply text-sm font-medium text-gray-900;
}

:global(html.dark) .form-label {
  @apply text-gray-100;
}

:global(html.dark) .form-field {
  @apply text-gray-100;
}
</style>
