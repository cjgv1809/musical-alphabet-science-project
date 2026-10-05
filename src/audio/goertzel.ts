/**
 * Algoritmo de Goertzel — detector eficiente de frecuencias concretas.
 *
 * Concepto matemático (análisis de Fourier, para la feria):
 * - La transformada de Fourier descompone un sonido en sus frecuencias.
 *   La FFT calcula TODAS (cara si solo nos interesan 13 notas).
 * - Goertzel calcula UN solo "casillero" de la transformada discreta
 *   (DFT): cuánto de la frecuencia objetivo hay en estas N muestras.
 *   Es O(N) por frecuencia frente a O(N·log N) de la FFT completa.
 * - Idea intuitiva: multiplica la señal por una onda de referencia
 *   (seno/coseno a la frecuencia objetivo) y suma. Si la señal contiene
 *   esa nota, las crestas coinciden y la suma crece; si no, se cancelan.
 *
 * Recurrencia (filtro IIR de 2.º orden):
 *   s[n] = x[n] + 2·cos(ω)·s[n-1] − s[n-2],  con ω = 2π·f/fs
 *   magnitud² = s[N-1]² + s[N-2]² − 2·cos(ω)·s[N-1]·s[N-2]
 *
 * Para una sinusoide de amplitud A con N muestras: magnitud ≈ A·N/2.
 * Ejemplo: A=0.5, N=1024 → magnitud ≈ 256 en la frecuencia correcta
 * y cercana a 0 en las demás.
 */

/**
 * Calcula la magnitud de UNA frecuencia objetivo en un bloque de muestras.
 *
 * @param muestras Bloque de audio (ej. 1024 muestras del micrófono).
 * @param frecuenciaObjetivo Frecuencia a buscar, en Hz.
 * @param sampleRate Frecuencia de muestreo en Hz (ej. 44100 o 48000).
 * @returns Magnitud (≥ 0). Mayor = más presencia de esa frecuencia.
 */
export function goertzel(
  muestras: Float32Array,
  frecuenciaObjetivo: number,
  sampleRate: number,
): number {
  const n = muestras.length;
  if (n === 0) return 0;
  if (!Number.isFinite(frecuenciaObjetivo) || !Number.isFinite(sampleRate)) {
    return 0;
  }
  // Fuera de rango físico no hay nada que buscar:
  // bajo 0 Hz o sobre Nyquist (fs/2) el resultado no es fiable.
  if (frecuenciaObjetivo <= 0 || frecuenciaObjetivo >= sampleRate / 2) {
    return 0;
  }
  if (sampleRate <= 0) return 0;

  // ω: cuántos radianes avanza la onda de referencia por muestra.
  const omega = (2 * Math.PI * frecuenciaObjetivo) / sampleRate;
  const coseno = Math.cos(omega);
  const coeficiente = 2 * coseno;

  // Recurrencia del filtro resonante (solo 2 estados: memoria mínima).
  let sAnterior = 0;
  let sAnterior2 = 0;
  for (let i = 0; i < n; i += 1) {
    const muestra = muestras[i] ?? 0;
    const s = muestra + coeficiente * sAnterior - sAnterior2;
    sAnterior2 = sAnterior;
    sAnterior = s;
  }

  // Magnitud al cuadrado (teorema: |DFT(k)|² con esta recurrencia)…
  const magnitudCuadrada =
    sAnterior * sAnterior + sAnterior2 * sAnterior2 - coeficiente * sAnterior * sAnterior2;
  // …y raíz para devolver magnitud lineal (puede dar -0.0000001 por
  // redondeo: se protege con Math.max(0, ·)).
  return Math.sqrt(Math.max(0, magnitudCuadrada));
}

/**
 * Evalúa VARIAS frecuencias objetivo sobre el mismo bloque.
 * Es lo que usa el decodificador: solo miramos las 13 notas del mapeo
 * (+ referencias de ruido), no todo el espectro.
 *
 * @returns Mapa frecuencia → magnitud.
 */
export function calcularMagnitudes(
  muestras: Float32Array,
  frecuencias: readonly number[],
  sampleRate: number,
): Readonly<Record<number, number>> {
  const resultado: Record<number, number> = {};
  for (const frecuencia of frecuencias) {
    resultado[frecuencia] = goertzel(muestras, frecuencia, sampleRate);
  }
  return resultado;
}
