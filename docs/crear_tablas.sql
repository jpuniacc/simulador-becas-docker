-- =====================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS - SIMULADOR UNIACC
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABLA PROSPECTOS
-- =====================================================
CREATE TABLE prospectos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    rut TEXT UNIQUE,
    pasaporte TEXT UNIQUE,
    fecha_nacimiento DATE,
    nacionalidad_id UUID REFERENCES nacionalidades(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint para asegurar que tenga RUT o pasaporte
    CONSTRAINT check_identificacion CHECK (
        (rut IS NOT NULL AND pasaporte IS NULL) OR 
        (rut IS NULL AND pasaporte IS NOT NULL)
    )
);

-- Índices para prospectos
CREATE INDEX idx_prospectos_email ON prospectos(email);
CREATE INDEX idx_prospectos_rut ON prospectos(rut);
CREATE INDEX idx_prospectos_pasaporte ON prospectos(pasaporte);
CREATE INDEX idx_prospectos_nacionalidad ON prospectos(nacionalidad_id);

-- =====================================================
-- 2. TABLA DATOS ACADÉMICOS
-- =====================================================
CREATE TABLE datos_academicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prospecto_id UUID NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,
    colegio_id UUID REFERENCES colegios(id), -- Referencia a la tabla colegios
    nombre_colegio TEXT, -- Campo de respaldo si no se encuentra en la tabla colegios
    region_colegio TEXT, -- Campo de respaldo
    comuna_colegio TEXT, -- Campo de respaldo
    tipo_colegio TEXT, -- Campo de respaldo
    carrera_deseada TEXT NOT NULL,
    nivel_educativo_actual TEXT CHECK (nivel_educativo_actual IN ('1ro Medio', '2do Medio', '3ro Medio', '4to Medio', 'Egresado')) DEFAULT 'Egresado',
    promedio DECIMAL(3,2) CHECK (promedio IS NULL OR (promedio >= 1.0 AND promedio <= 7.0)),
    nem DECIMAL(3,2) CHECK (nem IS NULL OR (nem >= 1.0 AND nem <= 7.0)),
    ranking DECIMAL(6,2) CHECK (ranking IS NULL OR (ranking >= 0 AND ranking <= 1000)),
    año_egreso INTEGER CHECK (año_egreso IS NULL OR (año_egreso >= 2000 AND año_egreso <= EXTRACT(YEAR FROM NOW()))),
    
    -- Constraints inteligentes basados en el nivel educativo
    CONSTRAINT check_nem_egresado CHECK (
        (nivel_educativo_actual = 'Egresado' AND nem IS NOT NULL) OR 
        (nivel_educativo_actual != 'Egresado' AND nem IS NULL)
    ),
    CONSTRAINT check_ranking_egresado CHECK (
        (nivel_educativo_actual = 'Egresado' AND ranking IS NOT NULL) OR 
        (nivel_educativo_actual != 'Egresado' AND ranking IS NULL)
    ),
    CONSTRAINT check_promedio_egresado CHECK (
        (nivel_educativo_actual = 'Egresado' AND promedio IS NOT NULL) OR 
        (nivel_educativo_actual != 'Egresado' AND promedio IS NULL)
    ),
    CONSTRAINT check_año_egreso_egresado CHECK (
        (nivel_educativo_actual = 'Egresado' AND año_egreso IS NOT NULL) OR 
        (nivel_educativo_actual != 'Egresado' AND año_egreso IS NULL)
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para datos académicos
CREATE INDEX idx_datos_academicos_prospecto ON datos_academicos(prospecto_id);
CREATE INDEX idx_datos_academicos_colegio ON datos_academicos(colegio_id);
CREATE INDEX idx_datos_academicos_carrera ON datos_academicos(carrera_deseada);
CREATE INDEX idx_datos_academicos_promedio ON datos_academicos(promedio);

-- =====================================================
-- 3. TABLA PUNTAJES PAES
-- =====================================================
CREATE TABLE puntajes_paes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prospecto_id UUID NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,
    
    -- Estado del estudiante respecto a PAES
    estado_estudiante TEXT CHECK (estado_estudiante IN ('sin_rendir', 'en_proceso', 'rendido', 'no_aplica')) DEFAULT 'no_aplica',
    fecha_rendicion DATE,
    año_rendicion INTEGER CHECK (año_rendicion >= 2020),
    tipo_rendicion TEXT CHECK (tipo_rendicion IN ('Regular', 'Especial', 'PAA')) DEFAULT 'Regular',
    rendio_paes BOOLEAN DEFAULT FALSE,
    
    -- Pruebas obligatorias
    puntaje_comprension_lectora INTEGER CHECK (puntaje_comprension_lectora >= 100 AND puntaje_comprension_lectora <= 1000),
    puntaje_matematica_1 INTEGER CHECK (puntaje_matematica_1 >= 100 AND puntaje_matematica_1 <= 1000),
    
    -- Pruebas electivas
    puntaje_matematica_2 INTEGER CHECK (puntaje_matematica_2 >= 100 AND puntaje_matematica_2 <= 1000),
    puntaje_historia_geografia INTEGER CHECK (puntaje_historia_geografia >= 100 AND puntaje_historia_geografia <= 1000),
    puntaje_ciencias INTEGER CHECK (puntaje_ciencias >= 100 AND puntaje_ciencias <= 1000),
    puntaje_fisica INTEGER CHECK (puntaje_fisica >= 100 AND puntaje_fisica <= 1000),
    puntaje_quimica INTEGER CHECK (puntaje_quimica >= 100 AND puntaje_quimica <= 1000),
    puntaje_biologia INTEGER CHECK (puntaje_biologia >= 100 AND puntaje_biologia <= 1000),
    
    -- Metadatos
    puntaje_total INTEGER GENERATED ALWAYS AS (
        CASE 
            WHEN rendio_paes = true THEN
                COALESCE(puntaje_comprension_lectora, 0) + 
                COALESCE(puntaje_matematica_1, 0) + 
                COALESCE(puntaje_matematica_2, 0) + 
                COALESCE(puntaje_historia_geografia, 0) + 
                COALESCE(puntaje_ciencias, 0) + 
                COALESCE(puntaje_fisica, 0) + 
                COALESCE(puntaje_quimica, 0) + 
                COALESCE(puntaje_biologia, 0)
            ELSE 0
        END
    ) STORED,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para puntajes PAES
CREATE INDEX idx_puntajes_paes_prospecto ON puntajes_paes(prospecto_id);
CREATE INDEX idx_puntajes_paes_estado ON puntajes_paes(estado_estudiante);
CREATE INDEX idx_puntajes_paes_total ON puntajes_paes(puntaje_total);

-- =====================================================
-- 4. TABLA DATOS SOCIOECONÓMICOS
-- =====================================================
CREATE TABLE datos_socioeconomicos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prospecto_id UUID NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,
    usa_cae BOOLEAN DEFAULT FALSE,
    decil_ingreso INTEGER CHECK (decil_ingreso >= 1 AND decil_ingreso <= 10),
    ingreso_mensual DECIMAL(12,2) CHECK (ingreso_mensual >= 0),
    numero_integrantes_familia INTEGER CHECK (numero_integrantes_familia >= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para datos socioeconómicos
CREATE INDEX idx_datos_socioeconomicos_prospecto ON datos_socioeconomicos(prospecto_id);
CREATE INDEX idx_datos_socioeconomicos_decil ON datos_socioeconomicos(decil_ingreso);
CREATE INDEX idx_datos_socioeconomicos_cae ON datos_socioeconomicos(usa_cae);

-- =====================================================
-- 5. TABLA DECILES
-- =====================================================
CREATE TABLE deciles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    decil INTEGER UNIQUE NOT NULL CHECK (decil >= 1 AND decil <= 10),
    rango_ingreso_min DECIMAL(12,2) NOT NULL,
    rango_ingreso_max DECIMAL(12,2) NOT NULL,
    descripcion TEXT NOT NULL,
    descripcion_corta TEXT NOT NULL,
    porcentaje_poblacion DECIMAL(5,2) NOT NULL CHECK (porcentaje_poblacion >= 0 AND porcentaje_poblacion <= 100),
    activo BOOLEAN DEFAULT TRUE,
    orden_visual INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para deciles
CREATE INDEX idx_deciles_decil ON deciles(decil);
CREATE INDEX idx_deciles_activo ON deciles(activo);
CREATE INDEX idx_deciles_orden ON deciles(orden_visual);

-- =====================================================
-- 6. TABLA NACIONALIDADES
-- =====================================================
CREATE TABLE nacionalidades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_iso TEXT NOT NULL UNIQUE, -- Código ISO 3166-1 alpha-2 (ej: CL, AR, PE)
    nombre_espanol TEXT NOT NULL,    -- Nombre en español (ej: Chile, Argentina, Perú)
    nombre_ingles TEXT NOT NULL,     -- Nombre en inglés (ej: Chile, Argentina, Peru)
    continente TEXT NOT NULL,        -- Continente (ej: América del Sur, América del Norte, Europa)
    region TEXT,                     -- Región específica (ej: Cono Sur, Andina, Caribe)
    activa BOOLEAN DEFAULT TRUE,     -- Si está activa para selección
    orden_visual INTEGER,            -- Para ordenar en la UI
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para nacionalidades
CREATE INDEX idx_nacionalidades_codigo ON nacionalidades(codigo_iso);
CREATE INDEX idx_nacionalidades_continente ON nacionalidades(continente);
CREATE INDEX idx_nacionalidades_activa ON nacionalidades(activa);
CREATE INDEX idx_nacionalidades_orden ON nacionalidades(orden_visual);

-- =====================================================
-- 7. TABLA COLEGIOS
-- =====================================================
CREATE TABLE colegios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rbd TEXT NOT NULL UNIQUE, -- RBD (Rol Base de Datos) único del establecimiento
    nombre TEXT NOT NULL, -- Nombre del establecimiento
    nombre_corto TEXT, -- Nombre abreviado para UI
    dependencia TEXT NOT NULL CHECK (dependencia IN ('Municipal', 'Particular Subvencionado', 'Particular Pagado', 'Corporación de Administración Delegada', 'Servicio Local de Educación')),
    tipo_educacion TEXT NOT NULL CHECK (tipo_educacion IN ('Básica', 'Media', 'Básica y Media', 'Especial')),
    modalidad TEXT, -- Modalidad educativa (ej: Humanista-Científico, Técnico-Profesional, Artístico)
    region_id INTEGER NOT NULL, -- ID de la región (1-16)
    region_nombre TEXT NOT NULL, -- Nombre de la región
    comuna_id INTEGER NOT NULL, -- ID de la comuna
    comuna_nombre TEXT NOT NULL, -- Nombre de la comuna
    direccion TEXT,
    telefono TEXT,
    email TEXT,
    sitio_web TEXT,
    latitud DECIMAL(10, 8), -- Coordenada latitud
    longitud DECIMAL(11, 8), -- Coordenada longitud
    activo BOOLEAN DEFAULT TRUE, -- Si el establecimiento está activo
    fecha_creacion DATE, -- Fecha de creación del establecimiento
    fecha_cierre DATE, -- Fecha de cierre (si aplica)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para colegios
CREATE INDEX idx_colegios_rbd ON colegios(rbd);
CREATE INDEX idx_colegios_nombre ON colegios(nombre);
CREATE INDEX idx_colegios_dependencia ON colegios(dependencia);
CREATE INDEX idx_colegios_region ON colegios(region_id, region_nombre);
CREATE INDEX idx_colegios_comuna ON colegios(comuna_id, comuna_nombre);
CREATE INDEX idx_colegios_activo ON colegios(activo);
CREATE INDEX idx_colegios_tipo_educacion ON colegios(tipo_educacion);

-- =====================================================
-- 8. TABLA BECAS
-- =====================================================
CREATE TABLE becas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    porcentaje_descuento DECIMAL(5,2) CHECK (porcentaje_descuento >= 0 AND porcentaje_descuento <= 100),
    monto_fijo DECIMAL(12,2) CHECK (monto_fijo >= 0),
    requisitos TEXT[],
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para becas
CREATE INDEX idx_becas_nombre ON becas(nombre);
CREATE INDEX idx_becas_activa ON becas(activa);

-- =====================================================
-- 7. TABLA BENEFICIOS
-- =====================================================
CREATE TABLE beneficios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT CHECK (tipo IN ('Descuento', 'Financiamiento', 'Beca', 'Convenio')),
    valor DECIMAL(12,2),
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para beneficios
CREATE INDEX idx_beneficios_nombre ON beneficios(nombre);
CREATE INDEX idx_beneficios_tipo ON beneficios(tipo);
CREATE INDEX idx_beneficios_activo ON beneficios(activo);

-- =====================================================
-- 8. TABLA BENEFICIOS UNIACC
-- =====================================================
CREATE TABLE beneficios_uniacc (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    codigo_beneficio INTEGER UNIQUE NOT NULL,
    descripcion TEXT NOT NULL,
    porcentaje_maximo DECIMAL(5,2),
    monto_maximo DECIMAL(12,2),
    tipo_beneficio TEXT CHECK (tipo_beneficio IN ('BECA', 'FINANCIAMIENTO', 'FINANCIERO')),
    origen_beneficio TEXT CHECK (origen_beneficio IN ('INTERNO', 'EXTERNO')),
    aplicacion_concepto TEXT CHECK (aplicacion_concepto IN ('A', 'M')),
    aplicacion TEXT CHECK (aplicacion IN ('SALDO', 'TOTAL')),
    prioridad INTEGER CHECK (prioridad >= 1 AND prioridad <= 3),
    vigente BOOLEAN DEFAULT TRUE,
    usuario_creacion INTEGER,
    fecha_modificacion TIMESTAMP,
    requisitos JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para beneficios UNIACC
CREATE INDEX idx_beneficios_uniacc_codigo ON beneficios_uniacc(codigo_beneficio);
CREATE INDEX idx_beneficios_uniacc_tipo ON beneficios_uniacc(tipo_beneficio);
CREATE INDEX idx_beneficios_uniacc_origen ON beneficios_uniacc(origen_beneficio);
CREATE INDEX idx_beneficios_uniacc_vigente ON beneficios_uniacc(vigente);
CREATE INDEX idx_beneficios_uniacc_prioridad ON beneficios_uniacc(prioridad);

-- =====================================================
-- 9. TABLA SIMULACIONES
-- =====================================================
CREATE TABLE simulaciones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    prospecto_id UUID NOT NULL REFERENCES prospectos(id) ON DELETE CASCADE,
    datos_entrada JSONB NOT NULL,
    resultados JSONB,
    beneficios_aplicables JSONB,
    fecha_simulacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para simulaciones
CREATE INDEX idx_simulaciones_prospecto ON simulaciones(prospecto_id);
CREATE INDEX idx_simulaciones_fecha ON simulaciones(fecha_simulacion);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a todas las tablas
CREATE TRIGGER update_prospectos_updated_at BEFORE UPDATE ON prospectos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_datos_academicos_updated_at BEFORE UPDATE ON datos_academicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_puntajes_paes_updated_at BEFORE UPDATE ON puntajes_paes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_datos_socioeconomicos_updated_at BEFORE UPDATE ON datos_socioeconomicos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deciles_updated_at BEFORE UPDATE ON deciles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_becas_updated_at BEFORE UPDATE ON becas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_beneficios_updated_at BEFORE UPDATE ON beneficios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_beneficios_uniacc_updated_at BEFORE UPDATE ON beneficios_uniacc FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_simulaciones_updated_at BEFORE UPDATE ON simulaciones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- DATOS INICIALES - DECILES
-- =====================================================
INSERT INTO deciles (decil, rango_ingreso_min, rango_ingreso_max, descripcion, descripcion_corta, porcentaje_poblacion, orden_visual) VALUES
(1, 0, 81150, 'Primer 1º decil: desde $0 a $81.150 ingresos por persona', '1º decil: $0 a $81.150', 10.0, 1),
(2, 81151, 128281, 'Segundo 2º decil: $81.150 a $128.281 ingresos por persona', '2º decil: $81.150 a $128.281', 10.0, 2),
(3, 128282, 169998, 'Tercer 3º decil: $128.281 a $169.998 ingresos por persona', '3º decil: $128.281 a $169.998', 10.0, 3),
(4, 169999, 211695, 'Cuarto 4º decil: $169.998 a $211.695 ingresos por persona', '4º decil: $169.998 a $211.695', 10.0, 4),
(5, 211696, 258268, 'Quinto 5º decil: $211.695 a $258.268 ingresos por persona', '5º decil: $211.695 a $258.268', 10.0, 5),
(6, 258269, 324984, 'Sexto 6º decil: $258.268 a $324.984 ingresos por persona', '6º decil: $258.268 a $324.984', 10.0, 6),
(7, 324985, 412913, 'Séptimo 7º decil: $324.984 a $412.913 ingresos por persona', '7º decil: $324.984 a $412.913', 10.0, 7),
(8, 412914, 555965, 'Octavo 8º decil: $412.913 a $555.965 ingresos por persona', '8º decil: $412.913 a $555.965', 10.0, 8),
(9, 555966, 904199, 'Noveno 9º decil: $555.965 a $904.199 ingresos por persona', '9º decil: $555.965 a $904.199', 10.0, 9),
(10, 904200, 999999999, 'Décimo 10º decil: $904.199 en adelante ingresos por persona', '10º decil: $904.199 en adelante', 10.0, 10);

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================
COMMENT ON TABLE prospectos IS 'Datos personales de estudiantes/prospectos';
COMMENT ON TABLE datos_academicos IS 'Información educacional de los estudiantes';
COMMENT ON TABLE puntajes_paes IS 'Resultados de pruebas PAES y estado del estudiante';
COMMENT ON TABLE datos_socioeconomicos IS 'Información socioeconómica para cálculo de becas';
COMMENT ON TABLE deciles IS 'Deciles socioeconómicos oficiales de Chile';
COMMENT ON TABLE becas IS 'Catálogo de becas disponibles';
COMMENT ON TABLE beneficios IS 'Catálogo de beneficios generales';
COMMENT ON TABLE beneficios_uniacc IS 'Beneficios específicos de UNIACC (internos y externos)';
COMMENT ON TABLE simulaciones IS 'Historial de simulaciones realizadas';

-- =====================================================
-- FUNCIONES PARA SIMULACIÓN
-- =====================================================

-- Función para verificar si un estudiante puede simular
CREATE OR REPLACE FUNCTION puede_simular(prospecto_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    nivel_actual TEXT;
    tiene_datos_socioeconomicos BOOLEAN;
    tiene_datos_academicos BOOLEAN;
BEGIN
    -- Obtener nivel educativo actual
    SELECT da.nivel_educativo_actual INTO nivel_actual
    FROM datos_academicos da
    WHERE da.prospecto_id = prospecto_uuid;
    
    -- Verificar si tiene datos socioeconómicos
    SELECT EXISTS(
        SELECT 1 FROM datos_socioeconomicos ds 
        WHERE ds.prospecto_id = prospecto_uuid
    ) INTO tiene_datos_socioeconomicos;
    
    -- Verificar si tiene datos académicos
    SELECT EXISTS(
        SELECT 1 FROM datos_academicos da 
        WHERE da.prospecto_id = prospecto_uuid
    ) INTO tiene_datos_academicos;
    
    -- Un estudiante puede simular si:
    -- 1. Es egresado (tiene NEM, ranking, etc.) - PAES NO es obligatorio
    -- 2. O es estudiante de enseñanza media con datos socioeconómicos
    RETURN (
        (nivel_actual = 'Egresado' AND tiene_datos_academicos) OR 
        (nivel_actual IN ('1ro Medio', '2do Medio', '3ro Medio', '4to Medio') AND tiene_datos_socioeconomicos AND tiene_datos_academicos)
    );
END;
$$ LANGUAGE plpgsql;

-- Función para obtener beneficios aplicables según nivel educativo
CREATE OR REPLACE FUNCTION obtener_beneficios_por_nivel(prospecto_uuid UUID)
RETURNS TABLE (
    codigo_beneficio INTEGER,
    descripcion TEXT,
    porcentaje_maximo DECIMAL,
    monto_maximo DECIMAL,
    tipo_beneficio TEXT,
    elegible BOOLEAN,
    razon_elegibilidad TEXT
) AS $$
DECLARE
    nivel_actual TEXT;
    decil_estudiante INTEGER;
BEGIN
    -- Obtener nivel educativo y decil
    SELECT da.nivel_educativo_actual, ds.decil_ingreso 
    INTO nivel_actual, decil_estudiante
    FROM datos_academicos da
    LEFT JOIN datos_socioeconomicos ds ON da.prospecto_id = ds.prospecto_id
    WHERE da.prospecto_id = prospecto_uuid;
    
    -- Retornar beneficios según el nivel educativo
    RETURN QUERY
    SELECT 
        bu.codigo_beneficio,
        bu.descripcion,
        bu.porcentaje_maximo,
        bu.monto_maximo,
        bu.tipo_beneficio,
        CASE 
            -- Beneficios para estudiantes de enseñanza media
            WHEN nivel_actual IN ('1ro Medio', '2do Medio', '3ro Medio', '4to Medio') THEN
                CASE 
                    WHEN bu.descripcion ILIKE '%TALENTO%' THEN true
                    WHEN bu.descripcion ILIKE '%MIGRANTE%' THEN true
                    WHEN bu.tipo_beneficio = 'FINANCIERO' THEN true
                    WHEN bu.descripcion ILIKE '%CONVENIO%' THEN true
                    ELSE false
                END
            -- Beneficios para egresados (PAES NO es obligatorio en UNIACC)
            WHEN nivel_actual = 'Egresado' THEN
                CASE 
                    WHEN bu.descripcion ILIKE '%DACC%' THEN true
                    WHEN bu.descripcion ILIKE '%NEM%' THEN true
                    WHEN bu.descripcion ILIKE '%PSU%' THEN true
                    WHEN bu.descripcion ILIKE '%CAE%' THEN true
                    WHEN bu.descripcion ILIKE '%TALENTO%' THEN true
                    WHEN bu.descripcion ILIKE '%MIGRANTE%' THEN true
                    WHEN bu.descripcion ILIKE '%CONVENIO%' THEN true
                    WHEN bu.tipo_beneficio = 'FINANCIERO' THEN true
                    WHEN bu.tipo_beneficio = 'FINANCIAMIENTO' THEN true
                    ELSE false
                END
            ELSE false
        END as elegible,
        CASE 
            WHEN nivel_actual IN ('1ro Medio', '2do Medio', '3ro Medio', '4to Medio') THEN
                CASE 
                    WHEN bu.descripcion ILIKE '%TALENTO%' THEN 'Beca talento para estudiantes de enseñanza media'
                    WHEN bu.descripcion ILIKE '%MIGRANTE%' THEN 'Beca migrante disponible'
                    WHEN bu.tipo_beneficio = 'FINANCIERO' THEN 'Descuento por forma de pago'
                    WHEN bu.descripcion ILIKE '%CONVENIO%' THEN 'Convenio institucional'
                    ELSE 'No aplica para estudiantes de enseñanza media'
                END
            WHEN nivel_actual = 'Egresado' THEN
                CASE 
                    WHEN bu.descripcion ILIKE '%DACC%' THEN 'Beca por rendimiento DACC'
                    WHEN bu.descripcion ILIKE '%NEM%' THEN 'Beca por NEM'
                    WHEN bu.descripcion ILIKE '%PSU%' THEN 'Beca por PSU (opcional)'
                    WHEN bu.descripcion ILIKE '%CAE%' THEN 'Crédito con Aval del Estado'
                    WHEN bu.descripcion ILIKE '%TALENTO%' THEN 'Beca talento para egresados'
                    WHEN bu.descripcion ILIKE '%MIGRANTE%' THEN 'Beca migrante para egresados'
                    WHEN bu.descripcion ILIKE '%CONVENIO%' THEN 'Convenio institucional'
                    WHEN bu.tipo_beneficio = 'FINANCIERO' THEN 'Descuento por forma de pago'
                    WHEN bu.tipo_beneficio = 'FINANCIAMIENTO' THEN 'Financiamiento disponible'
                    ELSE 'No cumple requisitos'
                END
            ELSE 'Nivel educativo no válido'
        END as razon_elegibilidad
    FROM beneficios_uniacc bu
    WHERE bu.vigente = true
    ORDER BY bu.prioridad, bu.codigo_beneficio;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
