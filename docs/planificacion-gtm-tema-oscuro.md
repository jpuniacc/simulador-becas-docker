# Planificación: evento GTM `simulacion_exitosa` y tema oscuro

**Proyecto:** Simulador de Becas UNIACC  
**Perfil del desarrollador:** conoce Vue/PrimeVue pero no el repositorio  
**Metodología:** desarrollo manual, sin asistencia de IA  
**Fecha de referencia:** junio 2026

---

## Capacidad de dedicación

| Concepto | Valor |
|---|---|
| Jornada semanal total | 35 h/semana |
| Dedicación al proyecto | 10% |
| **Horas efectivas de desarrollo** | **3,5 h/semana** |
| Equivalente diario (5 días) | ~0,7 h/día |

**Fórmula de conversión:** `semanas ≈ horas totales ÷ 3,5`

---

## Contexto técnico (resumen)

### Evento GTM solicitado

Al presionar **"Ver resultados"** con validación exitosa y simulación completada, el sistema debe ejecutar:

```js
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'simulacion_exitosa',
  modalidad: 'Pregrado',   // dinámico según simulador
  carrera: 'Psicología'    // dinámico según carrera seleccionada
});
```

### Estado actual del código

- GTM ya instalado en `index.html` (contenedor `GTM-NS5SPR`)
- Existen eventos `campaign_initialized` y `page_view`
- `pushToDataLayer()` definido en `useCampaignTracking.ts` pero **no usado** en el flujo de simulación
- El botón "Ver resultados" está en 4 vistas: Pregrado, Advance, Diplomados y Postgrado
- Punto de integración recomendado: `Results.vue` → `handleSimulate`, tras `simulate()` exitoso

### Mapeo `modalidad` propuesto

| Simulador | `segmentacion` | Valor en dataLayer |
|---|---|---|
| Pregrado | `pregrado` | `Pregrado` |
| Pregrado Advance | `pregrado_advance` | `Pregrado Advance` |
| Diplomados | `diplomados` | `Diplomados` |
| Postgrados / Magíster | `postgrado` | `Postgrado` |

> Confirmar nomenclatura con marketing antes de implementar.

### Tema oscuro (solo Plan B)

- `themeStore` existe pero **no está conectado** en `App.vue`
- No hay toggle visible en la UI
- Estilos hardcodeados en claro (`bg-white` en steppers, etc.)
- `Results.vue` (~3.000 líneas) concentra la mayor complejidad visual

---

## Estimación realista — horas de desarrollo

| Entregable | Análisis | Desarrollo | QA + review + deploy | **Total** |
|---|---|---|---|---|
| **Plan A — Solo GTM** | 4 h | 8 h | 4 h | **~16 h** |
| **Plan B — GTM + modo oscuro** | 10 h | 40 h | 14 h | **~64 h** |

| Plan | Horas | Semanas (3,5 h/sem) | Calendario |
|---|---|---|---|
| **Plan A** | ~16 h | **~5 semanas** | **~1,25 meses** |
| **Plan B** | ~64 h | **~18 semanas** | **~4,5 meses** |

> La configuración del trigger/tag en GTM la realiza marketing/analytics en paralelo. Si hay demora, puede sumar 1–2 semanas de calendario sin consumir horas de desarrollo.

---

## Plan A — Solo evento GTM (sin modo oscuro)

### Objetivo

Disparar `simulacion_exitosa` con `modalidad` y `carrera` dinámicos en los 4 simuladores al completar la simulación con éxito.

### Duración realista

**~16 h → 5 semanas** a 3,5 h/semana.

### Cronograma semanal

| Semana | Horas | Actividades | Entregable |
|---|---|---|---|
| **1** | 3,5 h | Análisis del flujo en 4 vistas (`Simulador2View`, `PostgradoView`, `DiplomadosView`, `MagisterView`). Rastrear patrón `@mousedown` del botón. Confirmar mapeo `modalidad` con marketing. | Documento de integración acordado |
| **2** | 3,5 h | Crear helper `trackSimulacionExitosa`. Integrar en `Results.vue` → `handleSimulate` tras `simulate()` exitoso. | Código en rama feature |
| **3** | 3,5 h | Pruebas locales (`dataLayer` en consola). Cubrir edge cases: error en `simulate()`, carrera vacía, los 4 tipos de segmentación. | Feature lista para review |
| **4** | 3,5 h | QA en los 4 simuladores con GTM Preview. Ajustes según feedback de marketing. | QA aprobado |
| **5** | 2 h | PR, code review, merge, deploy Netlify, verificación en producción. | **En producción** |

### Alcance incluido

- Evento `simulacion_exitosa` en los 4 simuladores
- Payload: `{ event, modalidad, carrera }` + `campaign_data` existente
- Validación con GTM Preview

### Alcance excluido

- Toggle de tema oscuro
- Correcciones visuales en modo oscuro
- Cambios en `themeStore` o configuración dark de PrimeVue

### Hitos

| Hito | Semana |
|---|---|
| Código listo para review | 2 |
| QA aprobado | 4 |
| **En producción** | **5** |

---

## Plan B — GTM + modo oscuro (alcance completo)

### Objetivo

Todo lo del Plan A, más activar el toggle de tema oscuro y corregir la experiencia visual en los 4 simuladores (steppers, formularios y pantalla de resultados).

### Duración realista

**~64 h → 18 semanas** a 3,5 h/semana (~4,5 meses).

### Cronograma por fases

#### Fase 1 — GTM (semanas 1–5, ~16 h)

Idéntica al Plan A. El evento GTM queda en producción al cierre de la semana 5.

| Semana | Horas | Entregable |
|---|---|---|
| 1 | 3,5 h | Análisis + alineación con marketing |
| 2 | 3,5 h | Helper + integración en `Results.vue` |
| 3 | 3,5 h | Pruebas locales y edge cases |
| 4 | 3,5 h | QA en 4 simuladores + GTM Preview |
| 5 | 2 h | Deploy GTM en producción |

**Hito:** evento `simulacion_exitosa` en producción — **semana 5**.

---

#### Fase 2 — Infraestructura dark mode (semanas 6–8, ~10 h)

| Semana | Horas | Actividades | Entregable |
|---|---|---|---|
| **6** | 3,5 h | Auditoría visual en 4 simuladores: checklist por vista y paso (1, 2, 3). Identificar `bg-white`, colores fijos, inconsistencias `prefers-color-scheme` vs `.dark`. | Checklist de correcciones |
| **7** | 3,5 h | Conectar `themeStore.initializeTheme()` en `App.vue`. Agregar toggle UI (sol/luna). Configurar PrimeVue: `darkModeSelector: '.dark'` en `main.ts`. | Toggle funcional |
| **8** | 3 h | Verificar persistencia en `localStorage`. Probar que componentes PrimeVue responden al toggle. | Infraestructura dark lista |

**Hito:** toggle oscuro operativo — **semana 8** (visual aún incompleto).

---

#### Fase 3 — Correcciones visuales (semanas 9–15, ~24 h)

| Semana | Horas | Actividades | Entregable |
|---|---|---|---|
| **9** | 3,5 h | 4 vistas stepper: eliminar `bg-white`, corregir `:deep(.p-steplist)`. | Steppers en oscuro |
| **10** | 3,5 h | Headers, mensajes informativos, navegación entre pasos. | Vistas base corregidas |
| **11** | 3,5 h | `PersonalAcademicData.vue` y `CareerFinancing.vue`. | Formularios pregrado |
| **12** | 3,5 h | Componentes postgrado, diplomados y magíster. | Formularios restantes |
| **13** | 3,5 h | `Results.vue`: cards, badges, tags de becas, contraste de texto. | Resultados — parte 1 |
| **14** | 3,5 h | `Results.vue`: secciones mobile/accordion, estados de carga y error. | Resultados — parte 2 |
| **15** | 3,5 h | Unificar `form-styles.css` y media queries → clase `.dark`. Revisar export PDF en oscuro. | Estilos unificados |

**Hito:** correcciones visuales completas en rama — **semana 15**.

---

#### Fase 4 — QA y producción (semanas 16–18, ~14 h)

| Semana | Horas | Actividades | Entregable |
|---|---|---|---|
| **16** | 3,5 h | QA visual: 4 simuladores × 3 pasos × modo claro y oscuro. | Registro de hallazgos |
| **17** | 3,5 h | QA mobile, toasts de validación, PDF export. Corrección de bugs encontrados. | Bugs resueltos |
| **18** | 7 h | PR final, code review, merge, deploy Netlify, verificación post-producción (GTM + oscuro). | **En producción** |

**Hito:** alcance completo en producción — **semana 18**.

---

### Riesgo de extensión (Plan B)

Si `Results.vue` requiere más ajustes de lo previsto (PDF, badges, mobile), el plan puede extenderse a **~21 semanas** (~74 h). Comunicar buffer de **+3 semanas** a stakeholders.

---

## Comparativa para stakeholders

| Criterio | Plan A (sin oscuro) | Plan B (con oscuro) |
|---|---|---|
| Horas de desarrollo | ~16 h | ~64 h |
| Semanas (3,5 h/sem) | **5** | **18** |
| Meses calendario | **~1,25** | **~4,5** |
| Valor para marketing | Alto (evento GTM) | Alto (GTM en semana 5) |
| Valor UX | — | Tema oscuro completo |
| Complejidad técnica | Baja | Media-alta |
| Dependencia externa | GTM (marketing) | GTM (marketing) |

---

## Recomendación

Si marketing necesita el tracking con urgencia:

1. Ejecutar **Plan A** primero (5 semanas, ~16 h).
2. Encadenar la **Fase 2–4 del Plan B** (semanas 6–18) sin rehacer el GTM.

Esto entrega valor de negocio temprano (evento en producción en ~1 mes) y reparte el esfuerzo visual del modo oscuro en el tiempo restante.

---

## Dependencias y riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Marketing no configura trigger/tag en GTM | Evento en código sin reportes | Coordinar desde semana 1; validar con GTM Preview en semana 4 |
| Nomenclatura de `modalidad` no acordada | Retrabajo en payload | Confirmar tabla de mapeo antes de semana 2 |
| `Results.vue` más complejo de lo estimado | +3 semanas en Plan B | Buffer comunicado; priorizar pantallas críticas |
| Code review con demoras | +1 semana calendario | PRs pequeños por fase (GTM separado de oscuro) |
| Dev interrumpe dedicación del 10% | Extensión proporcional | Bloques de 3,5 h/semana protegidos en agenda |

---

## Archivos principales a modificar

### Plan A (GTM)

| Archivo | Cambio |
|---|---|
| `src/utils/analytics.ts` (nuevo) o `useCampaignTracking.ts` | Helper `trackSimulacionExitosa` |
| `src/components/simulador/Results.vue` | Llamada tras `simulate()` exitoso |

### Plan B (adicional — dark mode)

| Archivo | Cambio |
|---|---|
| `src/App.vue` | Inicializar `themeStore`, toggle UI |
| `src/main.ts` | `darkModeSelector: '.dark'` en PrimeVue |
| `src/views/Simulador2View.vue` (+ 3 vistas) | Quitar estilos hardcodeados en claro |
| `src/components/simulador/PersonalAcademicData.vue` | Estilos `.dark` |
| `src/components/simulador/CareerFinancing.vue` | Estilos `.dark` |
| `src/components/simulador/Results.vue` | Correcciones visuales extensas |
| `src/assets/form-styles.css` | Unificar criterio dark |

---

## Resumen ejecutivo

| Plan | Horas | Semanas | Meses | Entrega principal |
|---|---|---|---|---|
| **A — Solo GTM** | 16 h | 5 | ~1,25 | `simulacion_exitosa` en 4 simuladores |
| **B — GTM + oscuro** | 64 h | 18 | ~4,5 | GTM (sem. 5) + tema oscuro completo (sem. 18) |

**Capacidad:** 3,5 h/semana (10% de 35 h).  
**Perfil:** desarrollador que conoce Vue pero no el repositorio.  
**Metodología:** desarrollo manual sin IA.
