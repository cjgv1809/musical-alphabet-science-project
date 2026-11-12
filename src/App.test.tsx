import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App.tsx';

/**
 * Test de humo de la UI: verifica que la app monta el panel de
 * guitarra a palabras. La lógica de audio está cubierta por los
 * tests de `src/audio/`; aquí solo integramos.
 */
describe('App (integración)', () => {
  it('monta el título y el panel de guitarra a palabras', async () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /notas que hablan/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /de la guitarra a las palabras/i }),
    ).toBeInTheDocument();
    // "Hablar" es la pestaña inicial: ahí está la escucha.
    expect(screen.getByRole('button', { name: /escuchar melodía/i })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /aprender/i }));
    expect(screen.getByRole('button', { name: /tocar melodía/i })).toBeInTheDocument();
  });

  it('las pestañas se manejan con el teclado y solo una está visible', async () => {
    render(<App />);
    const hablar = screen.getByRole('tab', { name: /hablar/i });
    const aprender = screen.getByRole('tab', { name: /aprender/i });
    expect(hablar).toHaveAttribute('aria-selected', 'true');
    expect(aprender).toHaveAttribute('aria-selected', 'false');

    hablar.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(aprender).toHaveAttribute('aria-selected', 'true');
    expect(aprender).toHaveFocus();
    expect(screen.getByRole('tabpanel', { name: /aprender/i })).toBeVisible();

    await userEvent.keyboard('{Home}');
    expect(hablar).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: /hablar/i })).toBeVisible();
  });
});
