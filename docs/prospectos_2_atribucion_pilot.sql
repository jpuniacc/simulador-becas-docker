-- =============================================================================
-- PILOT: prospectos_2 — atribución ampliada (revisión antes de migrar prospectos)
-- =============================================================================
--
-- Objetivo:
--   Copiar prospectos → prospectos_2, agregar columnas nuevas y backfillear
--   desde url_origen / first_touch_url / last_touch_url.
--
-- NO usar prospectos_2 en la app. Solo SQL Editor / análisis.
--
-- Ejecutar en: Supabase SQL Editor (DEV o QA primero).
-- Re-ejecutable: DROP + CREATE o usar sección "Reset" al final.
--
-- Referencia conversación: tracking orgánico + Google Ads (_gcl_aw, etc.)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Helper: extraer query param de una URL (Postgres)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.extract_url_param(url text, param text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN url IS NULL OR param IS NULL THEN NULL
    ELSE NULLIF(
      regexp_replace(
        (regexp_match(url, '[?&]' || param || '=([^&#]*)', 'i'))[1],
        '\+', ' ', 'g'
      ),
      ''
    )
  END;
$$;

COMMENT ON FUNCTION public.extract_url_param IS
  'Extrae un query param de url_origen para backfill de atribución (pilot prospectos_2)';

-- -----------------------------------------------------------------------------
-- 1. Crear tabla espejo (misma estructura que prospectos)
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.prospectos_2;

CREATE TABLE public.prospectos_2 (
  LIKE public.prospectos INCLUDING DEFAULTS
);

-- -----------------------------------------------------------------------------
-- 2. Copiar datos ANTES de agregar columnas nuevas (SELECT * exige mismo nº cols)
-- -----------------------------------------------------------------------------
INSERT INTO public.prospectos_2
SELECT * FROM public.prospectos;

-- -----------------------------------------------------------------------------
-- 3. Agregar columnas de atribución ampliada
-- -----------------------------------------------------------------------------
ALTER TABLE public.prospectos_2
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS landing_page text,
  ADD COLUMN IF NOT EXISTS organic_source text,
  ADD COLUMN IF NOT EXISTS organic_medium text,
  ADD COLUMN IF NOT EXISTS traffic_type text,
  ADD COLUMN IF NOT EXISTS gad_source text,
  ADD COLUMN IF NOT EXISTS gbraid text,
  ADD COLUMN IF NOT EXISTS wbraid text,
  ADD COLUMN IF NOT EXISTS twclid text,
  ADD COLUMN IF NOT EXISTS gcl_aw text,
  ADD COLUMN IF NOT EXISTS backfill_source text,
  ADD COLUMN IF NOT EXISTS backfill_at timestamptz DEFAULT now();

COMMENT ON TABLE public.prospectos_2 IS
  'PILOT: copia de prospectos con atribución ampliada. NO usar en producción app.';
COMMENT ON COLUMN public.prospectos_2.traffic_type IS
  'paid | organic | social | referral | direct | email (derivado en backfill)';
COMMENT ON COLUMN public.prospectos_2.backfill_source IS
  'De qué URL se extrajo la mayoría de params: url_origen | first_touch | last_touch';

CREATE INDEX IF NOT EXISTS idx_prospectos_2_traffic_type ON public.prospectos_2 (traffic_type);
CREATE INDEX IF NOT EXISTS idx_prospectos_2_organic_source ON public.prospectos_2 (organic_source);
CREATE INDEX IF NOT EXISTS idx_prospectos_2_created_at ON public.prospectos_2 (created_at DESC);

-- Permisos lectura (ajustar según ambiente)
GRANT SELECT ON public.prospectos_2 TO authenticated;
GRANT ALL ON public.prospectos_2 TO service_role;

-- -----------------------------------------------------------------------------
-- 4. Backfill: elegir URL con más señal (url_origen > first_touch > last_touch)
-- -----------------------------------------------------------------------------
WITH enriched AS (
  SELECT
    p.id,
    COALESCE(NULLIF(p.url_origen, ''), NULLIF(p.first_touch_url, ''), p.last_touch_url) AS primary_url,
    CASE
      WHEN NULLIF(p.url_origen, '') IS NOT NULL THEN 'url_origen'
      WHEN NULLIF(p.first_touch_url, '') IS NOT NULL THEN 'first_touch_url'
      WHEN NULLIF(p.last_touch_url, '') IS NOT NULL THEN 'last_touch_url'
      ELSE NULL
    END AS backfill_src
  FROM public.prospectos_2 p
)
UPDATE public.prospectos_2 p
SET
  backfill_source = e.backfill_src,

  -- Click IDs (solo si estaban NULL en prospectos original)
  gclid = COALESCE(
    p.gclid,
    public.extract_url_param(e.primary_url, 'gclid')
  ),
  gcl_aw = COALESCE(
    p.gcl_aw,
    public.extract_url_param(e.primary_url, '_gcl_aw')
  ),
  fbclid = COALESCE(p.fbclid, public.extract_url_param(e.primary_url, 'fbclid')),
  msclkid = COALESCE(p.msclkid, public.extract_url_param(e.primary_url, 'msclkid')),
  ttclid = COALESCE(p.ttclid, public.extract_url_param(e.primary_url, 'ttclid')),
  twclid = COALESCE(p.twclid, public.extract_url_param(e.primary_url, 'twclid')),
  li_fat_id = COALESCE(p.li_fat_id, public.extract_url_param(e.primary_url, 'li_fat_id')),
  gad_source = COALESCE(p.gad_source, public.extract_url_param(e.primary_url, 'gad_source')),
  gbraid = COALESCE(p.gbraid, public.extract_url_param(e.primary_url, 'gbraid')),
  wbraid = COALESCE(p.wbraid, public.extract_url_param(e.primary_url, 'wbraid')),

  -- UTMs
  utm_source = COALESCE(p.utm_source, public.extract_url_param(e.primary_url, 'utm_source')),
  utm_medium = COALESCE(p.utm_medium, public.extract_url_param(e.primary_url, 'utm_medium')),
  utm_campaign = COALESCE(p.utm_campaign, public.extract_url_param(e.primary_url, 'utm_campaign')),
  utm_term = COALESCE(p.utm_term, public.extract_url_param(e.primary_url, 'utm_term')),
  utm_content = COALESCE(p.utm_content, public.extract_url_param(e.primary_url, 'utm_content')),
  campaign_id = COALESCE(p.campaign_id, public.extract_url_param(e.primary_url, 'campaign_id')),
  ad_id = COALESCE(p.ad_id, public.extract_url_param(e.primary_url, 'ad_id')),

  -- Landing aproximada (no existía referrer histórico)
  landing_page = COALESCE(p.first_touch_url, p.url_origen),

  backfill_at = now()
FROM enriched e
WHERE p.id = e.id;

-- gclid desde _gcl_aw si sigue vacío (caso Google Ads auto-tagging)
UPDATE public.prospectos_2
SET gclid = gcl_aw
WHERE gclid IS NULL
  AND gcl_aw IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 5. Derivar traffic_type
-- -----------------------------------------------------------------------------
UPDATE public.prospectos_2 p
SET traffic_type = CASE
  WHEN COALESCE(p.gclid, p.gcl_aw, p.fbclid, p.msclkid, p.ttclid, p.twclid, p.li_fat_id, p.gbraid, p.wbraid) IS NOT NULL
    THEN 'paid'
  WHEN lower(COALESCE(p.utm_medium, '')) IN ('cpc', 'ppc', 'paid', 'paidsearch', 'display', 'cpm', 'cpv')
    THEN 'paid'
  WHEN lower(COALESCE(p.utm_medium, '')) = 'email'
    THEN 'email'
  WHEN lower(COALESCE(p.utm_medium, '')) = 'organic'
    THEN 'organic'
  WHEN p.utm_source IS NOT NULL
    THEN 'referral'
  ELSE 'direct'
END
WHERE p.traffic_type IS NULL;

-- organic_* solo cuando utm lo indica (referrer histórico no disponible)
UPDATE public.prospectos_2
SET
  organic_source = COALESCE(organic_source, utm_source),
  organic_medium = COALESCE(organic_medium, utm_medium)
WHERE traffic_type = 'organic'
  AND utm_source IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 6. Queries de revisión (ejecutar después del backfill)
-- -----------------------------------------------------------------------------

-- 5.1 Resumen por traffic_type
-- SELECT traffic_type, COUNT(*) AS n
-- FROM public.prospectos_2
-- GROUP BY 1
-- ORDER BY 2 DESC;

-- 5.2 Cuántos se reclasificaron de "direct" implícito a paid (tenían _gcl_aw en URL)
-- SELECT COUNT(*) AS reclasificados_paid_por_gcl_aw
-- FROM public.prospectos_2
-- WHERE traffic_type = 'paid'
--   AND gcl_aw IS NOT NULL
--   AND (url_origen ~* '_gcl_aw=' OR first_touch_url ~* '_gcl_aw=' OR last_touch_url ~* '_gcl_aw=');

-- 5.3 Comparar antes/después en filas con _gcl_aw (muestra)
-- SELECT
--   p.id,
--   p.email,
--   o.gclid AS gclid_antes,
--   p.gclid AS gclid_despues,
--   p.gcl_aw,
--   p.traffic_type,
--   p.url_origen
-- FROM public.prospectos_2 p
-- JOIN public.prospectos o ON o.id = p.id
-- WHERE p.url_origen ~* '_gcl_aw='
--    OR p.first_touch_url ~* '_gcl_aw='
-- LIMIT 30;

-- 5.4 Distribución backfill_source
-- SELECT backfill_source, COUNT(*)
-- FROM public.prospectos_2
-- GROUP BY 1;

-- 5.5 Prospectos que siguen direct sin params (posible orgánico perdido)
-- SELECT COUNT(*) AS posible_organico_perdido
-- FROM public.prospectos_2
-- WHERE traffic_type = 'direct'
--   AND url_origen IS NOT NULL
--   AND url_origen !~* '[?&]';

-- -----------------------------------------------------------------------------
-- 7. Reset pilot (opcional)
-- -----------------------------------------------------------------------------
-- DROP TABLE IF EXISTS public.prospectos_2;
-- DROP FUNCTION IF EXISTS public.extract_url_param(text, text);
