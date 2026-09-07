# Properties HubSpot — atribución simulador (para crear en portal)

Portal: **51464408**  
Objeto: **Contact**  
Tipo recomendado: **Single-line text** (todos)

Crear en: **Settings → Properties → Contact properties → Create property**

En cada property, copia el **Label**, **Internal name** y **Description** de la tabla.

---

## Tabla para RevOps

| Internal name | Label (nombre visible) | Descripción detallada (para dummies) |
|---------------|------------------------|--------------------------------------|
| `traffic_type_simulador` | Traffic type simulador | **¿De qué “tipo” de visita llegó el prospecto al simulador?** Clasificación automática hecha por el simulador al cargar la página. Valores posibles: `paid` (publicidad pagada, ej. Google/Meta Ads), `organic` (búsqueda orgánica, sin pago), `social` (red social), `referral` (llegó desde otro sitio web), `email` (campaña de correo), `direct` (entró directo, sin referrer ni campaña). Útil para reportes: “¿cuántos leads vienen de ads vs orgánico?” |
| `referrer_simulador` | Referrer simulador | **¿Desde qué página web venía el usuario justo antes de abrir el simulador?** Es el “referrer” del navegador (`document.referrer`): la URL de la página anterior. Ejemplos: `https://www.google.cl/...` si buscó en Google, `https://www.uniacc.cl/...` si hizo clic desde el sitio principal, o vacío si abrió el link directo. No es la URL del simulador; es **el sitio de origen inmediato**. |
| `gcl_aw_simulador` | GCL AW simulador | **Identificador crudo de Google Ads cuando la URL trae auto-tagging.** Google a veces no pone `gclid` en la URL visible, sino el parámetro `_gcl_aw` (formato típico: `GCL.1735689600.xxxxx`). El simulador guarda ese valor aquí para auditoría y para cruzar con Google Ads aunque no haya UTM en la URL. Si solo existe `_gcl_aw`, el simulador también lo usa como click ID de Google. |
| `landing_page_simulador` | Landing page simulador | **Primera URL completa del simulador que el usuario abrió en esa sesión** (incluye parámetros de campaña si los tenía). Ejemplo: `https://simulador.uniacc.cl/simulador?utm_source=google&gclid=...`. Sirve para ver exactamente con qué link entró, no solo el dominio. Se guarda en la primera visita de la sesión y no cambia si navega dentro del simulador. |
| `organic_source_simulador` | Organic source simulador | **Nombre de la fuente “orgánica” inferida** cuando el tráfico no viene marcado como pago. Ejemplos: `google`, `bing`, `facebook`, `www.uniacc.cl`. Se deduce del referrer o de UTMs (`utm_source` con medium organic). Ayuda a distinguir “Google orgánico” vs “llegó desde uniacc.cl” cuando no hay `gclid` ni ads. |
| `organic_medium_simulador` | Organic medium simulador | **Cómo se clasificó el canal “orgánico” inferido.** Valores típicos: `organic` (buscador sin pago), `social` (red social sin campaña paid clara), `referral` (otro sitio web). Complementa `organic_source_simulador`: source = “quién”, medium = “tipo de canal”. Ejemplo: source `google` + medium `organic` = búsqueda Google no pagada. |
| `hutk_simulador` | HubSpot UTK simulador | **Cookie de seguimiento de HubSpot (`hubspotutk`) del visitante en el simulador.** Es el “ID de sesión” que HubSpot usa para unir la visita web con el contacto al crear/actualizar el lead. Permite que HubSpot atribuya la conversión al historial de páginas vistas en el simulador. Si el usuario tiene bloqueador de anuncios, este campo puede quedar vacío. |
| `adgroup_id_simulador` | Adgroup ID (Simulador) | **ID del grupo de anuncios de Google Ads que trajo al prospecto.** Lo entrega ValueTrack como `{adgroupid}` y llega en la URL como `adgroup_id` o `hsa_grp`. Es un número, ej. `178234567890`. Junto con `campaign_id_simulador` y `ad_id_simulador` permite bajar el reporte a nivel de grupo de anuncios. Queda vacío en campañas de video/Demand Gen que no lo envían. |

> `campaign_id_simulador` y `ad_id_simulador` **ya existen** en el portal. La única pendiente
> de crear es `adgroup_id_simulador` (el token de la integración no tiene scope
> `crm.schemas.contacts.write`, así que debe crearla RevOps a mano).

---

## Properties nativas de HubSpot (no crear — ya existen)

| Internal name | Uso en simulador |
|---------------|------------------|
| `hs_google_click_id` | Click ID de Google (`gclid` o valor derivado de `_gcl_aw`) |
| `hs_facebook_click_id` | `fbclid` de Meta |
| `hs_tiktok_click_id` | `ttclid` de TikTok |
| `hs_linkedin_click_id` | `li_fat_id` de LinkedIn |
| `utm_source_simulador` … `utm_content_simulador` | UTMs si ya existen en el portal RevOps |
| `first_touch_url_simulador` / `last_touch_url_simulador` | URLs de primer y último toque en el journey del simulador |
| `url_origen_simulador` | URL en el momento del envío del formulario |

---

## Texto listo para pegar en “Description” de HubSpot (uno por property)

### traffic_type_simulador

```
Clasificación automática del tipo de tráfico al entrar al simulador de becas UNIACC. Valores: paid (ads), organic (buscador sin pago), social, referral (otro sitio), email, direct (sin origen claro). Generado por el simulador; no editar manualmente salvo corrección.
```

### referrer_simulador

```
URL de la página web desde la que el usuario llegó al simulador (referrer del navegador). Ej.: Google, uniacc.cl u otro dominio. Vacío si abrió el link directo. Capturado al cargar el simulador.
```

### gcl_aw_simulador

```
Valor del parámetro _gcl_aw de Google Ads (auto-tagging) en la URL de entrada. Formato típico GCL.timestamp.token. Se guarda para auditoría y atribución cuando no hay gclid visible en la URL.
```

### landing_page_simulador

```
Primera URL completa del simulador que el usuario abrió en la sesión (con query string de campaña si existía). No cambia al navegar pasos internos del wizard.
```

### organic_source_simulador

```
Fuente inferida para tráfico no pagado: google, bing, facebook, uniacc.cl, etc. Derivada del referrer o UTMs. Complementa traffic_type cuando el lead no trae gclid/fbclid.
```

### organic_medium_simulador

```
Medio inferido del tráfico orgánico/referido: organic, social, referral. Indica el tipo de canal junto con organic_source_simulador.
```

### hutk_simulador

```
Valor de la cookie hubspotutk del visitante en el simulador. Permite a HubSpot vincular el contacto con la sesión de tracking web. Puede estar vacío si el usuario bloquea scripts de HubSpot.
```

### adgroup_id_simulador

```
ID del grupo de anuncios de Google Ads (ValueTrack {adgroupid}). Llega en la URL como adgroup_id o hsa_grp. Complementa campaign_id_simulador y ad_id_simulador para reportar a nivel de grupo de anuncios. Vacío en campañas de video y Demand Gen que no lo envían.
```

---

## Checklist post-creación

- [ ] Las 7 properties existen con **internal name** exacto (minúsculas, guiones bajos).
- [ ] Reprobar simulación con consentimiento → HTTP 200/201 en `/api/hubspot-contact`.
- [ ] Contacto en HubSpot muestra los campos poblados.
- [ ] `prospectos.hubspot_contact_id` ya no es `null` tras envío OK.

Ver URLs de prueba: `docs/urls-prueba-atribucion-dev.md`
