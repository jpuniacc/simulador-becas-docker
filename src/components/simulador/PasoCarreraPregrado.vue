<script setup lang="ts">
/**
 * Paso 2 de pregrado (VOU v4, fase 3): buscador que abre un modal guiado
 * (carrera → financiamiento → motor de becas). Reemplaza a `CareerFinancing` SOLO en /simulador.
 * Mantiene el mismo contrato con Simulador2View: update:form-data, validation-change,
 * isFormValid, markAsSubmitted y getMissingFields.
 */
import { computed, onMounted, ref, watch } from 'vue'
import Button from 'primevue/button'
import { Search, GraduationCap, Pencil } from 'lucide-vue-next'
import ModalSimulacionCarrera from './ModalSimulacionCarrera.vue'
import { useCarreras } from '@/composables/useCarreras'
import { useDeciles } from '@/composables/useDeciles'
import {
  camposFaltantesPaso2,
  detalleCarrera,
  esEgresado,
  esPaso2Valido,
  estadoRespondido,
  paesRespondida,
  usaFinanciamiento,
  validarPaso2,
  MENSAJES_PASO2,
  type EstadoPaso2
} from '@/utils/pasoCarrera'
import type { FormData } from '@/types/simulador'

interface Props {
  formData?: Partial<FormData>
}
const props = withDefaults(defineProps<Props>(), { formData: () => ({}) })

const emit = defineEmits<{
  'update:form-data': [data: Partial<FormData>]
  'validation-change': [isValid: boolean]
  'ver-resultados': []
}>()

const { carrerasVigentes, loading: carrerasLoading, inicializar: inicializarCarreras } = useCarreras()
const { deciles, loading: decilesLoading, error: decilesError, cargarDeciles, formatearRango } = useDeciles()

const modalVisible = ref(false)
const pasoInicial = ref<1 | 2 | 3>(1)
const consultaInicial = ref('')
const consulta = ref('')
const submitted = ref(false)

// Extranjero que reside fuera del país: solo carreras Online (misma regla que el paso 2 anterior)
const soloOnline = computed(() => props.formData?.extranjero === true && props.formData?.residencia_chilena === false)

const carreras = computed(() => carrerasVigentes.value as any[])
const decilesOptions = computed(() => deciles.value.map((d) => ({ label: formatearRango(d), value: d.decil as number })))

const estado = computed<EstadoPaso2>(() => ({
  carrera: props.formData?.carrera,
  carreraId: props.formData?.carreraId,
  nivelEducativo: props.formData?.nivelEducativo,
  rendioPAES: props.formData?.rendioPAES,
  paesRespondido: props.formData?.paesRespondido,
  paes: props.formData?.paes,
  usaFinanciamientoEstado: props.formData?.usaFinanciamientoEstado,
  planeaUsarCAE: props.formData?.planeaUsarCAE,
  usaBecasEstado: props.formData?.usaBecasEstado,
  decil: props.formData?.decil
}))

const isFormValid = computed(() => esPaso2Valido(estado.value))
const errores = computed(() => (submitted.value ? validarPaso2(estado.value) : {}))

const carreraElegida = computed(() => carreras.value.find((c) => c.id === props.formData?.carreraId) ?? null)
const tieneCarrera = computed(() => !!props.formData?.carrera && !!props.formData?.carreraId)
const aplicaFinanciamiento = computed(() => esEgresado(props.formData?.nivelEducativo))

const textoPaes = computed(() => {
  const e = estado.value
  if (!paesRespondida(e)) return 'Sin responder'
  if (!e.rendioPAES) return 'No'
  return `Sí · Comprensión Lectora ${e.paes?.lenguaje ?? '—'} · Matemática 1 ${e.paes?.matematica ?? '—'}`
})

const textoEstado = computed(() => {
  const e = estado.value
  if (!estadoRespondido(e)) return 'Sin responder'
  if (!usaFinanciamiento(e)) return 'No'
  const tipos = [e.planeaUsarCAE ? 'CAE' : '', e.usaBecasEstado ? 'Becas ministeriales' : ''].filter(Boolean).join(' y ')
  const d = deciles.value.find((x) => x.decil === e.decil)
  return `Sí · ${tipos || 'sin tipo seleccionado'}${d ? ` · Renta ${formatearRango(d)}` : ''}`
})

const abrir = (paso: 1 | 2 | 3 = 1, consultaTexto = '') => {
  pasoInicial.value = paso
  consultaInicial.value = consultaTexto
  modalVisible.value = true
}

const buscar = () => abrir(1, consulta.value.trim())

const alConfirmar = (datos: Partial<FormData>) => emit('update:form-data', datos)

// Si cambia el filtro de extranjero y la carrera elegida ya no corresponde, se limpia
watch(
  () => [props.formData?.extranjero, props.formData?.residencia_chilena],
  () => {
    if (!soloOnline.value || !carreraElegida.value) return
    if ((carreraElegida.value.modalidad_programa || '').toLowerCase().trim() !== 'online') {
      emit('update:form-data', { carrera: '', carreraId: 0 })
    }
  }
)

watch(isFormValid, (v) => emit('validation-change', v), { immediate: true })

const markAsSubmitted = () => {
  submitted.value = true
}

const getMissingFields = (): string[] => camposFaltantesPaso2(estado.value)

onMounted(async () => {
  await Promise.all([inicializarCarreras(), cargarDeciles()])
})

defineExpose({ isFormValid, markAsSubmitted, getMissingFields })
</script>

<template>
  <div class="pc" data-testid="paso-carrera-pregrado">
    <!-- Sin carrera: el buscador es el CTA del paso -->
    <section v-if="!tieneCarrera" class="pc-buscador" aria-labelledby="pc-cta">
      <h2 id="pc-cta" class="pc-cta">¿Qué carrera quieres simular?</h2>
      <form class="pc-form" role="search" @submit.prevent="buscar">
        <div class="pc-campo" :class="{ 'pc-campo-error': !!errores.carrera }">
          <Search class="pc-campo-icono" aria-hidden="true" />
          <input
            v-model="consulta"
            type="search"
            class="pc-input"
            placeholder="Busca tu carrera…"
            autocomplete="off"
            enterkeyhint="search"
            aria-label="Busca tu carrera"
            :aria-invalid="!!errores.carrera"
            aria-describedby="pc-error"
            data-testid="buscador-input"
          />
          <Button type="submit" label="Buscar" class="pc-buscar" data-testid="buscador-boton" />
        </div>
      </form>
      <p v-if="errores.carrera" id="pc-error" class="pc-error" role="alert" data-testid="error-carrera-paso">
        {{ MENSAJES_PASO2.carrera }}
      </p>
    </section>

    <!-- Con carrera: tarjeta + respuestas con opción de editar -->
    <section v-else class="pc-elegida" aria-labelledby="pc-elegida-titulo" data-testid="carrera-elegida">
      <div class="pc-card">
        <div class="pc-card-cabecera">
          <GraduationCap class="pc-card-icono" aria-hidden="true" />
          <div class="pc-card-texto">
            <p class="pc-etiqueta">Carrera que quieres simular</p>
            <h2 id="pc-elegida-titulo" class="pc-card-nombre">{{ formData.carrera }}</h2>
            <p class="pc-card-detalle">{{ detalleCarrera(carreraElegida) }}</p>
          </div>
          <Button type="button" label="Cambiar" icon="pi pi-pencil" severity="secondary" size="small" text data-testid="cambiar-carrera" @click="abrir(1)" />
        </div>
      </div>

      <div class="pc-card pc-respuestas" data-testid="resumen-respuestas">
        <div class="pc-card-cabecera">
          <div class="pc-card-texto">
            <h3 class="pc-sub">Tus respuestas</h3>
          </div>
          <Button type="button" label="Editar" severity="secondary" size="small" text data-testid="editar-respuestas" @click="abrir(2)">
            <template #icon><Pencil class="pc-lapiz" aria-hidden="true" /></template>
          </Button>
        </div>
        <p v-if="!aplicaFinanciamiento" class="pc-noaplica">No necesitamos más datos para tu nivel educativo.</p>
        <dl v-else class="pc-lista">
          <div class="pc-fila">
            <dt>¿Rendiste la PAES?</dt>
            <dd :class="{ 'pc-pendiente': !!errores.paes || textoPaes === 'Sin responder' }" data-testid="resp-paes">{{ textoPaes }}</dd>
          </div>
          <div class="pc-fila">
            <dt>Financiamiento del Estado</dt>
            <dd :class="{ 'pc-pendiente': !!errores.estado || textoEstado === 'Sin responder' }" data-testid="resp-estado">{{ textoEstado }}</dd>
          </div>
        </dl>
        <p v-if="submitted && !isFormValid && tieneCarrera" class="pc-error" role="alert" data-testid="error-respuestas">
          Completa tus respuestas para ver los resultados.
          <button type="button" class="pc-enlace" @click="abrir(2)">Completar ahora</button>
        </p>
      </div>
    </section>

    <ModalSimulacionCarrera
      v-model:visible="modalVisible"
      :start-step="pasoInicial"
      :consulta-inicial="consultaInicial"
      :form-data="formData"
      :carreras="carreras"
      :carreras-loading="carrerasLoading"
      :deciles-options="decilesOptions"
      :deciles-loading="decilesLoading"
      :deciles-error="decilesError"
      :solo-online="soloOnline"
      @commit="alConfirmar"
      @ver-resultados="emit('ver-resultados')"
    />
  </div>
</template>

<style scoped>
.pc { width: 100%; max-width: 40rem; margin: 0 auto; padding: 0.5rem 1rem; }
.pc-buscador { border-radius: 0.75rem; background: #f1f5f9; padding: 1rem; }
.pc-cta { font-size: 1.125rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem; }
.pc-campo { display: flex; align-items: center; gap: 0.5rem; border: 1px solid #94a3b8; border-radius: 0.5rem; background: #fff; padding: 0.25rem 0.25rem 0.25rem 0.75rem; }
.pc-campo:focus-within { border-color: #1a3b66; box-shadow: 0 0 0 2px rgba(26, 59, 102, 0.25); }
.pc-campo-error { border-color: #dc2626; }
.pc-campo-icono { width: 1.125rem; height: 1.125rem; color: #64748b; flex: none; }
.pc-input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; padding: 0.625rem 0; font-size: 1rem; color: #0f172a; }
.pc-buscar { flex: none; min-height: 2.5rem; }
.pc-error { margin-top: 0.5rem; font-size: 0.875rem; font-weight: 600; color: #b91c1c; }
.pc-card { border: 1px solid #cbd5e1; border-radius: 0.75rem; background: #fff; padding: 1rem; }
.pc-respuestas { margin-top: 0.75rem; }
.pc-card-cabecera { display: flex; align-items: flex-start; gap: 0.75rem; }
.pc-card-icono { width: 1.5rem; height: 1.5rem; color: #1a3b66; flex: none; margin-top: 0.125rem; }
.pc-card-texto { flex: 1; min-width: 0; }
.pc-etiqueta { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #64748b; }
.pc-card-nombre { font-size: 1.25rem; font-weight: 700; color: #1a3b66; line-height: 1.2; }
.pc-card-detalle { font-size: 0.875rem; color: #64748b; margin-top: 0.125rem; }
.pc-sub { font-size: 1rem; font-weight: 700; color: #0f172a; }
.pc-lapiz { width: 1rem; height: 1rem; }
.pc-lista { margin-top: 0.5rem; }
.pc-fila { padding: 0.5rem 0; border-top: 1px solid #e2e8f0; }
.pc-fila dt { font-size: 0.8125rem; color: #64748b; }
.pc-fila dd { margin: 0; font-weight: 600; color: #0f172a; }
.pc-pendiente { color: #b45309 !important; }
.pc-noaplica { margin-top: 0.5rem; font-size: 0.9375rem; color: #475569; }
.pc-enlace { border: 0; background: none; color: #1a3b66; text-decoration: underline; font-weight: 700; cursor: pointer; }
</style>

<!-- Modo oscuro: sin "scoped" para que la clase html.dark gane a los estilos claros -->
<style>
html.dark .pc-buscador { background: #1e293b; }
html.dark .pc-cta, html.dark .pc-sub, html.dark .pc-fila dd { color: #f1f5f9; }
html.dark .pc-campo, html.dark .pc-card { background: #0f172a; border-color: #475569; }
html.dark .pc-input { color: #f1f5f9; }
html.dark .pc-card-nombre, html.dark .pc-card-icono { color: #bfdbfe; }
html.dark .pc-etiqueta, html.dark .pc-card-detalle, html.dark .pc-fila dt, html.dark .pc-noaplica { color: #cbd5e1; }
html.dark .pc-fila { border-color: #334155; }
html.dark .pc-error { color: #fca5a5; }
html.dark .pc-pendiente { color: #fbbf24 !important; }
html.dark .pc-enlace { color: #bfdbfe; }
</style>
