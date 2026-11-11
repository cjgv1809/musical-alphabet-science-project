import { describe, expect, it } from 'vitest';
import { AJUSTES_POR_DEFECTO, sanearAjustes } from './ajustes.ts';

describe('ajustes', () => {
  it('devuelve los valores por defecto ante datos ausentes o corruptos', () => {
    expect(sanearAjustes(null)).toEqual(AJUSTES_POR_DEFECTO);
    expect(sanearAjustes('basura')).toEqual(AJUSTES_POR_DEFECTO);
    expect(sanearAjustes({ duracionNotaMs: 'rápido' })).toEqual(AJUSTES_POR_DEFECTO);
  });

  it('acota los valores fuera de rango', () => {
    const a = sanearAjustes({ duracionNotaMs: 5, velocidadVoz: 99 });
    expect(a.duracionNotaMs).toBe(300);
    expect(a.velocidadVoz).toBe(1.4);
  });

  it('conserva valores válidos', () => {
    const a = sanearAjustes({ duracionNotaMs: 700, velocidadVoz: 1, vozNombre: 'Paulina' });
    expect(a).toEqual({ duracionNotaMs: 700, velocidadVoz: 1, vozNombre: 'Paulina' });
  });
});
