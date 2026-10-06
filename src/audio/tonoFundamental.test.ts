import { describe, expect, it } from 'vitest';
import { estimarFrecuenciaFundamental } from './tonoFundamental.ts';

/**
 * Tests del estimador de fundamental con tres timbres:
 * seno puro (altavoz ideal), "guitarra" sintética (fundamental +
 * armónicos 0.5/0.25/0.12, como una cuerda real) y ruido/silencio.
 * La gracia del modo instrumento es que TODOS los timbres den la
 * misma nota: eso es lo que validamos aquí.
 */

const SAMPLE_RATE = 44100;
const N = 2048;

function sintetizar(
  frecuencia: number,
  armonicos: readonly number[] = [1],
  amplitud = 0.4,
): Float32Array {
  const muestras = new Float32Array(N);
  for (let i = 0; i < N; i += 1) {
    let valor = 0;
    for (let k = 0; k < armonicos.length; k += 1) {
      const parcial = k + 1;
      valor +=
        (armonicos[k] ?? 0) *
        Math.sin((2 * Math.PI * frecuencia * parcial * i) / SAMPLE_RATE);
    }
    muestras[i] = amplitud * valor;
  }
  return muestras;
}

/** Timbre "cuerda pulsada": fundamental + armónicos decrecientes. */
const GUITARRA = [1, 0.5, 0.25, 0.12] as const;

describe('tonoFundamental (YIN simplificado)', () => {
  it('estima senos puros con error < 1 %', () => {
    for (const f of [220, 440, 659.25, 932.33]) {
      const est = estimarFrecuenciaFundamental(sintetizar(f), SAMPLE_RATE);
      expect(est).not.toBe(null);
      expect(Math.abs((est?.frecuencia ?? 0) - f) / f).toBeLessThan(0.01);
      expect(est?.claridad ?? 0).toBeGreaterThan(0.9);
    }
  });

  it('la "guitarra" da la misma fundamental que el seno (timbre libre)', () => {
    for (const f of [220, 329.63, 523.25]) {
      const est = estimarFrecuenciaFundamental(
        sintetizar(f, GUITARRA),
        SAMPLE_RATE,
      );
      expect(est).not.toBe(null);
      // Sin error de octava: debe ser f, no 2f ni f/2.
      expect(Math.abs((est?.frecuencia ?? 0) - f) / f).toBeLessThan(0.02);
    }
  });

  it('el registro grave de los signos (155–208 Hz) también se estima', () => {
    for (const f of [155.56, 196.0, 207.65]) {
      const seno = estimarFrecuenciaFundamental(sintetizar(f), SAMPLE_RATE);
      expect(Math.abs((seno?.frecuencia ?? 0) - f) / f).toBeLessThan(0.02);
      const guitarra = estimarFrecuenciaFundamental(
        sintetizar(f, GUITARRA),
        SAMPLE_RATE,
      );
      expect(
        Math.abs((guitarra?.frecuencia ?? 0) - f) / f,
      ).toBeLessThan(0.03);
    }
  });

  it('silencio y ruido no inventan tonos', () => {
    expect(
      estimarFrecuenciaFundamental(new Float32Array(N), SAMPLE_RATE),
    ).toBe(null);
    // Ruido blanco: sin periodicidad clara → null.
    const ruido = new Float32Array(N);
    let semilla = 12345;
    for (let i = 0; i < N; i += 1) {
      semilla = (semilla * 1103515245 + 12345) % 2147483648;
      ruido[i] = 0.3 * (semilla / 2147483648 - 0.5) * 2;
    }
    expect(estimarFrecuenciaFundamental(ruido, SAMPLE_RATE)).toBe(null);
  });

  it('protege casos borde', () => {
    expect(
      estimarFrecuenciaFundamental(new Float32Array(100), SAMPLE_RATE),
    ).toBe(null);
    expect(
      estimarFrecuenciaFundamental(sintetizar(440), 0),
    ).toBe(null);
  });
});
