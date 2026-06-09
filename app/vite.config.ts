import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false, // registramos manualmente em main.tsx (Task 12) — evita registro duplicado
      includeAssets: ['favicon.svg', 'apple-touch-icon-180x180.png'],
      devOptions: {
        enabled: false, // SW desligado em dev (não interfere em HMR nem nos testes)
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // NÃO cacheamos respostas do Supabase aqui — dados ficam no TanStack Query.
      },
      manifest: {
        name: 'Vila Viva',
        short_name: 'Vila Viva',
        description: 'Plataforma comunitária da Ecovila Piracanga',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F7F2EA',
        theme_color: '#B85C2A',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['node_modules', 'dist', 'tests/e2e/**'],
  },
});
