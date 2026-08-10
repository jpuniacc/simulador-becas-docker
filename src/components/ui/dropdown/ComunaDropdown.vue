<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronDown, MapPin } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Comuna } from '@/composables/useColegios'

// Props
interface Props {
  modelValue?: Comuna | null
  comunas: Comuna[]
  placeholder?: string
  disabled?: boolean
  error?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  comunas: () => [],
  placeholder: 'Selecciona tu comuna',
  disabled: false,
  error: '',
  class: ''
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Comuna | null]
  'change': [value: Comuna | null]
}>()

// Estado local
const isOpen = ref(false)
const searchTerm = ref('')
const selectedComuna = ref<Comuna | null>(props.modelValue || null)

// Computed
const filteredComunas = computed(() => {
  if (!searchTerm.value) return props.comunas || []
  return (props.comunas || []).filter(comuna =>
    comuna.comuna_nombre.toLowerCase().includes(searchTerm.value.toLowerCase())
  )
})

const displayValue = computed(() => {
  return selectedComuna.value?.comuna_nombre || props.placeholder
})

const hasError = computed(() => !!props.error)

// Métodos
const toggleDropdown = () => {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchTerm.value = ''
  }
}

const selectComuna = (comuna: Comuna) => {
  selectedComuna.value = comuna
  emit('update:modelValue', comuna)
  emit('change', comuna)
  isOpen.value = false
  searchTerm.value = ''
}

const clearSelection = () => {
  selectedComuna.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.comuna-dropdown')) {
    isOpen.value = false
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  selectedComuna.value = newValue || null
})

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div class="comuna-dropdown relative" :class="props.class">
    <!-- Trigger Button -->
    <button
      type="button"
      :disabled="disabled"
      @click="toggleDropdown"
      :class="cn(
        'w-full px-4 py-3 text-left border rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-uniacc-blue focus:border-uniacc-blue',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'flex items-center justify-between',
        hasError
          ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
          : 'border-gray-200 hover:border-gray-300',
        isOpen && 'border-uniacc-blue ring-1 ring-uniacc-blue'
      )"
    >
      <div class="flex items-center space-x-2">
        <MapPin class="w-4 h-4 text-gray-500" />
        <span :class="cn(
          'text-sm',
          selectedComuna ? 'text-gray-900' : 'text-gray-500'
        )">
          {{ displayValue }}
        </span>
      </div>

      <ChevronDown
        :class="cn(
          'w-4 h-4 text-gray-500 transition-transform duration-200',
          isOpen && 'rotate-180'
        )"
      />
    </button>

    <!-- Dropdown Menu -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-80 overflow-hidden"
      >
        <!-- Search Input -->
        <div class="p-2 border-b border-gray-100">
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Buscar comuna..."
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-uniacc-blue focus:border-uniacc-blue"
            @click.stop
          />
        </div>

        <!-- Options List -->
        <div class="max-h-64 overflow-y-auto">
          <div
            v-if="filteredComunas.length === 0"
            class="px-4 py-3 text-sm text-gray-500 text-center"
          >
            {{ searchTerm ? 'No se encontraron comunas' : 'No hay comunas disponibles' }}
          </div>

          <button
            v-for="comuna in filteredComunas"
            :key="comuna.comuna_id"
            type="button"
            @click="selectComuna(comuna)"
            :class="cn(
              'w-full px-4 py-3 text-left text-sm transition-colors duration-150',
              'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
              selectedComuna?.comuna_id === comuna.comuna_id
                ? 'bg-uniacc-blue/10 text-uniacc-blue font-medium'
                : 'text-gray-900'
            )"
          >
            <div class="flex items-center space-x-2">
              <MapPin class="w-4 h-4 text-gray-400" />
              <span>{{ comuna.comuna_nombre }}</span>
            </div>
          </button>
        </div>
      </div>
    </Transition>

    <!-- Error Message -->
    <div v-if="hasError" class="mt-1 text-sm text-red-600">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.comuna-dropdown {
  @apply relative;
}
</style>
