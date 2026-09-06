import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  // Necessário para empacotar no Capacitor/Android (caminhos relativos no WebView).
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'icons/*.png', 'instalar.html'],
      manifest: {
        name: 'Task-Flux',
        short_name: 'Task-Flux',
        description: 'Checklist de veículos com foto, ditado por voz e envio por e-mail.',
        theme_color: '#1b3a2f',
        background_color: '#1b3a2f',
        display: 'standalone',
        lang: 'pt-BR',
        start_url: './',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // APK e página de instalar devem ir sempre ao servidor (headers corretos).
        navigateFallbackDenylist: [/^\/api/, /^\/install/, /^\/downloads/, /^\/instalar/],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
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
});
