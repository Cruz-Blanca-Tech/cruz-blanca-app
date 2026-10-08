import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas E2E (Playwright) contra la app compilada (`npm run build` antes).
 * No requieren backend ni login real de Google: validan la protección de rutas
 * por rol (src/proxy.ts) y la pantalla de inicio de sesión.
 */
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `${BASE_URL}/auth`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
