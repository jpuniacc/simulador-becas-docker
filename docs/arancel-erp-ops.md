# Aranceles desde ERP

Los montos de `carreras_uniacc` se actualizan desde ERP vía:

1. ETL `integracion-umas` → Supabase **local** `mnp_mt_arancel`
2. `uniacc-api` `POST /api/simulador/aranceles/sync` → este proyecto (supabase.com)

Ops detalladas: `/opt/uniacc-api-docker/docs/simulador-arancel-ops.md`  
Plan: `docs/superpowers/plans/2026-08-10-arancel-erp-simulador.md`
