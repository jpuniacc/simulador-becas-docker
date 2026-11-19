<script setup lang="ts">
import { OPCIONES_CUOTAS } from '@/utils/resumenPregrado'

defineProps<{ modelValue: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
</script>

<template>
  <div class="selector-cuotas" role="radiogroup" aria-label="Número de cuotas">
    <button
      v-for="n in OPCIONES_CUOTAS"
      :key="n"
      type="button"
      role="radio"
      :aria-checked="modelValue === n"
      :data-testid="`cuota-${n}`"
      class="cuota-btn"
      :class="{ 'cuota-btn-on': modelValue === n }"
      @click="emit('update:modelValue', n)"
    >
      <span class="cuota-num">{{ n }}</span>
      <span class="cuota-sub">{{ n === 1 ? 'contado' : 'cuotas' }}</span>
    </button>
  </div>
</template>

<style scoped>
.selector-cuotas {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.375rem;
}

.cuota-btn {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  border: 2px solid #cbd5e1;
  background: #fff;
  padding: 0.5rem 0.25rem;
  color: #1e293b;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}

.cuota-btn:hover {
  border-color: #1a3b66;
}

.cuota-btn:focus-visible {
  outline: 3px solid #93c5fd;
  outline-offset: 2px;
}

.cuota-btn-on {
  border-color: #1a3b66;
  background: #1a3b66;
  color: #fff;
}

.cuota-num {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.2;
}

.cuota-sub {
  font-size: 0.6875rem;
  line-height: 1.1;
  opacity: 0.85;
}
</style>

<!-- Modo oscuro: sin "scoped" para que la clase html.dark gane a los estilos claros -->
<style>
html.dark .cuota-btn {
  background: #1e293b;
  border-color: #475569;
  color: #e2e8f0;
}

html.dark .cuota-btn-on {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}
</style>
