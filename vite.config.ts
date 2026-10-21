import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        // - vendors em chunks próprios: cache estável entre deploys e entrada mais leve (22-performance)
        manualChunks: id => {
          if (!id.includes('node_modules')) return undefined;
          if (/[/](react|react-dom|scheduler)[/]/.test(id)) return 'react';
          if (/react-router|@remix-run/.test(id)) return 'router';
          if (/@tanstack/.test(id)) return 'query';
          if (/i18next/.test(id)) return 'i18n';
          if (/[/]zod[/]/.test(id)) return 'zod';
          return undefined;
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
  },
});
