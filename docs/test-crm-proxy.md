# Cómo probar el Proxy CRM

## Opción 1: Probar localmente con Netlify CLI (Recomendado)

### 1. Instalar Netlify CLI (si no lo tienes)
```bash
npm install -g netlify-cli
# o
npm install --save-dev netlify-cli
```

### 2. Ejecutar el servidor de desarrollo con Netlify
```bash
# Si instalaste globalmente
netlify dev

# Si instalaste como dev dependency
npx netlify dev
```

Esto iniciará:
- Tu aplicación Vue en `http://localhost:8888` (o el puerto que configure)
- Las Netlify Functions disponibles en `http://localhost:8888/.netlify/functions/crm-proxy`

### 3. Probar la función directamente
Puedes probar la función con curl o Postman:

```bash
curl -X POST http://localhost:8888/.netlify/functions/crm-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "primerApellido": "Usuario",
    "segundoApellido": "",
    "email": "test@example.com",
    "rut": "12345678-9",
    "telefono": "+56912345678",
    "carrera": "CAUC1DR",
    "origen": 4,
    "User_Agent": "Test Agent"
  }'
```

## Opción 2: Probar en cada ambiente

### Dev (localhost)
1. Ejecutar `npm run dev`
2. La app usará el proxy de Vite configurado en `vite.config.ts`
3. Verificar en la consola del navegador que se vea: `CRM_URL /crm/webservice/formulario_web.php`

### QA (simuladorqa.uniacc.cl)
1. Desplegar o acceder a QA
2. La app detectará `simuladorqa.uniacc.cl` y usará URL directa
3. Verificar en la consola: `CRM_URL http://crmadmision-qa.uniacc.cl/webservice/formulario_web.php`
4. Probar completando el formulario del simulador

### Producción (simulador.uniacc.cl)
1. Desplegar a producción en Netlify
2. La app detectará `simulador.uniacc.cl` y usará la Netlify Function
3. Verificar en la consola: `CRM_URL /.netlify/functions/crm-proxy`
4. Probar completando el formulario del simulador

## Opción 3: Probar la función en producción después del deploy

Una vez desplegado, puedes probar la función directamente:

```bash
curl -X POST https://simulador.uniacc.cl/.netlify/functions/crm-proxy \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Test",
    "primerApellido": "Usuario",
    "email": "test@example.com",
    "rut": "12345678-9",
    "telefono": "+56912345678",
    "carrera": "CAUC1DR",
    "origen": 4,
    "User_Agent": "Test Agent"
  }'
```

## Verificar en la consola del navegador

En cualquier ambiente, abre las herramientas de desarrollador (F12) y busca en la consola:
- `CRM_URL` - Debe mostrar la URL correcta según el ambiente
- `data CRM` - Debe mostrar el JSON que se envía
- `response CRM` - Debe mostrar la respuesta del servidor (si es exitosa)

## Solución de problemas

### Error: "Cannot find module '@netlify/functions'"
```bash
npm install --save-dev @netlify/functions
```

### La función no se encuentra en producción
- Verifica que la carpeta `netlify/functions/` esté incluida en el repositorio
- Verifica que Netlify esté configurado para construir funciones
- Revisa los logs de build en Netlify

### Error de CORS persiste
- Verifica que la función esté devolviendo los headers CORS correctos
- Verifica en Network tab que la petición llegue a `/.netlify/functions/crm-proxy`
- Revisa la consola del navegador para errores específicos

