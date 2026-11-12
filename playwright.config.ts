import { defineConfig, devices } from '@playwright/test';
import { RUTA_WAV } from './e2e/rutas.ts';

// E2E: abre la app compilada en Chromium con un micrófono FALSO que
// reproduce un WAV (generado en `e2e/global-setup.ts`) tocando "HOLA".
// Así se prueba el flujo completo sin guitarra ni permisos reales.
const PUERTO = 4173;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PUERTO}/`,
    permissions: ['microphone'],
    trace: 'retain-on-failure',
    launchOptions: {
      args: [
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        `--use-file-for-fake-audio-capture=${RUTA_WAV}`,
      ],
    },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PUERTO} --strictPort`,
    url: `http://localhost:${PUERTO}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
