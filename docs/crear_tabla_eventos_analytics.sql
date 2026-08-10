-- Tabla para persistir eventos analytics del simulador (ej. simulacion_exitosa)
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS eventos_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_name TEXT NOT NULL DEFAULT 'simulacion_exitosa',
    modalidad TEXT NOT NULL,
    carrera TEXT,
    segmentacion TEXT,
    campaign_data JSONB,
    prospecto_id UUID REFERENCES prospectos(id) ON DELETE SET NULL,
    simulacion_id UUID REFERENCES simulaciones(id) ON DELETE SET NULL,
    url_origen TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eventos_analytics_event_name ON eventos_analytics(event_name);
CREATE INDEX IF NOT EXISTS idx_eventos_analytics_created_at ON eventos_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_eventos_analytics_prospecto_id ON eventos_analytics(prospecto_id);
CREATE INDEX IF NOT EXISTS idx_eventos_analytics_modalidad ON eventos_analytics(modalidad);

COMMENT ON TABLE eventos_analytics IS 'Eventos analytics disparados desde el simulador (GTM + respaldo en BD)';
COMMENT ON COLUMN eventos_analytics.event_name IS 'Nombre del evento (ej. simulacion_exitosa)';
COMMENT ON COLUMN eventos_analytics.campaign_data IS 'UTMs y parámetros de campaña al momento del evento';

ALTER TABLE eventos_analytics ENABLE ROW LEVEL SECURITY;

-- Mismos permisos que prospectos para el cliente anon del simulador
GRANT INSERT, SELECT ON eventos_analytics TO anon;
GRANT INSERT, SELECT, UPDATE ON eventos_analytics TO authenticated;
GRANT ALL ON eventos_analytics TO service_role;

CREATE POLICY "anon_insert_eventos_analytics"
    ON eventos_analytics FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "anon_update_eventos_analytics"
    ON eventos_analytics FOR UPDATE TO anon
    USING (true)
    WITH CHECK (true);

CREATE POLICY "anon_select_eventos_analytics"
    ON eventos_analytics FOR SELECT TO anon
    USING (true);
