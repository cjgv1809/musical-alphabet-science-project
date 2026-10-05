import { describe, expect, it } from 'vitest';
import { calcularMagnitudes, goertzel } from './goertzel.ts';

/**
 * Tests del algoritmo de Goertzel con señales sintéticas.
 *
 * Física del test: generamos ondas sinusoidales puras por software
 * (amplitud y frecuencia conocidas) y comprobamos que el detector
 * responde fuerte en la frecuencia correcta y flojo en las demás.
 * Así validamos la matemática sin necesitar micrófono.
 */

const SAMPLE_RATE = 44100;
const N = 1024;

/** Genera N muestras de un seno puro: x[n] = A·sin(2π·f·n/fs). */
function generarSeno(frecuencia: number, amplitud = 0.5): Float32Array {
  const muestras = new Float32Array(N);
  for (let i = 0; i < N; i += 1) {
    muestras[i] = amplitud * Math.sin((2 * Math.PI * frecuencia * i) / SAMPLE_RATE);
  }
  return muestras;
}

/** Genera un doble tono (como nuestras letras): suma de dos senos. */
function generarDobleTono(f1: number, f2: number, amplitud = 0.5): Float32Array {
  const muestras = new Float32Array(N);
  for (let i = 0; i < N; i += 1) {
    muestras[i] =
      amplitud * Math.sin((2 * Math.PI * f1 * i) / SAMPLE_RATE) +
      amplitud * Math.sin((2 * Math.PI * f2 * i) / SAMPLE_RATE);
  }
  return muestras;
}

describe('goertzel (detector de frecuencias)', () => {
  it('detecta fuerte la frecuencia presente y flojo las ausentes', () => {
    const muestras = generarSeno(700);
    const presente = goertzel(muestras, 700, SAMPLE_RATE);
    const ausente = goertzel(muestras, 1500, SAMPLE_RATE);
    // Magnitud teórica ≈ A·N/2 = 0.5·1024/2 = 256.
    expect(presente).toBeGreaterThan(200);
    // La ausente debe ser un orden de magnitud menor (lóbulo lateral).
    expect(ausente).toBeLessThan(presente / 5);
  });

  it('detecta ambos tonos de un par DTMF', () => {
    const muestras = generarDobleTono(700, 1500);
    const mag700 = goertzel(muestras, 700, SAMPLE_RATE);
    const mag1500 = goertzel(muestras, 1500, SAMPLE_RATE);
    const magOtra = goertzel(muestras, 850, SAMPLE_RATE);
    expect(mag700).toBeGreaterThan(150);
    expect(mag1500).toBeGreaterThan(150);
    // Frecuencia vecina del mapeo pero no transmitida: mucho menor.
    expect(magOtra).toBeLessThan(Math.min(mag700, mag1500) / 3);
  });

  it('el silencio da magnitud ~0 (no hay falsos positivos)', () => {
    const silencio = new Float32Array(N);
    expect(goertzel(silencio, 700, SAMPLE_RATE)).toBeCloseTo(0, 6);
  });

  it('protege casos borde: vacío, Nyquist e inválidos', () => {
    expect(goertzel(new Float32Array(0), 700, SAMPLE_RATE)).toBe(0);
    // Sobre Nyquist (fs/2 = 22050): no fiable → 0.
    expect(goertzel(generarSeno(700), 25000, SAMPLE_RATE)).toBe(0);
    expect(goertzel(generarSeno(700), -100, SAMPLE_RATE)).toBe(0);
    expect(goertzel(generarSeno(700), 700, 0)).toBe(0);
  });

  it('calcularMagnitudes evalúa solo las frecuencias pedidas', () => {
    const muestras = generarSeno(850);
    const mags = calcularMagnitudes(muestras, [400, 850, 1350], SAMPLE_RATE);
    expect(Object.keys(mags).length).toBe(3);
    const mag850 = mags[850] ?? 0;
    const mag400 = mags[400] ?? 0;
    const mag1350 = mags[1350] ?? 0;
    expect(mag850).toBeGreaterThan(mag400);
    expect(mag850).toBeGreaterThan(mag1350);
  });
});
