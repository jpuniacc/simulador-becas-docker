#!/usr/bin/env bash
# Aplica migración de atribución en Supabase BaaS (proyecto lxdvlysoiixkrunlzruf).
# Requiere: Supabase CLI logueado en la org correcta, o DATABASE_URL con postgres password.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL_FILE="$ROOT/docs/agregar_campos_atribucion_prospectos.sql"
PROJECT_REF="lxdvlysoiixkrunlzruf"

echo "==> Migración atribución prospectos ($PROJECT_REF)"

if [[ -n "${DATABASE_URL:-}" ]]; then
  echo "Usando DATABASE_URL..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
  echo "OK (psql)"
  exit 0
fi

if command -v supabase >/dev/null 2>&1; then
  if supabase projects list 2>/dev/null | grep -q "$PROJECT_REF"; then
    echo "Usando Supabase CLI..."
    supabase db execute --project-ref "$PROJECT_REF" -f "$SQL_FILE"
    echo "OK (supabase cli)"
    exit 0
  fi
fi

echo "No se pudo aplicar automáticamente."
echo "Opciones:"
echo "  1) Supabase Dashboard → SQL Editor → pegar: $SQL_FILE"
echo "  2) export DATABASE_URL='postgresql://postgres.[ref]:[password]@...' && $0"
echo "  3) MCP Supabase: autenticar con la org que contiene $PROJECT_REF"
exit 1
