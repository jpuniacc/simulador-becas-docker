<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Calculator, Check } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { TEXTOS } from '@/constants/textosSimulador'

const router = useRouter()
const T = TEXTOS.home

const goToSimulator = () => {
  router.push('/elige-tu-camino')
}
</script>

<template>
  <div class="home-view">
    <header class="home-topbar">
      <img src="../assets/universidad-uniacc-logo.png" alt="Universidad UNIACC" class="home-logo" />
    </header>
    <div class="home-brandline" aria-hidden="true"></div>

    <main class="home-main">
      <section class="home-hero">
        <h1 class="home-title">{{ T.titulo }}</h1>
        <p class="home-subtitle">{{ T.subtitulo }}</p>

        <Button
          size="lg"
          @click="goToSimulator"
          class="home-cta bg-uniacc-orange hover:bg-uniacc-orange-hover text-white font-semibold rounded-lg shadow-lg"
        >
          <Calculator class="w-5 h-5 mr-2" />
          {{ T.boton }}
        </Button>

        <ul class="home-trust">
          <li v-for="item in T.confianza" :key="item">
            <Check class="w-4 h-4 text-uniacc-pink" aria-hidden="true" />
            <span>{{ item }}</span>
          </li>
        </ul>

        <section class="home-how" aria-labelledby="como-funciona">
          <h2 id="como-funciona" class="home-how-title">{{ T.comoFuncionaTitulo }}</h2>
          <ol class="home-how-list">
            <li v-for="(paso, i) in T.pasos" :key="paso">
              <span class="home-how-num">{{ i + 1 }}</span>
              <span>{{ paso }}</span>
            </li>
          </ol>
        </section>

        <p class="home-note">{{ T.nota }}</p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home-view {
  @apply min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 text-gray-900;
}

.home-topbar {
  @apply w-full bg-white px-4 py-3 flex items-center justify-center md:justify-start md:px-10;
}

.home-logo {
  @apply h-9 w-auto object-contain md:h-11;
}

.home-brandline {
  height: 5px;
  background: linear-gradient(to right,
      var(--p-tertiary-500, #ff6b35) 0%,
      var(--p-tertiary-500, #ff6b35) 33.33%,
      var(--p-secondary-500, #ff007f) 33.33%,
      var(--p-secondary-500, #ff007f) 66.66%,
      var(--p-primary-500, #0ea5e9) 66.66%,
      var(--p-primary-500, #0ea5e9) 100%);
}

.home-main {
  @apply flex-1 w-full px-5 py-8 md:py-16;
}

.home-hero {
  @apply mx-auto w-full max-w-xl flex flex-col gap-5;
}

.home-title {
  @apply text-3xl md:text-5xl font-bold leading-tight text-gray-900;
}

.home-subtitle {
  @apply text-base md:text-xl text-gray-600 leading-relaxed;
}

.home-cta {
  @apply w-full px-8 py-6 text-lg;
}

.home-trust {
  @apply flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-gray-700;
}

.home-trust li {
  @apply flex items-center gap-1.5;
}

.home-how {
  @apply rounded-xl bg-white/90 border border-gray-200 p-4 shadow-sm;
}

.home-how-title {
  @apply text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3;
}

.home-how-list {
  @apply flex flex-col gap-3;
}

.home-how-list li {
  @apply flex items-center gap-3 text-base text-gray-800;
}

.home-how-num {
  @apply flex h-7 w-7 flex-none items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white;
}

.home-note {
  @apply text-xs text-gray-500 leading-relaxed;
}

:global(html.dark .home-view) {
  background: #0f172a;
  color: #f8fafc;
}

:global(html.dark .home-topbar) {
  background: #0f172a;
}

/* El logo tiene fondo blanco opaco: se muestra como insignia clara sobre la barra oscura */
:global(html.dark .home-logo) {
  background: #ffffff;
  border-radius: 0.375rem;
  padding: 0.25rem 0.5rem;
}

:global(html.dark .home-title) {
  color: #f8fafc;
}

:global(html.dark .home-subtitle),
:global(html.dark .home-trust),
:global(html.dark .home-note) {
  color: #cbd5e1;
}

:global(html.dark .home-how) {
  background: #1e293b;
  border-color: #334155;
}

:global(html.dark .home-how-list li) {
  color: #e2e8f0;
}

:global(html.dark .home-how-title) {
  color: #94a3b8;
}

:global(html.dark .home-how-num) {
  background: #f8fafc;
  color: #0f172a;
}
</style>
