import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App.tsx';

/**
 * Tests de humo de la UI: verifican que todos los paneles
 * se montan sin romper nada. La lógica de audio ya está cubierta
 * por los tests de `src/audio/`; aquí solo integramos.
 */
describe('App (integración)', () => {
  it('monta todos los paneles', () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { name: /alfabeto musical tocado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /codificar y tocar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /escuchar y decodificar/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /espectro en vivo/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /alfabeto de notas/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /física del proyecto/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /modo instrumento/i }),
    ).toBeInTheDocument();
  });
});
