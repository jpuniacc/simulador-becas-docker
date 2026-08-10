<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ChevronDown, Search, MapPin } from 'lucide-vue-next'
import { cn } from '@/lib/utils'

// Props
interface Props {
  modelValue?: any
  options: any[]
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  error?: string
  class?: string
  searchable?: boolean
  icon?: any
  displayKey?: string
  valueKey?: string
  maxHeight?: string
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  placeholder: 'Selecciona una opción',
  searchPlaceholder: 'Buscar...',
  disabled: false,
  error: '',
  class: '',
  searchable: true,
  icon: MapPin,
  displayKey: 'nombre',
  valueKey: 'id',
  maxHeight: '320px'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: any]
  'change': [value: any]
  'search': [term: string]
}>()

// Estado local
const isOpen = ref(false)
const searchTerm = ref('')
const selectedOption = ref<any>(null)
const dropdownRef = ref<HTMLElement | null>(null)
const triggerRef = ref<HTMLElement | null>(null)
const dropdownPosition = ref({ top: 0, left: 0, width: 0 })

// Computed
const filteredOptions = computed(() => {
  if (!searchTerm.value) return props.options
  return props.options.filter(option => {
    const displayValue = option[props.displayKey] || option
    return displayValue.toLowerCase().includes(searchTerm.value.toLowerCase())
  })
})

const displayValue = computed(() => {
  if (selectedOption.value) {
    return selectedOption.value[props.displayKey] || selectedOption.value
  }
  return props.placeholder
})

const hasError = computed(() => !!props.error)

// Métodos
const toggleDropdown = async () => {
  if (props.disabled) return

  if (!isOpen.value) {
    await nextTick()
    calculatePosition()
  }

  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchTerm.value = ''
  }
}

const calculatePosition = () => {
  if (!triggerRef.value) return

  const rect = triggerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const dropdownHeight = 320 // maxHeight en px
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top

  // Determinar si mostrar arriba o abajo
  const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

  dropdownPosition.value = {
    top: showAbove ? rect.top - dropdownHeight - 8 : rect.bottom + 8,
    left: rect.left,
    width: rect.width
  }
}

const selectOption = (option: any) => {
  selectedOption.value = option
  emit('update:modelValue', option)
  emit('change', option)
  isOpen.value = false
  searchTerm.value = ''
}

const clearSelection = () => {
  selectedOption.value = null
  emit('update:modelValue', null)
  emit('change', null)
}

const handleSearch = (term: string) => {
  searchTerm.value = term
  emit('search', term)
}

const handleClickOutside = (event: Event) => {
  const target = event.target as HTMLElement
  if (!dropdownRef.value?.contains(target) && !triggerRef.value?.contains(target)) {
    isOpen.value = false
  }
}

const handleScroll = () => {
  if (isOpen.value) {
    calculatePosition()
  }
}

const handleResize = () => {
  if (isOpen.value) {
    calculatePosition()
  }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
  selectedOption.value = newValue || null
})

watch(searchTerm, (newTerm) => {
  if (newTerm.length >= 2) {
    handleSearch(newTerm)
  }
})

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="world-class-dropdown relative" :class="props.class">
    <!-- Trigger Button -->
    <button
      ref="triggerRef"
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
      <div class="flex items-center space-x-2 min-w-0 flex-1">
        <component
          :is="props.icon"
          class="w-4 h-4 text-gray-500 flex-shrink-0"
        />
        <span :class="cn(
          'text-sm truncate',
          selectedOption ? 'text-gray-900' : 'text-gray-500'
        )">
          {{ displayValue }}
        </span>
      </div>

      <ChevronDown
        :class="cn(
          'w-4 h-4 text-gray-500 transition-transform duration-200 flex-shrink-0',
          isOpen && 'rotate-180'
        )"
      />
    </button>

    <!-- Dropdown Menu -->
    <Teleport to="body">
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
          ref="dropdownRef"
          class="fixed z-[9999] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl overflow-hidden"
          :style="{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            maxHeight: props.maxHeight
          }"
        >
          <!-- Search Input -->
          <div v-if="searchable" class="p-3 border-b border-gray-100 dark:border-slate-600 sticky top-0 bg-white dark:bg-slate-800">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                v-model="searchTerm"
                type="text"
                :placeholder="searchPlaceholder"
                class="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-uniacc-blue focus:border-uniacc-blue"
                @click.stop
                @focus.stop
              />
            </div>
          </div>

          <!-- Options List -->
          <div class="overflow-y-auto" :style="{ maxHeight: `calc(${props.maxHeight} - ${searchable ? '60px' : '0px'})` }">
            <div
              v-if="filteredOptions.length === 0"
              class="px-4 py-6 text-sm text-gray-500 text-center"
            >
              {{ searchTerm ? 'No se encontraron opciones' : 'No hay opciones disponibles' }}
            </div>

            <button
              v-for="(option, index) in filteredOptions"
              :key="option[valueKey] || index"
              type="button"
              @click="selectOption(option)"
              :class="cn(
                'w-full px-4 py-3 text-left text-sm transition-colors duration-150',
                'hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                'flex items-center space-x-3',
                selectedOption?.[valueKey] === option[valueKey]
                  ? 'bg-uniacc-blue/10 text-uniacc-blue font-medium'
                  : 'text-gray-900'
              )"
            >
              <component
                :is="props.icon"
                class="w-4 h-4 text-gray-400 flex-shrink-0"
              />
              <span class="truncate">{{ option[displayKey] || option }}</span>
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Error Message -->
    <div v-if="hasError" class="mt-1 text-sm text-red-600">
      {{ error }}
    </div>
  </div>
</template>

<style scoped>
.world-class-dropdown {
  @apply relative;
}

/* Smooth scrolling */
.overflow-y-auto {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
