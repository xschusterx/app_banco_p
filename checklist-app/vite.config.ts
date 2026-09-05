import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Necessário para empacotar no Capacitor/Android (caminhos relativos no WebView).
  base: './',
  plugins: [react()],
})
