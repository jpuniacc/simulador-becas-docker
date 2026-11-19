<script setup lang="ts">
/**
 * Sub-step 2 del modal: PAES (Sí/No + puntajes) y financiamiento del Estado
 * (Sí/No → CAE / Becas ministeriales + tramo de renta) con la nota de requisitos.
 */
import { computed } from 'vue'
import Dropdown from 'primevue/dropdown'
import { Info, TrendingUp, CheckCircle } from 'lucide-vue-next'
import SiNoToggle from './SiNoToggle.vue'
import { TEXTOS_MODAL } from '@/utils/resumenPregrado'
import { RANGO_PAES, type ErroresPaso2 } from '@/utils/pasoCarrera'

export interface BorradorFinanciamiento {
  rendioPAES: boolean
  paesRespondido: boolean
  lenguaje: number | null
  matematica: number | null
  usaFinanciamientoEstado: boolean | undefined
  planeaUsarCAE: boolean
  usaBecasEstado: boolean
  decil: number | null
}

const props = defineProps<{
  modelValue: BorradorFinanciamiento
  /** Solo los egresados responden estas preguntas. */
  aplica: boolean
  errores: ErroresPaso2
  decilesOptions: Array<{ label: string; value: number }>
  decilesLoading?: boolean
  decilesError?: string | null
}>()
const emit = defineEmits<{ 'update:modelValue': [value: BorradorFinanciamiento] }>()

const set = (patch: Partial<BorradorFinanciamiento>) => emit('update:modelValue', { ...props.modelValue, ...patch })

const setPaes = (v: boolean) =>
  set(v ? { rendioPAES: true, paesRespondido: true } : { rendioPAES: false, paesRespondido: true, lenguaje: null, matematica: null })

const setEstado = (v: boolean) =>
  set(v ? { usaFinanciamientoEstado: true } : { usaFinanciamientoEstado: false, planeaUsarCAE: false, usaBecasEstado: false, decil: null })

const aNumero = (e: Event): number | null => {
  const raw = (e.target as HTMLInputElement).value
  if (raw === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? Math.round(n) : null
}

const decil = computed({
  get: () => props.modelValue.decil,
  set: (v: number | null) => set({ decil: v })
})
const hayErroresOpciones = computed(() => !!props.errores.opciones)
</script>

<template>
  <div class="sf" data-testid="subpaso-financiamiento">
    <h3 class="sf-titulo">Financiamiento</h3>
    <p class="sf-sub">Dos preguntas para orientarte sobre las alternativas que podrían aplicar en tu caso.</p>

    <p v-if="!aplica" class="sf-noaplica" data-testid="financiamiento-no-aplica">
      Por tu nivel educativo no necesitamos estos datos. Puedes continuar.
    </p>

    <template v-else>
      <!-- PAES -->
      <section class="sf-bloque" aria-labelledby="sf-q-paes">
        <p id="sf-q-paes" class="sf-pregunta">¿Rendiste la PAES?</p>
        <p id="sf-h-paes" class="sf-ayuda">{{ TEXTOS_MODAL.ayudaPaes }}</p>
        <SiNoToggle
          :model-value="modelValue.paesRespondido ? modelValue.rendioPAES : undefined"
          labelledby="sf-q-paes"
          describedby="sf-h-paes"
          :invalid="!!errores.paes"
          testid="paes-toggle"
          @update:model-value="setPaes"
        />
        <p v-if="errores.paes" class="sf-error" role="alert" data-testid="error-paes">{{ errores.paes }}</p>

        <div v-if="modelValue.rendioPAES" class="sf-puntajes">
          <div class="sf-campo">
            <label for="sf-lenguaje" class="sf-label">Comprensión Lectora *</label>
            <input
              id="sf-lenguaje"
              type="number"
              inputmode="numeric"
              class="sf-input"
              :class="{ 'sf-input-error': !!errores.lenguaje }"
              :min="RANGO_PAES.min"
              :max="RANGO_PAES.max"
              placeholder="Ej: 700"
              :value="modelValue.lenguaje ?? ''"
              :aria-invalid="!!errores.lenguaje"
              aria-describedby="sf-ayuda-lenguaje"
              @input="set({ lenguaje: aNumero($event) })"
            />
            <p id="sf-ayuda-lenguaje" class="sf-ayuda">{{ errores.lenguaje ? '' : TEXTOS_MODAL.ayudaPuntaje }}</p>
            <p v-if="errores.lenguaje" class="sf-error" role="alert" data-testid="error-lenguaje">{{ errores.lenguaje }}</p>
          </div>
          <div class="sf-campo">
            <label for="sf-matematica" class="sf-label">Matemática 1 *</label>
            <input
              id="sf-matematica"
              type="number"
              inputmode="numeric"
              class="sf-input"
              :class="{ 'sf-input-error': !!errores.matematica }"
              :min="RANGO_PAES.min"
              :max="RANGO_PAES.max"
              placeholder="Ej: 650"
              :value="modelValue.matematica ?? ''"
              :aria-invalid="!!errores.matematica"
              aria-describedby="sf-ayuda-matematica"
              @input="set({ matematica: aNumero($event) })"
            />
            <p id="sf-ayuda-matematica" class="sf-ayuda">{{ errores.matematica ? '' : TEXTOS_MODAL.ayudaPuntaje }}</p>
            <p v-if="errores.matematica" class="sf-error" role="alert" data-testid="error-matematica">{{ errores.matematica }}</p>
          </div>
        </div>
      </section>

      <!-- Financiamiento del Estado -->
      <section class="sf-bloque" aria-labelledby="sf-q-estado">
        <p id="sf-q-estado" class="sf-pregunta">¿Piensas usar financiamiento del Estado?</p>
        <p id="sf-h-estado" class="sf-ayuda">{{ TEXTOS_MODAL.ayudaFinanciamiento }}</p>
        <SiNoToggle
          :model-value="modelValue.usaFinanciamientoEstado"
          labelledby="sf-q-estado"
          describedby="sf-h-estado"
          :invalid="!!errores.estado"
          testid="estado-toggle"
          @update:model-value="setEstado"
        />
        <p v-if="errores.estado" class="sf-error" role="alert" data-testid="error-estado">{{ errores.estado }}</p>

        <template v-if="modelValue.usaFinanciamientoEstado">
          <fieldset class="sf-opciones" :aria-describedby="hayErroresOpciones ? 'sf-error-opciones' : undefined">
            <legend class="sf-label">¿Qué tipo de financiamiento planeas utilizar?</legend>
            <label class="sf-opcion" :class="{ 'sf-opcion-on': modelValue.planeaUsarCAE, 'sf-opcion-error': hayErroresOpciones }">
              <input type="checkbox" :checked="modelValue.planeaUsarCAE" @change="set({ planeaUsarCAE: ($event.target as HTMLInputElement).checked })" />
              <TrendingUp class="sf-opcion-icono" aria-hidden="true" />
              <span><strong>CAE</strong><small>Crédito con Aval del Estado</small></span>
            </label>
            <label class="sf-opcion" :class="{ 'sf-opcion-on': modelValue.usaBecasEstado, 'sf-opcion-error': hayErroresOpciones }">
              <input type="checkbox" :checked="modelValue.usaBecasEstado" @change="set({ usaBecasEstado: ($event.target as HTMLInputElement).checked })" />
              <CheckCircle class="sf-opcion-icono" aria-hidden="true" />
              <span><strong>Becas ministeriales</strong><small>Becas estatales de arancel</small></span>
            </label>
          </fieldset>
          <p v-if="hayErroresOpciones" id="sf-error-opciones" class="sf-error" role="alert" data-testid="error-opciones">{{ errores.opciones }}</p>

          <div class="sf-campo sf-renta">
            <label id="sf-label-decil" for="sf-decil" class="sf-label">Tramo de renta mensual *</label>
            <p id="sf-ayuda-decil" class="sf-ayuda">{{ TEXTOS_MODAL.ayudaRenta }}</p>
            <Dropdown
              v-model="decil"
              input-id="sf-decil"
              :options="decilesOptions"
              option-label="label"
              option-value="value"
              placeholder="Selecciona rango"
              append-to="body"
              class="sf-dropdown"
              :class="{ 'p-invalid': !!errores.decil }"
              :loading="decilesLoading"
              aria-labelledby="sf-label-decil"
              data-testid="decil-select"
            />
            <p v-if="decilesError" class="sf-error" role="alert">{{ decilesError }}</p>
            <p v-if="errores.decil" class="sf-error" role="alert" data-testid="error-decil">{{ errores.decil }}</p>
          </div>
        </template>
      </section>

      <!-- La nota va al final y nada la tapa: el panel del tramo se abre sobre el body -->
      <div class="sf-nota" role="note" data-testid="nota-requisitos">
        <Info class="sf-nota-icono" aria-hidden="true" />
        <p>{{ TEXTOS_MODAL.notaRequisitos }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sf-titulo { font-size: 1.125rem; font-weight: 700; color: #0f172a; }
.sf-sub { margin-top: 0.125rem; font-size: 0.9375rem; color: #475569; }
.sf-noaplica { margin-top: 1rem; border-radius: 0.5rem; background: #f1f5f9; padding: 0.75rem; color: #334155; }
.sf-bloque { margin-top: 1.25rem; }
.sf-pregunta { font-weight: 700; color: #0f172a; }
.sf-ayuda { margin: 0.125rem 0 0.5rem; font-size: 0.8125rem; color: #64748b; min-height: 0; }
.sf-error { margin-top: 0.375rem; font-size: 0.875rem; font-weight: 600; color: #b91c1c; }
.sf-puntajes { display: grid; grid-template-columns: 1fr; gap: 0.75rem; margin-top: 0.875rem; }
@media (min-width: 520px) { .sf-puntajes { grid-template-columns: 1fr 1fr; } }
.sf-label { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 700; color: #1e293b; }
.sf-input { width: 100%; border: 1px solid #94a3b8; border-radius: 0.375rem; padding: 0.625rem 0.75rem; font-size: 1rem; background: #fff; color: #0f172a; min-height: 2.75rem; }
.sf-input:focus-visible { outline: 2px solid #1a3b66; outline-offset: 1px; }
.sf-input-error { border-color: #dc2626; }
.sf-opciones { border: 0; margin: 0.875rem 0 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 0.5rem; }
.sf-opciones .sf-label { margin-bottom: 0.125rem; }
.sf-opcion { display: flex; align-items: center; gap: 0.625rem; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 0.625rem 0.75rem; background: #fff; cursor: pointer; min-height: 2.75rem; }
.sf-opcion input { width: 1.125rem; height: 1.125rem; accent-color: #1a3b66; flex: none; }
.sf-opcion span { display: flex; flex-direction: column; }
.sf-opcion small { font-size: 0.75rem; color: #64748b; }
.sf-opcion-icono { width: 1.25rem; height: 1.25rem; color: #1a3b66; flex: none; }
.sf-opcion-on { border-color: #1a3b66; background: #e8eef7; }
.sf-opcion-error { border-color: #dc2626; }
.sf-renta { margin-top: 0.875rem; }
.sf-dropdown { width: 100%; }
.sf-nota { display: flex; gap: 0.625rem; margin-top: 1.25rem; border-radius: 0.5rem; background: #e0f2fe; border: 1px solid #bae6fd; padding: 0.75rem; font-size: 0.875rem; color: #0c4a6e; }
.sf-nota-icono { width: 1.125rem; height: 1.125rem; flex: none; margin-top: 0.125rem; }
</style>

<!-- Modo oscuro: sin "scoped" para que la clase html.dark gane a los estilos claros -->
<style>
html.dark .sf-titulo, html.dark .sf-pregunta, html.dark .sf-label { color: #f1f5f9; }
html.dark .sf-sub, html.dark .sf-ayuda, html.dark .sf-opcion small { color: #cbd5e1; }
html.dark .sf-noaplica { background: #1e293b; color: #e2e8f0; }
html.dark .sf-error { color: #fca5a5; }
html.dark .sf-input { background: #0f172a; border-color: #475569; color: #f1f5f9; }
html.dark .sf-opcion { background: #0f172a; border-color: #475569; color: #f1f5f9; }
html.dark .sf-opcion-on { background: #1e3a5f; border-color: #93c5fd; }
html.dark .sf-opcion-icono { color: #bfdbfe; }
html.dark .sf-nota { background: #082f49; border-color: #0c4a6e; color: #e0f2fe; }
</style>
