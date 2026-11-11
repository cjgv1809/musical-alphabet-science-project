import { describe, expect, it } from 'vitest';
import { agregarAlHistorial } from './historial.ts';

describe('historial', () => {
  it('pone la frase más reciente primero y no repite', () => {
    expect(agregarAlHistorial(['AGUA', 'HOLA'], 'HOLA')).toEqual(['HOLA', 'AGUA']);
    expect(agregarAlHistorial([], 'SÍ')).toEqual(['SÍ']);
  });

  it('ignora textos vacíos y respeta el máximo', () => {
    expect(agregarAlHistorial(['AGUA'], '   ')).toEqual(['AGUA']);
    expect(agregarAlHistorial(['A', 'B', 'C'], 'D', 3)).toEqual(['D', 'A', 'B']);
  });
});
