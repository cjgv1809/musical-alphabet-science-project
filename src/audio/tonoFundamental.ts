/**
 * Estimador del tono fundamental (YIN simplificado).
 *
 * Problema: una guitarra toca UNA nota con MUCHOS armónicos
 * (f, 2f, 3f…). Goertzel diría "veo varias notas"; nosotros queremos
 * LA nota que el oído percibe: la fundamental (el periodo más largo).
 *
 * Método YIN (de Cheveigné, 2002), en 4 pasos:
 * 1. Función diferencia d(τ): compara la onda consigo misma desplazada
 *    τ muestras. Si la onda es periódica de periodo T, d(T) ≈ 0.
 * 2. Normalización acumulativa: divide por el promedio hasta τ. Sin
 *    esto, los valles en 2T, 3T (octavas graves falsas) ganarían siempre.
 * 3. Primer valle bajo el umbral (0.15), NO el mínimo global: así se
 *    evita elegir múltiplos del periodo (el error de octava clásico).
 * 4. Interpolación parabólica para precisión de fracción de muestra.
 *
 * Devuelve también la "claridad" (0–1): 1 = tono puro y estable,
 * ~0 = ruido. Sirve como medidor y como control de calidad.
 */

export interface EstimacionTono {
  /** Frecuencia fundamental estimada, en Hz. */
  frecuencia: number;
  /** Periodicidad 0–1 (1 = tono clarísimo). */
  claridad: number;
}

/** Valle aceptado si la diferencia normalizada baja de 0.15. */
const UMBRAL_YIN = 0.15;
/** Energía mínima (RMS): por debajo es silencio, no un tono. */
const RMS_MINIMO = 0.01;

export function estimarFrecuenciaFundamental(
  muestras: Float32Array,
  sampleRate: number,
  freqMin = 150,
  freqMax = 1500,
): EstimacionTono | null {
  const n = muestras.length;
  if (n < 256 || sampleRate <= 0) return null;

  // Centrar (quitar DC) y puerta de silencio: los micros reales
  // siempre traen un pequeño offset y ruido de fondo.
  let media = 0;
  for (let i = 0; i < n; i += 1) media += muestras[i] ?? 0;
  media /= n;
  const x = new Float64Array(n);
  let energia = 0;
  for (let i = 0; i < n; i += 1) {
    const centrada = (muestras[i] ?? 0) - media;
    x[i] = centrada;
    energia += centrada * centrada;
  }
  if (Math.sqrt(energia / n) < RMS_MINIMO) return null;

  const tauMin = Math.max(2, Math.floor(sampleRate / freqMax));
  let tauMax = Math.ceil(sampleRate / freqMin);
  tauMax = Math.min(tauMax, n - 64);
  if (tauMax <= tauMin) return null;

  // Ventana fija para todos los τ (así los valores son comparables).
  const ventana = n - tauMax;

  // 1. Función diferencia.
  const dif = new Float64Array(tauMax + 1);
  for (let tau = 0; tau <= tauMax; tau += 1) {
    let suma = 0;
    for (let j = 0; j < ventana; j += 1) {
      const d = (x[j] ?? 0) - (x[j + tau] ?? 0);
      suma += d * d;
    }
    dif[tau] = suma;
  }

  // 2. Normalización acumulativa.
  const norm = new Float64Array(tauMax + 1);
  norm[0] = 1;
  let acumulado = 0;
  for (let tau = 1; tau <= tauMax; tau += 1) {
    acumulado += dif[tau] ?? 0;
    norm[tau] = acumulado === 0 ? 1 : ((dif[tau] ?? 0) * tau) / acumulado;
  }

  // 3. Primer valle bajo el umbral (y su mínimo local).
  let tauEst = -1;
  for (let tau = tauMin; tau <= tauMax; tau += 1) {
    if ((norm[tau] ?? 1) < UMBRAL_YIN) {
      while (tau + 1 <= tauMax && (norm[tau + 1] ?? 1) < (norm[tau] ?? 1)) {
        tau += 1;
      }
      tauEst = tau;
      break;
    }
  }
  if (tauEst < 0) return null;

  // 4. Interpolación parabólica (estándar): ajusta una parábola a los
  // tres puntos del valle y corrige la fracción de muestra.
  const y0 = norm[tauEst - 1] ?? (norm[tauEst] ?? 0);
  const y1 = norm[tauEst] ?? 0;
  const y2 = norm[tauEst + 1] ?? (norm[tauEst] ?? 0);
  const denominador = y0 + y2 - 2 * y1;
  const correccion =
    denominador !== 0 ? (0.5 * (y0 - y2)) / denominador : 0;
  const tauInterp = tauEst + Math.max(-1, Math.min(1, correccion));

  const claridad = Math.max(0, Math.min(1, 1 - y1));
  return { frecuencia: sampleRate / tauInterp, claridad };
}
