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
cd /opt/simulador-becas
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

## Prueba upsert

1. Contacto nuevo (email único) con consentimiento → HTTP 201, `hubspot_contact_id` en `prospectos`.
2. Misma email otra simulación → HTTP 200 (PATCH), mismo id.
3. Sin consentimiento → no llama al sidecar.
4. Token vacío → 500 del sidecar; el SPA puede seguir guardando prospecto si el catch en Results lo permite.

## Referencia

- Doc Revops: `docs/Api-HubSpot/rv100_documentacion_api_contacto_uniacc.pdf`
- Mapper: `server/hubspot/mapper.js`
- DTO frontend: `src/utils/hubspotContact.ts`
