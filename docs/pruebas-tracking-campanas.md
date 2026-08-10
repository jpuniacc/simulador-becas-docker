# 🧪 Pruebas de Tracking de Campañas y JSON Dinámico

## ⚠️ NOTA IMPORTANTE: Cómo Probar URLs

**Algunos sistemas operativos (especialmente macOS) pueden interpretar ciertos parámetros de URL como protocolos cuando se copian/pegan.** Si al copiar una URL te redirige a DuckDuckGo u otro sitio:

1. **Escribe la URL directamente en la barra de direcciones** (método recomendado)
2. O usa la consola del navegador: `window.location.href = 'URL_AQUI'`
3. O consulta `docs/urls-prueba-tracking.md` para más métodos

## 📋 Lista de Pruebas

### **Fase 1: Pruebas Locales (DEV)**

#### ✅ 1.1 Pruebas de Captura de Parámetros UTM

- [X] **Prueba 1.1.1**: Captura de parámetros UTM básicos

  - URL: `http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=test2024`
  - Verificar en consola: `localStorage.getItem('simulador-campaign-data')`
  - Verificar que se capturen: `utm_source`, `utm_medium`, `utm_campaign`
  - **Resultado esperado**: JSON con los 3 parámetros UTM en localStorage
- [X] **Prueba 1.1.2**: Captura de todos los parámetros UTM

  - URL: `http://localhost:5173/?utm_source=facebook&utm_medium=social&utm_campaign=becas2024&utm_term=becas&utm_content=ad1`
  - Verificar que se capturen los 5 parámetros UTM
  - **Resultado esperado**: JSON completo con todos los parámetros
- [X] **Prueba 1.1.3**: Captura de parámetros personalizados

  - URL: `http://localhost:5173/?campaign_id=CAMP001&ad_id=AD123`
  - Verificar que se capturen los parámetros personalizados
  - **Resultado esperado**: JSON con `campaign_id` y `ad_id`

#### ✅ 1.2 Pruebas de Click IDs de Plataformas

- [X] **Prueba 1.2.1**: Google Ads (gclid)

  - URL: `http://localhost:5173/?utm_source=google&gclid=EAIaIQobChMI1234567890`
  - Verificar captura de `gclid`
  - **Resultado esperado**: JSON con `gclid` presente
- [X] **Prueba 1.2.2**: Facebook Ads (fbclid)

  - URL: `http://localhost:5173/?utm_source=facebook&fbclid=IwAR1234567890`
  - Verificar captura de `fbclid`
  - **Resultado esperado**: JSON con `fbclid` presente
- [X] **Prueba 1.2.3**: Microsoft Ads (msclkid)

  - URL: `http://localhost:5173/?utm_source=microsoft&msclkid=7890123456`
  - Verificar captura de `msclkid`
  - **Resultado esperado**: JSON con `msclkid` presente
- [X] **Prueba 1.2.4**: TikTok Ads (ttclid)

  - URL: `http://localhost:5173/?utm_source=tiktok&ttclid=3456789012`
  - **⚠️ IMPORTANTE**: Escribir URL directamente en la barra de direcciones (NO copiar/pegar - puede redirigir a DuckDuckGo)
  - Verificar captura de `ttclid` en los logs de consola
  - Verificar en localStorage: `JSON.parse(localStorage.getItem('simulador-campaign-data')).ttclid`
  - **Resultado esperado**: JSON con `ttclid` presente
- [X] **Prueba 1.2.5**: LinkedIn Ads (li_fat_id)

  - URL: `http://localhost:5173/?utm_source=linkedin&li_fat_id=5678901234`
  - Verificar captura de `li_fat_id`
  - **Resultado esperado**: JSON con `li_fat_id` presente

#### ✅ 1.3 Pruebas de Persistencia (localStorage)

- [X] **Prueba 1.3.1**: Persistencia entre navegaciones

  - Paso 1: Abrir con UTM: `http://localhost:5173/?utm_source=google&utm_medium=cpc`
  - Paso 2: Navegar a otra página sin parámetros
  - Paso 3: Verificar que los datos persistan en localStorage
  - **Resultado esperado**: Datos UTM aún presentes después de navegación
- [X] **Prueba 1.3.2**: First Touch vs Last Touch

  - Paso 1: Visita inicial con `?utm_source=facebook`
  - Paso 2: Segunda visita con `?utm_source=google`
  - Verificar que `first_touch_url` sea de Facebook
  - Verificar que `last_touch_url` sea de Google
  - **Resultado esperado**: First touch preservado, last touch actualizado
- [X] **Prueba 1.3.3**: Expiración de datos (30 días)

  - Modificar manualmente `expiresAt` en localStorage a una fecha pasada
  - Refrescar página
  - Verificar que los datos se eliminen automáticamente
  - **Resultado esperado**: localStorage vacío después de expiración

#### ✅ 1.4 Pruebas de Integración con Store

- [X] **Prueba 1.4.1**: Inicialización en simuladorStore

  - Abrir con UTM: `http://localhost:5173/?utm_source=test`
  - Verificar en consola que `formData` contenga los parámetros UTM
  - **Resultado esperado**: `formData.utm_source === 'test'`
- [X] **Prueba 1.4.2**: Datos disponibles en el formulario ✅

  - Completar el simulador con parámetros UTM
  - Verificar que los datos estén disponibles cuando se guarda el prospecto
  - **Resultado esperado**: Los UTM están en `formData` al completar
  - **Resultado**: ✅ Confirmado en Supabase - Los parámetros UTM se guardan correctamente

### **Fase 2: Pruebas de JSON Dinámico**

#### ✅ 2.1 Verificación de JSON Enviado al CRM

- [X] **Prueba 2.1.1**: JSON mínimo (sin parámetros de campaña)

  - Abrir sin parámetros UTM
  - Completar formulario y enviar
  - Verificar en consola el JSON enviado (`console.log('data CRM', data)`)
  - **Resultado esperado**: JSON sin campos de campaña (solo campos obligatorios)
- [X] **Prueba 2.1.2**: JSON con parámetros UTM básicos

  - URL: `http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=test`
  - Completar formulario y enviar
  - Verificar JSON enviado
  - **Resultado esperado**: JSON incluye solo `utm_source`, `utm_medium`, `utm_campaign`
- [X] **Prueba 2.1.3**: JSON con Google Ads completo

  - URL: `http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=summer&gclid=TEST123&utm_term=becas`
  - Completar formulario y enviar
  - Verificar JSON enviado
  - **Resultado esperado**: JSON incluye UTM + `gclid`, sin campos vacíos
- [X] **Prueba 2.1.4**: JSON con Facebook Ads completo

  - URL: `http://localhost:5173/?utm_source=facebook&utm_medium=social&fbclid=TEST456&campaign_id=CAMP001`
  - Completar formulario y enviar
  - Verificar JSON enviado
  - **Resultado esperado**: JSON incluye parámetros relevantes, sin campos undefined
- [X] **Prueba 2.1.5**: JSON con múltiples plataformas

  - URL: `http://localhost:5173/?utm_source=google&gclid=G123&fbclid=F456&msclkid=M789`
  - Completar formulario y enviar
  - Verificar que se incluyan todos los click IDs presentes
  - **Resultado esperado**: JSON con todos los click IDs capturados

#### ✅ 2.2 Verificación de Campos Obligatorios

- [X] **Prueba 2.2.1**: Campos obligatorios siempre presentes

  - Enviar con y sin parámetros UTM
  - Verificar que siempre incluyan: `nombre`, `primerApellido`, `segundoApellido`, `email`, `rut`, `telefono`, `carrera`, `origen`, `User_Agent`
  - **Resultado esperado**: Campos obligatorios presentes en ambos casos
- [X] **Prueba 2.2.2**: Formato de datos obligatorios

  - Verificar formato de RUT (con puntos y guión)
  - Verificar formato de teléfono (con +56)
  - Verificar formato de código de carrera
  - **Resultado esperado**: Todos los campos con formato correcto

#### ✅ 2.3 Verificación de Exclusion de Campos Vacíos

- [X] **Prueba 2.3.1**: No incluir campos undefined

  - Enviar sin parámetros UTM
  - Verificar que el JSON no tenga campos como `utm_source: undefined`
  - **Resultado esperado**: JSON sin campos undefined
- [X] **Prueba 2.3.2**: No incluir campos null

  - Verificar que campos null no se incluyan
  - **Resultado esperado**: JSON sin campos null
- [X] **Prueba 2.3.3**: No incluir strings vacíos en campaña

  - Verificar que `utm_source: ""` no se incluya
  - **Resultado esperado**: JSON sin campos de campaña con strings vacíos

### **Fase 3: Pruebas de Guardado en Supabase**

#### ✅ 3.1 Verificación de Guardado de Prospecto

- [X] **Prueba 3.1.1**: Guardado con parámetros UTM

  - Completar formulario con UTM
  - Verificar en Supabase que los campos UTM se guarden correctamente
  - **Resultado esperado**: Campos UTM presentes en tabla `prospectos`
- [X] **Prueba 3.1.2**: Guardado sin parámetros UTM

  - Completar formulario sin UTM
  - Verificar en Supabase que los campos UTM sean NULL
  - **Resultado esperado**: Campos UTM como NULL (no undefined)
- [X] **Prueba 3.1.3**: Guardado del JSON completo en prospecto_crm

  - Completar formulario con varios parámetros de campaña
  - Verificar en Supabase el campo `prospecto_crm`
  - **Resultado esperado**: JSON completo guardado correctamente

#### ✅ 3.2 Verificación de Touch Points

- [X] **Prueba 3.2.1**: Guardado de first_touch_url

  - Primera visita con UTM
  - Verificar en Supabase campo `first_touch_url`
  - **Resultado esperado**: URL completa de primera visita guardada
- [X] **Prueba 3.2.2**: Guardado de last_touch_url

  - Múltiples visitas con diferentes UTM
  - Verificar que `last_touch_url` sea la última visita
  - **Resultado esperado**: URL de última interacción guardada
- [X] **Prueba 3.2.3**: Timestamps correctos

  - Verificar formato ISO 8601 de `first_touch_timestamp` y `last_touch_timestamp`
  - **Resultado esperado**: Timestamps en formato correcto

### **Fase 4: Pruebas de Envío al CRM**

#### ✅ 4.1 Pruebas de Endpoint

- [X] **Prueba 4.1.1**: Envío exitoso al CRM (DEV)

  - Enviar desde localhost
  - Verificar que llegue al endpoint correcto (proxy Vite)
  - Verificar respuesta del CRM
  - **Resultado esperado**: Respuesta 200 con datos procesados
- [X] **Prueba 4.1.2**: JSON recibido en CRM

  - Revisar logs del backend del CRM
  - Verificar que reciba el JSON dinámico correctamente
  - **Resultado esperado**: CRM recibe JSON con solo campos presentes
- [X] **Prueba 4.1.3**: Manejo de campos opcionales en CRM

  - Enviar con diferentes combinaciones de parámetros
  - Verificar que el CRM procese correctamente campos opcionales
  - **Resultado esperado**: CRM procesa JSON sin errores

#### ✅ 4.2 Pruebas de Consentimiento

- [X] **Prueba 4.2.1**: Sin consentimiento no se envía

  - Completar formulario sin marcar consentimiento
  - Verificar que no se haga petición al CRM
  - **Resultado esperado**: No hay petición HTTP al CRM
- [X] **Prueba 4.2.2**: Con consentimiento se envía

  - Completar formulario con consentimiento marcado
  - Verificar que se haga petición al CRM
  - **Resultado esperado**: Petición HTTP exitosa al CRM

### **Fase 5: Pruebas de Escenarios Reales**

#### ✅ 5.1 Escenarios de Campañas

- [X] **Prueba 5.1.1**: Campaña de Google Ads

  - URL completa: `http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=verano2024&utm_term=becas&utm_content=ad1&gclid=EAIaIQobChMI...`
  - Completar flujo completo
  - Verificar JSON final
  - **Resultado esperado**: Todos los parámetros de Google Ads presentes
- [X] **Prueba 5.1.2**: Campaña de Facebook Ads

  - URL: `http://localhost:5173/?utm_source=facebook&utm_medium=social&utm_campaign=becas&fbclid=IwAR...`
  - Completar flujo completo
  - Verificar JSON final
  - **Resultado esperado**: Parámetros de Facebook presentes
- [X] **Prueba 5.1.3**: Campaña de Email Marketing

  - URL: `http://localhost:5173/?utm_source=newsletter&utm_medium=email&utm_campaign=monthly`
  - Completar flujo completo
  - Verificar JSON final
  - **Resultado esperado**: Parámetros de email presentes
- [X] **Prueba 5.1.4**: Tráfico directo (sin parámetros)

  - URL: `http://localhost:5173/` (sin parámetros)
  - Completar flujo completo
  - Verificar JSON final
  - **Resultado esperado**: Solo campos obligatorios, sin campos de campaña

#### ✅ 5.2 Pruebas de Múltiples Visitas

- [X] **Prueba 5.2.1**: Usuario con primera visita de Facebook, segunda de Google
  - Visita 1: Con `utm_source=facebook`
  - Visita 2: Con `utm_source=google`
  - Completar en segunda visita
  - Verificar que `first_touch_url` sea de Facebook
  - Verificar que `last_touch_url` sea de Google
  - **Resultado esperado**: First touch preservado, last touch actualizado

### **Fase 6: Pruebas en QA (simuladorqa.uniacc.cl)**

#### ✅ 6.1 Pruebas de Ambiente QA

- [ ] **Prueba 6.1.1**: Captura de parámetros en QA

  - Abrir `https://simuladorqa.uniacc.cl/?utm_source=test&utm_medium=qa`
  - Verificar captura correcta
  - **Resultado esperado**: Parámetros capturados igual que en DEV
- [ ] **Prueba 6.1.2**: Envío al CRM desde QA

  - Verificar que use el endpoint correcto (CRM QA)
  - Verificar envío exitoso
  - **Resultado esperado**: Envío correcto a CRM de QA
- [ ] **Prueba 6.1.3**: JSON dinámico en QA

  - Verificar que el JSON sea dinámico igual que en DEV
  - **Resultado esperado**: Comportamiento idéntico a DEV

### **Fase 7: Pruebas de Edge Cases**

#### ✅ 7.1 Casos Especiales

- [ ] **Prueba 7.1.1**: Parámetros UTM con caracteres especiales

  - URL: `http://localhost:5173/?utm_source=test&utm_campaign=campaña%20especial`
  - Verificar que se capturen correctamente
  - **Resultado esperado**: Caracteres especiales decodificados correctamente
- [ ] **Prueba 7.1.2**: Múltiples parámetros del mismo tipo

  - Verificar comportamiento si hay parámetros duplicados
  - **Resultado esperado**: Se usa el último valor o el primero según implementación
- [ ] **Prueba 7.1.3**: URLs muy largas con muchos parámetros

  - Crear URL con muchos parámetros UTM
  - Verificar que se capturen todos
  - **Resultado esperado**: Todos los parámetros capturados
- [ ] **Prueba 7.1.4**: Limpieza de localStorage

  - Probar función de limpieza manual
  - Verificar que se puedan limpiar datos de campaña
  - **Resultado esperado**: Datos eliminados correctamente

### **Fase 8: Pruebas de Documentación**

#### ✅ 8.1 Verificación de Documentación

- [ ] **Prueba 8.1.1**: Revisar guía para proveedor

  - Verificar que todos los casos de uso estén documentados
  - **Resultado esperado**: Documentación completa y clara
- [ ] **Prueba 8.1.2**: Ejemplos de JSON actualizados

  - Verificar que los ejemplos en la documentación sean correctos
  - **Resultado esperado**: Ejemplos reflejan el comportamiento real

## 📊 Checklist de Validación Final

Antes de considerar completadas las pruebas, verificar:

- [ ] Todos los parámetros UTM se capturan correctamente
- [ ] Todos los Click IDs de plataformas funcionan
- [ ] El JSON es dinámico (solo incluye campos presentes)
- [ ] No se incluyen campos undefined/null/vacíos
- [ ] Los datos persisten correctamente en localStorage
- [ ] First touch y last touch funcionan correctamente
- [ ] Los datos se guardan correctamente en Supabase
- [ ] El JSON se envía correctamente al CRM
- [ ] El comportamiento es consistente entre DEV, QA y PROD
- [ ] La documentación está completa y actualizada

## 🐛 Issues Conocidos

- [ ] (Agregar issues encontrados durante las pruebas)

## 📝 Notas de Pruebas

_Agregar notas adicionales durante la ejecución de las pruebas_

---

**Última actualización**: [Fecha]
**Responsable**: [Nombre]
**Estado**: 🟡 En progreso
