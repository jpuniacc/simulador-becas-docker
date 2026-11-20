<script setup lang="ts">
/**
 * Autocompletado de carrera (combobox con lista de sugerencias, estilo Google).
 * - Sugiere desde la primera letra, sin tildes ni mayúsculas, por cualquier palabra; primero las que empiezan igual.
 * - Resalta en negrita lo que coincide. Cada sugerencia es UNA carrera (id propio), por eso las jornadas
 *   (Diurno / Vespertino / Online) se ven por separado y el arancel sigue saliendo por id.
 * - Teclado: ↑ ↓ mueven, Enter elige, Esc cierra la lista. El foco nunca sale del campo (aria-activedescendant).
 * No escribe en ninguna parte: solo avisa al padre qué carrera se eligió.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Search, Check, X } from 'lucide-vue-next'
import { detalleCarrera, resaltarCoincidencias, sugerirCarreras, type CarreraBuscable } from '@/utils/pasoCarrera'
import { TEXTOS_RESUMEN } from '@/utils/resumenPregrado'

type CarreraOpcion = CarreraBuscable & { id: number }

interface Props {
  modelValue: string
  carreras: CarreraOpcion[]
  carreraId?: number
  soloOnline?: boolean
  cargando?: boolean
  error?: string
  inputId?: string
  placeholder?: string
  ariaLabel?: string
  describedby?: string
  testid?: string
  autofocus?: boolean
  /** En móvil, al enfocar acerca el campo al borde superior para que el teclado no tape las sugerencias. */
  acercarAlEnfocar?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  carreraId: 0,
  soloOnline: false,
  cargando: false,
  error: '',
  inputId: 'ca-input',
  placeholder: 'Busca tu carrera…',
  ariaLabel: 'Busca tu carrera',
  describedby: undefined,
  testid: 'buscador-input',
  autofocus: false,
  acercarAlEnfocar: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  seleccionar: [carrera: CarreraOpcion]
}>()

const MAX_SUGERENCIAS = 8

const inputRef = ref<HTMLInputElement | null>(null)
const listaRef = ref<HTMLElement | null>(null)
const activo = ref(-1)
const cerrado = ref(false)
/** En móvil el alto de la lista se limita al espacio visible bajo el campo (el teclado ocupa el resto). */
const altoMax = ref<string | undefined>(undefined)

const listaId = computed(() => `${props.inputId}-lista`)
const opcionId = (i: number) => `${props.inputId}-op-${i}`

const todas = computed(() => sugerirCarreras(props.carreras, props.modelValue, props.soloOnline))
const sugerencias = computed(() => todas.value.slice(0, MAX_SUGERENCIAS))
const hayConsulta = computed(() => props.modelValue.trim().length > 0)
const visible = computed(() => hayConsulta.value && !cerrado.value)
const expandido = computed(() => visible.value && !props.cargando && sugerencias.value.length > 0)

const anuncio = computed(() => {
  if (!visible.value || props.cargando) return ''
  const n = todas.value.length
  if (!n) return 'No encontramos esa carrera.'
  return n === 1 ? '1 sugerencia disponible.' : `${n} sugerencias disponibles. Usa las flechas arriba y abajo para recorrerlas.`
})

watch(() => props.modelValue, () => { activo.value = -1 })

watch(activo, async (i) => {
  if (i < 0) return
  await nextTick()
  listaRef.value?.querySelector<HTMLElement>(`#${CSS.escape(opcionId(i))}`)?.scrollIntoView?.({ block: 'nearest' })
})

const elegir = (c: CarreraOpcion) => {
  emit('seleccionar', c)
  emit('update:modelValue', c.nombre_programa)
  cerrado.value = true
  activo.value = -1
}

const onInput = (e: Event) => {
  cerrado.value = false
  activo.value = -1
  emit('update:modelValue', (e.target as HTMLInputElement).value)
  nextTick(ajustarAlto)
}

const esMovil = () => window.innerWidth <= 640

const ajustarAlto = () => {
  const campo = inputRef.value?.closest('.ca-campo') as HTMLElement | null
  if (!campo || !esMovil()) { altoMax.value = undefined; return }
  const visible = () => window.visualViewport?.height ?? window.innerHeight
  let libre = visible() - campo.getBoundingClientRect().bottom - 24
  if (libre < 176 && props.acercarAlEnfocar) {
    // Poco espacio bajo el campo: lo sube al borde superior para que las sugerencias no queden tapadas por el teclado
    campo.scrollIntoView?.({ block: 'start' })
    libre = visible() - campo.getBoundingClientRect().bottom - 24
  }
  altoMax.value = `${Math.round(Math.max(128, Math.min(352, libre)))}px`
}

const onFocus = () => {
  cerrado.value = false
  nextTick(ajustarAlto)
}

onMounted(() => window.visualViewport?.addEventListener('resize', ajustarAlto))
onBeforeUnmount(() => window.visualViewport?.removeEventListener('resize', ajustarAlto))
watch(expandido, (v) => { if (v) nextTick(ajustarAlto) })

const onBlur = () => { cerrado.value = true; activo.value = -1 }

const onKeydown = (e: KeyboardEvent) => {
  const n = sugerencias.value.length
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      if (!hayConsulta.value || !n) return
      cerrado.value = false
      activo.value = activo.value + 1 >= n ? 0 : activo.value + 1
      break
    case 'ArrowUp':
      e.preventDefault()
      if (!hayConsulta.value || !n) return
      cerrado.value = false
      activo.value = activo.value <= 0 ? n - 1 : activo.value - 1
      break
    case 'Enter':
      if (!expandido.value) return
      if (activo.value >= 0) { e.preventDefault(); elegir(sugerencias.value[activo.value]) }
      else if (n === 1) { e.preventDefault(); elegir(sugerencias.value[0]) }
      break
    case 'Escape':
      // Si la lista está abierta, Esc solo la cierra (no cierra el modal que la contiene)
      if (visible.value) { e.preventDefault(); e.stopPropagation(); cerrado.value = true; activo.value = -1 }
      break
  }
}

const limpiar = () => {
  emit('update:modelValue', '')
  cerrado.value = false
  activo.value = -1
  inputRef.value?.focus()
}

const enfocar = () => inputRef.value?.focus()
defineExpose({ enfocar })
</script>

<template>
  <div class="ca" data-testid="autocompletar-carrera">
    <div class="ca-campo" :class="{ 'ca-campo-error': !!error }">
      <Search class="ca-icono" aria-hidden="true" />
      <input
        :id="inputId"
        ref="inputRef"
        :value="modelValue"
        :autofocus="autofocus"
        type="text"
        role="combobox"
        class="ca-input"
        :placeholder="placeholder"
        :aria-label="ariaLabel"
        aria-autocomplete="list"
        :aria-expanded="expandido"
        :aria-controls="listaId"
        :aria-activedescendant="expandido && activo >= 0 ? opcionId(activo) : undefined"
        :aria-invalid="!!error"
        :aria-describedby="describedby"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
        enterkeyhint="search"
        :data-testid="testid"
        @input="onInput"
        @keydown="onKeydown"
        @focus="onFocus"
        @blur="onBlur"
      />
      <button v-if="modelValue" type="button" class="ca-borrar" aria-label="Borrar búsqueda" data-testid="buscador-borrar" @mousedown.prevent @click="limpiar">
        <X class="ca-borrar-icono" aria-hidden="true" />
      </button>
      <slot name="accion" />
    </div>

    <p class="ca-sr" role="status" aria-live="polite">{{ anuncio }}</p>

    <p v-if="visible && cargando" class="ca-estado">Cargando carreras…</p>

    <ul
      v-show="expandido"
      :id="listaId"
      ref="listaRef"
      class="ca-lista"
      :style="{ maxHeight: altoMax }"
      role="listbox"
      aria-label="Sugerencias de carreras"
      data-testid="lista-carreras"
    >
      <li
        v-for="(c, i) in sugerencias"
        :id="opcionId(i)"
        :key="c.id"
        role="option"
        class="ca-opcion"
        :class="{ 'ca-opcion-activa': i === activo, 'ca-opcion-elegida': c.id === carreraId }"
        :aria-selected="i === activo"
        :data-carrera-id="c.id"
        @mousedown.prevent
        @click="elegir(c)"
      >
        <span class="ca-texto">
          <span class="ca-nombre">
            <template v-for="(t, k) in resaltarCoincidencias(c.nombre_programa, modelValue)" :key="k">
              <strong v-if="t.coincide" class="ca-coincide">{{ t.texto }}</strong><template v-else>{{ t.texto }}</template>
            </template>
          </span>
          <span class="ca-detalle">
            <template v-for="(t, k) in resaltarCoincidencias(detalleCarrera(c), modelValue)" :key="k">
              <strong v-if="t.coincide" class="ca-coincide">{{ t.texto }}</strong><template v-else>{{ t.texto }}</template>
            </template>
          </span>
        </span>
        <Check v-if="c.id === carreraId" class="ca-check" aria-hidden="true" />
      </li>
      <li v-if="todas.length > sugerencias.length" class="ca-mas" role="presentation" data-testid="mas-resultados">
        Mostrando {{ sugerencias.length }} de {{ todas.length }}. Sigue escribiendo para afinar la búsqueda.
      </li>
    </ul>

    <div v-if="visible && !cargando && !todas.length" class="ca-vacio" role="status" data-testid="sin-resultados">
      <p class="ca-vacio-titulo">No encontramos esa carrera</p>
      <p>
        Revisa cómo la escribiste o prueba con otra palabra. Si no la ves, escríbenos a
        <a :href="`mailto:${TEXTOS_RESUMEN.email}`" @mousedown.prevent>{{ TEXTOS_RESUMEN.email }}</a>
        o llámanos al
        <template v-for="(t, i) in TEXTOS_RESUMEN.telefonos" :key="t.tel">
          <template v-if="i > 0"> ó al </template><a :href="`tel:${t.tel}`" @mousedown.prevent>{{ t.texto }}</a>
        </template>.
      </p>
    </div>
  </div>
</template>

<style scoped>
.ca { width: 100%; }
.ca-campo { display: flex; align-items: center; gap: 0.5rem; border: 1px solid #94a3b8; border-radius: 0.5rem; background: #fff; padding: 0.25rem 0.25rem 0.25rem 0.75rem; }
.ca-campo:focus-within { border-color: #1a3b66; box-shadow: 0 0 0 2px rgba(26, 59, 102, 0.25); }
.ca-campo-error { border-color: #dc2626; }
.ca-icono { width: 1.125rem; height: 1.125rem; color: #64748b; flex: none; }
.ca-input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; padding: 0.625rem 0; font-size: 1rem; color: #0f172a; }
.ca-borrar { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; border: 0; border-radius: 999px; background: transparent; color: #64748b; cursor: pointer; }
.ca-borrar:hover { background: #e2e8f0; }
.ca-borrar-icono { width: 1.125rem; height: 1.125rem; }
.ca-sr { position: absolute; width: 1px; height: 1px; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.ca-estado { margin-top: 0.75rem; font-size: 0.9375rem; color: #475569; }
.ca-lista { list-style: none; margin: 0.5rem 0 0; padding: 0.25rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; background: #fff; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12); max-height: min(22rem, 45dvh); overflow-y: auto; overscroll-behavior: contain; }
.ca-opcion { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; min-height: 3rem; padding: 0.5rem 0.75rem; border-radius: 0.375rem; cursor: pointer; color: #0f172a; }
.ca-opcion:hover { background: #f1f5f9; }
.ca-opcion-activa, .ca-opcion-activa:hover { background: #e0e9f6; box-shadow: inset 3px 0 0 #1a3b66; }
.ca-opcion-elegida .ca-nombre { color: #1a3b66; }
.ca-texto { display: flex; flex-direction: column; min-width: 0; }
.ca-nombre { font-weight: 400; line-height: 1.3; overflow-wrap: anywhere; }
.ca-detalle { font-size: 0.8125rem; color: #475569; line-height: 1.3; overflow-wrap: anywhere; }
.ca-coincide { font-weight: 700; color: #0f172a; }
.ca-check { width: 1.25rem; height: 1.25rem; flex: none; color: #1a3b66; }
.ca-mas { padding: 0.5rem 0.75rem; font-size: 0.8125rem; color: #64748b; border-top: 1px solid #e2e8f0; margin-top: 0.25rem; }
.ca-vacio { margin-top: 0.5rem; border: 1px solid #fcd34d; background: #fffbeb; border-radius: 0.5rem; padding: 0.75rem; font-size: 0.875rem; color: #78350f; overflow-wrap: anywhere; }
.ca-vacio-titulo { font-weight: 700; font-size: 0.9375rem; margin-bottom: 0.25rem; }
.ca-vacio a { color: #1a3b66; font-weight: 700; text-decoration: underline; }
</style>

<!-- Modo oscuro: sin "scoped" para que la clase html.dark gane a los estilos claros -->
<style>
html.dark .ca-campo { background: #0f172a; border-color: #475569; }
html.dark .ca-input { color: #f1f5f9; }
html.dark .ca-icono, html.dark .ca-borrar { color: #cbd5e1; }
html.dark .ca-borrar:hover { background: #334155; }
html.dark .ca-estado, html.dark .ca-detalle { color: #cbd5e1; }
html.dark .ca-lista { background: #0f172a; border-color: #475569; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); }
html.dark .ca-opcion { color: #f1f5f9; }
html.dark .ca-opcion:hover { background: #1e293b; }
html.dark .ca-opcion-activa, html.dark .ca-opcion-activa:hover { background: #1e3a5f; box-shadow: inset 3px 0 0 #93c5fd; }
html.dark .ca-opcion-elegida .ca-nombre, html.dark .ca-check { color: #bfdbfe; }
html.dark .ca-coincide { color: #ffffff; }
html.dark .ca-mas { color: #cbd5e1; border-color: #334155; }
html.dark .ca-vacio { background: #422006; border-color: #92400e; color: #fde68a; }
html.dark .ca-vacio a { color: #bfdbfe; }
</style>
