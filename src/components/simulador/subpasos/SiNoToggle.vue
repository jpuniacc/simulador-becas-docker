<script setup lang="ts">
/** Respuesta Sí / No de un toque (radiogroup accesible). */
defineProps<{
  modelValue: boolean | undefined
  labelledby: string
  describedby?: string
  invalid?: boolean
  testid?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>

<template>
  <div class="sn" role="radiogroup" :aria-labelledby="labelledby" :aria-describedby="describedby" :data-testid="testid">
    <button
      type="button"
      role="radio"
      class="sn-btn"
      :class="{ 'sn-on': modelValue === true, 'sn-invalid': invalid }"
      :aria-checked="modelValue === true"
      @click="emit('update:modelValue', true)"
    >Sí</button>
    <button
      type="button"
      role="radio"
      class="sn-btn"
      :class="{ 'sn-on': modelValue === false, 'sn-invalid': invalid }"
      :aria-checked="modelValue === false"
      @click="emit('update:modelValue', false)"
    >No</button>
  </div>
</template>

<style scoped>
.sn { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
.sn-btn { border: 1px solid #94a3b8; border-radius: 0.375rem; background: #fff; padding: 0.75rem 0.5rem; font-size: 1rem; font-weight: 700; color: #1a3b66; cursor: pointer; min-height: 2.75rem; }
.sn-btn:hover { background: #f1f5f9; }
.sn-btn:focus-visible { outline: 2px solid #1a3b66; outline-offset: 2px; }
.sn-on { background: #4b8fc4; border-color: #4b8fc4; color: #fff; }
.sn-on:hover { background: #3f80b3; }
.sn-invalid:not(.sn-on) { border-color: #dc2626; }
</style>

<!-- Modo oscuro: sin "scoped" para que la clase html.dark gane a los estilos claros -->
<style>
html.dark .sn-btn { background: #0f172a; border-color: #475569; color: #e2e8f0; }
html.dark .sn-btn:hover { background: #1e293b; }
html.dark .sn-on, html.dark .sn-on:hover { background: #2f6fa5; border-color: #93c5fd; color: #fff; }
</style>
