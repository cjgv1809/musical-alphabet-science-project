import { expect, test } from '@playwright/test';

test.describe('flujo principal', () => {
  test('escucha la guitarra (micrófono falso), transcribe y reconoce HOLA', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /escuchar melodía/i }).click();

    const transcripcion = page.getByRole('log', { name: /melodía transcrita/i });
    await expect(transcripcion).toContainText('HOLA');
    await expect(page.getByText(/frase reconocida/i)).toContainText('HOLA');

    // El afinador y el medidor aparecen mientras se escucha.
    await expect(page.getByRole('button', { name: /dejar de escuchar/i })).toBeVisible();
  });

  test('cambiar de pestaña no corta la escucha ni pierde el texto', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /escuchar melodía/i }).click();
    const transcripcion = page.getByRole('log', { name: /melodía transcrita/i });
    await expect(transcripcion).toContainText('H');

    await page.getByRole('tab', { name: /aprender/i }).click();
    await expect(page.getByRole('button', { name: /tocar melodía/i })).toBeVisible();
    await page.getByRole('tab', { name: /hablar/i }).click();

    await expect(page.getByRole('button', { name: /dejar de escuchar/i })).toBeVisible();
    await expect(transcripcion).toContainText('HOLA');
  });

  test('Borrar y Limpiar vacían la transcripción', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /escuchar melodía/i }).click();
    const transcripcion = page.getByRole('log', { name: /melodía transcrita/i });
    await expect(transcripcion).toContainText('H');
    await page.getByRole('button', { name: /dejar de escuchar/i }).click();

    await page.getByRole('button', { name: 'Limpiar' }).click();
    await expect(transcripcion).toContainText('Aquí aparecerá');
  });
});

test.describe('PWA', () => {
  test('tras la primera visita la app carga sin conexión', async ({ page, context }) => {
    await page.goto('/');
    // Espera a que el service worker esté activo y controle la página.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: /notas que hablan/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /aprender/i })).toBeVisible();
  });
});
