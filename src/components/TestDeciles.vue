<template>
  <div class="p-8 max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Prueba de Deciles UNIACC</h1>

    <Card class="mb-8">
      <CardHeader>
        <CardTitle>Estadísticas de Deciles</CardTitle>
        <CardDescription>Información general sobre los deciles cargados.</CardDescription>
      </CardHeader>
      <CardContent>
        <div v-if="simuladorStore.decilesLoading" class="text-center py-4">
          <p class="text-gray-600 dark:text-gray-400">Cargando estadísticas...</p>
        </div>
        <div v-else-if="simuladorStore.decilesError" class="text-red-500 py-4">
          Error: {{ simuladorStore.decilesError }}
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg shadow-sm">
            <p class="text-sm font-medium text-blue-700 dark:text-blue-200">Total Deciles</p>
            <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">{{ simuladorStore.decilesFromSupabase.length }}</p>
          </div>
          <div class="bg-green-50 dark:bg-green-900 p-4 rounded-lg shadow-sm">
            <p class="text-sm font-medium text-green-700 dark:text-green-200">Rango Mínimo</p>
            <p class="text-2xl font-bold text-green-900 dark:text-green-100">
              ${{ simuladorStore.decilesFromSupabase.length > 0 ? simuladorStore.decilesFromSupabase[0].rango_ingreso_min.toLocaleString('es-CL') : '0' }}
            </p>
          </div>
          <div class="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg shadow-sm">
            <p class="text-sm font-medium text-purple-700 dark:text-purple-200">Rango Máximo</p>
            <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">
              ${{ simuladorStore.decilesFromSupabase.length > 0 ? simuladorStore.decilesFromSupabase[simuladorStore.decilesFromSupabase.length - 1].rango_ingreso_max.toLocaleString('es-CL') : '0' }}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Test de Dropdown -->
    <Card class="mb-8">
      <CardHeader>
        <CardTitle>Test de Dropdown de Deciles</CardTitle>
        <CardDescription>Prueba el dropdown que se usará en el simulador.</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rango de Ingresos *
            </label>
            <select
              v-model="decilSeleccionado"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
            >
              <option value="">Selecciona rango</option>
              <option
                v-for="decil in simuladorStore.decilesFromSupabase"
                :key="decil.id"
                :value="decil.decil"
              >
                {{ simuladorStore.formatearRango(decil) }}
              </option>
            </select>
          </div>

          <div v-if="decilSeleccionado" class="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h4 class="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Decil {{ decilSeleccionado }} seleccionado
            </h4>
            <div class="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p><strong>Rango:</strong> {{ simuladorStore.formatearRango(decilSeleccionadoInfo) }}</p>
              <p><strong>Descripción:</strong> {{ decilSeleccionadoInfo?.descripcion }}</p>
              <p><strong>Descripción Corta:</strong> {{ decilSeleccionadoInfo?.descripcion_corta }}</p>
              <p><strong>% Población:</strong> {{ decilSeleccionadoInfo?.porcentaje_poblacion }}%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Lista de Deciles -->
    <div v-if="simuladorStore.decilesLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-uniacc-blue mx-auto"></div>
      <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">Cargando deciles...</p>
    </div>
    <div v-else-if="simuladorStore.decilesError" class="text-red-500 text-center py-8">
      <p class="text-xl">Error al cargar los deciles: {{ simuladorStore.decilesError }}</p>
    </div>
    <div v-else-if="simuladorStore.decilesFromSupabase.length === 0" class="text-center py-8">
      <p class="text-xl text-gray-500 dark:text-gray-400">No se encontraron deciles.</p>
    </div>
    <div v-else class="grid grid-cols-1 gap-4">
      <Card v-for="decil in simuladorStore.decilesFromSupabase" :key="decil.id" class="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle class="text-uniacc-blue dark:text-uniacc-light-blue">
            Decil {{ decil.decil }}
          </CardTitle>
          <CardDescription class="dark:text-gray-300">
            {{ decil.descripcion_corta }}
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-2 text-gray-700 dark:text-gray-200">
          <p><strong>Rango de Ingresos:</strong> {{ simuladorStore.formatearRango(decil) }}</p>
          <p><strong>Descripción:</strong> {{ decil.descripcion }}</p>
          <p><strong>% Población:</strong> {{ decil.porcentaje_poblacion }}%</p>
          <div class="flex flex-wrap gap-2 mt-2">
            <Badge variant="secondary" class="dark:bg-gray-700 dark:text-gray-100">
              Orden: {{ decil.orden_visual }}
            </Badge>
            <Badge :variant="decil.activo ? 'default' : 'destructive'" class="dark:bg-gray-700 dark:text-gray-100">
              {{ decil.activo ? 'Activo' : 'Inactivo' }}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useSimuladorStore } from '@/stores/simuladorStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const simuladorStore = useSimuladorStore()

const decilSeleccionado = ref<number | null>(null)

const decilSeleccionadoInfo = computed(() => {
  if (!decilSeleccionado.value) return null
  return simuladorStore.decilesFromSupabase.find(d => d.decil === decilSeleccionado.value) || null
})

onMounted(async () => {
  if (simuladorStore.decilesFromSupabase.length === 0) {
    await simuladorStore.loadDecilesFromSupabase()
  }
})
</script>
