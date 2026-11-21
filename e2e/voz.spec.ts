import { expect, test } from '@playwright/test';

test('al decir NO, la voz recibe una palabra normal (no "noroeste")', async ({
  page,
}) => {
  // Sustituye la síntesis del navegador por una que solo registra lo que se le pide.
  await page.addInitScript(() => {
    const dichos: string[] = [];
    (window as unknown as { __dichos: string[] }).__dichos = dichos;
    class Enunciado {
      lang = '';
      rate = 1;
      voice: unknown = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(public text: string) {}
    }
    (
      window as unknown as { SpeechSynthesisUtterance: unknown }
    ).SpeechSynthesisUtterance = Enunciado;
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        speaking: false,
        cancel: () => undefined,
        getVoices: () => [],
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        speak: (e: { text: string; onend: (() => void) | null }) => {
          dichos.push(e.text);
          e.onend?.();
        },
      },
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: /decir en voz alta: no\./i }).click();
  const dichos = await page.evaluate(
    () => (window as unknown as { __dichos: string[] }).__dichos,
  );
  expect(dichos).toEqual(['no']);
});
