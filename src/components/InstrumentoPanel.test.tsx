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
