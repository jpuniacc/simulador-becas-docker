# Atribución de prospectos → HubSpot (simulador)

**Fecha:** 2026-09-01  
**Estado:** Fase 1 implementada en código — pendiente SQL Supabase + properties HS + QA deploy  
**Portal HubSpot:** `51464408`  
**Objetivo confirmado:** Saber **de dónde vino el prospecto** y que quede **guardado en HubSpot**, aunque la URL no traiga UTMs claros.

---

## Problema

La integración actual es **API server-side** (`hubspot-api` → CRM Contacts). Solo persiste origen si el front capturó algo en la URL:

| Señal | ¿Se captura hoy? | ¿Llega a HS? |
|-------|------------------|--------------|
| `utm_*` en URL | Sí, si existen al cargar | Sí → `utm_*_simulador` |
| `gclid` explícito | Sí | Sí → `hs_google_click_id` |
| `_gcl_aw` (Google Ads auto-tag) | **No** | **No** |
| Referrer (Google orgánico, etc.) | **No** | **No** |
| Landing / first touch sin params | **No** | Parcial (`url_origen` al submit) |
| Cookie HubSpot `hubspotutk` | **No** | **No** |
| Journey desde `uniacc.cl` | **No** (subdominio aislado) | **No** |

`useCampaignTracking` **no guarda nada** si la URL no tiene params → prospecto aparece en HS **sin fuente**.

El pilot `prospectos_2` demostró que muchos leads paid tienen `_gcl_aw` en `url_origen` pero `gclid` null en BD.

---

## Solución propuesta (3 capas)

Un solo embed **no basta**. Hace falta **embed + captura en front + enriquecer API**.

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. HubSpot tracking (51464408.js)                               │
│    → cookie hubspotutk, page views, cross-domain uniacc.cl        │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ 2. Captura de sesión (useCampaignTracking ampliado)             │
│    → referrer, landing_page, _gcl_aw→gclid, traffic_type        │
│    → siempre persistir (también sin UTMs)                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│ 3. API al simular (sidecar)                                     │
│    → properties HS: utm_*, organic, referrer, traffic_type      │
│    → contexto: hutk + pageUri (vincula contacto al journey HS)  │
│    → Supabase prospectos (mismos campos)                        │
└─────────────────────────────────────────────────────────────────┘
```

### Capa 1 — HubSpot embed (recomendación Revops)

```html
<script type="text/javascript" id="hs-script-loader" async defer
  src="//js.hs-scripts.com/51464408.js"></script>
```

- Ubicación: `index.html` o tag GTM (decisión con Go Point).
- Cross-domain: activar en portal HS `uniacc.cl` ↔ `simulador.uniacc.cl`.
- SPA: en `router/index.ts`, tras cada navegación:
  ```javascript
  _hsq.push(['setPath', to.fullPath])
  _hsq.push(['trackPageView'])
  ```

**Qué resuelve:** HS conoce la sesión anónima y puede inferir source/campaign al vincular contacto con `hutk`.

### Capa 2 — Captura front (complemento obligatorio para orgánico/directo)

Extender `useCampaignTracking` (diseño ya validado en `prospectos_2`):

| Campo nuevo | Fuente |
|-------------|--------|
| `referrer` | `document.referrer` al primer load |
| `landing_page` | Primera URL de sesión (`sessionStorage`) |
| `gcl_aw` / normalizar `gclid` | Parse URL (`_gcl_aw`, `gad_source`, etc.) |
| `traffic_type` | `paid` \| `organic` \| `social` \| `referral` \| `direct` \| `email` |
| `organic_source` / `organic_medium` | Derivar de referrer si no hay paid |

Regla clave: **`initialize()` siempre persiste sesión**, no solo cuando hay UTMs.

### Capa 3 — Sidecar HubSpot

**Properties** (mapper existente + nuevas):

- Ya mapeadas: `utm_*_simulador`, `hs_google_click_id`, URLs touch, etc.
- Agregar (confirmar nombres con Revops): `referrer_simulador`, `traffic_type_simulador`, `organic_source_simulador`, `landing_page_simulador`.

**Contexto de atribución HS** (nuevo):

Al crear/actualizar contacto, enviar junto al body:

```json
{
  "context": {
    "hutk": "<cookie hubspotutk>",
    "pageUri": "<window.location.href>",
    "pageName": "Simulador UNIACC"
  }
}
```

> Nota técnica: validar con Revops si el upsert actual (CRM v3) acepta `context` o si conviene usar **Submit to Form API** con `hutk` (patrón WordPress). El objetivo es el mismo: que HS asocie el contacto al journey trackeado.

**Supabase:** mismos campos en `prospectos` (migración real post-pilot `prospectos_2`).

---

## Matriz: de dónde viene → qué lo captura

| Origen del visitante | Sin embed | Solo embed | Embed + capa 2 + hutk |
|----------------------|-----------|------------|------------------------|
| Google Ads (`gclid`) | Parcial | Mejor | Completo |
| Google Ads (`_gcl_aw`) | **No** | Parcial | Completo |
| Google orgánico | **No** | Parcial (HS) | Completo (referrer + HS) |
| Link desde uniacc.cl | **No** | Mejor (cross-domain) | Completo |
| Directo / email sin UTM | **No** | Parcial | `direct` / referrer |
| Meta (`fbclid`) | Parcial | Mejor | Completo |

---

## Enfoque recomendado

**Implementación integrada (A):** embed + captura sesión + hutk en sidecar.

No implementar solo el script (enfoque C del doc anterior): el contacto API seguiría sin origen claro en muchos casos.

---

## Plan de validación (QA)

1. Llegar desde Google Ads (con `_gcl_aw`) → simular → contacto HS con source paid.
2. Llegar desde búsqueda orgánica (sin params) → simular → HS muestra orgánico o referrer.
3. Llegar desde `www.uniacc.cl` → clic al simulador → misma sesión HS (cross-domain).
4. Verificar properties custom + timeline del contacto en portal HS.
5. Comparar con fila en `prospectos` / `prospectos_2`.

---

## Riesgos

| Riesgo | Mitigación |
|--------|------------|
| API CRM sin `hutk` | Probar Forms submit o endpoint acordado con Revops |
| Consentimiento tracking | Cargar `51464408.js` según política UNIACC |
| Duplicar GTM vs HS | Roles claros: GTM = eventos; HS = CRM + atribución ads |
| Adblockers | Properties manuales (capa 2) como respaldo |

---

## Alcance fase 1 (MVP atribución)

- [ ] Embed HS en QA
- [ ] `useCampaignTracking` ampliado
- [ ] `hutk` + nuevos campos en DTO y sidecar
- [ ] Properties HS acordadas con Revops
- [ ] Cross-domain en portal HS
- [ ] QA con 3 escenarios (paid, organic, cross-domain)
- [ ] Prod

**Fuera de fase 1:** backfill histórico masivo en `prospectos` (opcional, script ya en pilot).

---

## Aprobación

- [ ] Revops: nombres de properties + método API (`context` vs Forms)
- [ ] Go Point: embed directo vs GTM
- [ ] Legal: consentimiento cookie HS
- [ ] Dev: aprobación diseño integrado

Tras ✅ → `docs/superpowers/plans/2026-09-01-atribucion-hubspot-simulador.md`
