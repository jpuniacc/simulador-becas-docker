export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aranceles_cae: {
        Row: {
          arancel_anual: number | null
          arancel_referencia: number | null
          codigo_carrera: number | null
          codigo_ies: number | null
          created_at: string
          duracion_maxima: number | null
          id: number
          id_carrera: number | null
          jornada: string | null
          nombre_carrera: string | null
        }
        Insert: {
          arancel_anual?: number | null
          arancel_referencia?: number | null
          codigo_carrera?: number | null
          codigo_ies?: number | null
          created_at?: string
          duracion_maxima?: number | null
          id?: number
          id_carrera?: number | null
          jornada?: string | null
          nombre_carrera?: string | null
        }
        Update: {
          arancel_anual?: number | null
          arancel_referencia?: number | null
          codigo_carrera?: number | null
          codigo_ies?: number | null
          created_at?: string
          duracion_maxima?: number | null
          id?: number
          id_carrera?: number | null
          jornada?: string | null
          nombre_carrera?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foreign_key_carrera_arancel"
            columns: ["id_carrera"]
            isOneToOne: false
            referencedRelation: "carreras_uniacc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foreign_key_carrera_arancel"
            columns: ["id_carrera"]
            isOneToOne: false
            referencedRelation: "v_carreras_vigentes"
            referencedColumns: ["id"]
          },
        ]
      }
      becas_estado: {
        Row: {
          codigo_beca: string | null
          created_at: string
          decil_maximo: number | null
          descripcion: string | null
          descuento_monto: number | null
          descuento_porcentaje: number | null
          id: number
          nem_minimo: number | null
          nombre: string | null
          paes_minimo: number | null
          requeire_decil: boolean | null
          requiere_nem: boolean | null
          requiere_paes: boolean | null
          tipo_descuento: string | null
        }
        Insert: {
          codigo_beca?: string | null
          created_at?: string
          decil_maximo?: number | null
          descripcion?: string | null
          descuento_monto?: number | null
          descuento_porcentaje?: number | null
          id?: number
          nem_minimo?: number | null
          nombre?: string | null
          paes_minimo?: number | null
          requeire_decil?: boolean | null
          requiere_nem?: boolean | null
          requiere_paes?: boolean | null
          tipo_descuento?: string | null
        }
        Update: {
          codigo_beca?: string | null
          created_at?: string
          decil_maximo?: number | null
          descripcion?: string | null
          descuento_monto?: number | null
          descuento_porcentaje?: number | null
          id?: number
          nem_minimo?: number | null
          nombre?: string | null
          paes_minimo?: number | null
          requeire_decil?: boolean | null
          requiere_nem?: boolean | null
          requiere_paes?: boolean | null
          tipo_descuento?: string | null
        }
        Relationships: []
      }
      becas_informativas: {
        Row: {
          codigo: string
          descripcion: string
          estado: string | null
          id: string
          nombre: string
          porcentajes: Json | null
          requisitos: Json | null
          vigente_desde: string
          vigente_hasta: string
        }
        Insert: {
          codigo: string
          descripcion: string
          estado?: string | null
          id?: string
          nombre: string
          porcentajes?: Json | null
          requisitos?: Json | null
          vigente_desde: string
          vigente_hasta: string
        }
        Update: {
          codigo?: string
          descripcion?: string
          estado?: string | null
          id?: string
          nombre?: string
          porcentajes?: Json | null
          requisitos?: Json | null
          vigente_desde?: string
          vigente_hasta?: string
        }
        Relationships: []
      }
      becas_uniacc: {
        Row: {
          activa: boolean | null
          becas_incompatibles: Json | null
          carreras_aplicables: Json | null
          codigo_beca: string
          created_at: string | null
          cupos_disponibles: number | null
          cupos_utilizados: number | null
          descripcion: string | null
          descuento_mixto: Json | null
          descuento_monto_fijo: number | null
          descuento_porcentaje: number | null
          duracion_meses: number | null
          duracion_tipo: string | null
          edad_requerida: number | null
          es_combinable: boolean | null
          id: string
          institucion_requerida: string | null
          max_anos_egreso: number | null
          max_anos_paes: number | null
          modalidades_aplicables: Json
          nem_minimo: number | null
          nivel_aplicable: string | null
          nombre: string
          paes_minimo: number | null
          prioridad: number | null
          proceso_evaluacion: string | null
          programas_excluidos: Json | null
          ranking_minimo: number | null
          region_excluida: string | null
          requiere_beca_estado: boolean | null
          requiere_documentacion: Json | null
          requiere_extranjeria: boolean | null
          requiere_genero: string | null
          requiere_institucion: boolean | null
          requiere_nem: boolean | null
          requiere_paes: boolean | null
          requiere_ranking: boolean | null
          requiere_region_especifica: boolean | null
          requiere_residencia_chile: boolean | null
          tipo: string | null
          tipo_descuento: string | null
          updated_at: string | null
          vigencia_desde: string
          vigencia_hasta: string | null
        }
        Insert: {
          activa?: boolean | null
          becas_incompatibles?: Json | null
          carreras_aplicables?: Json | null
          codigo_beca: string
          created_at?: string | null
          cupos_disponibles?: number | null
          cupos_utilizados?: number | null
          descripcion?: string | null
          descuento_mixto?: Json | null
          descuento_monto_fijo?: number | null
          descuento_porcentaje?: number | null
          duracion_meses?: number | null
          duracion_tipo?: string | null
          edad_requerida?: number | null
          es_combinable?: boolean | null
          id?: string
          institucion_requerida?: string | null
          max_anos_egreso?: number | null
          max_anos_paes?: number | null
          modalidades_aplicables: Json
          nem_minimo?: number | null
          nivel_aplicable?: string | null
          nombre: string
          paes_minimo?: number | null
          prioridad?: number | null
          proceso_evaluacion?: string | null
          programas_excluidos?: Json | null
          ranking_minimo?: number | null
          region_excluida?: string | null
          requiere_beca_estado?: boolean | null
          requiere_documentacion?: Json | null
          requiere_extranjeria?: boolean | null
          requiere_genero?: string | null
          requiere_institucion?: boolean | null
          requiere_nem?: boolean | null
          requiere_paes?: boolean | null
          requiere_ranking?: boolean | null
          requiere_region_especifica?: boolean | null
          requiere_residencia_chile?: boolean | null
          tipo?: string | null
          tipo_descuento?: string | null
          updated_at?: string | null
          vigencia_desde: string
          vigencia_hasta?: string | null
        }
        Update: {
          activa?: boolean | null
          becas_incompatibles?: Json | null
          carreras_aplicables?: Json | null
          codigo_beca?: string
          created_at?: string | null
          cupos_disponibles?: number | null
          cupos_utilizados?: number | null
          descripcion?: string | null
          descuento_mixto?: Json | null
          descuento_monto_fijo?: number | null
          descuento_porcentaje?: number | null
          duracion_meses?: number | null
          duracion_tipo?: string | null
          edad_requerida?: number | null
          es_combinable?: boolean | null
          id?: string
          institucion_requerida?: string | null
          max_anos_egreso?: number | null
          max_anos_paes?: number | null
          modalidades_aplicables?: Json
          nem_minimo?: number | null
          nivel_aplicable?: string | null
          nombre?: string
          paes_minimo?: number | null
          prioridad?: number | null
          proceso_evaluacion?: string | null
          programas_excluidos?: Json | null
          ranking_minimo?: number | null
          region_excluida?: string | null
          requiere_beca_estado?: boolean | null
          requiere_documentacion?: Json | null
          requiere_extranjeria?: boolean | null
          requiere_genero?: string | null
          requiere_institucion?: boolean | null
          requiere_nem?: boolean | null
          requiere_paes?: boolean | null
          requiere_ranking?: boolean | null
          requiere_region_especifica?: boolean | null
          requiere_residencia_chile?: boolean | null
          tipo?: string | null
          tipo_descuento?: string | null
          updated_at?: string | null
          vigencia_desde?: string
          vigencia_hasta?: string | null
        }
        Relationships: []
      }
      carreras: {
        Row: {
          anio: number | null
          arancel_carrera: number | null
          area_actual: string
          descripcion_escuela: string
          descripcion_facultad: string
          duracion_en_semestres: number | null
          id: number
          matricula_carrera: number | null
          nivel_global: string
          nombre_carrera: string
          nombre_grado: string
          nombre_titulo: string
          tipo_plan_carrera: string
          vigencia: string
        }
        Insert: {
          anio?: number | null
          arancel_carrera?: number | null
          area_actual: string
          descripcion_escuela: string
          descripcion_facultad: string
          duracion_en_semestres?: number | null
          id?: number
          matricula_carrera?: number | null
          nivel_global: string
          nombre_carrera: string
          nombre_grado: string
          nombre_titulo: string
          tipo_plan_carrera: string
          vigencia: string
        }
        Update: {
          anio?: number | null
          arancel_carrera?: number | null
          area_actual?: string
          descripcion_escuela?: string
          descripcion_facultad?: string
          duracion_en_semestres?: number | null
          id?: number
          matricula_carrera?: number | null
          nivel_global?: string
          nombre_carrera?: string
          nombre_grado?: string
          nombre_titulo?: string
          tipo_plan_carrera?: string
          vigencia?: string
        }
        Relationships: []
      }
      carreras_uniacc: {
        Row: {
          anio: number
          anio_arancel_referencia: number | null
          arancel: number
          arancel_referencia: number | null
          codigo_carrera: string | null
          descripcion_programa: string
          duracion_programa: string
          facultad: string | null
          id: number
          malla: string
          matricula: number
          modalidad_programa: string | null
          nivel_academico: string | null
          nombre_programa: string
          programa_activo: boolean | null
          requisitos_ingreso: string
          version_simulador: number | null
        }
        Insert: {
          anio: number
          anio_arancel_referencia?: number | null
          arancel: number
          arancel_referencia?: number | null
          codigo_carrera?: string | null
          descripcion_programa: string
          duracion_programa: string
          facultad?: string | null
          id?: number
          malla: string
          matricula: number
          modalidad_programa?: string | null
          nivel_academico?: string | null
          nombre_programa: string
          programa_activo?: boolean | null
          requisitos_ingreso: string
          version_simulador?: number | null
        }
        Update: {
          anio?: number
          anio_arancel_referencia?: number | null
          arancel?: number
          arancel_referencia?: number | null
          codigo_carrera?: string | null
          descripcion_programa?: string
          duracion_programa?: string
          facultad?: string | null
          id?: number
          malla?: string
          matricula?: number
          modalidad_programa?: string | null
          nivel_academico?: string | null
          nombre_programa?: string
          programa_activo?: boolean | null
          requisitos_ingreso?: string
          version_simulador?: number | null
        }
        Relationships: []
      }
      colegios: {
        Row: {
          activo: boolean | null
          comuna_id: number
          comuna_nombre: string
          created_at: string | null
          dependencia: string
          direccion: string | null
          email: string | null
          fecha_cierre: string | null
          fecha_creacion: string | null
          id: string
          latitud: number | null
          longitud: number | null
          modalidad: string | null
          nombre: string
          nombre_corto: string | null
          rbd: string
          region_id: number
          region_nombre: string
          sitio_web: string | null
          telefono: string | null
          tipo_educacion: string
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          comuna_id: number
          comuna_nombre: string
          created_at?: string | null
          dependencia: string
          direccion?: string | null
          email?: string | null
          fecha_cierre?: string | null
          fecha_creacion?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          modalidad?: string | null
          nombre: string
          nombre_corto?: string | null
          rbd: string
          region_id: number
          region_nombre: string
          sitio_web?: string | null
          telefono?: string | null
          tipo_educacion: string
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          comuna_id?: number
          comuna_nombre?: string
          created_at?: string | null
          dependencia?: string
          direccion?: string | null
          email?: string | null
          fecha_cierre?: string | null
          fecha_creacion?: string | null
          id?: string
          latitud?: number | null
          longitud?: number | null
          modalidad?: string | null
          nombre?: string
          nombre_corto?: string | null
          rbd?: string
          region_id?: number
          region_nombre?: string
          sitio_web?: string | null
          telefono?: string | null
          tipo_educacion?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      colegios2: {
        Row: {
          comuna_nombre: string | null
          dependencia: string | null
          id: number
          nombre: string | null
          rbd: number | null
          region_id: number | null
          region_nombre: string | null
        }
        Insert: {
          comuna_nombre?: string | null
          dependencia?: string | null
          id?: number
          nombre?: string | null
          rbd?: number | null
          region_id?: number | null
          region_nombre?: string | null
        }
        Update: {
          comuna_nombre?: string | null
          dependencia?: string | null
          id?: number
          nombre?: string | null
          rbd?: number | null
          region_id?: number | null
          region_nombre?: string | null
        }
        Relationships: []
      }
      colegios3: {
        Row: {
          comuna_nombre: string | null
          dependencia: string | null
          descripcion_orientacion_religiosa: string | null
          dv: string | null
          nombre: string | null
          orientacion_religiosa: string | null
          rbd: string | null
          rbd_rural: string | null
          region_id: number | null
          region_nombre: string | null
        }
        Insert: {
          comuna_nombre?: string | null
          dependencia?: string | null
          descripcion_orientacion_religiosa?: string | null
          dv?: string | null
          nombre?: string | null
          orientacion_religiosa?: string | null
          rbd?: string | null
          rbd_rural?: string | null
          region_id?: number | null
          region_nombre?: string | null
        }
        Update: {
          comuna_nombre?: string | null
          dependencia?: string | null
          descripcion_orientacion_religiosa?: string | null
          dv?: string | null
          nombre?: string | null
          orientacion_religiosa?: string | null
          rbd?: string | null
          rbd_rural?: string | null
          region_id?: number | null
          region_nombre?: string | null
        }
        Relationships: []
      }
      datos_academicos: {
        Row: {
          año_egreso: number | null
          carrera_deseada: string
          colegio_id: string | null
          comuna_colegio: string | null
          created_at: string | null
          id: string
          nem: number | null
          nivel_educativo_actual: string | null
          nombre_colegio: string | null
          promedio: number | null
          prospecto_id: string
          ranking: number | null
          region_colegio: string | null
          tipo_colegio: string | null
          tipo_programa: string | null
          updated_at: string | null
        }
        Insert: {
          año_egreso?: number | null
          carrera_deseada: string
          colegio_id?: string | null
          comuna_colegio?: string | null
          created_at?: string | null
          id?: string
          nem?: number | null
          nivel_educativo_actual?: string | null
          nombre_colegio?: string | null
          promedio?: number | null
          prospecto_id: string
          ranking?: number | null
          region_colegio?: string | null
          tipo_colegio?: string | null
          tipo_programa?: string | null
          updated_at?: string | null
        }
        Update: {
          año_egreso?: number | null
          carrera_deseada?: string
          colegio_id?: string | null
          comuna_colegio?: string | null
          created_at?: string | null
          id?: string
          nem?: number | null
          nivel_educativo_actual?: string | null
          nombre_colegio?: string | null
          promedio?: number | null
          prospecto_id?: string
          ranking?: number | null
          region_colegio?: string | null
          tipo_colegio?: string | null
          tipo_programa?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "datos_academicos_colegio_id_fkey"
            columns: ["colegio_id"]
            isOneToOne: false
            referencedRelation: "colegios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "datos_academicos_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
      datos_socioeconomicos: {
        Row: {
          comuna_residencia: string | null
          created_at: string | null
          decil_ingreso: number | null
          id: string
          ingreso_mensual: number | null
          numero_integrantes_familia: number | null
          planea_usar_cae: boolean | null
          prospecto_id: string
          region_residencia: string | null
          updated_at: string | null
          usa_becas_estado: boolean | null
        }
        Insert: {
          comuna_residencia?: string | null
          created_at?: string | null
          decil_ingreso?: number | null
          id?: string
          ingreso_mensual?: number | null
          numero_integrantes_familia?: number | null
          planea_usar_cae?: boolean | null
          prospecto_id: string
          region_residencia?: string | null
          updated_at?: string | null
          usa_becas_estado?: boolean | null
        }
        Update: {
          comuna_residencia?: string | null
          created_at?: string | null
          decil_ingreso?: number | null
          id?: string
          ingreso_mensual?: number | null
          numero_integrantes_familia?: number | null
          planea_usar_cae?: boolean | null
          prospecto_id?: string
          region_residencia?: string | null
          updated_at?: string | null
          usa_becas_estado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "datos_socioeconomicos_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
      deciles: {
        Row: {
          activo: boolean | null
          created_at: string | null
          decil: number
          descripcion: string
          descripcion_corta: string
          id: string
          orden_visual: number
          porcentaje_poblacion: number
          rango_ingreso_max: number
          rango_ingreso_min: number
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          decil: number
          descripcion: string
          descripcion_corta: string
          id?: string
          orden_visual: number
          porcentaje_poblacion: number
          rango_ingreso_max: number
          rango_ingreso_min: number
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          decil?: number
          descripcion?: string
          descripcion_corta?: string
          id?: string
          orden_visual?: number
          porcentaje_poblacion?: number
          rango_ingreso_max?: number
          rango_ingreso_min?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      descuento_modo_pago: {
        Row: {
          activa: boolean | null
          dscto_arancel: number | null
          id: string
          nombre: string | null
        }
        Insert: {
          activa?: boolean | null
          dscto_arancel?: number | null
          id?: string
          nombre?: string | null
        }
        Update: {
          activa?: boolean | null
          dscto_arancel?: number | null
          id?: string
          nombre?: string | null
        }
        Relationships: []
      }
      descuento_pago_anticipado: {
        Row: {
          activa: boolean | null
          dscto_arancel: number | null
          dscto_matricula: number | null
          fecha_inicio: string | null
          fecha_termino: string | null
          id: string
          nombre: string | null
        }
        Insert: {
          activa?: boolean | null
          dscto_arancel?: number | null
          dscto_matricula?: number | null
          fecha_inicio?: string | null
          fecha_termino?: string | null
          id?: string
          nombre?: string | null
        }
        Update: {
          activa?: boolean | null
          dscto_arancel?: number | null
          dscto_matricula?: number | null
          fecha_inicio?: string | null
          fecha_termino?: string | null
          id?: string
          nombre?: string | null
        }
        Relationships: []
      }
      eventos_analytics: {
        Row: {
          campaign_data: Json | null
          carrera: string | null
          created_at: string
          event_name: string
          id: string
          modalidad: string
          prospecto_id: string | null
          segmentacion: string | null
          simulacion_id: string | null
          url_origen: string | null
        }
        Insert: {
          campaign_data?: Json | null
          carrera?: string | null
          created_at?: string
          event_name?: string
          id?: string
          modalidad: string
          prospecto_id?: string | null
          segmentacion?: string | null
          simulacion_id?: string | null
          url_origen?: string | null
        }
        Update: {
          campaign_data?: Json | null
          carrera?: string | null
          created_at?: string
          event_name?: string
          id?: string
          modalidad?: string
          prospecto_id?: string | null
          segmentacion?: string | null
          simulacion_id?: string | null
          url_origen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "eventos_analytics_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_analytics_simulacion_id_fkey"
            columns: ["simulacion_id"]
            isOneToOne: false
            referencedRelation: "simulaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      instituciones_superior: {
        Row: {
          estado: string | null
          funcionamiento: string | null
          id: string
          nombre: string
          tipo_institucion: string
        }
        Insert: {
          estado?: string | null
          funcionamiento?: string | null
          id?: string
          nombre: string
          tipo_institucion: string
        }
        Update: {
          estado?: string | null
          funcionamiento?: string | null
          id?: string
          nombre?: string
          tipo_institucion?: string
        }
        Relationships: []
      }
      nacionalidades: {
        Row: {
          activa: boolean | null
          codigo_iso: string
          continente: string
          created_at: string | null
          id: string
          nombre_espanol: string
          nombre_ingles: string
          orden_visual: number | null
          region: string | null
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          codigo_iso: string
          continente: string
          created_at?: string | null
          id?: string
          nombre_espanol: string
          nombre_ingles: string
          orden_visual?: number | null
          region?: string | null
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          codigo_iso?: string
          continente?: string
          created_at?: string | null
          id?: string
          nombre_espanol?: string
          nombre_ingles?: string
          orden_visual?: number | null
          region?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prospectos: {
        Row: {
          ad_id: string | null
          adgroup_id: string | null
          anio_ingreso: number | null
          anio_nacimiento: number | null
          año_egreso: number | null
          apellido: string
          arancel_final: number | null
          arancel_original: number | null
          area_interes: string | null
          beca: string | null
          becas_estado: boolean | null
          cae: boolean | null
          campaign_id: string | null
          carrera: number | null
          carreratitulo: string | null
          colegio: string | null
          comprension_lectora: number | null
          comuna: string | null
          consentimiento_contacto: boolean | null
          created_at: string | null
          curso: string
          decil: string | null
          descuento_total: number | null
          email: string
          fbclid: string | null
          first_touch_timestamp: string | null
          first_touch_url: string | null
          gad_source: string | null
          gbraid: string | null
          gcl_aw: string | null
          gclid: string | null
          genero: string | null
          grado_academico: string | null
          hubspot_contact_id: string | null
          id: string
          landing_page: string | null
          last_touch_timestamp: string | null
          last_touch_url: string | null
          li_fat_id: string | null
          matematica1: number | null
          matricula_final: number | null
          matricula_original: number | null
          medio_pago: string | null
          modalidadpreferencia: Json | null
          msclkid: string | null
          nem: number | null
          nombre: string
          numero_cuotas: number | null
          objetivo: Json | null
          organic_medium: string | null
          organic_source: string | null
          paes: boolean | null
          pasaporte: string | null
          periodo_id: number | null
          prospecto_crm: Json | null
          rango_ingreso: string | null
          ranking: number | null
          referrer: string | null
          region: string | null
          respuesta_crm: Json | null
          rut: string | null
          segmentacion: string | null
          semestre_ingreso: number | null
          telefono: string | null
          total_final: number | null
          traffic_type: string | null
          ttclid: string | null
          twclid: string | null
          updated_at: string | null
          url_origen: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          valor_mensual: number | null
          wbraid: string | null
        }
        Insert: {
          ad_id?: string | null
          adgroup_id?: string | null
          anio_ingreso?: number | null
          anio_nacimiento?: number | null
          año_egreso?: number | null
          apellido: string
          arancel_final?: number | null
          arancel_original?: number | null
          area_interes?: string | null
          beca?: string | null
          becas_estado?: boolean | null
          cae?: boolean | null
          campaign_id?: string | null
          carrera?: number | null
          carreratitulo?: string | null
          colegio?: string | null
          comprension_lectora?: number | null
          comuna?: string | null
          consentimiento_contacto?: boolean | null
          created_at?: string | null
          curso: string
          decil?: string | null
          descuento_total?: number | null
          email: string
          fbclid?: string | null
          first_touch_timestamp?: string | null
          first_touch_url?: string | null
          gad_source?: string | null
          gbraid?: string | null
          gcl_aw?: string | null
          gclid?: string | null
          genero?: string | null
          grado_academico?: string | null
          hubspot_contact_id?: string | null
          id?: string
          landing_page?: string | null
          last_touch_timestamp?: string | null
          last_touch_url?: string | null
          li_fat_id?: string | null
          matematica1?: number | null
          matricula_final?: number | null
          matricula_original?: number | null
          medio_pago?: string | null
          modalidadpreferencia?: Json | null
          msclkid?: string | null
          nem?: number | null
          nombre: string
          numero_cuotas?: number | null
          objetivo?: Json | null
          organic_medium?: string | null
          organic_source?: string | null
          paes?: boolean | null
          pasaporte?: string | null
          periodo_id?: number | null
          prospecto_crm?: Json | null
          rango_ingreso?: string | null
          ranking?: number | null
          referrer?: string | null
          region?: string | null
          respuesta_crm?: Json | null
          rut?: string | null
          segmentacion?: string | null
          semestre_ingreso?: number | null
          telefono?: string | null
          total_final?: number | null
          traffic_type?: string | null
          ttclid?: string | null
          twclid?: string | null
          updated_at?: string | null
          url_origen?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_mensual?: number | null
          wbraid?: string | null
        }
        Update: {
          ad_id?: string | null
          adgroup_id?: string | null
          anio_ingreso?: number | null
          anio_nacimiento?: number | null
          año_egreso?: number | null
          apellido?: string
          arancel_final?: number | null
          arancel_original?: number | null
          area_interes?: string | null
          beca?: string | null
          becas_estado?: boolean | null
          cae?: boolean | null
          campaign_id?: string | null
          carrera?: number | null
          carreratitulo?: string | null
          colegio?: string | null
          comprension_lectora?: number | null
          comuna?: string | null
          consentimiento_contacto?: boolean | null
          created_at?: string | null
          curso?: string
          decil?: string | null
          descuento_total?: number | null
          email?: string
          fbclid?: string | null
          first_touch_timestamp?: string | null
          first_touch_url?: string | null
          gad_source?: string | null
          gbraid?: string | null
          gcl_aw?: string | null
          gclid?: string | null
          genero?: string | null
          grado_academico?: string | null
          hubspot_contact_id?: string | null
          id?: string
          landing_page?: string | null
          last_touch_timestamp?: string | null
          last_touch_url?: string | null
          li_fat_id?: string | null
          matematica1?: number | null
          matricula_final?: number | null
          matricula_original?: number | null
          medio_pago?: string | null
          modalidadpreferencia?: Json | null
          msclkid?: string | null
          nem?: number | null
          nombre?: string
          numero_cuotas?: number | null
          objetivo?: Json | null
          organic_medium?: string | null
          organic_source?: string | null
          paes?: boolean | null
          pasaporte?: string | null
          periodo_id?: number | null
          prospecto_crm?: Json | null
          rango_ingreso?: string | null
          ranking?: number | null
          referrer?: string | null
          region?: string | null
          respuesta_crm?: Json | null
          rut?: string | null
          segmentacion?: string | null
          semestre_ingreso?: number | null
          telefono?: string | null
          total_final?: number | null
          traffic_type?: string | null
          ttclid?: string | null
          twclid?: string | null
          updated_at?: string | null
          url_origen?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          valor_mensual?: number | null
          wbraid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospectos_carrera_fkey"
            columns: ["carrera"]
            isOneToOne: false
            referencedRelation: "carreras_uniacc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospectos_carrera_fkey"
            columns: ["carrera"]
            isOneToOne: false
            referencedRelation: "v_carreras_vigentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospectos_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "simulador_mv_periodos_ingreso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospectos_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "v_carreras_vigentes"
            referencedColumns: ["periodo_id"]
          },
        ]
      }
      puntajes_paes: {
        Row: {
          año_rendicion: number | null
          created_at: string | null
          estado_estudiante: string | null
          fecha_rendicion: string | null
          id: string
          prospecto_id: string
          puntaje_biologia: number | null
          puntaje_ciencias: number | null
          puntaje_comprension_lectora: number | null
          puntaje_fisica: number | null
          puntaje_historia_geografia: number | null
          puntaje_matematica_1: number | null
          puntaje_matematica_2: number | null
          puntaje_quimica: number | null
          puntaje_total: number | null
          rendio_paes: boolean | null
          tipo_rendicion: string | null
          updated_at: string | null
        }
        Insert: {
          año_rendicion?: number | null
          created_at?: string | null
          estado_estudiante?: string | null
          fecha_rendicion?: string | null
          id?: string
          prospecto_id: string
          puntaje_biologia?: number | null
          puntaje_ciencias?: number | null
          puntaje_comprension_lectora?: number | null
          puntaje_fisica?: number | null
          puntaje_historia_geografia?: number | null
          puntaje_matematica_1?: number | null
          puntaje_matematica_2?: number | null
          puntaje_quimica?: number | null
          puntaje_total?: number | null
          rendio_paes?: boolean | null
          tipo_rendicion?: string | null
          updated_at?: string | null
        }
        Update: {
          año_rendicion?: number | null
          created_at?: string | null
          estado_estudiante?: string | null
          fecha_rendicion?: string | null
          id?: string
          prospecto_id?: string
          puntaje_biologia?: number | null
          puntaje_ciencias?: number | null
          puntaje_comprension_lectora?: number | null
          puntaje_fisica?: number | null
          puntaje_historia_geografia?: number | null
          puntaje_matematica_1?: number | null
          puntaje_matematica_2?: number | null
          puntaje_quimica?: number | null
          puntaje_total?: number | null
          rendio_paes?: boolean | null
          tipo_rendicion?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "puntajes_paes_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
      simulaciones: {
        Row: {
          beneficios_aplicables: Json | null
          created_at: string | null
          datos_entrada: Json
          fecha_simulacion: string | null
          id: string
          prospecto_id: string
          resultados: Json | null
          updated_at: string | null
        }
        Insert: {
          beneficios_aplicables?: Json | null
          created_at?: string | null
          datos_entrada: Json
          fecha_simulacion?: string | null
          id?: string
          prospecto_id: string
          resultados?: Json | null
          updated_at?: string | null
        }
        Update: {
          beneficios_aplicables?: Json | null
          created_at?: string | null
          datos_entrada?: Json
          fecha_simulacion?: string | null
          id?: string
          prospecto_id?: string
          resultados?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "simulaciones_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
      simulador_mv_carrera_periodo_valores: {
        Row: {
          activo: boolean
          anio_arancel_referencia: number | null
          arancel: number
          arancel_referencia: number | null
          carrera_id: number
          created_at: string | null
          id: number
          matricula: number
          periodo_id: number
        }
        Insert: {
          activo?: boolean
          anio_arancel_referencia?: number | null
          arancel: number
          arancel_referencia?: number | null
          carrera_id: number
          created_at?: string | null
          id?: number
          matricula: number
          periodo_id: number
        }
        Update: {
          activo?: boolean
          anio_arancel_referencia?: number | null
          arancel?: number
          arancel_referencia?: number | null
          carrera_id?: number
          created_at?: string | null
          id?: number
          matricula?: number
          periodo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "simulador_mv_carrera_periodo_valores_carrera_id_fkey"
            columns: ["carrera_id"]
            isOneToOne: false
            referencedRelation: "carreras_uniacc"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulador_mv_carrera_periodo_valores_carrera_id_fkey"
            columns: ["carrera_id"]
            isOneToOne: false
            referencedRelation: "v_carreras_vigentes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulador_mv_carrera_periodo_valores_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "simulador_mv_periodos_ingreso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulador_mv_carrera_periodo_valores_periodo_id_fkey"
            columns: ["periodo_id"]
            isOneToOne: false
            referencedRelation: "v_carreras_vigentes"
            referencedColumns: ["periodo_id"]
          },
        ]
      }
      simulador_mv_periodos_ingreso: {
        Row: {
          activo: boolean
          anio: number
          created_at: string | null
          fecha_fin: string | null
          fecha_inicio: string
          fecha_vigencia_desde: string | null
          fecha_vigencia_hasta: string | null
          id: number
          nombre: string
          semestre: number | null
        }
        Insert: {
          activo?: boolean
          anio: number
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio: string
          fecha_vigencia_desde?: string | null
          fecha_vigencia_hasta?: string | null
          id?: number
          nombre: string
          semestre?: number | null
        }
        Update: {
          activo?: boolean
          anio?: number
          created_at?: string | null
          fecha_fin?: string | null
          fecha_inicio?: string
          fecha_vigencia_desde?: string | null
          fecha_vigencia_hasta?: string | null
          id?: number
          nombre?: string
          semestre?: number | null
        }
        Relationships: []
      }
      validacion_alumno_nuevo: {
        Row: {
          es_alumno_nuevo: boolean
          fecha_validacion: string | null
          id: string
          observaciones: string | null
          prospecto_id: string | null
        }
        Insert: {
          es_alumno_nuevo?: boolean
          fecha_validacion?: string | null
          id?: string
          observaciones?: string | null
          prospecto_id?: string | null
        }
        Update: {
          es_alumno_nuevo?: boolean
          fecha_validacion?: string | null
          id?: string
          observaciones?: string | null
          prospecto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "validacion_alumno_nuevo_prospecto_id_fkey"
            columns: ["prospecto_id"]
            isOneToOne: false
            referencedRelation: "prospectos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_carreras_vigentes: {
        Row: {
          anio_arancel_referencia: number | null
          arancel: number | null
          arancel_referencia: number | null
          codigo_carrera: string | null
          descripcion_programa: string | null
          duracion_programa: string | null
          facultad: string | null
          fecha_vigencia_desde: string | null
          fecha_vigencia_hasta: string | null
          id: number | null
          malla: string | null
          matricula: number | null
          modalidad_programa: string | null
          nivel_academico: string | null
          nombre_programa: string | null
          periodo_anio: number | null
          periodo_fecha_fin: string | null
          periodo_fecha_inicio: string | null
          periodo_id: number | null
          periodo_nombre: string | null
          periodo_semestre: number | null
          requisitos_ingreso: string | null
          version_simulador: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_login:
        | { Args: { p_password: string; p_usu_usuario: string }; Returns: Json }
        | { Args: { p_password: string; p_usu_usuario: string }; Returns: Json }
      generate_jwt_token:
        | { Args: { p_usu_id: number; p_usu_usuario: string }; Returns: string }
        | { Args: { p_usu_id: number; p_usu_usuario: string }; Returns: string }
      get_comunas_por_region: {
        Args: { region: number }
        Returns: {
          comuna_nombre: string
        }[]
      }
      get_regiones_unicas: {
        Args: never
        Returns: {
          region_id: string
          region_nombre: string
        }[]
      }
      obtener_beneficios_por_nivel: {
        Args: { prospecto_uuid: string }
        Returns: {
          codigo_beneficio: number
          descripcion: string
          elegible: boolean
          monto_maximo: number
          porcentaje_maximo: number
          razon_elegibilidad: string
          tipo_beneficio: string
        }[]
      }
      obtiene_apertura_periodo: {
        Args: { p_tipomat: number }
        Returns: {
          ano_apertura: number
          periodo_apertura: number
          periodos_apertura: number
        }[]
      }
      obtiene_arancel_carrera: {
        Args: { p_codcarr: string; p_rut: string }
        Returns: {
          arancel_base: number
          matricula_base: number
          message: string
          status: number
        }[]
      }
      obtiene_carreras: {
        Args: { p_rut: string }
        Returns: {
          codcarr: string
          nombre: string
        }[]
      }
      obtiene_datos_matricula: {
        Args: { p_codcarr: string; p_rut: string }
        Returns: {
          ano_actual: number
          ano_ingreso: number
          periodo_actual: number
          periodo_ingreso: number
          periodos_actual: number
          tipomat: number
        }[]
      }
      puede_simular: { Args: { prospecto_uuid: string }; Returns: boolean }
      verify_jwt_token: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
