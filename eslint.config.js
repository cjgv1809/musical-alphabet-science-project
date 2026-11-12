import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Configuración ESLint (flat config).
// - recommended de JS y TypeScript: errores reales, no estilo.
// - react-hooks: reglas de hooks (dependencias de efectos, etc.).
// - jsx-a11y: accesibilidad en JSX (el público objetivo lo exige).
// - eslint-config-prettier va al final: apaga reglas de formato que
//   chocarían con Prettier (el formato lo decide Prettier, no ESLint).
export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'coverage',
    'test-results',
    'playwright-report',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
  },
  {
    // Service worker: otro entorno global.
    files: ['public/sw.js'],
    extends: [js.configs.recommended],
    languageOptions: { globals: globals.serviceworker },
  },
  {
    files: ['*.config.{js,ts}', 'vitest.setup.ts', 'e2e/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
]);
