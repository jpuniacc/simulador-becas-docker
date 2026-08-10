# GTM: evento `simulacion_exitosa`

Guía para el equipo de marketing/analytics. El desarrollo ya dispara el evento desde el simulador; falta configurar el contenedor GTM.

## Contenedor

- **ID:** `GTM-NS5SPR`
- **Instalación:** ya presente en `index.html`

## Cuándo se dispara

Al presionar **"Ver resultados"** en cualquiera de los 4 simuladores, **solo si la simulación termina sin error**:

| Simulador | Ruta típica | `modalidad` en dataLayer |
|---|---|---|
| Pregrado | `/simulador` | `Pregrado` |
| Pregrado Advance | `/advance` | `Pregrado Advance` |
| Diplomados | `/diplomados` | `Diplomados` |
| Postgrado / Magíster | `/magister` | `Postgrado` |

## Payload enviado

```js
window.dataLayer.push({
  event: 'simulacion_exitosa',
  campaign_data: { /* UTMs y parámetros de campaña desde localStorage */ },
  modalidad: 'Pregrado',   // dinámico según simulador
  carrera: 'Psicología'    // nombre legible de la carrera seleccionada
});
```

> `campaign_data` es un campo adicional con datos de campaña (utm_source, gclid, etc.). No interfiere con el trigger si se configura por nombre de evento.

## Configuración en GTM (pasos)

### 1. Trigger — Custom Event

| Campo | Valor |
|---|---|
| Tipo | Custom Event |
| Event name | `simulacion_exitosa` |
| This trigger fires on | All Custom Events |

### 2. Variables de capa de datos (Data Layer Variables)

Crear dos variables de tipo **Data Layer Variable**:

| Nombre variable GTM | Data Layer Variable Name |
|---|---|
| `DLV - modalidad` | `modalidad` |
| `DLV - carrera` | `carrera` |

Opcional: `DLV - campaign_data` → `campaign_data`

### 3. Tag (ejemplo GA4)

| Campo | Valor |
|---|---|
| Tipo | Google Analytics: GA4 Event |
| Event Name | `simulacion_exitosa` |
| Trigger | Custom Event `simulacion_exitosa` |
| Event Parameters | `modalidad` = `{{DLV - modalidad}}`, `carrera` = `{{DLV - carrera}}` |

### 4. Publicar

1. Vista previa (Preview) en GTM
2. Completar una simulación en el simulador
3. Verificar en Tag Assistant que aparece `simulacion_exitosa` con `modalidad` y `carrera`
4. Publicar contenedor

## Verificación en consola del navegador

Tras completar una simulación:

```js
window.dataLayer.filter(e => e.event === 'simulacion_exitosa')
```

Debe retornar al menos un objeto con `modalidad` y `carrera` poblados.

## Persistencia en base de datos

| Dato | ¿Se guarda en BD? | Dónde |
|---|---|---|
| Evento GTM `simulacion_exitosa` | **Sí** | Supabase → tabla `eventos_analytics` |
| Datos del prospecto (lead) | Sí | Supabase → tabla `prospectos` |
| Resultados de simulación | Sí | Supabase → tabla `simulaciones` (vinculada al prospecto, validez 7 días) |

El evento se guarda en `eventos_analytics` al completar la simulación. Si el prospecto y la simulación se guardan después, el registro se actualiza con `prospecto_id` y `simulacion_id`.

### Migración requerida

Ejecutar en Supabase el script [`docs/crear_tabla_eventos_analytics.sql`](crear_tabla_eventos_analytics.sql) antes de desplegar.

## Contacto desarrollo

Código relevante:

- `src/utils/analytics.ts` — `trackSimulacionExitosa()`, `linkSimulacionExitosa()`
- `src/utils/analyticsPersistence.ts` — insert/update en `eventos_analytics`
- `src/components/simulador/Results.vue` — disparo tras simulación exitosa
- `src/utils/__tests__/analytics.spec.ts` — tests unitarios del payload
- `docs/crear_tabla_eventos_analytics.sql` — migración Supabase
