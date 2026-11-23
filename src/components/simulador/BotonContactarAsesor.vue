<script setup lang="ts">
/** Botón «Contactar asesor»: abre WhatsApp con la carrera y el total estimado. */
import { computed } from 'vue'
import { urlWhatsAppAsesor } from '@/utils/resumenPregrado'
import { pushToDataLayer } from '@/utils/analytics'

const props = defineProps<{ carrera: string; total: string; segmentacion?: string }>()

const href = computed(() => urlWhatsAppAsesor(props.carrera, props.total))

const track = () => {
  pushToDataLayer('contactar_asesor', {
    segmentacion: props.segmentacion || 'pregrado',
    carrera: props.carrera,
    total_estimado: props.total
  })
}
</script>

<template>
  <a
    :href="href"
    target="_blank"
    rel="noopener"
    class="p-button p-component boton-contactar-asesor"
    data-testid="contactar-asesor"
    @click="track"
  >
    <span class="pi pi-whatsapp p-button-icon p-button-icon-left" aria-hidden="true" />
    <span class="p-button-label">Contactar asesor</span>
  </a>
</template>

<style scoped>
.boton-contactar-asesor {
  text-decoration: none;
  cursor: pointer;
}
</style>
