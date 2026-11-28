<script setup lang="ts">
/**
 * Resumen de pregrado (VOU v4, fase 2).
 * Reemplaza a `Results` SOLO en /simulador. /advance, /postgrados y /diplomados siguen con `Results`.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Message from 'primevue/message'
import ProgressSpinner from 'primevue/progressspinner'
import { Award, CheckCircle, Clock, FileText, Info } from 'lucide-vue-next'
import { useSimuladorStore } from '@/stores/simuladorStore'
import { useDescuentosStore } from '@/stores/descuentosStore'
import { useBecasStore, type BecasInformativas } from '@/stores/becasStore'
import { useRegistroSimulacion } from '@/composables/useRegistroSimulacion'
import { formatCurrency } from '@/utils/formatters'
import { exportSimulacionPdf } from '@/utils/pdfSimulacion'
import {
  CUOTAS_POR_DEFECTO,
  TEXTOS_RESUMEN,
  calcularResumen,
  etiquetaBecaAplicada,
  pctContadoDesdeModosPago
} from '@/utils/resumenPregrado'
import type { FormData } from '@/types/simulador'
import SelectorCuotas from './SelectorCuotas.vue'
import BloqueReferencialEstado from './BloqueReferencialEstado.vue'

interface Props {
  formData?: Partial<FormData>
  segmentacion?: string
}

const props = withDefaults(defineProps<Props>(), { segmentacion: 'pregrado' })

const simuladorStore = useSimuladorStore()
const descuentosStore = useDescuentosStore()
const becasStore = useBecasStore()
const { registrarLead } = useRegistroSimulacion()

const isLoading = ref(false)
const error = ref<string | null>(null)
const isGeneratingPDF = ref(false)
const cuotas = ref<number>(CUOTAS_POR_DEFECTO)
const showBecaInfoDialog = ref(false)
const selectedBecaInfo = ref<BecasInformativas | null>(null)

onMounted(() => {
  descuentosStore.cargarDescuentosPagoAnticipado()
  descuentosStore.cargarDescuentosModoPago()
  becasStore.cargarBecasInformativas()
})

const calculoBecas = computed(() => simuladorStore.calculoBecas)
const fd = computed(() => simuladorStore.formData)

// Carrera elegida: siempre por id (no por nombre)
const carreraInfo = computed(() => {
  if (!fd.value.carreraId) return null
  return simuladorStore.carrerasStore.obtenerCarreraPorId(fd.value.carreraId) ?? null
})

const becasAplicadas = computed(() => calculoBecas.value?.becas_aplicadas || [])
// La prelación deja como máximo una beca; se muestra la primera
const becaPrincipal = computed(() => becasAplicadas.value[0] ?? null)
const becasInformativas = computed(() => becasStore.becasInformativas || [])

const pctContado = computed(() => pctContadoDesdeModosPago(descuentosStore.descuentosModoPagoActivos))
const anticipadoVigente = computed(() => descuentosStore.obtenerDescuentoPagoAnticipadoVigente())

// Todos los montos salen de una sola función pura (sin CAE en ningún total)
const resumen = computed(() =>
  calcularResumen({
    arancelBase: calculoBecas.value?.arancel_base || 0,
    matricula: carreraInfo.value?.matricula || 0,
    descuentoBeca: calculoBecas.value?.descuento_total || 0,
    cuotas: cuotas.value,
    pctContado: pctContado.value,
    pctAnticipadoArancel: anticipadoVigente.value?.dscto_arancel ?? null,
    pctAnticipadoMatricula: anticipadoVigente.value?.dscto_matricula ?? null
  })
)

const etiquetaBeca = computed(() => (becaPrincipal.value ? etiquetaBecaAplicada(becaPrincipal.value as any, formatCurrency) : ''))

const mostrarReferencialEstado = computed(() => !!(fd.value.usaBecasEstado || fd.value.planeaUsarCAE))
const arancelReferenciaCae = computed(() => carreraInfo.value?.arancel_referencia || null)
const anioArancelReferencia = computed(() => {
  const a = carreraInfo.value?.anio_arancel_referencia
  return a != null && Number(a) > 0 ? Number(a) : null
})

// Lead: una sola vez, al entrar al resumen (lo llama Simulador2View al pasar al paso 3)
const handleSimulate = async () => {
  try {
    isLoading.value = true
    error.value = null

    if (props.formData) {
      simuladorStore.updateFormData(props.formData)
    }

    await simuladorStore.simulate({ arancelPorId: true })

    await registrarLead({
      segmentacion: props.segmentacion,
      carreraInfo: carreraInfo.value,
      becasAplicadas: becasAplicadas.value as any
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Error al realizar la simulación'
    console.error('Error en simulación:', err)
  } finally {
    isLoading.value = false
  }
}

const handleExportPDF = async () => {
  if (!calculoBecas.value || !carreraInfo.value) return
  try {
    isGeneratingPDF.value = true
    const r = resumen.value
    exportSimulacionPdf({
      modoReferencial: true,
      nombre: fd.value.nombre || '',
      apellido: fd.value.apellido || '',
      identificacion: fd.value.identificacion || '',
      tipoIdentificacion: fd.value.tipoIdentificacion || 'rut',
      email: fd.value.email || '',
      carreraNombre: carreraInfo.value.nombre_programa || fd.value.carrera || '',
      nivelAcademico: carreraInfo.value.nivel_academico,
      modalidadPrograma: carreraInfo.value.modalidad_programa,
      duracionPrograma: carreraInfo.value.duracion_programa,
      arancelBase: r.arancelReferencial,
      matricula: r.matricula,
      becasInternas: becasAplicadas.value.map((b: any) => ({
        nombre: b.beca?.nombre || 'Beca',
        descuentoAplicado: b.descuento_aplicado,
        montoDescuento: b.monto_descuento,
        tipoDescuento: b.beca?.tipo_descuento || null,
        procesoEvaluacion: b.beca?.proceso_evaluacion || null
      })),
      usaBecasEstado: !!fd.value.usaBecasEstado,
      planeaUsarCAE: !!fd.value.planeaUsarCAE,
      arancelReferenciaCae: arancelReferenciaCae.value,
      anioArancelReferencia: anioArancelReferencia.value,
      descuentoModoPagoArancel: r.descuentoContado,
      descuentoModoPagoPct: r.esContado ? pctContado.value : null,
      descuentoPagoAnticipadoArancel: r.descuentoAnticipadoArancel,
      descuentoPagoAnticipadoMatricula: r.descuentoAnticipadoMatricula,
      beneficioEstimado: r.beneficioEstimado,
      arancelFinalConDescuentos: r.arancelFinal,
      matriculaFinalConDescuentos: r.matriculaFinal,
      totalPagar: r.totalEstimado,
      numeroCuotas: r.cuotas,
      valorMensual: r.valorCuota
    })
  } catch (e) {
    console.error('No se pudo generar el PDF:', e)
  } finally {
    isGeneratingPDF.value = false
  }
}

const openBecaInfoDialog = (beca: BecasInformativas) => {
  selectedBecaInfo.value = beca
  showBecaInfoDialog.value = true
}

const lista = (v: unknown): string[] => (Array.isArray(v) ? v : [v]).map(String)

// ---- Carrusel de Becas Adicionales (solo móvil; en escritorio es una grilla) ----
const pistaRef = ref<HTMLElement | null>(null)
const indiceActivo = ref(0)
let cuadro = 0

const tarjetas = (): HTMLElement[] => Array.from(pistaRef.value?.children ?? []) as HTMLElement[]

const actualizarIndiceActivo = () => {
  const pista = pistaRef.value
  if (!pista) return
  const items = tarjetas()
  if (!items.length) return
  // Al final del recorrido la última tarjeta nunca llega al borde izquierdo: se marca igualmente como activa
  if (pista.scrollWidth > pista.clientWidth && pista.scrollLeft >= pista.scrollWidth - pista.clientWidth - 2) {
    indiceActivo.value = items.length - 1
    return
  }
  let mejor = 0
  let distMin = Infinity
  items.forEach((el, i) => {
    const d = Math.abs(el.offsetLeft - pista.scrollLeft)
    if (d < distMin) { distMin = d; mejor = i }
  })
  indiceActivo.value = mejor
}

const alDesplazar = () => {
  if (cuadro) return
  cuadro = requestAnimationFrame(() => {
    cuadro = 0
    actualizarIndiceActivo()
  })
}

const irATarjeta = (i: number) => {
  const pista = pistaRef.value
  const items = tarjetas()
  if (!pista || !items.length) return
  const destino = Math.min(Math.max(i, 0), items.length - 1)
  const reducir = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  pista.scrollTo({ left: items[destino].offsetLeft, behavior: reducir ? 'auto' : 'smooth' })
  indiceActivo.value = destino
}

const onTeclaPista = (e: KeyboardEvent) => {
  if (e.key === 'ArrowRight') { e.preventDefault(); irATarjeta(indiceActivo.value + 1) }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); irATarjeta(indiceActivo.value - 1) }
}

onMounted(() => nextTick(actualizarIndiceActivo))
onBeforeUnmount(() => { if (cuadro) cancelAnimationFrame(cuadro) })

defineExpose({ simulate: handleSimulate })
</script>

<template>
  <div class="resumen-pregrado" data-testid="resumen-pregrado">
    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <Message v-if="error" severity="error" :closable="false" class="mb-4">{{ error }}</Message>

    <div v-if="!isLoading && !error && calculoBecas" class="flex flex-col gap-4">
      <!-- Tarjeta principal: montos primero -->
      <section class="rp-card" aria-labelledby="rp-carrera">
        <div v-if="carreraInfo" class="rp-carrera">
          <h2 id="rp-carrera" class="rp-carrera-nombre">{{ carreraInfo.nombre_programa }}</h2>
          <p class="rp-carrera-detalle">
            {{ [carreraInfo.nivel_academico, carreraInfo.modalidad_programa, carreraInfo.duracion_programa].filter(Boolean).join(' · ') }}
          </p>
        </div>

        <p v-if="becaPrincipal" class="rp-beca" data-testid="beca-aplicada">
          <CheckCircle class="rp-beca-icon" aria-hidden="true" />
          <span>{{ etiquetaBeca }}</span>
        </p>
        <p v-else class="rp-sin-beca" data-testid="sin-beca">{{ TEXTOS_RESUMEN.sinBeca }}</p>

        <p class="rp-ref">{{ TEXTOS_RESUMEN.referencial }}</p>

        <div class="rp-cuota" aria-live="polite">
          <span class="rp-cuota-valor" data-testid="valor-cuota">{{ formatCurrency(resumen.valorCuota) }}</span>
          <span class="rp-cuota-n" data-testid="cuota-texto">
            {{ resumen.esContado ? 'en 1 pago (contado)' : `× ${resumen.cuotas} cuotas` }}
          </span>
        </div>
        <p class="rp-total-linea">
          Total estimado <strong data-testid="total-estimado">{{ formatCurrency(resumen.totalEstimado) }}</strong>
          · beneficio estimado <strong data-testid="beneficio-estimado">{{ formatCurrency(resumen.beneficioEstimado) }}</strong>
        </p>

        <div class="rp-cuotas">
          <p class="rp-cuotas-label" id="rp-cuotas-label">Número de cuotas</p>
          <SelectorCuotas v-model="cuotas" />
        </div>

        <dl class="rp-detalle" data-testid="detalle-montos">
          <div class="rp-fila">
            <dt>Arancel referencial</dt>
            <dd data-testid="arancel-referencial">{{ formatCurrency(resumen.arancelReferencial) }}</dd>
          </div>
          <div v-if="becaPrincipal" class="rp-fila rp-fila-desc">
            <dt>Beneficio UNIACC estimado</dt>
            <dd>−{{ formatCurrency(resumen.descuentoBeca) }}</dd>
          </div>
          <div v-if="resumen.descuentoContado > 0" class="rp-fila rp-fila-desc" data-testid="fila-contado">
            <dt>Descuento por pago al contado<span v-if="pctContado"> ({{ pctContado }}%)</span></dt>
            <dd>−{{ formatCurrency(resumen.descuentoContado) }}</dd>
          </div>
          <div v-if="resumen.descuentoAnticipadoArancel > 0" class="rp-fila rp-fila-desc">
            <dt>Descuento por pago anticipado (arancel)</dt>
            <dd>−{{ formatCurrency(resumen.descuentoAnticipadoArancel) }}</dd>
          </div>
          <div class="rp-fila">
            <dt>Matrícula</dt>
            <dd>{{ formatCurrency(resumen.matricula) }}</dd>
          </div>
          <div v-if="resumen.descuentoAnticipadoMatricula > 0" class="rp-fila rp-fila-desc">
            <dt>Descuento por pago anticipado (matrícula)</dt>
            <dd>−{{ formatCurrency(resumen.descuentoAnticipadoMatricula) }}</dd>
          </div>
          <div class="rp-fila rp-fila-total">
            <dt>Total estimado</dt>
            <dd>{{ formatCurrency(resumen.totalEstimado) }}</dd>
          </div>
        </dl>
      </section>

      <!-- Disclaimer -->
      <section class="rp-disclaimer" data-testid="disclaimer" role="note">
        <Info class="rp-disclaimer-icon" aria-hidden="true" />
        <div>
          <p>
            <strong>{{ TEXTOS_RESUMEN.disclaimerTitulo }}</strong>
            {{ TEXTOS_RESUMEN.disclaimerCuerpo }}
          </p>
          <p class="rp-vigencia">
            <Clock class="rp-vigencia-icon" aria-hidden="true" />
            {{ TEXTOS_RESUMEN.vigencia }}
          </p>
        </div>
      </section>

      <!-- Financiamiento del Estado (referencial, no suma) -->
      <BloqueReferencialEstado
        v-if="mostrarReferencialEstado"
        :usa-becas-estado="!!fd.usaBecasEstado"
        :usa-cae="!!fd.planeaUsarCAE"
        :arancel-referencia-cae="arancelReferenciaCae"
        :anio-arancel-referencia="anioArancelReferencia"
        :formatear="formatCurrency"
      />

      <!-- Línea neutra de contacto -->
      <p class="rp-contacto" data-testid="contacto">
        ¿Quieres revisar tu caso? Escríbenos a
        <a :href="`mailto:${TEXTOS_RESUMEN.email}`">{{ TEXTOS_RESUMEN.email }}</a>
        o llámanos al
        <template v-for="(t, i) in TEXTOS_RESUMEN.telefonos" :key="t.tel">
          <a :href="`tel:${t.tel}`">{{ t.texto }}</a><span v-if="i < TEXTOS_RESUMEN.telefonos.length - 1"> o al </span>
        </template>.
      </p>

      <!-- Detalle de la beca aplicada -->
      <section v-if="becaPrincipal" class="rp-card rp-beca-detalle" data-testid="detalle-beca">
        <h3 class="rp-h3"><Award class="rp-h3-icon" aria-hidden="true" /> Beca aplicada</h3>
        <h4 class="rp-beca-nombre">{{ becaPrincipal.beca?.nombre }}</h4>
        <p v-if="becaPrincipal.beca?.descripcion" class="rp-texto">{{ becaPrincipal.beca.descripcion }}</p>
        <div v-if="becaPrincipal.beca?.requiere_documentacion?.length" class="rp-docs">
          <p class="rp-docs-titulo"><FileText class="rp-docs-icon" aria-hidden="true" /> Documentación requerida</p>
          <ul>
            <li v-for="(doc, i) in becaPrincipal.beca.requiere_documentacion" :key="i">{{ doc }}</li>
          </ul>
        </div>
      </section>

      <!-- Becas Adicionales -->
      <section v-if="becasInformativas.length > 0" class="rp-card" data-testid="becas-adicionales">
        <h3 class="rp-h3"><Award class="rp-h3-icon" aria-hidden="true" /> Becas Adicionales</h3>
        <p class="rp-texto">Te invitamos a consultar por otras becas aplicables si ya eres parte de la familia UNIACC</p>
        <div class="rp-carrusel">
          <div
            ref="pistaRef"
            class="rp-grid rp-pista"
            role="group"
            aria-roledescription="carrusel"
            aria-label="Becas adicionales"
            tabindex="0"
            data-testid="carrusel-pista"
            @scroll.passive="alDesplazar"
            @keydown="onTeclaPista"
          >
            <article
              v-for="(beca, i) in becasInformativas"
              :key="beca.id"
              class="rp-mini"
              role="group"
              aria-roledescription="diapositiva"
              :aria-label="`${i + 1} de ${becasInformativas.length}`"
            >
              <h4 class="rp-mini-titulo">{{ beca.nombre }}</h4>
              <p v-if="beca.descripcion" class="rp-mini-desc" data-testid="beca-desc">{{ beca.descripcion }}</p>
              <Button
                label="Ver más"
                icon="pi pi-arrow-right"
                iconPos="right"
                outlined
                severity="secondary"
                class="rp-mini-btn"
                @click="openBecaInfoDialog(beca)"
              />
            </article>
          </div>
        </div>

        <div v-if="becasInformativas.length > 1" class="rp-puntos" data-testid="carrusel-puntos">
          <button
            v-for="(beca, i) in becasInformativas"
            :key="beca.id"
            type="button"
            class="rp-punto"
            :class="{ 'rp-punto-on': i === indiceActivo }"
            :aria-label="`Ir a la beca ${i + 1} de ${becasInformativas.length}: ${beca.nombre}`"
            :aria-current="i === indiceActivo ? 'true' : undefined"
            @click="irATarjeta(i)"
          />
        </div>
      </section>
    </div>

    <!-- Exportar PDF -->
    <div v-if="!isLoading && !error && calculoBecas && !isGeneratingPDF" class="rp-export">
      <Button label="Exportar PDF" icon="pi pi-download" severity="secondary" outlined @click="handleExportPDF" />
    </div>

    <!-- Detalle de beca informativa -->
    <Dialog
      v-model:visible="showBecaInfoDialog"
      :style="{ width: '90vw', maxWidth: '800px' }"
      :modal="true"
      :closable="true"
      :draggable="false"
      :header="selectedBecaInfo?.nombre || 'Información de Beca'"
    >
      <div v-if="selectedBecaInfo" class="rp-dialog">
        <div v-if="selectedBecaInfo.descripcion">
          <p class="rp-dialog-label">Descripción:</p>
          <p>{{ selectedBecaInfo.descripcion }}</p>
        </div>
        <div v-if="selectedBecaInfo.porcentajes">
          <p class="rp-dialog-label">Porcentajes:</p>
          <ul><li v-for="(p, i) in lista(selectedBecaInfo.porcentajes)" :key="i">{{ p }}</li></ul>
        </div>
        <div v-if="selectedBecaInfo.requisitos">
          <p class="rp-dialog-label">Requisitos:</p>
          <ul><li v-for="(r, i) in lista(selectedBecaInfo.requisitos)" :key="i">{{ r }}</li></ul>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<style scoped>
.resumen-pregrado {
  width: 100%;
  max-width: 48rem;
  margin: 0 auto;
  color: #0f172a;
}

.rp-card {
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  background: #fff;
  padding: 1.25rem;
}

.rp-carrera-nombre {
  font-size: 1.375rem;
  font-weight: 700;
  line-height: 1.2;
  color: #1a3b66;
}

.rp-carrera-detalle {
  margin-top: 0.125rem;
  font-size: 0.875rem;
  color: #64748b;
}

.rp-beca {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-top: 0.75rem;
  border-radius: 0.5rem;
  background: #dcfce7;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #14532d;
}

.rp-beca-icon {
  width: 1.125rem;
  height: 1.125rem;
  flex: none;
  margin-top: 0.0625rem;
}

.rp-sin-beca {
  margin-top: 0.75rem;
  border-radius: 0.5rem;
  background: #f1f5f9;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  color: #334155;
}

.rp-ref {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: #64748b;
}

.rp-cuota {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.125rem;
}

.rp-cuota-valor {
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1.1;
  color: #1a3b66;
}

.rp-cuota-n {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
}

.rp-total-linea {
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #475569;
}

.rp-cuotas {
  margin-top: 1rem;
}

.rp-cuotas-label {
  margin-bottom: 0.375rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #64748b;
}

.rp-detalle {
  margin-top: 1rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.5rem;
  font-size: 0.875rem;
}

.rp-fila {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.3125rem 0;
}

.rp-fila dd {
  flex: none;
  font-weight: 600;
  text-align: right;
}

.rp-fila-desc dd {
  color: #15803d;
}

.rp-fila-total {
  margin-top: 0.25rem;
  border-top: 1px solid #cbd5e1;
  padding-top: 0.5rem;
  font-weight: 700;
  color: #1a3b66;
}

.rp-disclaimer {
  display: flex;
  gap: 0.75rem;
  border: 1px solid #fcd34d;
  border-left-width: 4px;
  border-radius: 0.5rem;
  background: #fffbeb;
  padding: 0.875rem 1rem;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #78350f;
}

.rp-disclaimer-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex: none;
  margin-top: 0.125rem;
}

.rp-vigencia {
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
}

.rp-vigencia-icon {
  width: 0.875rem;
  height: 0.875rem;
  flex: none;
  margin-top: 0.125rem;
}

.rp-contacto {
  font-size: 0.875rem;
  line-height: 1.5;
  color: #334155;
}

.rp-contacto a {
  color: #1d4ed8;
  font-weight: 600;
  text-decoration: underline;
}

.rp-h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.0625rem;
  font-weight: 700;
  color: #1a3b66;
}

.rp-h3-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.rp-beca-nombre {
  margin-top: 0.5rem;
  font-weight: 700;
}

.rp-texto {
  margin-top: 0.375rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #475569;
}

.rp-docs {
  margin-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
  padding-top: 0.5rem;
  font-size: 0.8125rem;
}

.rp-docs-titulo {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-weight: 700;
  color: #1a3b66;
}

.rp-docs-icon {
  width: 1rem;
  height: 1rem;
}

.rp-docs ul {
  margin-top: 0.25rem;
  padding-left: 1.25rem;
  list-style: disc;
}

/* Becas Adicionales: carrusel horizontal en móvil/tablet chica, grilla de 2 columnas desde 768px */
.rp-carrusel {
  position: relative;
  margin-top: 0.75rem;
}

.rp-grid {
  position: relative;
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  overscroll-behavior-x: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding-bottom: 0.25rem;
}

.rp-grid::-webkit-scrollbar {
  display: none;
}

.rp-grid:focus-visible {
  outline: 2px solid #1a3b66;
  outline-offset: 2px;
}

.rp-grid > .rp-mini {
  flex: 0 0 85%;
  scroll-snap-align: start;
}

.rp-puntos {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.125rem;
  margin-top: 0.5rem;
}

/* Área táctil de 24px con un punto visible de 8px */
.rp-punto {
  position: relative;
  width: 1.5rem;
  height: 1.5rem;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.rp-punto::after {
  content: '';
  position: absolute;
  inset: 50% auto auto 50%;
  width: 0.5rem;
  height: 0.5rem;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: #bfdbfe;
  transition: background 0.15s, width 0.15s;
}

.rp-punto-on::after {
  width: 1.25rem;
  background: #1a3b66;
}

.rp-punto:focus-visible {
  outline: 2px solid #1a3b66;
  border-radius: 999px;
}

@media (min-width: 768px) {
  .rp-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    overflow: visible;
    scroll-snap-type: none;
  }

  .rp-grid > .rp-mini {
    flex: none;
  }

  .rp-puntos {
    display: none;
  }

}

@media (prefers-reduced-motion: reduce) {
  .rp-punto::after { transition: none; }

}

.rp-mini {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.5rem;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  background: #eff6ff;
  padding: 0.875rem;
}

.rp-mini-titulo {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1a3b66;
}

/* Puntos suspensivos: solo la forma -webkit-box (la propiedad estándar line-clamp
   hacía que Chrome no pintara «…») */
.rp-mini-desc {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8125rem;
  line-height: 1.45;
  color: #475569;
}

.rp-mini-btn {
  margin-top: auto;
  width: 100%;
}

.rp-export {
  display: flex;
  justify-content: center;
  margin-top: 1.5rem;
}

.rp-dialog {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.rp-dialog-label {
  font-weight: 700;
  color: #1a3b66;
}

.rp-dialog ul {
  padding-left: 1.25rem;
  list-style: disc;
}
</style>

<!-- Modo oscuro: sin "scoped" para que la clase html.dark gane a los estilos claros -->
<style>
/* Modo oscuro */
html.dark .resumen-pregrado {
  color: #e2e8f0;
}

html.dark .rp-card {
  background: #1e293b;
  border-color: #475569;
}

html.dark .rp-carrera-nombre,
html.dark .rp-cuota-valor,
html.dark .rp-h3,
html.dark .rp-fila-total,
html.dark .rp-mini-titulo,
html.dark .rp-docs-titulo {
  color: #bfdbfe;
}

html.dark .rp-carrera-detalle,
html.dark .rp-ref,
html.dark .rp-cuotas-label,
html.dark .rp-total-linea,
html.dark .rp-cuota-n,
html.dark .rp-texto,
html.dark .rp-mini-desc,
html.dark .rp-contacto {
  color: #cbd5e1;
}

html.dark .rp-beca {
  background: #14532d;
  color: #dcfce7;
}

html.dark .rp-sin-beca {
  background: #334155;
  color: #e2e8f0;
}

html.dark .rp-fila-desc dd {
  color: #86efac;
}

html.dark .rp-detalle,
html.dark .rp-docs,
html.dark .rp-fila-total {
  border-color: #475569;
}

html.dark .rp-disclaimer {
  background: #422006;
  border-color: #b45309;
  color: #fde68a;
}

html.dark .rp-mini {
  background: #1e3a5f;
  border-color: #3b82f6;
}

html.dark .rp-contacto a {
  color: #93c5fd;
}

html.dark .rp-punto::after {
  background: #475569;
}

html.dark .rp-punto-on::after {
  background: #bfdbfe;
}

html.dark .rp-grid:focus-visible,
html.dark .rp-punto:focus-visible {
  outline-color: #bfdbfe;
}
</style>
