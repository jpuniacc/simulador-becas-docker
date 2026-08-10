# 🔗 URLs de Prueba para Tracking de Campañas

## ⚠️ Importante: Cómo usar estas URLs

**NO copies y pegues las URLs directamente** - algunos sistemas operativos (especialmente macOS) pueden interpretar ciertos parámetros como protocolos y redirigirte a DuckDuckGo u otros sitios.

### Métodos recomendados:

1. **Escribir directamente en la barra de direcciones** (Recomendado)
   - Abre tu navegador
   - Haz clic en la barra de direcciones
   - Escribe la URL completa manualmente

2. **Usar la consola del navegador**
   ```javascript
   window.location.href = 'http://localhost:5173/?utm_source=google&gclid=TEST123'
   ```

3. **Crear un bookmark o marcador**
   - Guarda la URL como marcador
   - Haz clic en el marcador para abrirla

## 📋 URLs de Prueba

### Parámetros UTM Básicos

```
http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=test2024
```

```
http://localhost:5173/?utm_source=facebook&utm_medium=social&utm_campaign=becas2024&utm_term=becas&utm_content=ad1
```

### Google Ads (gclid)

```
http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=summer2024&gclid=EAIaIQobChMI1234567890
```

### Facebook Ads (fbclid)

```
http://localhost:5173/?utm_source=facebook&utm_medium=social&utm_campaign=becas&fbclid=IwAR1234567890
```

### Microsoft Ads (msclkid)

```
http://localhost:5173/?utm_source=microsoft&utm_medium=cpc&msclkid=7890123456
```

### TikTok Ads (ttclid)

```
http://localhost:5173/?utm_source=tiktok&utm_medium=social&ttclid=3456789012
```

### LinkedIn Ads (li_fat_id)

```
http://localhost:5173/?utm_source=linkedin&utm_medium=social&li_fat_id=5678901234
```

### Parámetros Personalizados

```
http://localhost:5173/?campaign_id=CAMP001&ad_id=AD123
```

### Combinación Completa

```
http://localhost:5173/?utm_source=google&utm_medium=cpc&utm_campaign=verano2024&utm_term=becas&utm_content=ad1&gclid=TEST123&campaign_id=CAMP001&ad_id=AD789
```

### Email Marketing

```
http://localhost:5173/?utm_source=newsletter&utm_medium=email&utm_campaign=monthly
```

### Sin Parámetros (Tráfico Directo)

```
http://localhost:5173/
```

## 🧪 Script para Probar en Consola

Copia y pega esto en la consola del navegador (F12) para probar diferentes URLs:

```javascript
// Función helper para probar URLs
function testCampaignURL(url) {
  console.log('🧪 Testing URL:', url)
  window.location.href = url
}

// Ejemplos de uso:
// testCampaignURL('http://localhost:5173/?utm_source=google&gclid=TEST123')
// testCampaignURL('http://localhost:5173/?utm_source=tiktok&ttclid=3456789012')
```

## ✅ Verificación Rápida

Después de cargar cualquier URL, ejecuta en la consola:

```javascript
// Ver datos en localStorage
JSON.parse(localStorage.getItem('simulador-campaign-data'))

// Ver datos en el store (si estás en la página del simulador)
// Abre Vue DevTools y busca el store 'simulador'
```

## 🔍 Qué Buscar en los Logs

Después de cargar una URL con parámetros, deberías ver en la consola:

1. `🔍 Campaign Tracking - Initializing...`
2. `🔍 Campaign Tracking - Current params from URL:` (debe mostrar los parámetros)
3. `✅ Campaign Tracking - New params captured`
4. `📊 App.vue - Campaign data initialized`
5. `✅ SimuladorStore - Campaign data added to formData`

