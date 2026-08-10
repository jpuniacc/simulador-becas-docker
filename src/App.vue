<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import Toast from 'primevue/toast'
import { useSEO } from './composables/useSEO'
import { useStructuredData } from './composables/useStructuredData'
import { useCampaignTracking } from './composables/useCampaignTracking'
import { useSimuladorStore } from './stores/simuladorStore'
import { useThemeStore } from './stores/themeStore'
import ThemeToggle from './components/ThemeToggle.vue'

// Composables
const { initialize: initializeSEO } = useSEO()
const { injectAllSchemas } = useStructuredData()
const { initialize: initializeCampaignTracking } = useCampaignTracking()
const simuladorStore = useSimuladorStore()
const themeStore = useThemeStore()

// Tema lo antes posible (evita flash claro si el SO está en oscuro)
themeStore.initializeTheme()

// Lifecycle
onMounted(() => {
  // Inicializar tracking de campañas (solo una vez al inicio de la app)
  const campaignData = initializeCampaignTracking()

  // Push inicial al dataLayer con datos de campaña
  if (typeof window !== 'undefined' && (window as any).dataLayer) {
    if (Object.keys(campaignData).length > 0) {
      (window as any).dataLayer.push({
        event: 'campaign_initialized',
        campaign_data: campaignData,
        page_path: window.location.pathname,
        page_url: window.location.href
      })
    }
  }

  // Log de debugging
  if (import.meta.env.DEV) {
    console.log('📊 App.vue - Campaign data initialized:', campaignData)
    console.log('📊 App.vue - Check localStorage:', localStorage.getItem('simulador-campaign-data'))
  }

  // Inicializar datos de campaña en el store
  simuladorStore.initializeCampaignData()

  // Inicializar SEO
  initializeSEO()

  // Inyectar structured data
  injectAllSchemas()
})
</script>

<template>
  <div id="app" class="app uniacc-theme">
    <div class="theme-toggle-bar">
      <ThemeToggle />
    </div>
    <!-- Router View -->
    <RouterView />
    <!-- Toast de PrimeVue -->
    <Toast />
  </div>
</template>

<style>
/* Reset y estilos globales */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background-color: #f9fafb;
  color: #111827;
  overflow-x: hidden;
}

html.dark body {
  background-color: #0f172a;
  color: #f8fafc;
}

.theme-toggle-bar {
  position: fixed;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 1000;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* Estilos para scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f5f9;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Estilos para selección de texto */
::selection {
  background-color: #3b82f6;
  color: white;
}

::-moz-selection {
  background-color: #3b82f6;
  color: white;
}

/* Estilos para focus */
*:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Estilos para botones */
button {
  cursor: pointer;
  border: none;
  background: none;
  font-family: inherit;
}

/* Estilos para enlaces */
a {
  color: inherit;
  text-decoration: none;
}

/* Estilos para inputs */
input, textarea, select {
  font-family: inherit;
  font-size: inherit;
}

/* Estilos para imágenes */
img {
  max-width: 100%;
  height: auto;
}

/* Estilos para transiciones globales */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

/* Estilos para utilidades */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Estilos para loading */
.loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Estilos para responsive */
@media (max-width: 640px) {
  html {
    font-size: 14px;
  }
}

@media (max-width: 480px) {
  html {
    font-size: 13px;
  }
}

/* Estilos para dark mode vía clase .dark (themeStore) */
.dark body,
html.dark body {
  background-color: #111827;
  color: #f9fafb;
}

html.dark ::-webkit-scrollbar-track {
  background: #1f2937;
}

html.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}

html.dark ::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

/* Estilos para impresión */
@media print {
  * {
    background: transparent !important;
    color: black !important;
    box-shadow: none !important;
    text-shadow: none !important;
  }

  a, a:visited {
    text-decoration: underline;
  }

  a[href]:after {
    content: " (" attr(href) ")";
  }

  abbr[title]:after {
    content: " (" attr(title) ")";
  }

  .no-print {
    display: none !important;
  }
}

/* Estilos para accesibilidad */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* Estilos para high contrast */
@media (prefers-contrast: high) {
  * {
    border-color: currentColor !important;
  }
}

/* Estilos para focus visible */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Estilos para hover */
@media (hover: hover) {
  a:hover {
    text-decoration: underline;
  }
}

/* Estilos para touch */
@media (hover: none) {
  button, a {
    min-height: 44px;
    min-width: 44px;
  }
}
</style>
