import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Necessário para empacotar no Capacitor/Android (caminhos relativos no WebView).
  base: './',
  plugins: [react()],
  // Permitir túneis públicos (localhost.run / Cloudflare) para teste no celular.
  preview: {
    host: true,
    allowedHosts: true,
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    },
  },
})
