import { describe, expect, it } from 'vitest';
import {
  DURACION_MINIMA_MS,
  DURACION_SIMBOLO_MS,
  FRECUENCIA_MAXIMA,
  FRECUENCIA_MINIMA,
  PAUSA_ENTRE_SIMBOLOS_MS,
  TAMANO_VENTANA,
  VENTANAS_CONSECUTIVAS,
} from './constants.ts';

/**
 * Test de constantes: verifica que los parámetros del proyecto
 * cumplen los requisitos físicos.
 * - Banda 300–3000 Hz (voz): nuestras notas (220–932 Hz) viajan bien.
 * - Duración mínima ≥ 50 ms (anti impulsivos).
 * - El tono emitido dura mucho más de lo que tarda el detector.
 */
describe('constants', () => {
  it('usa la banda de voz 300–3000 Hz', () => {
    expect(FRECUENCIA_MINIMA).toBe(300);
    expect(FRECUENCIA_MAXIMA).toBe(3000);
  });

  it('exige duración mínima de 50 ms contra ruidos impulsivos', () => {
    expect(DURACION_MINIMA_MS).toBeGreaterThanOrEqual(50);
    expect(TAMANO_VENTANA).toBe(1024);
    expect(VENTANAS_CONSECUTIVAS).toBeGreaterThanOrEqual(2);
  });

  it('el tono emitido (500 ms) dura más que la confirmación (~80 ms)', () => {
    expect(DURACION_SIMBOLO_MS).toBe(500);
    expect(PAUSA_ENTRE_SIMBOLOS_MS).toBeGreaterThan(0);
  });
});
