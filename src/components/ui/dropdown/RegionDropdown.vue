<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronDown, MapPin } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Region } from '@/composables/useColegios'

// Props
interface Props {
  modelValue?: Region | null
  regions: Region[]
  placeholder?: string
  disabled?: boolean
  error?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  regions: () => [],
  placeholder: 'Selecciona la Región',
  disabled: false,
  error: '',
  class: ''
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Region | null]
  'change': [value: Region | null]
}>()

// Estado local
const isOpen = ref(false)
const searchTerm = ref('')
const selectedRegion = ref<Region | null>(props.modelValue || null)

// Computed
const filteredRegions = computed(() => {
  const regions = props.regions || []

  // Filtrar si hay término de búsqueda
  const filtered = searchTerm.value
    ? regions.filter(region =>
        region.region_nombre.toLowerCase().includes(searchTerm.value.toLowerCase())
      )
    : regions

  // Ordenar: Región Metropolitana primero (ID 13 o nombre contiene "Metropolitana")
  return [...filtered].sort((a, b) => {
    const aIsMetro = a.region_id === 13 || a.region_nombre.toLowerCase().includes('metropolitana')
    const bIsMetro = b.region_id === 13 || b.region_nombre.toLowerCase().includes('metropolitana')

    if (aIsMetro && !bIsMetro) return -1
    if (!aIsMetro && bIsMetro) return 1
    return 0
  })
})

const displayValue = computed(() => {
  return selectedRegion.value?.region_nombre || props.placeholder
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

const selectRegion = (region: Region) => {
  selectedRegion.value = region
  emit('update:modelValue', region)
  emit('change', region)
  isOpen.value = false
  searchTerm.value = ''
}

const clearSelection = () => {
  selectedRegion.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.region-dropdown')) {
    isOpen.value = false
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  selectedRegion.value = newValue || null
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
  <div class="region-dropdown relative" :class="props.class">
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
          selectedRegion ? 'text-gray-900' : 'text-gray-500'
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
            placeholder="Buscar región..."
            class="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-uniacc-blue focus:border-uniacc-blue"
            @click.stop
          />
        </div>

        <!-- Options List -->
        <div class="max-h-64 overflow-y-auto">
          <div
            v-if="filteredRegions.length === 0"
            class="px-4 py-3 text-sm text-gray-500 text-center"
          >
            {{ searchTerm ? 'No se encontraron regiones' : 'No hay regiones disponibles' }}
          </div>

          <button
            v-for="region in filteredRegions"
            :key="region.region_id"
            type="button"
            @click="selectRegion(region)"
            :class="cn(
              'w-full px-4 py-3 text-left text-sm transition-colors duration-150',
              'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
              selectedRegion?.region_id === region.region_id
                ? 'bg-uniacc-blue/10 text-uniacc-blue font-medium'
                : 'text-gray-900'
            )"
          >
            <div class="flex items-center space-x-2">
              <MapPin class="w-4 h-4 text-gray-400" />
              <span>{{ region.region_nombre }}</span>
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
.region-dropdown {
  @apply relative;
}
</style>
