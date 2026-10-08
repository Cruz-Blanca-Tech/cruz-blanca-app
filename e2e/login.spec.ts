import { expect, test } from '@playwright/test';

/** Pantalla de inicio de sesión renderizada en un navegador real (Chromium). */
test('muestra la pantalla de inicio de sesión', async ({ page }) => {
  await page.goto('/auth');
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
  await expect(page.getByText('Accede con tu cuenta institucional')).toBeVisible();
  await expect(page.getByText(/Ley N\.° 29733/)).toBeVisible();
});

test('avisa cuando la sesión expiró', async ({ page }) => {
  await page.goto('/auth?session_expired=true');
  await expect(page.getByText(/Tu sesión expiró/)).toBeVisible();
});

test('un usuario sin sesión que abre /triaje termina en el login', async ({ page }) => {
  await page.goto('/triaje');
  await expect(page).toHaveURL(/\/auth$/);
  await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
});
