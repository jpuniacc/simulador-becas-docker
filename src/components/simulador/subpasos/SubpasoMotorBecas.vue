<script setup lang="ts">
/** Sub-step 3 del modal: qué beca aplica y cuánto descuenta (misma lógica que el resumen). */
import { CheckCircle, Info } from 'lucide-vue-next'
import ProgressSpinner from 'primevue/progressspinner'
import { formatCurrency } from '@/utils/formatters'
import { TEXTOS_RESUMEN } from '@/utils/resumenPregrado'
import { detalleCarrera } from '@/utils/pasoCarrera'
import type { ResultadoMotor } from '@/composables/useMotorBecas'

defineProps<{ resultado: ResultadoMotor | null; cargando: boolean; error: string | null }>()
const emit = defineEmits<{ reintentar: [] }>()
</script>

<template>
  <div class="sm" data-testid="subpaso-motor">
    <div v-if="cargando" class="sm-cargando" role="status" aria-live="polite">
      <ProgressSpinner style="width: 2rem; height: 2rem" stroke-width="5" />
      <span>Calculando tu beca…</span>
    </div>

    <div v-else-if="error" class="sm-error" role="alert" data-testid="motor-error">
      <p>No pudimos calcular tu beca ahora. {{ error }}</p>
      <button type="button" class="sm-reintentar" @click="emit('reintentar')">Reintentar</button>
    </div>

    <template v-else-if="resultado">
      <section class="sm-card" aria-labelledby="sm-carrera">
        <h3 id="sm-carrera" class="sm-carrera">{{ resultado.nombre }}</h3>
        <p class="sm-detalle">{{ detalleCarrera({ nombre_programa: resultado.nombre, nivel_academico: resultado.nivelAcademico, modalidad_programa: resultado.modalidad, duracion_programa: resultado.duracion }) }}</p>

        <p v-if="resultado.beca" class="sm-beca" data-testid="motor-beca">
          <CheckCircle class="sm-beca-icono" aria-hidden="true" />
          <span>{{ resultado.beca.etiqueta }}</span>
        </p>
        <p v-else class="sm-sin-beca" data-testid="motor-sin-beca">{{ TEXTOS_RESUMEN.sinBeca }}</p>

        <dl class="sm-montos" data-testid="motor-montos">
          <div class="sm-fila">
            <dt>Arancel referencial</dt>
            <dd data-testid="motor-arancel">{{ formatCurrency(resultado.arancelReferencial) }}</dd>
          </div>
          <template v-if="resultado.beca">
            <div class="sm-fila">
              <dt>Descuento de la beca<span v-if="resultado.beca.porcentaje !== null"> ({{ resultado.beca.porcentaje }}%)</span></dt>
              <dd class="sm-desc" data-testid="motor-descuento">−{{ formatCurrency(resultado.descuentoBeca) }}</dd>
            </div>
            <div class="sm-fila sm-fila-total">
              <dt>Arancel con beca</dt>
              <dd data-testid="motor-arancel-beca">{{ formatCurrency(resultado.arancelReferencial - resultado.descuentoBeca) }}</dd>
            </div>
          </template>
        </dl>
      </section>

      <div class="sm-aviso" role="note">
        <Info class="sm-aviso-icono" aria-hidden="true" />
        <p><strong>{{ TEXTOS_RESUMEN.disclaimerTitulo }}</strong> {{ TEXTOS_RESUMEN.disclaimerCuerpo }}</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sm-cargando { display: flex; align-items: center; justify-content: center; gap: 0.75rem; padding: 2rem 0; color: #475569; }
.sm-error { border: 1px solid #fecaca; background: #fef2f2; color: #991b1b; border-radius: 0.5rem; padding: 0.75rem; }
.sm-reintentar { margin-top: 0.5rem; border: 1px solid #991b1b; border-radius: 0.375rem; background: #fff; color: #991b1b; padding: 0.375rem 0.75rem; font-weight: 600; cursor: pointer; }
.sm-card { border: 1px solid #cbd5e1; border-radius: 0.75rem; background: #fff; padding: 1rem; }
.sm-carrera { font-size: 1.25rem; font-weight: 700; color: #1a3b66; line-height: 1.2; }
.sm-detalle { margin-top: 0.125rem; font-size: 0.875rem; color: #64748b; }
.sm-beca { display: flex; align-items: flex-start; gap: 0.5rem; margin-top: 0.75rem; border-radius: 0.5rem; background: #dcfce7; padding: 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 600; color: #14532d; }
.sm-beca-icono { width: 1.125rem; height: 1.125rem; flex: none; margin-top: 0.0625rem; }
.sm-sin-beca { margin-top: 0.75rem; border-radius: 0.5rem; background: #f1f5f9; padding: 0.625rem 0.75rem; font-size: 0.9375rem; color: #334155; }
.sm-montos { margin-top: 0.875rem; border-top: 1px solid #e2e8f0; padding-top: 0.5rem; font-size: 0.9375rem; }
.sm-fila { display: flex; justify-content: space-between; gap: 0.75rem; padding: 0.25rem 0; color: #334155; }
.sm-fila dd { font-weight: 600; margin: 0; white-space: nowrap; }
.sm-desc { color: #15803d; }
.sm-fila-total { border-top: 1px solid #e2e8f0; margin-top: 0.25rem; padding-top: 0.5rem; font-weight: 700; color: #0f172a; }
.sm-aviso { display: flex; gap: 0.625rem; margin-top: 0.875rem; border: 1px solid #fcd34d; background: #fffbeb; border-radius: 0.5rem; padding: 0.75rem; font-size: 0.8125rem; color: #78350f; }
.sm-aviso-icono { width: 1.125rem; height: 1.125rem; flex: none; margin-top: 0.125rem; }
</style>

<!-- Modo oscuro: sin "scoped" para que la clase html.dark gane a los estilos claros -->
<style>
html.dark .sm-cargando { color: #cbd5e1; }
html.dark .sm-error { background: #450a0a; border-color: #7f1d1d; color: #fecaca; }
html.dark .sm-card { background: #0f172a; border-color: #475569; }
html.dark .sm-carrera { color: #bfdbfe; }
html.dark .sm-detalle { color: #cbd5e1; }
html.dark .sm-beca { background: #14532d; color: #dcfce7; }
html.dark .sm-sin-beca { background: #1e293b; color: #e2e8f0; }
html.dark .sm-montos, html.dark .sm-fila-total { border-color: #334155; }
html.dark .sm-fila { color: #e2e8f0; }
html.dark .sm-fila-total { color: #f1f5f9; }
html.dark .sm-desc { color: #86efac; }
html.dark .sm-aviso { background: #422006; border-color: #92400e; color: #fde68a; }
</style>
