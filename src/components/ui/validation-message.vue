<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  message?: string
  type?: 'error' | 'warning' | 'info' | 'success'
  show?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  type: 'error',
  show: false
})

const messageClasses = computed(() => {
  const baseClasses = 'text-sm mt-1 transition-all duration-200'

  switch (props.type) {
    case 'error':
      return `${baseClasses} text-red-600`
    case 'warning':
      return `${baseClasses} text-yellow-600`
    case 'info':
      return `${baseClasses} text-blue-600`
    case 'success':
      return `${baseClasses} text-green-600`
    default:
      return `${baseClasses} text-red-600`
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-200 ease-out"
    enter-from-class="opacity-0 transform -translate-y-1"
    enter-to-class="opacity-100 transform translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 transform translate-y-0"
    leave-to-class="opacity-0 transform -translate-y-1"
  >
    <div
      v-if="show && message"
      :class="messageClasses"
      role="alert"
      aria-live="polite"
    >
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
/* Estilos adicionales si son necesarios */
</style>
