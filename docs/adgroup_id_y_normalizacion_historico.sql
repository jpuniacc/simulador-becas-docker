-- Simulador de Becas UNIACC — atribución Google Ads (corrección ValueTrack)
--
-- 1) Nueva columna adgroup_id  → ValueTrack {adgroupid} (llega como adgroup_id o hsa_grp)
-- 2) Normalización del histórico a la taxonomía UTM de Marketing
-- 3) Backfill de traffic_type en registros anteriores a la columna
--
-- Idempotente: se puede ejecutar más de una vez sin efectos secundarios.

-- ---------------------------------------------------------------------------
-- 1) Columna adgroup_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.prospectos
  ADD COLUMN IF NOT EXISTS adgroup_id text;

COMMENT ON COLUMN public.prospectos.adgroup_id IS
  'ID de grupo de anuncios Google Ads (ValueTrack {adgroupid}; alias de URL: adgroup_id, hsa_grp)';

-- ---------------------------------------------------------------------------
-- 2) Normalización de utm_source / utm_medium
-- ---------------------------------------------------------------------------
UPDATE public.prospectos SET utm_source = 'google'
 WHERE lower(btrim(utm_source)) IN ('adwords', 'googleads', 'google_ads', 'google-ads');

UPDATE public.prospectos SET utm_source = 'instagram'
 WHERE lower(btrim(utm_source)) = 'ig';

UPDATE public.prospectos SET utm_source = 'facebook'
 WHERE lower(btrim(utm_source)) = 'fb';

UPDATE public.prospectos SET utm_medium = 'cpc'
 WHERE lower(btrim(utm_medium)) IN ('ppc', 'paidsearch', 'paid_search', 'paid-search');

UPDATE public.prospectos SET utm_medium = 'paid_social'
 WHERE lower(btrim(utm_medium)) = 'paid-social';

UPDATE public.prospectos SET utm_medium = 'paid_video'
 WHERE lower(btrim(utm_medium)) = 'paid-video';

UPDATE public.prospectos SET utm_medium = 'organic_social'
 WHERE lower(btrim(utm_medium)) = 'organic-social';

UPDATE public.prospectos SET utm_medium = 'organic_video'
 WHERE lower(btrim(utm_medium)) = 'organic-video';

UPDATE public.prospectos SET utm_medium = 'demand_gen'
 WHERE lower(btrim(utm_medium)) = 'demand-gen';

-- ---------------------------------------------------------------------------
-- 3) Backfill de traffic_type (solo casos deterministas; el resto queda NULL)
--    Mismo criterio que deriveTrafficType() en src/utils/attribution.ts
-- ---------------------------------------------------------------------------
UPDATE public.prospectos SET traffic_type = 'paid'
 WHERE traffic_type IS NULL
   AND (
     coalesce(gclid, gcl_aw, fbclid, msclkid, ttclid, twclid, li_fat_id, gbraid, wbraid) IS NOT NULL
     OR lower(btrim(utm_medium)) IN (
       'cpc', 'ppc', 'paid', 'paidsearch', 'display', 'cpm', 'cpv',
       'pmax', 'demand_gen', 'paid_social', 'paid_video'
     )
   );

UPDATE public.prospectos SET traffic_type = 'email'
 WHERE traffic_type IS NULL AND lower(btrim(utm_medium)) = 'email';

UPDATE public.prospectos SET traffic_type = 'organic'
 WHERE traffic_type IS NULL AND lower(btrim(utm_medium)) = 'organic';

UPDATE public.prospectos SET traffic_type = 'social'
 WHERE traffic_type IS NULL AND lower(btrim(utm_medium)) IN ('organic_social', 'organic_video');
