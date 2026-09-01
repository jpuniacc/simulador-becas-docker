-- Atribución ampliada en prospectos (fase 1 HubSpot tracking)
-- Ejecutar en Supabase SQL Editor antes de deploy front con nuevos campos.

ALTER TABLE public.prospectos
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS landing_page text,
  ADD COLUMN IF NOT EXISTS organic_source text,
  ADD COLUMN IF NOT EXISTS organic_medium text,
  ADD COLUMN IF NOT EXISTS traffic_type text,
  ADD COLUMN IF NOT EXISTS gad_source text,
  ADD COLUMN IF NOT EXISTS gbraid text,
  ADD COLUMN IF NOT EXISTS wbraid text,
  ADD COLUMN IF NOT EXISTS twclid text,
  ADD COLUMN IF NOT EXISTS gcl_aw text;

COMMENT ON COLUMN public.prospectos.traffic_type IS
  'paid | organic | social | referral | direct | email';
COMMENT ON COLUMN public.prospectos.referrer IS 'document.referrer al first load de sesión';
COMMENT ON COLUMN public.prospectos.landing_page IS 'Primera URL de la sesión (sessionStorage)';
COMMENT ON COLUMN public.prospectos.gcl_aw IS 'Raw _gcl_aw de Google Ads auto-tagging';

CREATE INDEX IF NOT EXISTS idx_prospectos_traffic_type ON public.prospectos (traffic_type);
