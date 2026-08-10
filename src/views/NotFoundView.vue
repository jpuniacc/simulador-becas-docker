<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Home,
  ArrowLeft,
  Search,
  AlertTriangle,
  RotateCcw
} from 'lucide-vue-next'

// Router
const router = useRouter()

// Métodos
const goHome = () => {
  router.push('/')
}

const goBack = () => {
  router.back()
}

const goToSimulator = () => {
  router.push('/simulador')
}

const reloadPage = () => {
  window.location.reload()
}
</script>

<template>
  <div class="not-found-view">
    <!-- Header de navegación -->
    <div class="not-found-header">
      <div class="header-content">
        <div class="header-left">
          <Button
            variant="ghost"
            size="sm"
            @click="goBack"
            class="back-button"
          >
            <ArrowLeft class="w-4 h-4 mr-2" />
            Volver
          </Button>

          <Button
            variant="ghost"
            size="sm"
            @click="goHome"
            class="home-button"
          >
            <Home class="w-4 h-4 mr-2" />
            Inicio
          </Button>
        </div>

        <div class="header-center">
          <h1 class="not-found-title">Página no encontrada</h1>
          <p class="not-found-subtitle">Error 404</p>
        </div>

        <div class="header-right">
          <Button
            @click="goToSimulator"
            class="cta-button"
          >
            Simular Becas
          </Button>
        </div>
      </div>
    </div>

    <!-- Contenido principal -->
    <div class="not-found-content">
      <div class="error-container">
        <!-- Icono de error -->
        <div class="error-icon">
          <AlertTriangle class="w-24 h-24 text-orange-500" />
        </div>

        <!-- Número 404 -->
        <div class="error-number">
          <span class="number-4">4</span>
          <span class="number-0">0</span>
          <span class="number-4">4</span>
        </div>

        <!-- Título y descripción -->
        <div class="error-text">
          <h1 class="error-title">¡Oops! Página no encontrada</h1>
          <p class="error-description">
            La página que estás buscando no existe o ha sido movida.
            No te preocupes, te ayudamos a encontrar lo que necesitas.
          </p>
        </div>

        <!-- Acciones -->
        <div class="error-actions">
          <Button
            size="lg"
            @click="goHome"
            class="primary-button"
          >
            <Home class="w-5 h-5 mr-2" />
            Ir al Inicio
          </Button>

          <Button
            variant="outline"
            size="lg"
            @click="goToSimulator"
            class="secondary-button"
          >
            <Search class="w-5 h-5 mr-2" />
            Simular Becas
          </Button>

          <Button
            variant="ghost"
            size="lg"
            @click="reloadPage"
            class="tertiary-button"
          >
            <RotateCcw class="w-5 h-5 mr-2" />
            Recargar Página
          </Button>
        </div>

        <!-- Enlaces útiles -->
        <div class="helpful-links">
          <h3 class="links-title">Enlaces útiles:</h3>
          <div class="links-grid">
            <a href="/" class="helpful-link">
              <Home class="w-4 h-4 mr-2" />
              Página Principal
            </a>
            <a href="/simulador" class="helpful-link">
              <Search class="w-4 h-4 mr-2" />
              Simulador de Becas
            </a>
            <a href="/about" class="helpful-link">
              <AlertTriangle class="w-4 h-4 mr-2" />
              Sobre UNIACC
            </a>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="additional-info">
          <div class="info-card">
            <h4 class="info-title">¿Necesitas ayuda?</h4>
            <p class="info-description">
              Si crees que esto es un error, puedes contactarnos o intentar
              acceder desde la página principal.
            </p>
            <div class="info-actions">
              <Button
                variant="outline"
                size="sm"
                @click="goHome"
                class="info-button"
              >
                Contactar Soporte
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="not-found-footer">
      <div class="footer-content">
        <p class="footer-text">
          © 2024 UNIACC - Simulador de Becas y Beneficios
        </p>
        <div class="footer-links">
          <a href="/" class="footer-link">Inicio</a>
          <a href="/simulador" class="footer-link">Simulador</a>
          <a href="/about" class="footer-link">Sobre UNIACC</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-view {
  @apply min-h-screen bg-gray-50 flex flex-col;
}

.not-found-header {
  @apply bg-white border-b border-gray-200 sticky top-0 z-40;
}

.header-content {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4;
  @apply flex items-center justify-between;
}

.header-left {
  @apply flex items-center space-x-2;
}

.header-center {
  @apply text-center flex-1;
}

.not-found-title {
  @apply text-xl font-bold text-gray-900;
}

.not-found-subtitle {
  @apply text-sm text-gray-600;
}

.header-right {
  @apply flex items-center space-x-2;
}

.back-button,
.home-button {
  @apply text-gray-600 hover:text-gray-900;
}

.cta-button {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
}

.not-found-content {
  @apply flex-1 flex items-center justify-center p-4;
}

.error-container {
  @apply text-center max-w-4xl mx-auto;
}

.error-icon {
  @apply mb-8;
}

.error-number {
  @apply text-8xl md:text-9xl font-bold text-gray-300 mb-8;
  @apply flex items-center justify-center space-x-4;
}

.number-4,
.number-0 {
  @apply transform transition-all duration-300;
}

.number-4:hover,
.number-0:hover {
  @apply scale-110 text-blue-600;
}

.error-text {
  @apply mb-12;
}

.error-title {
  @apply text-3xl md:text-4xl font-bold text-gray-900 mb-4;
}

.error-description {
  @apply text-lg text-gray-600 max-w-2xl mx-auto;
}

.error-actions {
  @apply flex flex-col sm:flex-row gap-4 justify-center mb-12;
}

.primary-button {
  @apply bg-blue-600 hover:bg-blue-700 text-white;
}

.secondary-button {
  @apply border-blue-600 text-blue-600 hover:bg-blue-50;
}

.tertiary-button {
  @apply text-gray-600 hover:text-gray-900;
}

.helpful-links {
  @apply mb-12;
}

.links-title {
  @apply text-lg font-semibold text-gray-900 mb-4;
}

.links-grid {
  @apply grid grid-cols-1 sm:grid-cols-3 gap-4;
}

.helpful-link {
  @apply flex items-center justify-center p-4 bg-white rounded-lg border border-gray-200;
  @apply text-gray-600 hover:text-blue-600 hover:border-blue-300;
  @apply transition-all duration-200 transform hover:scale-105;
}

.additional-info {
  @apply max-w-2xl mx-auto;
}

.info-card {
  @apply bg-white p-6 rounded-lg border border-gray-200 shadow-sm;
}

.info-title {
  @apply text-lg font-semibold text-gray-900 mb-2;
}

.info-description {
  @apply text-gray-600 mb-4;
}

.info-actions {
  @apply flex justify-center;
}

.info-button {
  @apply border-blue-600 text-blue-600 hover:bg-blue-50;
}

.not-found-footer {
  @apply bg-white border-t border-gray-200 mt-auto;
}

.footer-content {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6;
  @apply flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0;
}

.footer-text {
  @apply text-sm text-gray-600;
}

.footer-links {
  @apply flex items-center space-x-6;
}

.footer-link {
  @apply text-sm text-gray-600 hover:text-gray-900 transition-colors;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    @apply flex-col space-y-4;
  }

  .header-left,
  .header-right {
    @apply w-full justify-center;
  }

  .header-center {
    @apply order-first;
  }

  .error-number {
    @apply text-6xl;
  }

  .error-title {
    @apply text-2xl;
  }

  .error-description {
    @apply text-base;
  }

  .error-actions {
    @apply flex-col;
  }

  .primary-button,
  .secondary-button,
  .tertiary-button {
    @apply w-full;
  }

  .links-grid {
    @apply grid-cols-1;
  }

  .footer-content {
    @apply text-center;
  }

  .footer-links {
    @apply flex-col space-y-2 space-x-0;
  }
}

@media (max-width: 480px) {
  .error-number {
    @apply text-5xl;
  }

  .error-title {
    @apply text-xl;
  }

  .error-description {
    @apply text-sm;
  }

  .helpful-link {
    @apply p-3;
  }
}

/* Animaciones */
.error-icon {
  @apply transform transition-all duration-300;
}

.error-icon:hover {
  @apply scale-110;
}

.number-4,
.number-0 {
  @apply transform transition-all duration-300;
}

.number-4:hover,
.number-0:hover {
  @apply scale-110 text-blue-600;
}

.helpful-link {
  @apply transform transition-all duration-200;
}

.helpful-link:hover {
  @apply scale-105;
}

.info-card {
  @apply transform transition-all duration-300;
}

.info-card:hover {
  @apply scale-105;
}

/* Efectos especiales */
.error-number {
  @apply relative;
}

.error-number::before {
  content: '';
  @apply absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400;
  @apply opacity-0 transition-opacity duration-300;
  @apply rounded-lg blur-sm;
}

.error-number:hover::before {
  @apply opacity-20;
}

/* Transiciones suaves */
.not-found-view {
  @apply transition-all duration-300;
}

.error-container {
  @apply transition-all duration-300;
}

.error-container:hover {
  @apply scale-105;
}

/* Estados de hover */
.primary-button:hover {
  @apply scale-105;
}

.secondary-button:hover {
  @apply scale-105;
}

.tertiary-button:hover {
  @apply scale-105;
}

.info-button:hover {
  @apply scale-105;
}

/* Animación de entrada */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-container {
  animation: fadeInUp 0.6s ease-out;
}

.error-icon {
  animation: fadeInUp 0.8s ease-out;
}

.error-number {
  animation: fadeInUp 1s ease-out;
}

.error-text {
  animation: fadeInUp 1.2s ease-out;
}

.error-actions {
  animation: fadeInUp 1.4s ease-out;
}

.helpful-links {
  animation: fadeInUp 1.6s ease-out;
}

.additional-info {
  animation: fadeInUp 1.8s ease-out;
}
</style>
