# Simulador de Becas UNIACC

Sistema web para simular becas y financiamiento estudiantil de la Universidad UNIACC. Permite a los estudiantes calcular descuentos, becas y opciones de financiamiento disponibles según sus datos personales, académicos y socioeconómicos.

## 🚀 Tecnologías

- **Vue.js 3** - Framework frontend
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Pinia** - Gestión de estado
- **Vue Router** - Enrutamiento
- **PrimeVue** - Componentes UI
- **Shadcn Vue** - Componentes UI adicionales
- **Tailwind CSS** - Estilos
- **Supabase** - Base de datos y backend
- **Axios** - Cliente HTTP
- **Netlify** - Hosting y funciones serverless

## 📋 Requisitos Previos

- Node.js `^20.19.0 || >=22.12.0`
- npm o yarn
- Cuenta de Supabase configurada
- Variables de entorno configuradas

## 🛠️ Instalación

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint

# Tests unitarios
npm run test:unit
```

## Docker (simulador + HubSpot)

Requisitos: Docker Compose v2, red externa `traefik_default`, archivo `.env` (partir de `.env.docker.example`).

```bash
cd /opt/simulador-becas-docker
cp .env.docker.example .env   # solo la primera vez
# Completar al menos: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, HUBSPOT_ACCESS_TOKEN

docker compose up --build -d
```

Servicios:

| Contenedor | Rol |
|------------|-----|
| `simulador-becas` | SPA (Traefik: `simulador-dev.uniacc.cl`) |
| `simulador-hubspot-api` | Backend HubSpot (puerto host `3000` + red Docker) |

Comandos útiles:

```bash
docker compose ps
docker compose logs -f hubspot-api
docker compose restart hubspot-api
curl -s http://127.0.0.1:3000/health
```

El token HubSpot vive solo en el sidecar (`.env` → `HUBSPOT_ACCESS_TOKEN`). No va en variables `VITE_*`.

Detalle: [docs/hubspot-integracion.md](./docs/hubspot-integracion.md).

## Desarrollo local (Vite + backend HubSpot en Docker)

Para no depender de una terminal SSH con `npm start` (se cae al cerrar sesión), levanta el backend con Compose y el front con Vite:

```bash
# Backend HubSpot (queda vivo aunque cierres la sesión)
cd /opt/simulador-becas-docker
docker compose up -d --build hubspot-api

# Frontend
npm install
npm run dev -- --host 0.0.0.0
```

Vite proxea `/api/hubspot-contact` → `http://127.0.0.1:3000` (`VITE_HUBSPOT_PROXY_TARGET` en `.env`).

Alternativa (solo local, se cae al cerrar la terminal):

```bash
cd server/hubspot && npm install && npm start
```

## ⚙️ Configuración de Variables de Entorno

El proyecto utiliza archivos `.env` diferentes según el ambiente. Cada rama tiene su propia configuración:

### Archivos `.env` por rama

#### `.env.production` (Rama MAIN)
```env
VITE_CRM_URL=https://crmadmision.uniacc.cl/webservice/formulario_web.php
VITE_CRM_PROXY_HOSTNAME=simulador.uniacc.cl
```

#### `.env.development` (Rama DEV/localhost)
```env
VITE_CRM_URL=http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php
VITE_CRM_PROXY_HOSTNAME=simuladordev.uniacc.cl
```

#### `.env.qa` (Rama QA)
```env
VITE_CRM_URL=http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php
VITE_CRM_PROXY_HOSTNAME=simuladorqa.uniacc.cl
```

### Configuración en Netlify

Para configurar las variables de entorno en Netlify:

1. Ve a **Site settings** → **Environment variables**
2. Configura según el contexto:

**Production (rama main):**
- `VITE_CRM_URL` = `https://crmadmision.uniacc.cl/webservice/formulario_web.php`
- `VITE_CRM_PROXY_HOSTNAME` = `simulador.uniacc.cl`

**Branch Deploy (rama qa/dev):**
- `VITE_CRM_URL` = `http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php`
- `VITE_CRM_PROXY_HOSTNAME` = `simuladorqa.uniacc.cl` o `simuladordev.uniacc.cl`

**Deploy Preview (PRs):**
- `VITE_CRM_URL` = `http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php`
- `VITE_CRM_PROXY_HOSTNAME` = `simuladordev.uniacc.cl`

## 🔧 Configuración de CORS y CRM

### Desarrollo Local (localhost)

En desarrollo local, se usa un proxy de Vite configurado en `vite.config.ts` que redirige las peticiones a `/crm` hacia el CRM de QA, evitando problemas de CORS.

**Flujo:**
```
localhost → /crm/webservice/formulario_web.php 
         → (proxy Vite) 
         → http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php
```

### Producción (Netlify)

En producción, se usa una Netlify Function (`/.netlify/functions/crm-proxy`) que actúa como proxy para evitar CORS.

**Flujo:**
```
simulador.uniacc.cl → /.netlify/functions/crm-proxy 
                    → (Netlify Function)
                    → https://crmadmision.uniacc.cl/webservice/formulario_web.php
```

La función detecta automáticamente el hostname y usa el endpoint correcto según el ambiente.

## 📁 Estructura del Proyecto

```
simulador-becas/
├── src/
│   ├── components/          # Componentes Vue
│   │   ├── simulador/      # Componentes del simulador
│   │   ├── postgrado/      # Componentes de postgrado
│   │   ├── wizard/         # Componentes del wizard
│   │   └── ui/             # Componentes UI (Shadcn)
│   ├── composables/        # Composables reutilizables
│   │   ├── useCRM.ts       # Integración con CRM
│   │   ├── useProspectos.ts # Gestión de prospectos
│   │   ├── useSimulation.ts # Lógica de simulación
│   │   └── ...
│   ├── stores/             # Stores de Pinia
│   │   ├── simuladorStore.ts
│   │   ├── becasStore.ts
│   │   └── ...
│   ├── types/              # Definiciones TypeScript
│   ├── utils/              # Utilidades
│   │   ├── logger.ts       # Sistema de logging seguro
│   │   ├── formatters.ts   # Formateadores
│   │   └── validation.ts   # Validaciones
│   └── views/              # Vistas principales
├── netlify/
│   └── functions/
│       └── crm-proxy.ts    # Netlify Function para proxy CRM
├── .env.production         # Variables producción
├── .env.development        # Variables desarrollo
├── .env.qa                 # Variables QA
└── vite.config.ts          # Configuración Vite
```

## 🔐 Sistema de Logging Seguro

El proyecto incluye un sistema de logging que ofusca automáticamente datos sensibles antes de mostrarlos en consola.

### Uso del Logger

```typescript
import { logger } from '@/utils/logger'

// Logs genéricos (ofuscan datos sensibles automáticamente)
logger.info('Mensaje', data)
logger.error('Error', error)
logger.warn('Advertencia', data)

// Logs específicos
logger.crm('Enviando al CRM', { crmUrl, data })
logger.prospecto('Insertando prospecto', { form, segmentacion })
logger.formData('Datos del formulario', formData)
```

### Datos Ofuscados

- **RUT**: `15.834.697-4` → `***697-4`
- **Email**: `juan.silva@uniacc.cl` → `ju***@uniacc.cl`
- **Teléfono**: `+56912345678` → `***678`
- **URLs/Endpoints**: `https://crmadmision.uniacc.cl/webservice/formulario_web.php` → `https://crmadmision.uniacc.cl/***`

## 📊 Funcionalidades Principales

### 1. Simulador de Becas (Pregrado)

- **Datos Personales**: Nombre, email, teléfono, RUT/Pasaporte
- **Datos Académicos**: Nivel educativo, colegio, NEM, Ranking, PAES
- **Datos Socioeconómicos**: Ingreso mensual, decil, región, comuna
- **Selección de Carrera**: Búsqueda y selección de carreras disponibles
- **Cálculo de Becas**: Cálculo automático de becas y descuentos aplicables
- **Resultados**: Visualización de aranceles, descuentos y beneficios

### 2. Simulador de Postgrado

- **Datos Personales**: Similar a pregrado
- **Datos de Postgrado**: Carrera título, área de interés, modalidad preferencia
- **Objetivos**: Mejorar habilidades, cambiar carrera, mejorar empleo, etc.

### 3. Filtros Especiales

#### Extranjeros fuera del país

- Si el usuario es extranjero y reside fuera del país:
  - Solo se muestran carreras en modalidad **Online**
  - No se solicitan campos **Ranking de Notas** ni **NEM**
  - Se muestra un mensaje informativo

### 4. Integración con CRM

- Envío automático de datos al CRM cuando hay consentimiento de contacto
- Guardado de respuesta del CRM en la tabla `prospectos`:
  ```json
  {
    "URL_Endpoint_crm": "/.netlify/functions/crm-proxy",
    "codigo_respuesta_crm": 1,
    "descripcion_respuesta": "OK"
  }
  ```

### 5. Vista Mobile

- Vista optimizada para dispositivos móviles (iOS y Android)
- Uso de componentes Shadcn (Accordion, Card) para mejor UX
- Optimizaciones específicas:
  - Touch targets mínimos (44px)
  - Safe area insets para iOS
  - Transparent tap highlight

## 🗄️ Base de Datos (Supabase)

### Tabla `prospectos`

Campos principales:
- Datos personales: `nombre`, `apellido`, `email`, `telefono`, `rut`, `pasaporte`
- Datos académicos: `curso`, `colegio`, `carrera`, `nem`, `ranking`, `paes`
- Datos socioeconómicos: `region`, `comuna`, `decil`, `rango_ingreso`
- Tracking: `url_origen`, `utm_source`, `utm_medium`, `utm_campaign`, etc.
- CRM: `prospecto_crm` (JSON enviado), `respuesta_crm` (JSON respuesta)

### Campos de Tracking

- `url_origen`: URL completa del navegador al momento de insertar el prospecto
- `utm_*`: Parámetros UTM para tracking de campañas
- `gclid`, `fbclid`, `msclkid`, etc.: IDs de tracking de diferentes plataformas

## 🚀 Deployment

### Netlify

El proyecto está configurado para deploy automático en Netlify:

1. **Build command**: `npm run build`
2. **Publish directory**: `dist`
3. **Node version**: `20` (configurado en `netlify.toml`)

### Netlify Functions

- **`crm-proxy`**: Función serverless que actúa como proxy para las peticiones al CRM, evitando problemas de CORS.

## 📝 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo con hot-reload
npm run dev:netlify      # Desarrollo con Netlify Functions local

# Build
npm run build            # Build de producción
npm run build:with-check # Build con type checking
npm run build-only       # Solo build (sin type check)

# Calidad de código
npm run type-check       # Verificar tipos TypeScript
npm run lint             # Linter y auto-fix
npm run test:unit        # Tests unitarios

# Preview
npm run preview          # Preview del build de producción
```

## 🔍 Desarrollo

### IDE Recomendado

- **VSCode** con extensión **Volar** (deshabilitar Vetur)
- TypeScript habilitado para soporte de tipos en `.vue`

### Estructura de Componentes

- **PrimeVue**: Componentes principales (Toast, Input, Select, etc.)
- **Shadcn Vue**: Componentes adicionales (Accordion, Card, etc.)
- **Tailwind CSS**: Estilos y utilidades

### Comentarios en Código

El proyecto utiliza comentarios con formato `// JPS` para documentar modificaciones importantes:

```typescript
// JPS: Descripción de la modificación
// Modificación: Qué se cambió
// Funcionamiento: Cómo funciona
```

## 🧪 Testing

```bash
# Ejecutar tests
npm run test:unit

# Tests en modo watch
npm run test:unit -- --watch
```

## 📚 Documentación Adicional

- `docs/flujo_simulacion.md` - Flujo detallado de la simulación
- `docs/becas_uniacc.md` - Información sobre becas
- `docs/test-crm-proxy.md` - Testing del proxy CRM

## 🤝 Contribución

1. Crear una rama desde `main` o `develop`
2. Realizar cambios y commits
3. Crear un Pull Request
4. Esperar revisión y aprobación

## 📄 Licencia

Proyecto privado de UNIACC

## 👥 Mantenimiento

Para cualquier duda o problema, contactar al equipo de desarrollo.

---

**Última actualización**: Enero 2025
