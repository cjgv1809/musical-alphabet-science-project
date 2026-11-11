import { describe, expect, it } from 'vitest';
import { MAX_FRASES, MAX_LONGITUD, agregarFrase } from './fraseario.ts';

describe('fraseario personalizado', () => {
  it('añade una frase limpiando espacios', () => {
    const r = agregarFrase([], '  Me llamo   Ana ');
    expect(r.error).toBeNull();
    expect(r.frases).toEqual(['Me llamo Ana']);
  });

  it('rechaza vacías, sin letras A–Z, largas y repetidas', () => {
    expect(agregarFrase([], '   ').error).not.toBeNull();
    expect(agregarFrase([], '1234').error).not.toBeNull();
    expect(agregarFrase([], 'A'.repeat(MAX_LONGITUD + 1)).error).not.toBeNull();
    // Repetida de las esenciales (sin tildes ni espacios).
    expect(agregarFrase([], 'por favor').error).not.toBeNull();
    expect(agregarFrase(['Ana'], 'ANA').error).not.toBeNull();
  });

  it('respeta el máximo de frases', () => {
    const llenas = Array.from({ length: MAX_FRASES }, (_, i) => `QX${'Z'.repeat(i + 1)}`);
    expect(agregarFrase(llenas, 'Otra').error).not.toBeNull();
  });
});
