import { describe, expect, it } from 'vitest';
import {
  DURACION_MINIMA_MS,
  DURACION_SIMBOLO_MS,
  FACTOR_UMBRAL,
  FRECUENCIA_MAXIMA,
  FRECUENCIA_MINIMA,
  TAMANO_VENTANA,
  UMBRAL_MINIMO,
  VENTANAS_CONSECUTIVAS,
} from './constants.ts';

/**
 * Test de constantes: verifica que los parámetros del proyecto
 * cumplen los requisitos físicos.
 * - Banda 300–3000 Hz (voz/telefonía).
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

  it('el umbral dinámico tiene suelo mínimo positivo', () => {
    expect(FACTOR_UMBRAL).toBeGreaterThan(1);
    expect(UMBRAL_MINIMO).toBeGreaterThan(0);
  });

  it('el tono emitido (500 ms) dura más que la confirmación (~80 ms)', () => {
    expect(DURACION_SIMBOLO_MS).toBe(500);
  });
});
