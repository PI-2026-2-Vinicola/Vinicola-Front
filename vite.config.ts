import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Em desenvolvimento, /api é encaminhado para a API OASIS (Vinicola-back).
// Para outra porta/endereço: OASIS_API_PROXY=http://192.168.0.10:8000 npm run dev
const apiTarget = process.env.OASIS_API_PROXY ?? 'http://localhost:8000';
const proxy = { '/api': { target: apiTarget, changeOrigin: true } };

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  server: { port: 5173, host: true, proxy },
  preview: { port: 4173, proxy },
  test: { environment: 'node' },
});
