<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

defineProps<{
  usaBecasEstado: boolean
  usaCae: boolean
  /** Arancel de referencia CAE (informativo, no se suma al total). */
  arancelReferenciaCae?: number | null
  anioArancelReferencia?: number | null
  formatear: (n: number) => string
}>()

const abierto = ref(false)
</script>

<template>
  <section class="ref-estado" data-testid="bloque-referencial">
    <button
      type="button"
      class="ref-estado-head"
      :aria-expanded="abierto"
      aria-controls="ref-estado-body"
      @click="abierto = !abierto"
    >
      <span class="ref-estado-titulo">Financiamiento del Estado</span>
      <span class="ref-estado-chip">Referencial</span>
      <ChevronDown class="ref-estado-chevron" :class="{ 'ref-estado-chevron-on': abierto }" aria-hidden="true" />
    </button>

    <div v-show="abierto" id="ref-estado-body" class="ref-estado-body">
      <p class="ref-estado-aviso">
        Esta información es referencial y <strong>no se suma</strong> al total estimado.
        Su asignación depende de los procesos oficiales de preselección y selección y de la normativa vigente.
      </p>

      <div v-if="usaBecasEstado" class="ref-estado-item">
        <h4>Becas Ministeriales</h4>
        <p>
          Las becas se asignan de acuerdo con la información entregada en la postulación al FUAS, donde el Estado otorga
          el beneficio en función de requisitos académicos y socioeconómicos. En general, se solicita un puntaje igual o
          superior a 510 puntos en el promedio de las pruebas obligatorias (Competencia Lectora y Competencia Matemática)
          en las PAES del año de admisión a la carrera.
        </p>
        <a href="https://portal.beneficiosestudiantiles.cl/becas/becas-de-arancel" target="_blank" rel="noopener noreferrer">
          Más información en el sitio Beneficios Estudiantiles
        </a>
      </div>

      <div v-if="usaCae" class="ref-estado-item">
        <h4>CAE (Crédito con Aval del Estado)</h4>
        <p>
          Se solicita un puntaje igual o superior a 485 puntos en el promedio de las pruebas obligatorias (Competencia
          Lectora y Competencia Matemática 1), considerando el mejor puntaje obtenido en los instrumentos de evaluación
          vigentes para el Proceso de Admisión 2026.
        </p>
        <p v-if="arancelReferenciaCae" class="ref-estado-monto" data-testid="cae-referencia">
          Arancel de referencia CAE{{ anioArancelReferencia ? ` ${anioArancelReferencia}` : '' }}:
          <strong>{{ formatear(arancelReferenciaCae) }}</strong>
          <span> (solo informativo)</span>
        </p>
        <a href="https://portal.ingresa.cl/como-postular/requisitos-para-postular/" target="_blank" rel="noopener noreferrer">
          Requisitos del Crédito con Garantía Estatal (CAE)
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ref-estado {
  border: 1px solid #cbd5e1;
  border-radius: 0.75rem;
  background: #fff;
  overflow: hidden;
}

.ref-estado-head {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #1a3b66;
  cursor: pointer;
}

.ref-estado-titulo {
  flex: 1 1 auto;
  min-width: 0;
}

.ref-estado-chip {
  flex: none;
  border-radius: 9999px;
  background: #ede9fe;
  color: #5b21b6;
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
}

.ref-estado-chevron {
  flex: none;
  width: 1.125rem;
  height: 1.125rem;
  transition: transform 0.15s;
}

.ref-estado-chevron-on {
  transform: rotate(180deg);
}

.ref-estado-body {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  border-top: 1px solid #e2e8f0;
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #334155;
}

.ref-estado-aviso {
  font-size: 0.8125rem;
  color: #475569;
}

.ref-estado-item h4 {
  margin-bottom: 0.25rem;
  font-weight: 700;
  color: #1a3b66;
}

.ref-estado-item a {
  display: inline-block;
  margin-top: 0.375rem;
  color: #1d4ed8;
  text-decoration: underline;
}

.ref-estado-monto {
  margin-top: 0.375rem;
}

:global(html.dark) .ref-estado {
  background: #1e293b;
  border-color: #475569;
}

:global(html.dark) .ref-estado-head,
:global(html.dark) .ref-estado-item h4 {
  color: #e2e8f0;
}

:global(html.dark) .ref-estado-body {
  border-color: #475569;
  color: #cbd5e1;
}

:global(html.dark) .ref-estado-aviso {
  color: #94a3b8;
}

:global(html.dark) .ref-estado-item a {
  color: #93c5fd;
}
</style>
