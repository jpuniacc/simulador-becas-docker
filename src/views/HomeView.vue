<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Calculator,
  Info,
  GraduationCap,
  Award,
  Clock,
  Shield,
  TrendingUp,
  Smartphone
} from 'lucide-vue-next'

// Router
const router = useRouter()

// Refs
const featuresSection = ref<HTMLElement>()

// Métodos
const goToSimulator = () => {
  router.push('/elige-tu-camino')
}

const goToAbout = () => {
  router.push('/about')
}

const scrollToFeatures = () => {
  featuresSection.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="home-view">
    <!-- Hero Section -->
    <section class="hero-section bg-gradient-to-br from-uniacc-blue to-uniacc-pink text-white">
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="hero-title">
            Descubre qué beneficios puedes obtener en
            <span class="text-uniacc-pink font-semibold">UNIACC</span>
          </h1>
          <p class="hero-description">
            Nuestro simulador te ayuda a conocer todas las becas, descuentos y beneficios
            disponibles para tu carrera. Solo necesitamos algunos datos básicos.
          </p>
          <div class="hero-actions">
            <Button
              size="lg"
              @click="goToSimulator"
              class="bg-uniacc-orange hover:bg-uniacc-orange-hover text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Calculator class="w-5 h-5 mr-2" />
              Comenzar Simulación
            </Button>
            <!-- <Button
              size="lg"
              @click="scrollToFeatures"
              class="bg-uniacc-purple hover:bg-uniacc-purple-hover text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Info class="w-5 h-5 mr-2" />
              Conocer Más
            </Button> -->
          </div>
        </div>
        <div class="hero-image">
          <div class="container-logo-uniacc">
            <img src="../assets/universidad-uniacc-logo.png" alt="Logo UNIACC" class="logo-uniacc" />
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <!-- <section ref="featuresSection" class="features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">¿Por qué elegir nuestro simulador?</h2>
          <p class="section-description">
            Herramientas diseñadas para ayudarte a tomar la mejor decisión educativa
          </p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <Calculator class="w-8 h-8 text-blue-600" />
            </div>
            <h3 class="feature-title">Cálculo Automático</h3>
            <p class="feature-description">
              Calculamos automáticamente tu decil socioeconómico y todos los beneficios aplicables
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <Award class="w-8 h-8 text-green-600" />
            </div>
            <h3 class="feature-title">Beneficios Completos</h3>
            <p class="feature-description">
              Accede a todas las becas internas, externas y convenios disponibles en UNIACC
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <Clock class="w-8 h-8 text-orange-600" />
            </div>
            <h3 class="feature-title">Solo 5 Minutos</h3>
            <p class="feature-description">
              Completa la simulación en menos de 5 minutos con información básica
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <Shield class="w-8 h-8 text-purple-600" />
            </div>
            <h3 class="feature-title">100% Gratuito</h3>
            <p class="feature-description">
              Sin costo alguno. Tu información se mantiene privada y segura
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <TrendingUp class="w-8 h-8 text-red-600" />
            </div>
            <h3 class="feature-title">Resultados Precisos</h3>
            <p class="feature-description">
              Basado en datos oficiales y criterios reales de UNIACC
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <Smartphone class="w-8 h-8 text-indigo-600" />
            </div>
            <h3 class="feature-title">Responsive</h3>
            <p class="feature-description">
              Funciona perfectamente en computadora, tablet y móvil
            </p>
          </div>
        </div>
      </div>
    </section> -->

    <!-- Process Section -->
    <!-- <section class="process-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">¿Cómo funciona?</h2>
          <p class="section-description">
            Un proceso simple y rápido para conocer tus beneficios
          </p>
        </div>

        <div class="process-steps">
          <div class="process-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3 class="step-title">Datos Personales</h3>
              <p class="step-description">Información básica de contacto</p>
            </div>
          </div>

          <div class="process-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3 class="step-title">Datos Académicos</h3>
              <p class="step-description">Nivel educativo y colegio</p>
            </div>
          </div>

          <div class="process-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3 class="step-title">Situación Socioeconómica</h3>
              <p class="step-description">Selecciona tu decil</p>
            </div>
          </div>

          <div class="process-step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h3 class="step-title">PAES (Opcional)</h3>
              <p class="step-description">Agrega tus puntajes si los tienes</p>
            </div>
          </div>

          <div class="process-step">
            <div class="step-number">5</div>
            <div class="step-content">
              <h3 class="step-title">Resultados</h3>
              <p class="step-description">Revisa tus beneficios disponibles</p>
            </div>
          </div>
        </div>
      </div>
    </section> -->

    <!-- Stats Section -->
    <!-- <section class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-number">1000+</div>
            <div class="stat-label">Simulaciones Realizadas</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">50+</div>
            <div class="stat-label">Beneficios Disponibles</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">95%</div>
            <div class="stat-label">Satisfacción de Usuarios</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">5 min</div>
            <div class="stat-label">Tiempo Promedio</div>
          </div>
        </div>
      </div>
    </section> -->

    <!-- CTA Section -->
    <!-- <section class="cta-section">
      <div class="container">
        <div class="cta-content">
          <h2 class="cta-title">¿Listo para descubrir tus beneficios?</h2>
          <p class="cta-description">
            Comienza tu simulación ahora y descubre qué beneficios puedes obtener en UNIACC
          </p>
          <div class="cta-actions">
            <Button
              size="lg"
              @click="goToSimulator"
              class="bg-uniacc-orange-light hover:bg-uniacc-orange-light text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Calculator class="w-5 h-5 mr-2" />
              Comenzar Simulación
            </Button>
            <Button
              size="lg"
              @click="goToAbout"
              class="bg-uniacc-purple-light hover:bg-uniacc-purple-light text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              <Info class="w-5 h-5 mr-2" />
              Conocer UNIACC
            </Button>
          </div>
        </div>
      </div>
    </section> -->


  </div>
</template>

<style scoped>
.home-view {
  @apply min-h-screen;
}

.hero-section {
  @apply bg-gradient-to-br from-blue-50 to-indigo-100 py-20;
}

.hero-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
  @apply grid grid-cols-1 lg:grid-cols-2 gap-12 items-center;
}

.hero-content {
  @apply space-y-8;
}

.hero-title {
  @apply text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight;
}

.hero-description {
  @apply text-xl text-gray-600 leading-relaxed;
}

.hero-actions {
  @apply flex flex-col sm:flex-row gap-4;
}

.cta-button {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200;
}

.secondary-button {
  @apply border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold rounded-lg;
}

.hero-image {
  @apply flex justify-center lg:justify-end;
}

.image-placeholder {
  @apply w-64 h-64 bg-white rounded-full shadow-lg flex items-center justify-center;
}

.features-section {
  @apply py-20 bg-white;
}

.container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.section-header {
  @apply text-center mb-16;
}

.section-title {
  @apply text-3xl md:text-4xl font-bold text-gray-900 mb-4;
}

.section-description {
  @apply text-xl text-gray-600 max-w-3xl mx-auto;
}

.features-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8;
}

.feature-card {
  @apply bg-white p-8 rounded-lg border border-gray-200 text-center hover:shadow-lg transition-all duration-300;
}

.feature-icon {
  @apply mb-6;
}

.feature-title {
  @apply text-xl font-semibold text-gray-900 mb-4;
}

.feature-description {
  @apply text-gray-600;
}

.process-section {
  @apply py-20 bg-gray-50;
}

.process-steps {
  @apply space-y-8;
}

.process-step {
  @apply flex items-center space-x-6 p-6 rounded-lg bg-white hover:shadow-md transition-all duration-200;
}

.step-number {
  @apply w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0;
}

.step-content {
  @apply flex-1;
}

.step-title {
  @apply text-xl font-semibold text-gray-900 mb-2;
}

.step-description {
  @apply text-gray-600;
}

.stats-section {
  @apply py-16 bg-blue-600;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-8;
}

.stat-item {
  @apply text-center text-white;
}

.stat-number {
  @apply text-4xl font-bold mb-2;
}

.stat-label {
  @apply text-lg;
}

.cta-section {
  @apply py-20 bg-gradient-to-r from-blue-600 to-indigo-600;
}

.cta-content {
  @apply text-center text-white;
}

.cta-title {
  @apply text-3xl md:text-4xl font-bold mb-4;
}

.cta-description {
  @apply text-xl mb-8 max-w-2xl mx-auto;
}

.cta-actions {
  @apply flex flex-col sm:flex-row gap-4 justify-center;
}

/* Animaciones */
.feature-card {
  @apply transform transition-all duration-300;
}

.feature-card:hover {
  @apply scale-105;
}

.process-step {
  @apply transform transition-all duration-200;
}

.process-step:hover {
  @apply scale-105;
}

.cta-button {
  @apply transform transition-all duration-200;
}

.cta-button:hover {
  @apply scale-105;
}

.secondary-button {
  @apply transform transition-all duration-200;
}

.secondary-button:hover {
  @apply scale-105;
}

.container-logo-uniacc {
  @apply flex items-center justify-center bg-white backdrop-blur-sm rounded-full w-[272px] h-[272px];
}

.logo-uniacc {
  @apply w-48 h-48 object-contain;
}

/* Responsive */
@media (max-width: 768px) {
  .hero-title {
    @apply text-3xl;
  }

  .hero-description {
    @apply text-lg;
  }

  .features-grid {
    @apply grid-cols-1;
  }

  .process-step {
    @apply flex-col text-center space-x-0 space-y-4;
  }

  .stats-grid {
    @apply grid-cols-2;
  }

  .container-logo-uniacc {
    @apply flex items-center justify-center bg-white backdrop-blur-sm rounded-full w-[180px] h-[180px];
  }

  .logo-uniacc {
    @apply w-32 h-32 object-contain;
  }
}

@media (max-width: 480px) {
  .hero-actions {
    @apply flex-col;
  }

  .cta-actions {
    @apply flex-col;
  }

  .cta-button,
  .secondary-button {
    @apply w-full;
  }
}
</style>
