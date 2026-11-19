<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, GraduationCap } from 'lucide-vue-next'
import { TEXTOS } from '@/constants/textosSimulador'

const router = useRouter()
const T = TEXTOS.camino

// Hoy solo Pregrado es seleccionable. Postgrado se muestra como «Próximamente»
// (no clicable). Las rutas /advance, /postgrados y /diplomados siguen existiendo
// pero ya no se enlazan desde esta pantalla.
const irAPregrado = () => {
  router.push('/simulador')
}

const volver = () => {
  router.push('/')
}
</script>

<template>
  <div class="camino-view">
    <header class="camino-header">
      <img src="/logo_uniacc_simulador.png" alt="Universidad UNIACC" class="camino-logo" />
      <p class="camino-header-title">Simulador de Becas</p>
    </header>
    <div class="camino-brandline" aria-hidden="true"></div>

    <main class="camino-main">
      <button type="button" class="camino-back" data-testid="volver" @click="volver">
        <ArrowLeft class="w-4 h-4" aria-hidden="true" />
        {{ T.volver }}
      </button>

      <h1 class="camino-title">{{ T.titulo }}</h1>
      <p class="camino-subtitle">{{ T.subtitulo }}</p>

      <div class="camino-cards">
        <button
          type="button"
          class="camino-card camino-card-activa"
          data-testid="card-pregrado"
          @click="irAPregrado"
        >
          <span class="camino-icon camino-icon-activa"><GraduationCap class="w-6 h-6" aria-hidden="true" /></span>
          <span class="camino-card-title">{{ T.pregrado.titulo }}</span>
          <span class="camino-card-desc">{{ T.pregrado.descripcion }}</span>
          <span class="camino-card-cta">
            {{ T.pregrado.boton }}
            <ArrowRight class="w-4 h-4" aria-hidden="true" />
          </span>
        </button>

        <div
          class="camino-card camino-card-inactiva"
          data-testid="card-postgrado"
          role="button"
          aria-disabled="true"
          tabindex="-1"
        >
          <span class="camino-chip">{{ T.postgrado.chip }}</span>
          <span class="camino-icon camino-icon-inactiva"><GraduationCap class="w-6 h-6" aria-hidden="true" /></span>
          <span class="camino-card-title">{{ T.postgrado.titulo }}</span>
          <span class="camino-card-desc">{{ T.postgrado.descripcion }}</span>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.camino-view {
  @apply min-h-screen flex flex-col bg-gray-50 text-gray-900;
}

.camino-header {
  @apply w-full bg-black text-white flex flex-col items-center gap-2 px-4 pt-6 pb-6;
}

.camino-logo {
  height: 48px;
  width: auto;
  max-width: min(240px, 70vw);
  object-fit: contain;
}

.camino-header-title {
  @apply text-xl md:text-2xl font-semibold;
}

.camino-brandline {
  height: 6px;
  background: linear-gradient(to right,
      var(--p-tertiary-500, #ff6b35) 0%,
      var(--p-tertiary-500, #ff6b35) 33.33%,
      var(--p-secondary-500, #ff007f) 33.33%,
      var(--p-secondary-500, #ff007f) 66.66%,
      var(--p-primary-500, #0ea5e9) 66.66%,
      var(--p-primary-500, #0ea5e9) 100%);
}

.camino-main {
  @apply w-full max-w-3xl mx-auto px-5 py-6 md:py-10 flex flex-col;
}

.camino-back {
  @apply self-start inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4;
}

.camino-title {
  @apply text-2xl md:text-4xl font-bold;
}

.camino-subtitle {
  @apply mt-2 mb-6 text-gray-600;
}

.camino-cards {
  @apply grid grid-cols-1 sm:grid-cols-2 gap-4;
}

.camino-card {
  @apply relative flex flex-col items-start gap-1 rounded-xl border p-5 text-left;
  min-height: 11rem;
}

.camino-card-activa {
  @apply bg-white border-gray-200 shadow-sm transition cursor-pointer hover:shadow-md hover:border-sky-400;
}

.camino-card-inactiva {
  @apply bg-gray-100 border-dashed border-gray-300 text-gray-400 cursor-not-allowed select-none;
}

.camino-icon {
  @apply mb-2 flex h-11 w-11 items-center justify-center rounded-lg text-white;
}

.camino-icon-activa {
  background: #4f94cd;
}

.camino-icon-inactiva {
  @apply bg-gray-300;
}

.camino-card-title {
  @apply text-lg font-semibold;
}

.camino-card-desc {
  @apply text-sm text-gray-600;
}

.camino-card-inactiva .camino-card-desc {
  @apply text-gray-400;
}

.camino-card-cta {
  @apply mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-sky-700;
}

.camino-chip {
  @apply absolute right-3 top-3 rounded-full bg-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white;
}

:global(html.dark) .camino-view {
  background: #0f172a;
  color: #f8fafc;
}

:global(html.dark) .camino-subtitle,
:global(html.dark) .camino-back,
:global(html.dark) .camino-card-desc {
  color: #cbd5e1;
}

:global(html.dark) .camino-card-activa {
  background: #1e293b;
  border-color: #334155;
}

:global(html.dark) .camino-card-inactiva {
  background: #172033;
  border-color: #334155;
}

:global(html.dark) .camino-card-inactiva .camino-card-desc,
:global(html.dark) .camino-card-inactiva .camino-card-title {
  color: #64748b;
}

:global(html.dark) .camino-card-cta {
  color: #7dd3fc;
}
</style>
