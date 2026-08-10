#!/bin/bash

# =====================================================
# SCRIPT DE VERIFICACIÓN DE COMPONENTES SHADCN/UI
# =====================================================

echo "🔍 Verificando componentes Shadcn/ui instalados..."
echo "=================================================="

# Directorio de componentes
COMPONENTS_DIR="src/components/ui"

# Lista de componentes requeridos para el simulador
REQUIRED_COMPONENTS=(
    "button"
    "input" 
    "label"
    "select"
    "textarea"
    "checkbox"
    "radio-group"
    "switch"
    "slider"
    "date-picker"
    "card"
    "tabs"
    "stepper"
    "breadcrumb"
    "navigation-menu"
    "table"
    "badge"
    "progress"
    "alert"
    "tooltip"
    "popover"
    "dialog"
    "sheet"
    "toast"
    "alert-dialog"
    "loading-spinner"
    "skeleton"
)

# Función para verificar si un componente existe
check_component() {
    local component=$1
    local component_dir="$COMPONENTS_DIR/$component"
    
    if [ -d "$component_dir" ]; then
        echo "✅ $component - Instalado"
        return 0
    else
        echo "❌ $component - Faltante"
        return 1
    fi
}

# Verificar componentes existentes
echo "📋 Estado actual de componentes:"
echo ""

missing_components=()
installed_components=()

for component in "${REQUIRED_COMPONENTS[@]}"; do
    if check_component "$component"; then
        installed_components+=("$component")
    else
        missing_components+=("$component")
    fi
done

echo ""
echo "📊 Resumen:"
echo "==========="
echo "✅ Instalados: ${#installed_components[@]}"
echo "❌ Faltantes: ${#missing_components[@]}"

if [ ${#missing_components[@]} -gt 0 ]; then
    echo ""
    echo "🚀 Componentes a instalar:"
    echo "=========================="
    for component in "${missing_components[@]}"; do
        echo "npx shadcn-vue@latest add $component"
    done
    
    echo ""
    echo "📝 Comando para instalar todos los faltantes:"
    echo "============================================="
    echo "npx shadcn-vue@latest add ${missing_components[*]}"
fi

echo ""
echo "🎯 Componentes específicos del simulador:"
echo "========================================="
echo "Estos componentes necesitarán ser creados manualmente:"
echo "- SimuladorForm.vue"
echo "- ResultadosSimulacion.vue" 
echo "- BeneficioCard.vue"
echo "- ProgressStepper.vue"
echo "- DatosPersonales.vue"
echo "- DatosAcademicos.vue"
echo "- DatosSocioeconomicos.vue"
echo "- DatosPAES.vue"
echo "- ResumenFinanciero.vue"
echo "- ComparadorBeneficios.vue"

echo ""
echo "✨ Verificación completada!"
