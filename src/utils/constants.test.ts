import { describe, expect, it } from 'vitest';
import {
  DURACION_MINIMA_MS,
  DURACION_SIMBOLO_MS,
  FRECUENCIA_CORTE_GRAVES,
  FRECUENCIA_MAXIMA,
  PAUSA_ENTRE_SIMBOLOS_MS,
  TAMANO_VENTANA,
  VENTANAS_CONSECUTIVAS,
} from './constants.ts';

/**
 * Test de constantes: verifica que los parámetros del proyecto
 * cumplen los requisitos físicos.
 * - Banda del micrófono 100–3000 Hz: cubre todas las notas (146.83–932 Hz).
 * - Duración mínima ≥ 50 ms (anti impulsivos).
 * - El tono emitido dura mucho más de lo que tarda el detector.
 */
describe('constants', () => {
  it('filtra el micrófono entre 100 y 3000 Hz', () => {
    expect(FRECUENCIA_CORTE_GRAVES).toBe(100);
    expect(FRECUENCIA_MAXIMA).toBe(3000);
  });

  it('el corte de graves del micro deja pasar la nota más grave (espacio RE3)', () => {
    expect(FRECUENCIA_CORTE_GRAVES).toBeLessThan(146.83);
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
