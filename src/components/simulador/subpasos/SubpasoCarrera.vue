<script setup lang="ts">
/** Sub-step 1 del modal: selección de carrera con autocompletado (jornada y duración visibles en cada sugerencia). */
import { computed, ref } from 'vue'
import { Check } from 'lucide-vue-next'
import Message from 'primevue/message'
import CarreraAutocompletar from '../CarreraAutocompletar.vue'
import { detalleCarrera, type CarreraBuscable } from '@/utils/pasoCarrera'

interface Props {
  carreras: Array<CarreraBuscable & { id: number }>
  carreraId: number
  cargando?: boolean
  soloOnline?: boolean
  error?: string
  consulta: string
  autofocusBusqueda?: boolean
}

const props = withDefaults(defineProps<Props>(), { cargando: false, soloOnline: false, error: '' })
const emit = defineEmits<{
  'update:consulta': [value: string]
  seleccionar: [carrera: CarreraBuscable & { id: number }]
}>()

const sugeridas = ['Danza', 'Psicología', 'Ingeniería Comercial']
const autoRef = ref<InstanceType<typeof CarreraAutocompletar> | null>(null)

const elegida = computed(() => props.carreras.find((c) => c.id === props.carreraId) ?? null)

const usarEjemplo = (s: string) => {
  emit('update:consulta', s)
  autoRef.value?.enfocar()
}

const enfocar = () => autoRef.value?.enfocar()
defineExpose({ enfocar })
</script>

<template>
  <div class="sp-carrera" data-testid="subpaso-carrera">
    <label class="sp-titulo" for="msc-busqueda">¿Qué carrera quieres simular?</label>

    <CarreraAutocompletar
      ref="autoRef"
      input-id="msc-busqueda"
      testid="modal-busqueda-input"
      :model-value="consulta"
      :carreras="carreras"
      :carrera-id="carreraId"
      :solo-online="soloOnline"
      :cargando="cargando"
      :error="error"
      :autofocus="autofocusBusqueda"
      :describedby="error ? 'msc-error-carrera' : 'msc-ayuda-carrera'"
      @update:model-value="emit('update:consulta', $event)"
      @seleccionar="emit('seleccionar', $event)"
    />
    <p id="msc-ayuda-carrera" class="sp-ayuda">Escribe el nombre y elige una opción. Cada una muestra su jornada y duración.</p>
    <p v-if="error" id="msc-error-carrera" class="sp-error" role="alert" data-testid="error-carrera">{{ error }}</p>

    <Message v-if="soloOnline" severity="info" variant="simple" size="small" class="sp-online">
      Como extranjero que resides fuera del país, solo puedes acceder a carreras en modalidad online.
    </Message>

    <div v-if="!consulta" class="sp-sugeridas">
      <span class="sp-sugeridas-label">Ejemplos:</span>
      <button v-for="s in sugeridas" :key="s" type="button" class="sp-chip" @click="usarEjemplo(s)">{{ s }}</button>
    </div>

    <section v-if="elegida" class="sp-elegida" aria-label="Carrera seleccionada" data-testid="carrera-seleccionada">
      <Check class="sp-elegida-icono" aria-hidden="true" />
      <div class="sp-elegida-texto">
        <p class="sp-elegida-etiqueta">Carrera seleccionada</p>
        <p class="sp-elegida-nombre">{{ elegida.nombre_programa }}</p>
        <p class="sp-elegida-detalle">{{ detalleCarrera(elegida) }}</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.sp-titulo { display: block; font-size: 1.125rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }
.sp-ayuda { margin-top: 0.375rem; font-size: 0.8125rem; color: #64748b; }
.sp-error { margin-top: 0.375rem; font-size: 0.875rem; font-weight: 600; color: #b91c1c; }
.sp-online { margin-top: 0.5rem; }
.sp-sugeridas { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 0.75rem; }
.sp-sugeridas-label { font-size: 0.8125rem; color: #64748b; }
.sp-chip { border: 1px solid #cbd5e1; border-radius: 999px; background: #f8fafc; padding: 0.375rem 0.875rem; min-height: 2.25rem; font-size: 0.875rem; color: #1a3b66; cursor: pointer; }
.sp-chip:hover { background: #e2e8f0; }
.sp-elegida { display: flex; align-items: flex-start; gap: 0.625rem; margin-top: 0.875rem; border: 1px solid #1a3b66; border-radius: 0.5rem; background: #e8eef7; padding: 0.75rem; }
.sp-elegida-icono { width: 1.25rem; height: 1.25rem; flex: none; color: #1a3b66; margin-top: 0.125rem; }
.sp-elegida-texto { min-width: 0; }
.sp-elegida-etiqueta { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #475569; }
.sp-elegida-nombre { font-weight: 700; color: #1a3b66; line-height: 1.25; }
.sp-elegida-detalle { font-size: 0.8125rem; color: #475569; }
</style>

<!-- Modo oscuro: sin "scoped" para que la clase html.dark gane a los estilos claros -->
<style>
html.dark .sp-titulo { color: #f1f5f9; }
html.dark .sp-ayuda, html.dark .sp-sugeridas-label { color: #cbd5e1; }
html.dark .sp-error { color: #fca5a5; }
html.dark .sp-chip { background: #1e293b; border-color: #475569; color: #bfdbfe; }
html.dark .sp-elegida { background: #1e3a5f; border-color: #93c5fd; }
html.dark .sp-elegida-icono, html.dark .sp-elegida-nombre { color: #bfdbfe; }
html.dark .sp-elegida-etiqueta, html.dark .sp-elegida-detalle { color: #cbd5e1; }
</style>
