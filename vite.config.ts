import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// `VITE_BASE` permite publicar a aplicação em um subdiretório (ex.: GitHub Pages).
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: { port: 5173, host: true },
  test: { environment: 'node' },
});
