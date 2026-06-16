import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import sparkProxy from './vite-spark-proxy.js';

export default defineConfig({
  plugins: [react(), sparkProxy()],
  server: {
    port: 5173,
  },
  resolve: {
    alias: { '@': '/src' },
  },
});
