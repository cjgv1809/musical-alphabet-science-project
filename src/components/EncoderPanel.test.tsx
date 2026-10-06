import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EncoderPanel from './EncoderPanel.tsx';
import { useAppStore } from '../store/useAppStore.ts';

/** El textarea escribe en el store (sin tocar audio: no se pulsa Tocar). */
describe('EncoderPanel', () => {
  it('escribir actualiza el mensaje global', async () => {
    const usuario = userEvent.setup();
    render(<EncoderPanel />);
    const campo = screen.getByLabelText(/mensaje/i);
    await usuario.clear(campo);
    await usuario.type(campo, 'hola');
    // Se guarda tal cual (el decodificador acepta minúsculas igual).
    expect(useAppStore.getState().mensaje).toBe('hola');
  });

  it('avisa de caracteres sin nota (ej. ñ)', async () => {
    const usuario = userEvent.setup();
    render(<EncoderPanel />);
    const campo = screen.getByLabelText(/mensaje/i);
    await usuario.clear(campo);
    await usuario.type(campo, 'mañana');
    expect(screen.getByRole('note')).toHaveTextContent(/se saltarán/i);
  });
});
