<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Home,
  GraduationCap,
  Award,
  Users,
  Target,
  CheckCircle,
  Globe,
  Phone,
  Mail,
  MapPin,
  ExternalLink
} from 'lucide-vue-next'

// Router
const router = useRouter()

// Refs
const statsSection = ref<HTMLElement>()

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

const scrollToStats = () => {
  statsSection.value?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="about-view">
    <!-- Header de navegación -->
    <div class="about-header">
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
          <h1 class="about-title">Sobre UNIACC</h1>
          <p class="about-subtitle">Conoce más sobre nuestra universidad</p>
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

    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-container">
        <div class="hero-content">
          <h1 class="hero-title">
            Universidad de las Artes, Ciencias y Comunicación
          </h1>
          <p class="hero-description">
            UNIACC es una universidad privada chilena que forma profesionales
            creativos, innovadores y comprometidos con el desarrollo del país.
          </p>
          <div class="hero-actions">
            <Button
              size="lg"
              @click="goToSimulator"
              class="cta-button"
            >
              Descubrir Beneficios
            </Button>
            <Button
              variant="outline"
              size="lg"
              @click="scrollToStats"
              class="secondary-button"
            >
              Conocer Más
            </Button>
          </div>
        </div>
        <div class="hero-image">
          <div class="container-logo-uniacc">
            <img src="../assets/universidad-uniacc-logo.png" alt="Logo UNIACC" class="logo-uniacc" />
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section ref="statsSection" class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-icon">
              <Users class="w-8 h-8 text-blue-600" />
            </div>
            <div class="stat-number">15,000+</div>
            <div class="stat-label">Estudiantes</div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <Award class="w-8 h-8 text-green-600" />
            </div>
            <div class="stat-number">50+</div>
            <div class="stat-label">Carreras</div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <Target class="w-8 h-8 text-purple-600" />
            </div>
            <div class="stat-number">25+</div>
            <div class="stat-label">Años de Experiencia</div>
          </div>
          <div class="stat-item">
            <div class="stat-icon">
              <CheckCircle class="w-8 h-8 text-orange-600" />
            </div>
            <div class="stat-number">95%</div>
            <div class="stat-label">Empleabilidad</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Mission Section -->
    <section class="mission-section">
      <div class="container">
        <div class="mission-content">
          <div class="mission-text">
            <h2 class="mission-title">Nuestra Misión</h2>
            <p class="mission-description">
              Formar profesionales creativos, innovadores y comprometidos con el
              desarrollo del país, a través de una educación de calidad que integra
              las artes, las ciencias y la comunicación.
            </p>
            <h3 class="vision-title">Nuestra Visión</h3>
            <p class="vision-description">
              Ser reconocida como la universidad líder en formación de profesionales
              creativos e innovadores, contribuyendo al desarrollo cultural, social
              y económico de Chile.
            </p>
          </div>
          <div class="mission-image">
            <div class="image-placeholder">
              <Globe class="w-24 h-24 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">¿Por qué elegir UNIACC?</h2>
          <p class="section-description">
            Descubre las ventajas de estudiar en nuestra universidad
          </p>
        </div>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <Award class="w-8 h-8 text-blue-600" />
            </div>
            <h3 class="feature-title">Excelencia Académica</h3>
            <p class="feature-description">
              Programas de estudio actualizados y docentes especializados en sus áreas
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <Users class="w-8 h-8 text-green-600" />
            </div>
            <h3 class="feature-title">Comunidad Diversa</h3>
            <p class="feature-description">
              Ambiente multicultural que enriquece la experiencia educativa
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <Target class="w-8 h-8 text-purple-600" />
            </div>
            <h3 class="feature-title">Enfoque Práctico</h3>
            <p class="feature-description">
              Metodologías que combinan teoría y práctica para el mundo real
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <CheckCircle class="w-8 h-8 text-orange-600" />
            </div>
            <h3 class="feature-title">Alta Empleabilidad</h3>
            <p class="feature-description">
              Graduados con altas tasas de inserción laboral en el mercado
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <Globe class="w-8 h-8 text-red-600" />
            </div>
            <h3 class="feature-title">Conectividad Global</h3>
            <p class="feature-description">
              Red de contactos internacionales y oportunidades de intercambio
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <GraduationCap class="w-8 h-8 text-indigo-600" />
            </div>
            <h3 class="feature-title">Innovación Constante</h3>
            <p class="feature-description">
              Tecnología de vanguardia y metodologías educativas innovadoras
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Simulator Section -->
    <section class="simulator-section">
      <div class="container">
        <div class="simulator-content">
          <div class="simulator-text">
            <h2 class="simulator-title">Simulador de Becas y Beneficios</h2>
            <p class="simulator-description">
              Nuestro simulador te ayuda a descubrir todas las becas, descuentos
              y beneficios disponibles para tu carrera. Es completamente gratuito
              y solo toma 5 minutos.
            </p>
            <div class="simulator-features">
              <div class="feature-item">
                <CheckCircle class="w-5 h-5 text-green-600" />
                <span>Cálculo automático de beneficios</span>
              </div>
              <div class="feature-item">
                <CheckCircle class="w-5 h-5 text-green-600" />
                <span>Información actualizada y precisa</span>
              </div>
              <div class="feature-item">
                <CheckCircle class="w-5 h-5 text-green-600" />
                <span>Resultados personalizados</span>
              </div>
              <div class="feature-item">
                <CheckCircle class="w-5 h-5 text-green-600" />
                <span>100% gratuito y confidencial</span>
              </div>
            </div>
            <div class="simulator-actions">
              <Button
                size="lg"
                @click="goToSimulator"
                class="bg-uniacc-orange-light hover:bg-uniacc-orange-light text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Comenzar Simulación
              </Button>
            </div>
          </div>
          <div class="simulator-image">
            <div class="image-placeholder">
              <Award class="w-32 h-32 text-blue-600" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="contact-section">
      <div class="container">
        <div class="contact-content">
          <h2 class="contact-title">¿Tienes preguntas?</h2>
          <p class="contact-description">
            Nuestro equipo está aquí para ayudarte con cualquier duda sobre
            admisión, becas o programas de estudio.
          </p>
          <div class="contact-info">
            <div class="contact-item">
              <Phone class="w-6 h-6 text-blue-600" />
              <div class="contact-details">
                <h3 class="contact-label">Teléfono</h3>
                <p class="contact-value">+56 2 2345 6789</p>
              </div>
            </div>
            <div class="contact-item">
              <Mail class="w-6 h-6 text-blue-600" />
              <div class="contact-details">
                <h3 class="contact-label">Email</h3>
                <p class="contact-value">admision@uniacc.cl</p>
              </div>
            </div>
            <div class="contact-item">
              <MapPin class="w-6 h-6 text-blue-600" />
              <div class="contact-details">
                <h3 class="contact-label">Dirección</h3>
                <p class="contact-value">Av. Salvador 1200, Providencia, Santiago</p>
              </div>
            </div>
          </div>
          <div class="contact-actions">
            <Button
              variant="outline"
              @click="goToSimulator"
              class="contact-button"
            >
              <ExternalLink class="w-4 h-4 mr-2" />
              Visitar Sitio Web
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <div class="about-footer">
      <div class="footer-content">
        <p class="footer-text">
          © 2024 UNIACC - Universidad de las Artes, Ciencias y Comunicación
        </p>
        <div class="footer-links">
          <a href="#" class="footer-link">Términos y Condiciones</a>
          <a href="#" class="footer-link">Política de Privacidad</a>
          <a href="#" class="footer-link">Contacto</a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.about-view {
  @apply min-h-screen bg-white;
}

.about-header {
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

.about-title {
  @apply text-xl font-bold text-gray-900;
}

.about-subtitle {
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

.secondary-button {
  @apply border-blue-600 text-blue-600 hover:bg-blue-50;
}

.hero-image {
  @apply flex justify-center lg:justify-end;
}

.image-placeholder {
  @apply w-64 h-64 bg-white rounded-full shadow-lg flex items-center justify-center;
}

.stats-section {
  @apply py-16 bg-blue-600;
}

.container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.stats-grid {
  @apply grid grid-cols-2 md:grid-cols-4 gap-8;
}

.stat-item {
  @apply text-center text-white;
}

.stat-icon {
  @apply mb-4;
}

.stat-number {
  @apply text-4xl font-bold mb-2;
}

.stat-label {
  @apply text-lg;
}

.mission-section {
  @apply py-20 bg-white;
}

.mission-content {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-12 items-center;
}

.mission-title {
  @apply text-3xl font-bold text-gray-900 mb-6;
}

.mission-description {
  @apply text-lg text-gray-600 mb-8;
}

.vision-title {
  @apply text-2xl font-bold text-gray-900 mb-4;
}

.vision-description {
  @apply text-lg text-gray-600;
}

.mission-image {
  @apply flex justify-center;
}

.features-section {
  @apply py-20 bg-gray-50;
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

.simulator-section {
  @apply py-20 bg-blue-600;
}

.simulator-content {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-12 items-center;
}

.simulator-title {
  @apply text-3xl font-bold text-white mb-6;
}

.simulator-description {
  @apply text-xl text-blue-100 mb-8;
}

.simulator-features {
  @apply space-y-4 mb-8;
}

.feature-item {
  @apply flex items-center space-x-3 text-blue-100;
}

.simulator-actions {
  @apply flex flex-col sm:flex-row gap-4;
}

.simulator-image {
  @apply flex justify-center;
}

.contact-section {
  @apply py-20 bg-white;
}

.contact-content {
  @apply text-center max-w-4xl mx-auto;
}

.contact-title {
  @apply text-3xl font-bold text-gray-900 mb-4;
}

.contact-description {
  @apply text-xl text-gray-600 mb-12;
}

.contact-info {
  @apply grid grid-cols-1 md:grid-cols-3 gap-8 mb-12;
}

.contact-item {
  @apply flex items-center space-x-4;
}

.contact-details {
  @apply text-left;
}

.contact-label {
  @apply text-lg font-semibold text-gray-900 mb-1;
}

.contact-value {
  @apply text-gray-600;
}

.contact-actions {
  @apply flex justify-center;
}

.contact-button {
  @apply border-blue-600 text-blue-600 hover:bg-blue-50;
}

.about-footer {
  @apply bg-gray-900 text-white;
}

.footer-content {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
  @apply flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0;
}

.footer-text {
  @apply text-sm text-gray-400;
}

.footer-links {
  @apply flex items-center space-x-6;
}

.footer-link {
  @apply text-sm text-gray-400 hover:text-white transition-colors;
}

.container-logo-uniacc {
  @apply flex items-center justify-center bg-white backdrop-blur-sm rounded-full w-[272px] h-[272px];
}

.logo-uniacc {
  @apply w-48 h-48 object-contain;
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

  .hero-title {
    @apply text-3xl;
  }

  .hero-description {
    @apply text-lg;
  }

  .stats-grid {
    @apply grid-cols-2;
  }

  .features-grid {
    @apply grid-cols-1;
  }

  .mission-content,
  .simulator-content {
    @apply grid-cols-1;
  }

  .contact-info {
    @apply grid-cols-1;
  }

  .contact-item {
    @apply justify-center;
  }

  .contact-details {
    @apply text-center;
  }

  .footer-content {
    @apply text-center;
  }

  .footer-links {
    @apply flex-col space-y-2 space-x-0;
  }

  .container-logo-uniacc {
    @apply flex items-center justify-center bg-white backdrop-blur-sm rounded-full w-[180px] h-[180px];
  }

  .logo-uniacc {
    @apply w-32 h-32 object-contain;
  }
}

@media (max-width: 480px) {
  .hero-actions,
  .simulator-actions {
    @apply flex-col;
  }

  .cta-button,
  .secondary-button,
  .contact-button {
    @apply w-full;
  }
}

/* Animaciones */
.feature-card {
  @apply transform transition-all duration-300;
}

.feature-card:hover {
  @apply scale-105;
}

.stat-item {
  @apply transform transition-all duration-300;
}

.stat-item:hover {
  @apply scale-105;
}

.contact-item {
  @apply transform transition-all duration-300;
}

.contact-item:hover {
  @apply scale-105;
}

/* Transiciones suaves */
.about-view {
  @apply transition-all duration-300;
}

.section-header {
  @apply transition-all duration-300;
}

.section-header:hover {
  @apply scale-105;
}
</style>
