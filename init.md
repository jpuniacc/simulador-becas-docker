# Arquitectura Base Vue.js + TypeScript + Tailwind + Shadcn/ui + Supabase

## 🚀 Guía Universal para Nuevos Proyectos

### Prerrequisitos
- Node.js (versión 20.19.0 o superior)
- npm o yarn
- Git

## 🏗️ Crear Nuevo Proyecto

### 1. Crear Proyecto Vue.js Base
```bash
# Crear proyecto Vue con TypeScript
npm create vue@latest mi-proyecto -- --typescript --router --pinia --vitest --eslint

# Navegar al proyecto
cd mi-proyecto

# Instalar dependencias base
npm install
```

### 2. Configurar Tailwind CSS v3 + Shadcn/ui
```bash
# Instalar dependencias base
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0 tailwindcss-animate

# Inicializar Tailwind CSS
npx tailwindcss init -p

# Configurar tailwind.config.js
cat > tailwind.config.js << 'EOF'
import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx,vue}',
    './components/**/*.{ts,tsx,vue}',
    './app/**/*.{ts,tsx,vue}',
    './src/**/*.{ts,tsx,vue}',
    './index.html',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
}
EOF

# Configurar postcss.config.js
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Configurar src/assets/main.css
cat > src/assets/main.css << 'EOF'
@import './base.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

#app {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  font-weight: normal;
}

a,
.green {
  text-decoration: none;
  color: hsla(160, 100%, 37%, 1);
  transition: 0.4s;
  padding: 3px;
}

@media (hover: hover) {
  a:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
}

@media (min-width: 1024px) {
  body {
    display: flex;
    place-items: center;
  }

  #app {
    display: grid;
    grid-template-columns: 1fr 1fr;
    padding: 0 2rem;
  }
}
EOF
```

### 3. Configurar Shadcn/ui
```bash
# Configurar Shadcn/ui
npx shadcn-vue@latest init

# Instalar componentes básicos
npx shadcn-vue@latest add button card input label select textarea
```

### 4. Configurar Supabase (Opcional)
```bash
# Instalar Supabase
npm install @supabase/supabase-js

# Crear archivo de variables de entorno
touch .env.local
```

Editar `.env.local`:
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
```

```bash
# Configurar Supabase
mkdir -p src/lib/supabase
cat > src/lib/supabase/client.ts << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
EOF

# Configurar tipos de Supabase (personalizar según tu esquema)
cat > src/types/supabase.ts << 'EOF'
export interface Database {
  public: {
    Tables: {
      // Define tus tablas aquí
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
  }
}
EOF
```

### 5. Instalar Dependencias Adicionales (Opcional)
```bash
# Utilidades Vue
npm install @vueuse/core

# Iconos
npm install lucide-vue-next

# Otras utilidades
npm install clsx tailwind-merge
```

## 🛠️ Tecnologías Incluidas

- **Frontend**: Vue.js 3 + Vite + TypeScript
- **UI Framework**: Shadcn/ui + Tailwind CSS v3
- **Estado**: Pinia
- **Routing**: Vue Router
- **Backend**: Supabase (opcional)
- **Iconos**: Lucide Vue Next
- **Utilidades**: VueUse
- **Animaciones**: Tailwind CSS Animate

## 📁 Estructura del Proyecto

```
mi-proyecto/
├── src/
│   ├── components/          # Componentes Vue
│   │   ├── ui/             # Componentes de Shadcn/ui
│   │   └── [feature]/      # Componentes específicos por feature
│   ├── stores/             # Stores de Pinia
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilidades
│   ├── lib/                # Librerías y configuraciones
│   │   └── supabase/       # Configuración de Supabase (opcional)
│   └── views/              # Vistas de la aplicación
├── public/                 # Archivos estáticos
├── components.json         # Configuración de Shadcn/ui
├── tailwind.config.js      # Configuración de Tailwind CSS
├── postcss.config.js       # Configuración de PostCSS
└── vite.config.ts          # Configuración de Vite
```

## 🚀 Comandos de Desarrollo

```bash
# Desarrollo
npm run dev

# Construcción para producción
npm run build

# Vista previa de la construcción
npm run preview

# Ejecutar tests
npm run test:unit

# Linting
npm run lint
```

## 🚨 Solución de Problemas Comunes

### Error de PostCSS con Tailwind v4
```bash
# Downgrade a Tailwind v3
npm uninstall tailwindcss @tailwindcss/postcss
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
```

### Error de tailwindcssAnimate
```bash
# Instalar plugin de animaciones
npm install -D tailwindcss-animate
```

### Error de alias de importación
```bash
# Verificar tsconfig.json
cat tsconfig.json
```

### Error de Shadcn/ui existente
```bash
# Eliminar configuración existente
rm -f components.json
npx shadcn-vue@latest init
```

## 📝 Notas de Desarrollo

- **TypeScript estricto** habilitado por defecto
- **Composición API** de Vue 3 en todos los componentes
- **Tailwind CSS v3** para estilos (versión estable)
- **Shadcn/ui** para componentes base reutilizables
- **Pinia** para manejo de estado global
- **Supabase** opcional para backend y autenticación
- **Arquitectura probada** y estable para producción

## 🎯 Casos de Uso Ideales

Esta arquitectura es perfecta para:
- **Aplicaciones web modernas** con UI profesional
- **Dashboards** y paneles de administración
- **Aplicaciones con autenticación** (usando Supabase)
- **Proyectos que requieren** componentes reutilizables
- **Aplicaciones responsive** mobile-first
- **Proyectos que necesitan** TypeScript y tipado estricto

## 🔄 Actualizaciones Futuras

Para mantener la arquitectura actualizada:
1. **Tailwind CSS**: Mantener en v3 hasta que v4 sea estable
2. **Vue.js**: Seguir las versiones LTS
3. **Shadcn/ui**: Actualizar componentes según necesidad
4. **Supabase**: Seguir las actualizaciones oficiales

---

**¡Listo!** Con esta guía puedes crear cualquier proyecto Vue.js moderno con una arquitectura sólida y probada.