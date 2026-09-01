# Pilot `prospectos_2` — atribución ampliada

> **For agentic workers:** Script listo en `docs/prospectos_2_atribucion_pilot.sql`. Ejecutar en Supabase SQL Editor (DEV/QA primero).

**Goal:** Crear tabla de prueba `prospectos_2` copiando `prospectos`, agregar columnas de atribución y backfillear desde URLs existentes para validar clasificación antes de migrar prod.

**Architecture:** Solo BD (Supabase). Sin cambios en SPA ni HubSpot en esta fase.

**Tech Stack:** PostgreSQL / Supabase SQL Editor.

---

## Contexto

| Problema | Ejemplo |
|----------|---------|
| `_gcl_aw` no se captura | URL con Google Ads auto-tagging → `gclid` NULL, dashboard muestra "Directo" |
| Orgánico no se guarda | `referrer` nunca persistido → histórico irrecuperable solo con URL |
| Solo se persiste campaña si hay UTMs/click IDs en URL al cargar | `useCampaignTracking` retorna `{}` sin params |

## Columnas nuevas en `prospectos_2`

| Columna | Origen backfill | Notas |
|---------|-----------------|-------|
| `referrer` | — | Vacío en histórico; solo front futuro |
| `landing_page` | `first_touch_url` → `url_origen` | Aproximación |
| `organic_source` / `organic_medium` | `utm_*` si `traffic_type=organic` | Limitado sin referrer |
| `traffic_type` | Derivado | `paid`, `direct`, `email`, `referral`, `organic` |
| `gad_source`, `gbraid`, `wbraid`, `twclid` | Parse URL | |
| `gcl_aw` | `_gcl_aw` en URL | Si `gclid` null → copiar `gcl_aw` → `gclid` |
| `backfill_source` | Meta | `url_origen` / `first_touch_url` / `last_touch_url` |
| `backfill_at` | Meta | Timestamp del backfill |

---

## Task 1: Ejecutar script pilot

**Files:** `docs/prospectos_2_atribucion_pilot.sql`

- [ ] Abrir Supabase SQL Editor (DEV o QA)
- [ ] Pegar y ejecutar script completo
- [ ] Verificar: `SELECT COUNT(*) FROM prospectos_2` = `SELECT COUNT(*) FROM prospectos`

---

## Task 2: Revisar resultados

Ejecutar queries de la sección 5 del script (descomentadas):

- [ ] **5.1** Distribución `traffic_type`
- [ ] **5.2** Cuántos pasaron a `paid` por `_gcl_aw`
- [ ] **5.3** Muestra filas con `_gcl_aw` (antes vs después)
- [ ] **5.5** Cuántos quedan `direct` sin query string (orgánico perdido)

**Criterios de éxito pilot:**

| Métrica | Esperado |
|---------|----------|
| Filas con `_gcl_aw` en URL | `traffic_type = paid`, `gclid` o `gcl_aw` poblado |
| Filas con UTMs en URL | UTMs backfilled si estaban NULL |
| Total filas | Igual que `prospectos` |

---

## Task 3: Decisión post-pilot

| Resultado | Siguiente paso |
|-----------|----------------|
| Backfill paid OK | Fase 1 real: `ALTER TABLE prospectos` + mismo backfill |
| Muchos `direct` sin params | Implementar captura `referrer` en front (Fase 2 plan anterior) |
| Pilot OK | `DROP TABLE prospectos_2` cuando no se necesite |

---

## Limitaciones explícitas

1. **Orgánico histórico:** no recuperable sin `document.referrer` (nunca guardado).
2. **`gclid` desde `_gcl_aw`:** valor raw de Google; HubSpot puede aceptarlo en `hs_google_click_id` — validar con RevOps.
3. **`prospectos_2` no tiene RLS anon** — solo lectura `authenticated` / `service_role`; no cablear a la app.

---

## Comandos

```sql
-- Resumen rápido post-ejecución
SELECT traffic_type, COUNT(*) FROM prospectos_2 GROUP BY 1 ORDER BY 2 DESC;

-- Caso tipo simulador.uniacc.cl con _gcl_aw
SELECT id, email, gclid, gcl_aw, traffic_type, left(url_origen, 120)
FROM prospectos_2
WHERE url_origen ~* '_gcl_aw='
LIMIT 20;

-- Limpiar pilot
-- DROP TABLE IF EXISTS prospectos_2;
```

---

**Estado:** Script creado — pendiente ejecución en Supabase por el equipo.
