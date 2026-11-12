import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import InstrumentoPanel from './InstrumentoPanel.tsx';
import { motorEscucha, type CallbacksEscucha } from '../audio/escucha.ts';
import * as voz from '../audio/voz.ts';

/**
 * El motor de micrófono se simula: capturamos los callbacks que el panel
 * le pasa y los disparamos a mano, como lo haría el detector.
 */
describe('InstrumentoPanel (escucha simulada)', () => {
  let callbacks: CallbacksEscucha;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(motorEscucha, 'iniciar').mockImplementation((cb) => {
      callbacks = cb;
      return Promise.resolve();
    });
    vi.spyOn(motorEscucha, 'detener').mockImplementation(() => undefined);
    vi.spyOn(voz, 'hablar').mockReturnValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  async function empezar(): Promise<void> {
    render(<InstrumentoPanel />);
    await act(async () => {
      screen.getByRole('button', { name: /escuchar melodía/i }).click();
    });
  }

  function tocar(simbolos: string): void {
    for (const s of simbolos) act(() => callbacks.alConfirmar(s, 20));
  }

  it('muestra el aviso de una sola cuerda cuando el motor detecta confusión', async () => {
    await empezar();
    expect(screen.queryByText(/una sola cuerda/i)).toBeNull();
    act(() => callbacks.alConfuso?.());
    expect(screen.getByText(/una sola cuerda/i)).toBeInTheDocument();
  });

  it('cambiar de pestaña no corta la escucha ni pierde la transcripción', async () => {
    await empezar();
    tocar('HOL');
    act(() => screen.getByRole('tab', { name: /aprender/i }).click());
    act(() => screen.getByRole('tab', { name: /hablar/i }).click());
    expect(motorEscucha.detener).not.toHaveBeenCalled();
    expect(screen.getByRole('log', { name: /melodía transcrita/i })).toHaveTextContent(
      /^HOL$/,
    );
    expect(
      screen.getByRole('button', { name: /dejar de escuchar/i }),
    ).toBeInTheDocument();
  });

  it('Borrar quita solo la última letra', async () => {
    await empezar();
    tocar('HOLA');
    act(() => screen.getByRole('button', { name: /borrar la última letra/i }).click());
    expect(screen.getByRole('log', { name: /melodía transcrita/i })).toHaveTextContent(
      /^HOL$/,
    );
  });

  it('espera un silencio antes de hablar: NO no suena si sigue NOCHE', async () => {
    await empezar();
    tocar('NO');
    act(() => vi.advanceTimersByTime(600));
    tocar('CHE');
    act(() => vi.advanceTimersByTime(5000));
    expect(voz.hablar).not.toHaveBeenCalled();
  });

  it('dice la frase tras el silencio y permite repetirla', async () => {
    await empezar();
    tocar('AGUA');
    act(() => vi.advanceTimersByTime(1500));
    expect(voz.hablar).toHaveBeenCalledTimes(1);
    // La voz simulada nunca avisa su fin: el respaldo reabre el micrófono.
    act(() => vi.advanceTimersByTime(3000));
    tocar('AGUA');
    act(() => vi.advanceTimersByTime(1500));
    expect(voz.hablar).toHaveBeenCalledTimes(2);
  });
});

describe('InstrumentoPanel (accesibilidad)', () => {
  it('no tiene violaciones axe', async () => {
    const axe = (await import('axe-core')).default;
    const { container } = render(<InstrumentoPanel />);
    // jsdom no calcula estilos reales: el contraste no se puede medir aquí.
    const resultado = await axe.run(container, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(resultado.violations).toEqual([]);
  });
});
