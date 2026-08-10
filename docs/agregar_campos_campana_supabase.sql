-- Script SQL para agregar columnas de campaña a la tabla prospectos en Supabase
-- Ejecutar en el SQL Editor de Supabase

-- Parámetros UTM estándar
ALTER TABLE prospectos
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT;

-- Parámetros de campaña personalizados
ALTER TABLE prospectos
ADD COLUMN IF NOT EXISTS campaign_id TEXT,
ADD COLUMN IF NOT EXISTS ad_id TEXT;

-- Click IDs de diferentes plataformas publicitarias
ALTER TABLE prospectos
ADD COLUMN IF NOT EXISTS gclid TEXT,      -- Google Click ID
ADD COLUMN IF NOT EXISTS fbclid TEXT,     -- Facebook Click ID
ADD COLUMN IF NOT EXISTS msclkid TEXT,    -- Microsoft Click ID
ADD COLUMN IF NOT EXISTS ttclid TEXT,     -- TikTok Click ID
ADD COLUMN IF NOT EXISTS li_fat_id TEXT;  -- LinkedIn Click ID

-- First-touch attribution
ALTER TABLE prospectos
ADD COLUMN IF NOT EXISTS first_touch_url TEXT,
ADD COLUMN IF NOT EXISTS first_touch_timestamp TIMESTAMPTZ;

-- Last-touch attribution
ALTER TABLE prospectos
ADD COLUMN IF NOT EXISTS last_touch_url TEXT,
ADD COLUMN IF NOT EXISTS last_touch_timestamp TIMESTAMPTZ;

-- Comentarios descriptivos para documentación
COMMENT ON COLUMN prospectos.utm_source IS 'Origen de la campaña (ej: google, facebook, email)';
COMMENT ON COLUMN prospectos.utm_medium IS 'Medio de la campaña (ej: cpc, banner, email)';
COMMENT ON COLUMN prospectos.utm_campaign IS 'Nombre de la campaña específica';
COMMENT ON COLUMN prospectos.utm_term IS 'Término de búsqueda (para campañas de búsqueda)';
COMMENT ON COLUMN prospectos.utm_content IS 'Contenido específico del anuncio/banner';
COMMENT ON COLUMN prospectos.campaign_id IS 'ID interno de la campaña';
COMMENT ON COLUMN prospectos.ad_id IS 'ID del anuncio específico';
COMMENT ON COLUMN prospectos.gclid IS 'Google Click ID para tracking de Google Ads';
COMMENT ON COLUMN prospectos.fbclid IS 'Facebook Click ID para tracking de Facebook Ads';
COMMENT ON COLUMN prospectos.msclkid IS 'Microsoft Click ID para tracking de Microsoft Ads';
COMMENT ON COLUMN prospectos.ttclid IS 'TikTok Click ID para tracking de TikTok Ads';
COMMENT ON COLUMN prospectos.li_fat_id IS 'LinkedIn Click ID para tracking de LinkedIn Ads';
COMMENT ON COLUMN prospectos.first_touch_url IS 'URL completa del primer contacto con la campaña';
COMMENT ON COLUMN prospectos.first_touch_timestamp IS 'Fecha y hora del primer contacto con la campaña';
COMMENT ON COLUMN prospectos.last_touch_url IS 'URL completa del último contacto con la campaña';
COMMENT ON COLUMN prospectos.last_touch_timestamp IS 'Fecha y hora del último contacto con la campaña';

