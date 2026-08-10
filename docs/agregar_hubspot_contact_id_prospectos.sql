-- Agregar ID de contacto HubSpot a prospectos (Simulador → HubSpot CRM)
-- Aplicar en el proyecto Supabase del simulador.

alter table public.prospectos
  add column if not exists hubspot_contact_id text;

comment on column public.prospectos.hubspot_contact_id is
  'ID del contacto en HubSpot (CRM v3 objects/contacts) tras upsert desde el simulador';
