import { describe, expect, it } from 'vitest';
import { DecodificadorSuavizado, analizarVentana, detectarEnVentana } from './decoder.ts';
import { obtenerFrecuencias } from './frequencies.ts';
import {
  calcularSnrDb,
  calcularUmbralDinamico,
  estimarRuidoDeFondo,
} from './noiseFilter.ts';
import { UMBRAL_MINIMO } from '../utils/constants.ts';

/**
 * Tests de decodificación con señales sintéticas.
 * Generamos por software el "acorde" de dos tonos de cada letra
 * y comprobamos que el detector lo reconoce, que el silencio no
 * produce letras fantasma y que el suavizado temporal funciona.
 */

const SAMPLE_RATE = 44100;
const N = 1024;

/** Síntesis de un símbolo: suma de sus dos tonos (como un altavoz). */
function sintetizarSimbolo(simbolo: string, amplitud = 0.5): Float32Array {
  const par = obtenerFrecuencias(simbolo);
  if (par === null) throw new Error(`Símbolo no soportado: ${simbolo}`);
  const muestras = new Float32Array(N);
  for (let i = 0; i < N; i += 1) {
    muestras[i] =
      amplitud * Math.sin((2 * Math.PI * par.fBaja * i) / SAMPLE_RATE) +
      amplitud * Math.sin((2 * Math.PI * par.fAlta * i) / SAMPLE_RATE);
  }
  return muestras;
}

describe('decoder (audio → texto)', () => {
  it('reconoce símbolos sintéticos (A, H, espacio, 5, ?)', () => {
    for (const simbolo of ['A', 'H', ' ', '5', '?']) {
      const deteccion = detectarEnVentana(
        sintetizarSimbolo(simbolo),
        SAMPLE_RATE,
      );
      expect(deteccion?.simbolo).toBe(simbolo);
    }
  });

  it('el silencio y el ruido débil no producen símbolos', () => {
    const silencio = new Float32Array(N);
    expect(detectarEnVentana(silencio, SAMPLE_RATE)).toBe(null);
    // Un solo tono (ej. un silbido) NO es una letra: falta el par.
    const unSoloTono = new Float32Array(N);
    for (let i = 0; i < N; i += 1) {
      unSoloTono[i] = 0.5 * Math.sin((2 * Math.PI * 700 * i) / SAMPLE_RATE);
    }
    expect(detectarEnVentana(unSoloTono, SAMPLE_RATE)).toBe(null);
  });

  it('una señal clara pero débil también se detecta', () => {
    // Amplitud 0.05 → magnitud ≈ 25, por encima del umbral mínimo (8).
    const debil = sintetizarSimbolo('E', 0.05);
    expect(detectarEnVentana(debil, SAMPLE_RATE)?.simbolo).toBe('E');
  });

  it('analizarVentana expone el par más fuerte y el umbral (diagnóstico)', () => {
    const analisis = analizarVentana(sintetizarSimbolo('A'), SAMPLE_RATE);
    expect(analisis?.mejorBaja.frecuencia).toBe(400);
    expect(analisis?.mejorAlta.frecuencia).toBe(1350);
    expect(analisis?.mejorBaja.magnitud).toBeGreaterThan(
      analisis?.umbral ?? 0,
    );
    expect(analizarVentana(new Float32Array(0), SAMPLE_RATE)).toBe(null);
  });

  it('tolera tonos desequilibrados (altavoz pequeño con graves flojos)', () => {
    // La nota baja al 20 % y la alta al 100 %: desequilibrio 5×, típico
    // de un portátil. Vale porque cada nota sigue ganando en su grupo.
    const par = obtenerFrecuencias('H');
    if (par === null) throw new Error('H debe existir en el mapeo');
    const muestras = new Float32Array(N);
    for (let i = 0; i < N; i += 1) {
      muestras[i] =
        0.1 * Math.sin((2 * Math.PI * par.fBaja * i) / SAMPLE_RATE) +
        0.5 * Math.sin((2 * Math.PI * par.fAlta * i) / SAMPLE_RATE);
    }
    expect(detectarEnVentana(muestras, SAMPLE_RATE)?.simbolo).toBe('H');
  });

  it('el suavizado exige varias ventanas + duración mínima', () => {
    const dec = new DecodificadorSuavizado();
    const tonoA = sintetizarSimbolo('A');
    // 1.ª ventana: candidata pero aún no confirmada.
    expect(dec.procesar(tonoA, SAMPLE_RATE, 0)).toBe(null);
    // 2.ª ventana tras 60 ms (≥ 50 ms): se confirma.
    const confirmada = dec.procesar(tonoA, SAMPLE_RATE, 60);
    expect(confirmada?.simbolo).toBe('A');
    // Mientras el tono sigue: NO duplica.
    expect(dec.procesar(tonoA, SAMPLE_RATE, 120)).toBe(null);
    // Pausa de silencio → la misma letra puede emitirse otra vez.
    dec.procesar(new Float32Array(N), SAMPLE_RATE, 200);
    expect(dec.procesar(tonoA, SAMPLE_RATE, 300)).toBe(null);
    expect(dec.procesar(tonoA, SAMPLE_RATE, 370)?.simbolo).toBe('A');
  });

  it('una ráfaga breve (palmada) no se confirma como letra', () => {
    const dec = new DecodificadorSuavizado();
    const tonoB = sintetizarSimbolo('B');
    // Solo UNA ventana y desaparece: insuficiente.
    expect(dec.procesar(tonoB, SAMPLE_RATE, 0)).toBe(null);
    expect(dec.procesar(new Float32Array(N), SAMPLE_RATE, 30)).toBe(null);
    // Y no quedó "a medias": una ventana aislada posterior tampoco emite.
    expect(dec.procesar(tonoB, SAMPLE_RATE, 1000)).toBe(null);
  });
});

describe('noiseFilter (umbral dinámico y SNR)', () => {
  it('estima el ruido como promedio de las referencias', () => {
    expect(estimarRuidoDeFondo([2, 4, 6])).toBeCloseTo(4);
    expect(estimarRuidoDeFondo([])).toBe(0);
  });

  it('el umbral nunca baja del mínimo y crece con el ruido', () => {
    // Con silencio total (ruido 0), el suelo evita falsos positivos.
    expect(calcularUmbralDinamico(0)).toBe(UMBRAL_MINIMO);
    // Con barullo, el umbral sube: solo pasan tonos fuertes.
    expect(calcularUmbralDinamico(10)).toBe(30);
    expect(calcularUmbralDinamico(10)).toBeGreaterThan(
      calcularUmbralDinamico(2),
    );
  });

  it('la SNR crece con la señal y cae con el ruido', () => {
    const buena = calcularSnrDb(250, 2);
    expect(buena).toBeGreaterThan(20); // señal clarísima de laboratorio
    expect(calcularSnrDb(20, 2)).toBeLessThan(buena);
    expect(calcularSnrDb(20, 10)).toBeLessThan(calcularSnrDb(20, 2));
    expect(calcularSnrDb(0, 5)).toBe(0);
  });
});
