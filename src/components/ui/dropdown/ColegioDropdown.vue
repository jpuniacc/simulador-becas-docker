<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronDown, School, Search } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
import type { Colegio } from '@/composables/useColegios'

// Props
interface Props {
  modelValue?: Colegio | null
  colegios: Colegio[]
  placeholder?: string
  disabled?: boolean
  error?: string
  class?: string
  onSearch?: (term: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  colegios: () => [],
  placeholder: 'Busca tu colegio...',
  disabled: false,
  error: '',
  class: '',
  onSearch: () => {}
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: Colegio | null]
  'change': [value: Colegio | null]
  'search': [term: string]
}>()

// Estado local
const isOpen = ref(false)
const searchTerm = ref('')
const selectedColegio = ref<Colegio | null>(props.modelValue || null)

// Computed
const filteredColegios = computed(() => {
  if (!searchTerm.value) return props.colegios || []
  return (props.colegios || []).filter(colegio =>
    colegio.nombre.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
    (colegio.nombre_corto && colegio.nombre_corto.toLowerCase().includes(searchTerm.value.toLowerCase()))
  )
})

const displayValue = computed(() => {
  return selectedColegio.value?.nombre || props.placeholder
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

const selectColegio = (colegio: Colegio) => {
  selectedColegio.value = colegio
  emit('update:modelValue', colegio)
  emit('change', colegio)
  isOpen.value = false
  searchTerm.value = ''
}

const clearSelection = () => {
  selectedColegio.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleSearch = (term: string) => {
  searchTerm.value = term
  emit('search', term)
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!target.closest('.colegio-dropdown')) {
    isOpen.value = false
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  selectedColegio.value = newValue || null
})

watch(searchTerm, (newTerm) => {
  if (newTerm.length >= 2) {
    handleSearch(newTerm)
  }
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
  <div class="colegio-dropdown relative" :class="props.class">
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
        <School class="w-4 h-4 text-gray-500" />
        <span :class="cn(
          'text-sm',
          selectedColegio ? 'text-gray-900' : 'text-gray-500'
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
        class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg max-h-96 overflow-hidden"
      >
        <!-- Search Input -->
        <div class="p-2 border-b border-gray-100">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              v-model="searchTerm"
              type="text"
              placeholder="Buscar colegio..."
              class="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-uniacc-blue focus:border-uniacc-blue"
              @click.stop
            />
          </div>
        </div>

        <!-- Options List -->
        <div class="max-h-80 overflow-y-auto">
          <div
            v-if="filteredColegios.length === 0"
            class="px-4 py-3 text-sm text-gray-500 text-center"
          >
            {{ searchTerm ? 'No se encontraron colegios' : 'No hay colegios disponibles' }}
          </div>

          <button
            v-for="colegio in filteredColegios"
            :key="colegio.id"
            type="button"
            @click="selectColegio(colegio)"
            :class="cn(
              'w-full px-4 py-3 text-left text-sm transition-colors duration-150',
              'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
              selectedColegio?.id === colegio.id
                ? 'bg-uniacc-blue/10 text-uniacc-blue font-medium'
                : 'text-gray-900'
            )"
          >
            <div class="flex items-start space-x-3">
              <School class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 truncate">
                  {{ colegio.nombre }}
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  <span class="inline-block px-2 py-1 bg-gray-100 rounded-full mr-2">
                    {{ colegio.dependencia }}
                  </span>
                  <span v-if="colegio.tipo_educacion" class="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {{ colegio.tipo_educacion }}
                  </span>
                </div>
                <div v-if="colegio.direccion" class="text-xs text-gray-400 mt-1 truncate">
                  {{ colegio.direccion }}
                </div>
              </div>
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
.colegio-dropdown {
  @apply relative;
}
</style>
