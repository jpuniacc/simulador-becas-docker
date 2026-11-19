<script setup lang="ts">
/**
 * Modal guiado del paso 2 de pregrado (VOU v4, fase 3):
 *   1 · Selección de carrera → 2 · Financiamiento → 3 · Motor de becas.
 * Trabaja sobre un borrador local y lo entrega al padre (`commit`) al avanzar y al cerrar.
 * No escribe en ninguna parte: el lead se dispara recién en el resumen.
 */
import { computed, nextTick, ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import SubpasoCarrera from './subpasos/SubpasoCarrera.vue'
import SubpasoFinanciamiento, { type BorradorFinanciamiento } from './subpasos/SubpasoFinanciamiento.vue'
import SubpasoMotorBecas from './subpasos/SubpasoMotorBecas.vue'
import { useMotorBecas } from '@/composables/useMotorBecas'
import {
  esEgresado,
  validarSubpasoCarrera,
  validarSubpasoFinanciamiento,
  type CarreraBuscable,
  type ErroresPaso2,
  type EstadoPaso2
} from '@/utils/pasoCarrera'
import type { FormData } from '@/types/simulador'

type CarreraOpcion = CarreraBuscable & { id: number }

interface Props {
  visible: boolean
  startStep?: 1 | 2 | 3
  consultaInicial?: string
  formData: Partial<FormData>
  carreras: CarreraOpcion[]
  carrerasLoading?: boolean
  decilesOptions: Array<{ label: string; value: number }>
  decilesLoading?: boolean
  decilesError?: string | null
  soloOnline?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  startStep: 1,
  consultaInicial: '',
  carrerasLoading: false,
  decilesLoading: false,
  decilesError: null,
  soloOnline: false
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  commit: [datos: Partial<FormData>]
  'ver-resultados': []
}>()

const TITULOS = ['Selección de carrera', 'Financiamiento', 'Motor de becas'] as const

const paso = ref<1 | 2 | 3>(1)
const consulta = ref('')
const carreraDraft = ref<{ carrera: string; carreraId: number }>({ carrera: '', carreraId: 0 })
const fin = ref<BorradorFinanciamiento>(blanco())
const intento = ref<{ 1: boolean; 2: boolean }>({ 1: false, 2: false })
const regionRef = ref<HTMLElement | null>(null)
// Al abrir, PrimeVue enfoca el primer [autofocus]: el buscador en escritorio (en móvil no, para no abrir el teclado) o el contenido
const enfocarBusqueda = ref(false)
const subCarreraRef = ref<InstanceType<typeof SubpasoCarrera> | null>(null)
let elementoPrevio: HTMLElement | null = null

const motor = useMotorBecas()

function blanco(): BorradorFinanciamiento {
  return {
    rendioPAES: false,
    paesRespondido: false,
    lenguaje: null,
    matematica: null,
    usaFinanciamientoEstado: undefined,
    planeaUsarCAE: false,
    usaBecasEstado: false,
    decil: null
  }
}

const aplicaFinanciamiento = computed(() => esEgresado(props.formData.nivelEducativo))

const desdeProps = () => {
  const f = props.formData
  carreraDraft.value = { carrera: f.carrera || '', carreraId: f.carreraId || 0 }
  const usaEstado = f.usaFinanciamientoEstado ?? (f.planeaUsarCAE || f.usaBecasEstado ? true : undefined)
  fin.value = {
    rendioPAES: !!f.rendioPAES,
    paesRespondido: f.paesRespondido ?? !!f.rendioPAES,
    lenguaje: f.paes?.lenguaje ?? null,
    matematica: f.paes?.matematica ?? null,
    usaFinanciamientoEstado: usaEstado,
    planeaUsarCAE: !!f.planeaUsarCAE,
    usaBecasEstado: !!f.usaBecasEstado,
    decil: f.decil ?? null
  }
}

const estado = computed<EstadoPaso2>(() => ({
  carrera: carreraDraft.value.carrera,
  carreraId: carreraDraft.value.carreraId,
  nivelEducativo: props.formData.nivelEducativo,
  rendioPAES: fin.value.rendioPAES,
  paesRespondido: fin.value.paesRespondido,
  paes: { lenguaje: fin.value.lenguaje, matematica: fin.value.matematica },
  usaFinanciamientoEstado: fin.value.usaFinanciamientoEstado,
  planeaUsarCAE: fin.value.planeaUsarCAE,
  usaBecasEstado: fin.value.usaBecasEstado,
  decil: fin.value.decil
}))

const erroresCarrera = computed<ErroresPaso2>(() => (intento.value[1] ? validarSubpasoCarrera(estado.value) : {}))
const erroresFin = computed<ErroresPaso2>(() => (intento.value[2] ? validarSubpasoFinanciamiento(estado.value) : {}))

/** Borrador → datos del formulario (solo lo que el modal controla). */
const aDatos = (): Partial<FormData> => {
  const base = props.formData.paes ?? { matematica: null, lenguaje: null, ciencias: null, historia: null, matematica2: null, terceraAsignatura: null }
  const datos: Partial<FormData> = {
    carrera: carreraDraft.value.carrera,
    carreraId: carreraDraft.value.carreraId,
    tipoPrograma: 'Regular'
  }
  if (aplicaFinanciamiento.value) {
    const usa = fin.value.usaFinanciamientoEstado
    Object.assign(datos, {
      rendioPAES: fin.value.rendioPAES,
      paesRespondido: fin.value.paesRespondido,
      paes: { ...base, lenguaje: fin.value.rendioPAES ? fin.value.lenguaje : null, matematica: fin.value.rendioPAES ? fin.value.matematica : null },
      usaFinanciamientoEstado: usa,
      planeaUsarCAE: usa ? fin.value.planeaUsarCAE : false,
      usaBecasEstado: usa ? fin.value.usaBecasEstado : false,
      decil: usa ? fin.value.decil : null
    })
  }
  return datos
}

const commit = () => emit('commit', aDatos())

const enfocarRegion = async () => {
  await nextTick()
  if (paso.value === 1 && !carreraDraft.value.carreraId && window.innerWidth > 640) subCarreraRef.value?.enfocar()
  else regionRef.value?.focus()
}

const calcularMotor = () => motor.calcular({ ...props.formData, ...aDatos() })

const irA = async (nuevo: 1 | 2 | 3) => {
  paso.value = nuevo
  if (nuevo === 3) calcularMotor()
  await enfocarRegion()
}

const siguiente = async () => {
  if (paso.value === 1) {
    intento.value[1] = true
    if (Object.keys(validarSubpasoCarrera(estado.value)).length) return
    commit()
    await irA(2)
  } else if (paso.value === 2) {
    intento.value[2] = true
    if (Object.keys(validarSubpasoFinanciamiento(estado.value)).length) return
    commit()
    await irA(3)
  }
}

const atras = () => {
  if (paso.value > 1) irA((paso.value - 1) as 1 | 2)
}

const verResultados = () => {
  // El motor ya validó los pasos 1 y 2; se revalida por si cambió algo desde otro lado
  if (Object.keys(validarSubpasoCarrera(estado.value)).length) { intento.value[1] = true; irA(1); return }
  if (Object.keys(validarSubpasoFinanciamiento(estado.value)).length) { intento.value[2] = true; irA(2); return }
  commit()
  emit('update:visible', false)
  emit('ver-resultados')
}

const elegirCarrera = (c: CarreraOpcion) => {
  carreraDraft.value = { carrera: c.nombre_programa, carreraId: c.id }
  intento.value[1] = false
}

const onShow = () => {
  elementoPrevio = (document.activeElement as HTMLElement) || null
}


const onHide = () => {
  // Al cerrar (✕, Esc o terminar) se conserva lo respondido hasta ahí
  commit()
  nextTick(() => elementoPrevio?.focus?.())
}

watch(
  () => props.visible,
  (v) => {
    if (!v) return
    desdeProps()
    consulta.value = props.consultaInicial
    intento.value = { 1: false, 2: false }
    motor.resultado.value = null
    motor.error.value = null
    paso.value = props.startStep
    enfocarBusqueda.value = props.startStep === 1 && !carreraDraft.value.carreraId && window.innerWidth > 640
    if (props.startStep === 3) calcularMotor()
  },
  { immediate: true }
)

const cerrar = (v: boolean) => emit('update:visible', v)
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :draggable="false"
    :closable="true"
    close-on-escape
    :dismissable-mask="false"
    block-scroll
    :close-button-props="{ 'aria-label': 'Cerrar', severity: 'secondary', text: true, rounded: true }"
    class="msc-dialog"
    :pt="{ content: { class: 'msc-content' }, footer: { class: 'msc-footer' }, header: { class: 'msc-header' } }"
    aria-labelledby="msc-titulo"
    data-testid="modal-simulacion"
    @update:visible="cerrar"
    @show="onShow"
    @hide="onHide"
  >
    <template #header>
      <h2 id="msc-titulo" class="msc-titulo" data-testid="modal-titulo">
        Paso {{ paso }} de 3 · {{ TITULOS[paso - 1] }}
      </h2>
    </template>

    <div class="msc-progreso" role="progressbar" aria-label="Avance de la simulación" aria-valuemin="1" aria-valuemax="3" :aria-valuenow="paso" :aria-valuetext="`Paso ${paso} de 3`">
      <span v-for="n in 3" :key="n" class="msc-barra" :class="{ 'msc-barra-on': n <= paso }" />
    </div>

    <div ref="regionRef" tabindex="-1" :autofocus="!enfocarBusqueda" class="msc-region" :aria-label="TITULOS[paso - 1]">
      <SubpasoCarrera
        v-show="paso === 1"
        ref="subCarreraRef"
        v-model:consulta="consulta"
        :carreras="carreras"
        :carrera-id="carreraDraft.carreraId"
        :cargando="carrerasLoading"
        :solo-online="soloOnline"
        :autofocus-busqueda="enfocarBusqueda"
        :error="erroresCarrera.carrera"
        @seleccionar="elegirCarrera"
      />
      <SubpasoFinanciamiento
        v-if="paso === 2"
        v-model="fin"
        :aplica="aplicaFinanciamiento"
        :errores="erroresFin"
        :deciles-options="decilesOptions"
        :deciles-loading="decilesLoading"
        :deciles-error="decilesError"
      />
      <SubpasoMotorBecas
        v-if="paso === 3"
        :resultado="motor.resultado.value"
        :cargando="motor.cargando.value"
        :error="motor.error.value"
        @reintentar="calcularMotor"
      />
    </div>

    <template #footer>
      <Button v-if="paso > 1" type="button" label="Atrás" icon="pi pi-arrow-left" severity="secondary" data-testid="modal-atras" @click="atras" />
      <Button
        v-if="paso < 3"
        type="button"
        label="Siguiente"
        icon="pi pi-arrow-right"
        icon-pos="right"
        class="msc-principal"
        data-testid="modal-siguiente"
        @click="siguiente"
      />
      <Button
        v-else
        type="button"
        label="Ver mis resultados"
        icon="pi pi-arrow-right"
        icon-pos="right"
        class="msc-principal"
        :disabled="motor.cargando.value || !!motor.error.value"
        data-testid="modal-ver-resultados"
        @click="verResultados"
      />
    </template>
  </Dialog>
</template>

<style>
/* Global: el Dialog de PrimeVue se monta en <body>, fuera del alcance de los estilos "scoped". */
.msc-dialog.p-dialog { width: 34rem; max-width: calc(100vw - 2rem); }
.msc-dialog .msc-header { padding: 1rem 1.25rem 0.5rem; }
.msc-dialog .msc-titulo { font-size: 0.9375rem; font-weight: 600; color: #475569; margin: 0; }
.msc-dialog .msc-content { padding: 0.5rem 1.25rem 1rem; }
.msc-dialog .msc-footer { display: flex; gap: 0.75rem; padding: 0.75rem 1.25rem 1rem; }
.msc-dialog .msc-footer .p-button { flex: 1; justify-content: center; min-height: 2.75rem; }
.msc-dialog .msc-progreso { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.375rem; margin-bottom: 1rem; }
.msc-dialog .msc-barra { height: 0.25rem; border-radius: 999px; background: #cbd5e1; }
.msc-dialog .msc-barra-on { background: #4b8fc4; }
.msc-dialog .msc-region { outline: none; }

@media (max-width: 640px) {
  /* Pantalla completa en móvil; el cuerpo hace scroll y los botones quedan visibles abajo */
  .msc-dialog.p-dialog { width: 100vw; max-width: 100vw; height: 100dvh; max-height: 100dvh; margin: 0; border-radius: 0; }
  .msc-dialog .msc-content { flex: 1 1 auto; overflow-y: auto; padding: 0.5rem 1rem 1rem; }
  .msc-dialog .msc-footer { padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom)); border-top: 1px solid #e2e8f0; }
}

html.dark .msc-dialog .msc-titulo { color: #cbd5e1; }
html.dark .msc-dialog .msc-barra { background: #475569; }
html.dark .msc-dialog .msc-barra-on { background: #60a5fa; }
html.dark .msc-dialog .msc-footer { border-color: #334155; }
</style>
