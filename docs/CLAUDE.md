# Configuración de Claude Code

Este archivo contiene la configuración para que Claude Code entienda mejor y trabaje con este proyecto.

## Descripción del Proyecto
Aplicación Vue.js para simulador académico de UNIACC con TypeScript, Tailwind CSS e integración con Supabase.

## Scripts Principales
- `npm run dev` - Iniciar servidor de desarrollo
- `npm run build` - Compilar para producción
- `npm run lint` - Ejecutar ESLint
- `npm run type-check` - Ejecutar verificación de tipos TypeScript
- `npm run test` - Ejecutar pruebas

## Arquitectura
- **Frontend**: Vue 3 con Composition API
- **Estilos**: Tailwind CSS con componentes shadcn/ui
- **Gestión de Estado**: Stores de Pinia
- **Base de Datos**: Supabase
- **Herramienta de Build**: Vite
- **Testing**: Vitest

## Directorios Principales
- `src/components/` - Componentes Vue
- `src/views/` - Vistas/páginas Vue
- `src/stores/` - Stores de Pinia
- `src/composables/` - Composables de Vue
- `src/types/` - Definiciones de tipos TypeScript
- `docs/` - Documentación del proyecto

## Notas de Desarrollo
- Utiliza formulario multi-paso estilo wizard para simulación académica
- Se integra con la base de datos académica de UNIACC
- Maneja datos de estudiantes, becas y recomendaciones de programas