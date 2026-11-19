<script setup lang="ts">
/** Sub-step 1 del modal: selección de carrera con búsqueda y opciones con modalidad y duración. */
import { computed, nextTick, ref } from 'vue'
import { Search, ChevronRight, Check } from 'lucide-vue-next'
import Message from 'primevue/message'
import { detalleCarrera, filtrarCarreras, type CarreraBuscable } from '@/utils/pasoCarrera'

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
const listaRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)

const resultados = computed(() => filtrarCarreras(props.carreras, props.consulta, props.soloOnline))

const moverFoco = (delta: number, desde: HTMLElement) => {
  const items = Array.from(listaRef.value?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])
  const i = items.indexOf(desde)
  const destino = items[i + delta]
  if (destino) destino.focus()
  else if (delta < 0) inputRef.value?.focus()
}

const onTeclaLista = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement
  if (e.key === 'ArrowDown') { e.preventDefault(); moverFoco(1, t) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moverFoco(-1, t) }
}

const onTeclaInput = (e: KeyboardEvent) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    nextTick(() => listaRef.value?.querySelector<HTMLElement>('[role="option"]')?.focus())
  }
}

const enfocar = () => inputRef.value?.focus()
defineExpose({ enfocar })
</script>

<template>
  <div class="sp-carrera" data-testid="subpaso-carrera">
    <label class="sp-titulo" for="msc-busqueda">¿Qué carrera quieres simular?</label>

    <div class="sp-busqueda" :class="{ 'sp-busqueda-error': !!error }">
      <Search class="sp-busqueda-icono" aria-hidden="true" />
      <input
        id="msc-busqueda"
        ref="inputRef"
        :autofocus="autofocusBusqueda"
        :value="consulta"
        type="search"
        class="sp-busqueda-input"
        placeholder="Busca tu carrera…"
        autocomplete="off"
        enterkeyhint="search"
        :aria-invalid="!!error"
        :aria-describedby="error ? 'msc-error-carrera' : 'msc-ayuda-carrera'"
        @input="emit('update:consulta', ($event.target as HTMLInputElement).value)"
        @keydown="onTeclaInput"
      />
    </div>
    <p id="msc-ayuda-carrera" class="sp-ayuda">Busca por nombre de carrera. Cada opción muestra su modalidad y duración.</p>
    <p v-if="error" id="msc-error-carrera" class="sp-error" role="alert" data-testid="error-carrera">{{ error }}</p>

    <Message v-if="soloOnline" severity="info" variant="simple" size="small" class="sp-online">
      Como extranjero que resides fuera del país, solo puedes acceder a carreras en modalidad online.
    </Message>

    <div v-if="!consulta" class="sp-sugeridas">
      <span class="sp-sugeridas-label">Ejemplos:</span>
      <button v-for="s in sugeridas" :key="s" type="button" class="sp-chip" @click="emit('update:consulta', s)">{{ s }}</button>
    </div>

    <p v-if="cargando" class="sp-estado" role="status">Cargando carreras…</p>

    <ul
      v-else-if="resultados.length"
      ref="listaRef"
      class="sp-lista"
      role="listbox"
      aria-label="Carreras disponibles"
      data-testid="lista-carreras"
      @keydown="onTeclaLista"
    >
      <li v-for="c in resultados" :key="c.id" role="presentation">
        <button
          type="button"
          role="option"
          class="sp-opcion"
          :class="{ 'sp-opcion-activa': c.id === carreraId }"
          :aria-selected="c.id === carreraId"
          :data-carrera-id="c.id"
          @click="emit('seleccionar', c)"
        >
          <span class="sp-opcion-texto">
            <span class="sp-opcion-nombre">{{ c.nombre_programa }}</span>
            <span class="sp-opcion-detalle">{{ detalleCarrera(c) }}</span>
          </span>
          <Check v-if="c.id === carreraId" class="sp-opcion-icono" aria-hidden="true" />
          <ChevronRight v-else class="sp-opcion-icono sp-opcion-flecha" aria-hidden="true" />
        </button>
      </li>
    </ul>

    <p v-else class="sp-estado" role="status" data-testid="sin-resultados">
      No encontramos carreras para «{{ consulta }}». Prueba con otra palabra.
    </p>
  </div>
</template>

<style scoped>
.sp-titulo { display: block; font-size: 1.125rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }
.sp-busqueda { display: flex; align-items: center; gap: 0.5rem; border: 1px solid #94a3b8; border-radius: 0.5rem; padding: 0 0.75rem; background: #fff; }
.sp-busqueda:focus-within { border-color: #1a3b66; box-shadow: 0 0 0 2px rgba(26, 59, 102, 0.25); }
.sp-busqueda-error { border-color: #dc2626; }
.sp-busqueda-icono { width: 1.125rem; height: 1.125rem; color: #64748b; flex: none; }
.sp-busqueda-input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; padding: 0.75rem 0; font-size: 1rem; color: #0f172a; }
.sp-ayuda { margin-top: 0.375rem; font-size: 0.8125rem; color: #64748b; }
.sp-error { margin-top: 0.375rem; font-size: 0.875rem; font-weight: 600; color: #b91c1c; }
.sp-online { margin-top: 0.5rem; }
.sp-sugeridas { display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; margin-top: 0.75rem; }
.sp-sugeridas-label { font-size: 0.8125rem; color: #64748b; }
.sp-chip { border: 1px solid #cbd5e1; border-radius: 999px; background: #f8fafc; padding: 0.25rem 0.75rem; font-size: 0.8125rem; color: #1a3b66; cursor: pointer; }
.sp-chip:hover { background: #e2e8f0; }
.sp-lista { list-style: none; margin: 0.75rem 0 0; padding: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.sp-opcion { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 0.75rem; text-align: left; border: 1px solid #cbd5e1; border-radius: 0.5rem; background: #fff; padding: 0.75rem 0.875rem; cursor: pointer; color: #0f172a; }
.sp-opcion:hover { background: #f1f5f9; }
.sp-opcion:focus-visible { outline: 2px solid #1a3b66; outline-offset: 2px; }
.sp-opcion-activa { border-color: #1a3b66; background: #e8eef7; }
.sp-opcion-texto { display: flex; flex-direction: column; min-width: 0; }
.sp-opcion-nombre { font-weight: 700; }
.sp-opcion-detalle { font-size: 0.8125rem; color: #475569; }
.sp-opcion-icono { width: 1.25rem; height: 1.25rem; flex: none; color: #1a3b66; }
.sp-opcion-flecha { color: #94a3b8; }
.sp-estado { margin-top: 1rem; font-size: 0.9375rem; color: #475569; }
</style>

<!-- Modo oscuro: sin "scoped" para que la clase html.dark gane a los estilos claros -->
<style>
html.dark .sp-titulo { color: #f1f5f9; }
html.dark .sp-busqueda { background: #0f172a; border-color: #475569; }
html.dark .sp-busqueda-input { color: #f1f5f9; }
html.dark .sp-ayuda, html.dark .sp-sugeridas-label, html.dark .sp-estado, html.dark .sp-opcion-detalle { color: #cbd5e1; }
html.dark .sp-error { color: #fca5a5; }
html.dark .sp-chip { background: #1e293b; border-color: #475569; color: #bfdbfe; }
html.dark .sp-opcion { background: #0f172a; border-color: #475569; color: #f1f5f9; }
html.dark .sp-opcion:hover { background: #1e293b; }
html.dark .sp-opcion-activa { background: #1e3a5f; border-color: #93c5fd; }
html.dark .sp-opcion-icono { color: #bfdbfe; }
</style>
