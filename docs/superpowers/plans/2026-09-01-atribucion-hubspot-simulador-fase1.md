# Fase 1: Atribución HubSpot simulador — implementado

**Goal:** Origen del prospecto guardado en HubSpot y Supabase aunque la URL no traiga UTMs.

## Cambios en código

| Archivo | Cambio |
|---------|--------|
| `index.html` | HubSpot embed 51464408 |
| `src/utils/attribution.ts` | Parse URL, traffic_type, orgánico |
| `src/composables/useCampaignTracking.ts` | Siempre persiste sesión |
| `src/utils/hubspotTracking.ts` | hutk, identify, page views |
| `src/router/index.ts` | `trackHubSpotPageView` |
| `src/utils/hubspotContact.ts` | DTO ampliado + hubspot_context |
| `server/hubspot/mapper.js` | Properties atribución |
| `src/composables/useCRM.ts` | `_hsq.identify` post-OK |
| `src/composables/useProspectos.ts` | Campos nuevos en INSERT |
| `docs/agregar_campos_atribucion_prospectos.sql` | Migración Supabase |

## Pre-deploy (obligatorio)

1. **Supabase SQL Editor:** ejecutar `docs/agregar_campos_atribucion_prospectos.sql`
2. **HubSpot portal:** crear custom properties si faltan (ver hubspot-integracion.md)
3. **HubSpot:** activar cross-domain `uniacc.cl` ↔ `simulador.uniacc.cl`

## URLs de prueba (dev)

Ver **`docs/urls-prueba-atribucion-dev.md`** — enlaces listos con base `https://simulador-dev.uniacc.cl/simulador`.

## QA checklist

- [ ] Cookie `hubspotutk` presente tras cargar simulador
- [ ] URL con `_gcl_aw` → `traffic_type=paid`, `gclid` poblado en localStorage
- [ ] Llegada orgánica (referrer google) → `traffic_type=organic`
- [ ] Simular con consentimiento → contacto HS con properties de atribución
- [ ] Fila en `prospectos` con `referrer`, `traffic_type`, etc.

## Comandos

```bash
cd /opt/simulador-becas-docker
npm run test -- src/utils/__tests__/attribution.spec.ts
docker compose up -d --build hubspot-api
npm run build
```
