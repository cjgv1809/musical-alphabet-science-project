import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.tsx';

/**
 * Test de humo de la UI: verifica que la app monta el panel de
 * guitarra a palabras. La lógica de audio está cubierta por los
 * tests de `src/audio/`; aquí solo integramos.
 */
describe('App (integración)', () => {
  it('monta el título y el panel de guitarra a palabras', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /notas que hablan/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /de la guitarra a las palabras/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /tocar melodía/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /escuchar melodía/i }),
    ).toBeInTheDocument();
  });
});
