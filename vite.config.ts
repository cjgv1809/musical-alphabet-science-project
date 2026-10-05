import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

// Configuración Vite + React + Vitest (Fase 1: scaffolding).
// - plugin-react: JSX / Fast Refresh.
// - basicSsl: certificado HTTPS autofirmado solo para desarrollo, para que
//   el micrófono (getUserMedia exige contexto seguro) funcione en el móvil
//   al abrir la URL de red (https://TU-IP:5173). No afecta a `build`.
// - test.environment jsdom: simula el DOM para React Testing Library.
// - test.setupFiles: carga matchers de jest-dom.
// - test.globals: permite usar describe/it/expect sin importarlos.
export default defineConfig({
  plugins: [react(), basicSsl()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
