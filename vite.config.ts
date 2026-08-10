import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/crm': {
        // JPS: Configuración del proxy usando variable de entorno
        // Modificación: El target ahora viene de VITE_CRM_URL en el archivo .env correspondiente
        // Funcionamiento:
        // - En desarrollo (.env.development): target = http://crmadmision-qa.uniacc.cl
        // - En QA (.env.qa): target = http://crmadmision-qa.uniacc.cl
        // - En producción (.env.production): no se usa proxy, se envía directamente
        // El proxy simula el hostname usando VITE_CRM_PROXY_HOSTNAME para evitar problemas de CORS
        target: process.env.VITE_CRM_URL || 'http://crmadmision-qa.uniacc.cl',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/crm/, ''),
        secure: false,
        // JPS: Configurar headers para simular el hostname correcto
        // Modificación: Usar VITE_CRM_PROXY_HOSTNAME para que el servidor CRM vea el hostname correcto
        // Funcionamiento: Esto permite que el proxy se comporte como si fuera simuladordev.uniacc.cl o simuladorqa.uniacc.cl
        configure: (proxy, _options) => {
          const proxyHostname = process.env.VITE_CRM_PROXY_HOSTNAME || 'simuladordev.uniacc.cl'
          
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Simular el hostname correcto en el header Host
            proxyReq.setHeader('Host', proxyHostname)
            console.log(`[Proxy] Sending Request to: ${process.env.VITE_CRM_URL || 'http://crmadmision-qa.uniacc.cl'} (simulating ${proxyHostname})`)
          })
          
          proxy.on('error', (err, _req, _res) => {
            console.error('[Proxy] Error:', err)
          })
          
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`[Proxy] Received Response: ${proxyRes.statusCode} ${proxyRes.statusMessage}`)
          })
        },
      }
    }
  }
})
