# URLs de prueba — atribución (simulador-dev)

Base: **`https://simulador-dev.uniacc.cl/simulador`**

Antes de cada prueba (consola del navegador):

```javascript
localStorage.removeItem('simulador-campaign-data')
sessionStorage.removeItem('simulador-landing-page')
location.reload()
```

Verificar después de cargar:

```javascript
JSON.parse(localStorage.getItem('simulador-campaign-data') || '{}')
```

| Campo esperado | Significado |
|----------------|-------------|
| `traffic_type` | `paid` \| `organic` \| `social` \| `referral` \| `direct` \| `email` |
| `gcl_aw` / `gclid` | Google Ads |
| `fbclid` | Meta |
| `msclkid` | Microsoft Ads |
| `landing_page` | URL completa de entrada |

> **HubSpot `hubspotutk`:** desactivar adblock en esta prueba. Si `ERR_BLOCKED_BY_CLIENT`, el resto de atribución igual persiste en localStorage/Supabase.

---

## Taxonomía UTM Marketing (source / medium)

El simulador clasifica `traffic_type` con estos mediums:

| Canal | utm_source | utm_medium | traffic_type |
|-------|------------|------------|--------------|
| Google Search Ads | google | cpc | paid |
| Google PMax | google | pmax | paid |
| Google Demand Gen | google | demand_gen | paid |
| Facebook Ads | facebook | paid_social | paid |
| Instagram Ads | instagram | paid_social | paid |
| TikTok Ads | tiktok | paid_social | paid |
| YouTube Ads | youtube | paid_video | paid |
| Instagram orgánico | instagram | organic_social | social |
| Facebook orgánico | facebook | organic_social | social |
| YouTube orgánico | youtube | organic_video | social |
| Google búsqueda orgánica | google | organic | organic |

Ejemplos:

```
https://simulador-dev.uniacc.cl/simulador?utm_source=google&utm_medium=pmax&utm_campaign=pmax_admision
https://simulador-dev.uniacc.cl/simulador?utm_source=facebook&utm_medium=paid_social&utm_campaign=retargeting&fbclid=IwAR0test
https://simulador-dev.uniacc.cl/simulador?utm_source=instagram&utm_medium=organic_social
```

---

## Google Ads — `_gcl_aw` (auto-tagging)

Formato real: `GCL.{timestamp}.{token}`

```
https://simulador-dev.uniacc.cl/simulador?_gcl_aw=GCL.1735689600.Cj0KCQiAtestSimuladorUNIACC
```

Esperado: `traffic_type: "paid"`, `gcl_aw` y `gclid` con el mismo valor.

---

## Google Ads — `gclid` + UTMs

```
https://simulador-dev.uniacc.cl/simulador?utm_source=google&utm_medium=cpc&utm_campaign=admision_2026&utm_term=becas+uniacc&utm_content=anuncio_a&gclid=CjwKCAiAtest123456789
```

Esperado: `traffic_type: "paid"`, UTMs poblados.

---

## Google Ads — Performance Max / iOS

```
https://simulador-dev.uniacc.cl/simulador?gbraid=0AAAAAtest-gbraid-123&gad_source=1
```

```
https://simulador-dev.uniacc.cl/simulador?wbraid=0BBBBBtest-wbraid-456&gad_source=1
```

Esperado: `traffic_type: "paid"`.

---

## Meta / Facebook Ads

```
https://simulador-dev.uniacc.cl/simulador?utm_source=facebook&utm_medium=paid&utm_campaign=retargeting_marzo&fbclid=IwAR0testFbClid123456789
```

Esperado: `traffic_type: "paid"`, `fbclid` presente.

---

## Microsoft / Bing Ads

```
https://simulador-dev.uniacc.cl/simulador?utm_source=bing&utm_medium=cpc&utm_campaign=search_brand&msclkid=abc123def456-msclkid-test
```

Esperado: `traffic_type: "paid"`.

---

## TikTok Ads

```
https://simulador-dev.uniacc.cl/simulador?utm_source=tiktok&utm_medium=paid&utm_campaign=gen_z&ttclid=ttclid_test_789012
```

Esperado: `traffic_type: "paid"`.

---

## LinkedIn Ads

```
https://simulador-dev.uniacc.cl/simulador?utm_source=linkedin&utm_medium=cpc&utm_campaign=profesionales&li_fat_id=li_fat_test_456
```

Esperado: `traffic_type: "paid"`.

---

## Email marketing

```
https://simulador-dev.uniacc.cl/simulador?utm_source=newsletter&utm_medium=email&utm_campaign=bienvenida_marzo&utm_content=cta_simular
```

Esperado: `traffic_type: "email"`.

---

## Referral / campaña interna

```
https://simulador-dev.uniacc.cl/simulador?utm_source=uniacc.cl&utm_medium=referral&utm_campaign=banner_home
```

Esperado: `traffic_type: "referral"`.

---

## Orgánico (UTM simulado)

```
https://simulador-dev.uniacc.cl/simulador?utm_source=google&utm_medium=organic
```

Esperado: `traffic_type: "organic"`.

> Orgánico **real** (sin UTMs): entrar desde un link en otra web (ej. buscar en Google y hacer clic). Se usa `document.referrer`.

---

## Directo (sin parámetros)

```
https://simulador-dev.uniacc.cl/simulador
```

Esperado: `traffic_type: "direct"` (sin referrer externo).

---

## IDs de campaña / anuncio

```
https://simulador-dev.uniacc.cl/simulador?utm_source=google&utm_medium=cpc&campaign_id=123456789&ad_id=987654321
```

---

## Combinado (caso realista Google Ads)

```
https://simulador-dev.uniacc.cl/simulador?utm_source=google&utm_medium=cpc&utm_campaign=pregrado_2026&utm_term=simulador+becas&_gcl_aw=GCL.1735689600.AbCdEfGhIjKlMnOpQrSt&gad_source=1
```

---

## Plantillas ValueTrack propuestas por Marketing

### Campaña 1 — Demand Gen (ID 23980021855)

`{keyword}` llega vacío en Demand Gen; el simulador lo descarta en vez de guardar `""`.

```
https://simulador-dev.uniacc.cl/simulador?utm_source=google&utm_medium=demand_gen&utm_campaign=simulador_general&utm_term=&utm_id=23980021855&campaign_id=23980021855&adgroup_id=178234567890&ad_id=712345678901&hsa_acc=7495669679&hsa_cam=23980021855&hsa_grp=178234567890&hsa_ad=712345678901&hsa_src=x&hsa_tgt=&hsa_kw=&hsa_mt=&hsa_net=adwords&hsa_ver=3
```

Esperado: `traffic_type: "paid"`, `utm_term` ausente, `campaign_id`/`adgroup_id`/`ad_id` poblados.

### Campaña 2 — YouTube Video Reach (ID 24013030977)

```
https://simulador-dev.uniacc.cl/simulador?utm_source=youtube&utm_medium=paid_video&utm_campaign=simulador_video_reach&utm_id=24013030977&campaign_id=24013030977&ad_id=712345678901&gclid=Cj0KCQiAtestYouTube&hsa_acc=7495669679&hsa_net=adwords&hsa_ver=3
```

Esperado: `utm_source: "youtube"` (el `gclid` no lo sobrescribe) y `traffic_type: "paid"`.

### Plantilla legacy sin cambios (normalización)

```
https://simulador-dev.uniacc.cl/simulador?utm_source=adwords&utm_medium=ppc&utm_id=23980021855&hsa_grp=178234567890&hsa_ad=712345678901
```

Esperado: `utm_source: "google"`, `utm_medium: "cpc"`, y `campaign_id`/`adgroup_id`/`ad_id`
capturados desde los alias `utm_id`/`hsa_*` aunque la plantilla no se haya corregido.

---

## Tras completar simulación (consentimiento OK)

En consola deberían aparecer:

- `[useCRM] POST HubSpot` → `dto` con `referrer`, `traffic_type`, `gcl_aw`, `hubspot_context`
- `[HubSpot] properties enviadas:` → properties del sidecar
- `[dataLayer] registro_confirmado_servidor`

Verificar en Supabase tabla `prospectos`: columnas `referrer`, `traffic_type`, `gcl_aw`, etc.
