import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Pruebas unitarias del frontend (Vitest).
 * - Solo lógica pura (reglas de dominio, permisos por ruta, formateo, schemas Zod):
 *   no necesitan navegador. La UI se cubre con las pruebas E2E de Playwright (e2e/).
 * - `coverage/lcov.info` es el reporte que lee SonarQube Cloud.
 */
export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      include: [
        'src/lib/**/*.ts',
        'src/config/**/*.ts',
        'src/features/**/lib/**/*.ts',
        'src/features/**/schemas/**/*.ts',
      ],
      exclude: ['**/*.test.ts'],
    },
  },
});
