<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-vue-next'

const router = useRouter()
const selectedOption = ref<string | null>(null)
const viewportHeight = ref<number>(window.innerHeight)
const segmentationViewRef = ref<HTMLElement | null>(null)

const updateViewportHeight = () => {
  viewportHeight.value = window.innerHeight
  if (segmentationViewRef.value) {
    segmentationViewRef.value.style.height = `${viewportHeight.value}px`
  }
}

onMounted(() => {
  updateViewportHeight()
  window.addEventListener('resize', updateViewportHeight)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewportHeight)
})

interface SegmentOption {
  id: string
  title: string
  subtitle: string
  bullets: string[]
  iconClass: string
  colorClass: string
  borderColorClass: string
  bgColorClass: string
}

const options: SegmentOption[] = [
  {
    id: 'pregrado',
    title: 'Pregrado',
    subtitle: 'Primera formación profesional',
    bullets: [
      'Egresados de enseñanza media',
      'Primera carrera universitaria'
    ],
    iconClass: 'pi pi-graduation-cap',
    colorClass: 'text-white',
    borderColorClass: '',
    bgColorClass: 'bg-primary-saturated'
  }
]

const selectOption = (optionId: string) => {
  selectedOption.value = optionId

  // Mapeo de opciones a rutas
  const routeMap: Record<string, string> = {
    'pregrado': '/simulador',
    'pregrado-advance': '/advance',
    'postgrado': '/postgrados',
    'cursos-diplomados': '/diplomados'
  }

  const route = routeMap[optionId]
  if (route) {
    router.push(route)
  }
}

const getCardClasses = (option: SegmentOption) => {
  const base = 'segmentation-card'
  const selected = selectedOption.value === option.id ? 'selected' : ''
  return [base, selected, option.bgColorClass].filter(Boolean).join(' ')
}
</script>

<template>
  <div ref="segmentationViewRef" class="segmentation-view" :style="{ height: `${viewportHeight}px` }">
    <div class="segmentation-cards">
      <Card
        v-for="option in options"
        :key="option.id"
        :class="getCardClasses(option)"
        @click="selectOption(option.id)"
      >
        <CardHeader class="card-header">
          <div class="card-icon-wrapper">
            <i :class="[option.iconClass, option.colorClass, 'icon']"></i>
          </div>
          <CardTitle class="card-title">{{ option.title }}</CardTitle>
          <CardDescription class="card-subtitle">
            {{ option.subtitle }}
          </CardDescription>
        </CardHeader>
        <CardContent class="card-content">
          <ul class="card-bullets">
            <li v-for="(bullet, index) in option.bullets" :key="index" class="bullet-item">
              <Check :class="[option.colorClass, 'bullet-icon']" />
              <span>{{ bullet }}</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600&display=swap');

.segmentation-view {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  padding: 0;
  margin: 0;
  position: relative;
}

.segmentation-cards {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  width: 100%;
  height: 100%;
  gap: 0;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.segmentation-card {
  cursor: pointer;
  transition: transform 0.3s ease;
  border: none;
  border-radius: 0;
  display: flex;
  flex-direction: column;
  padding: 3rem 2.5rem;
  position: relative;
  overflow: visible;
  justify-content: center;
  align-items: center;
  min-height: 0;
}

.segmentation-card:hover {
  transform: scale(1.08);
  z-index: 10;
}

.segmentation-card.selected {
  transform: scale(1.08);
  z-index: 10;
}

/* Colores de fondo saturados */
.bg-primary-saturated {
  background-color: var(--p-primary-500);
}

.bg-secondary-saturated {
  background-color: var(--p-secondary-500);
}

.bg-tertiary-saturated {
  background-color: var(--p-tertiary-500);
}

.bg-black-saturated {
  background-color: #000000;
}

.card-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding-bottom: 1rem;
  flex-shrink: 0;
}

.card-icon-wrapper {
  width: 60px;
  height: 60px;
  margin: 0 auto 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.segmentation-card:hover .card-icon-wrapper {
  transform: scale(1.1);
}

.icon {
  font-size: 48px;
  color: #ffffff;
}

.card-title {
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #ffffff;
  line-height: 1.2;
  flex-shrink: 0;
}

.card-subtitle {
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 500;
  color: #ffffff;
  opacity: 0.95;
  margin-bottom: 1rem;
  flex-shrink: 0;
}

.card-content {
  padding-top: 1rem;
  padding-bottom: 1.5rem;
  flex-shrink: 0;
  visibility: visible;
  opacity: 1;
}

.card-bullets {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transition: opacity 0.3s ease, max-height 0.3s ease;
}

.segmentation-card:hover .card-bullets {
  opacity: 1;
  max-height: 200px;
}

.bullet-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  font-family: 'Montserrat', sans-serif;
  font-size: 1rem;
  font-weight: 400;
  color: #ffffff;
  line-height: 1.5;
  width: 100%;
}

.bullet-item span {
  flex: 1;
}

.bullet-icon {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex-shrink: 0;
  color: #ffffff;
}

.text-white {
  color: #ffffff;
}

/* Asegurar que los componentes Card sean visibles */
:deep(.card-content) {
  display: block !important;
}

:deep(.card-header) {
  display: block !important;
}

/* Responsive */
@media (max-width: 768px) {
  .segmentation-cards {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
  }

  .segmentation-card {
    padding: 1.5rem 1rem;
  }

  .card-title {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .card-subtitle {
    font-size: 0.9rem;
    margin-bottom: 0.75rem;
  }

  .card-icon-wrapper {
    width: 50px;
    height: 50px;
    margin-bottom: 1rem;
  }

  .icon {
    width: 32px;
    height: 32px;
  }

  .bullet-item {
    font-size: 0.9rem;
  }

  .bullet-icon {
    width: 18px;
    height: 18px;
  }

  .card-icon-wrapper {
    width: 60px;
    height: 60px;
    margin-bottom: 1.5rem;
  }

  .icon {
    width: 36px;
    height: 36px;
  }

  .segmentation-card:hover {
    transform: scale(1.03);
  }

  .segmentation-card.selected {
    transform: scale(1.03);
  }
}
</style>
