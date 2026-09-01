# Integración HubSpot (Simulador de Becas)

## Resumen

El simulador envía contactos **solo a HubSpot** (Revops LATAM). Mantis ya no se usa.
El token vive solo en el sidecar `hubspot-api`; el browser llama a `/api/hubspot-contact`.

## Schema Supabase

Aplicar en el proyecto Supabase del simulador:

```bash
# Ver: docs/agregar_hubspot_contact_id_prospectos.sql
alter table public.prospectos
  add column if not exists hubspot_contact_id text;
```

## Variables de entorno

Ver `.env.docker.example`.

| Variable | Dónde | Uso |
|----------|--------|-----|
| `HUBSPOT_ACCESS_TOKEN` | sidecar / `.env` | Bearer Private App (Revops) |
| `HUBSPOT_BASE_URL` | sidecar | default `https://api.hubapi.com` |
| `VITE_HUBSPOT_PROXY_TARGET` | Vite dev | default `http://127.0.0.1:3000` |

## Docker / Traefik (recomendado)

Levanta SPA + sidecar. El sidecar publica `3000:3000` en el host (para Vite) y sigue disponible en la red Docker como `hubspot-api:3000` (nginx del SPA).

```bash
cd /opt/simulador-becas-docker
# En .env: HUBSPOT_ACCESS_TOKEN=...
docker compose up --build -d
```

Solo el backend HubSpot:

```bash
docker compose up -d --build hubspot-api
curl -s http://127.0.0.1:3000/health
docker compose logs -f hubspot-api
```

Nginx del SPA proxea `/api/hubspot-contact` → `http://hubspot-api:3000/hubspot/contact`.

## Desarrollo con Vite

Con el sidecar en Docker (no se cae al cerrar SSH):

```bash
docker compose up -d hubspot-api
npm run dev -- --host 0.0.0.0
```

Vite proxea `/api/hubspot-contact` → `http://127.0.0.1:3000/hubspot/contact`.

Alternativa sin Docker (proceso atado a la terminal):

```bash
cd server/hubspot && npm install && npm start
```

## Analytics (GTM dataLayer)

Tras simulación exitosa se dispara `simulacion_exitosa`.
Tras registro en servidor (HubSpot y/o prospecto en Supabase) se dispara `registro_confirmado_servidor`.

## Atribución HubSpot (fase 1)

- **Tracking embed** en `index.html`: `js.hs-scripts.com/51464408.js` (cookie `hubspotutk`).
- **Captura ampliada** en `useCampaignTracking`: referrer, landing, `_gcl_aw`, `traffic_type`, orgánico.
- **Al enviar contacto**: DTO incluye `hubspot_context` (hutk + pageUri); sidecar mapea a properties HS; tras OK se llama `_hsq.identify`.
- **Supabase**: ejecutar `docs/agregar_campos_atribucion_prospectos.sql` antes del deploy.

Properties HS nuevas (crear en portal si no existen): `referrer_simulador`, `traffic_type_simulador`, `organic_source_simulador`, `organic_medium_simulador`, `landing_page_simulador`, `hutk_simulador`, `gcl_aw_simulador`.

**Cross-domain** (manual en HubSpot): Settings → Tracking → incluir `simulador.uniacc.cl` y `uniacc.cl`.

## Cómo ver el payload completo

Hay **dos payloads**:

1. **DTO del simulador** — body a `/api/hubspot-contact` (lo arma el front).
2. **`request_properties`** — properties ya mapeadas que el sidecar envía a la API HubSpot (lo que Revops debe validar campo a campo).

### Consola del navegador (DevTools → Console)

Tras simular con consentimiento:

| Log | Contenido |
|-----|-----------|
| `[useCRM] POST HubSpot` | `dto` = payload 1 completo |
| `[HubSpot] properties enviadas:` | `request_properties` = payload 2 (mapeado) |
| `[useCRM] HubSpot OK` / `[HubSpot] Respuesta` | id, created, respuesta HubSpot |

### Supabase (`prospectos`)

```sql
select id, email, hubspot_contact_id, prospecto_crm, respuesta_crm, created_at
from public.prospectos
where email = 'correo@ejemplo.com'
order by created_at desc
limit 1;
```

- `prospecto_crm` → DTO (payload 1)
- `respuesta_crm.request_properties` → properties enviadas a HubSpot (payload 2)
- `respuesta_crm.hubspot_contact_id` → id para cruzar en HubSpot
- `hubspot_contact_id` → misma id a nivel de columna

### HubSpot UI / API

Con el `hubspot_contact_id`, abrir el contacto en HubSpot o consultar la API CRM Contacts.

### Logs del sidecar

```bash
cd /opt/simulador-becas-docker && docker compose logs -f hubspot-api
```

Tras cada upsert exitoso aparece `[hubspot-api] request_properties` con el JSON mapeado.

## Prueba upsert

1. Contacto nuevo (email único) con consentimiento → HTTP 201, `hubspot_contact_id` en `prospectos`.
2. Misma email otra simulación → HTTP 200 (PATCH), mismo id.
3. Sin consentimiento → no llama al sidecar.
4. Token vacío → 500 del sidecar; el SPA puede seguir guardando prospecto si el catch en Results lo permite.

## Referencia

- Doc Revops: `docs/Api-HubSpot/rv100_documentacion_api_contacto_uniacc.pdf`
- Mapper: `server/hubspot/mapper.js`
- DTO frontend: `src/utils/hubspotContact.ts`
