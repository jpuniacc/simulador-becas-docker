<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-2xl font-bold mb-6">Prueba de Carreras</h1>

    <!-- Estado de carga -->
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-2 text-gray-600">Cargando carreras...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <p class="text-red-600">{{ error }}</p>
    </div>

    <!-- Carreras cargadas -->
    <div v-else>
      <div class="mb-6">
        <h2 class="text-lg font-semibold mb-2">Estadísticas</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-sm text-blue-600">Total Carreras</p>
            <p class="text-2xl font-bold text-blue-900">{{ carreras.length }}</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <p class="text-sm text-green-600">Carreras Vigentes</p>
            <p class="text-2xl font-bold text-green-900">{{ carrerasVigentes.length }}</p>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg">
            <p class="text-sm text-purple-600">Facultades</p>
            <p class="text-2xl font-bold text-purple-900">{{ facultades.length }}</p>
          </div>
        </div>
      </div>

      <!-- Búsqueda -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Buscar Carrera</label>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Escribe para buscar..."
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- Lista de carreras -->
      <div class="space-y-2">
        <div
          v-for="carrera in carrerasFiltradas"
          :key="carrera.id"
          class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">{{ carrera.nombre_carrera }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ carrera.descripcion_facultad }}</p>
              <div class="flex flex-wrap gap-2 mt-2">
                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {{ carrera.area_actual }}
                </span>
                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {{ carrera.nivel_global }}
                </span>
                <span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  {{ carrera.tipo_plan_carrera }}
                </span>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-gray-500">ID: {{ carrera.id }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje si no hay resultados -->
      <div v-if="carrerasFiltradas.length === 0" class="text-center py-8">
        <p class="text-gray-500">No se encontraron carreras con el término "{{ searchTerm }}"</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCarreras } from '@/composables/useCarreras'

const {
  carreras,
  carrerasVigentes,
  facultades,
  loading,
  error,
  inicializar,
  buscarCarreras
} = useCarreras()

const searchTerm = ref('')

const carrerasFiltradas = computed(() => {
  if (!searchTerm.value) return carrerasVigentes.value
  return buscarCarreras(searchTerm.value)
})

onMounted(async () => {
  await inicializar()
})
</script>
