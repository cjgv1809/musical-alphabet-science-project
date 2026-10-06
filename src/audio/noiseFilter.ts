import {
  FACTOR_UMBRAL,
  FRECUENCIA_MAXIMA,
  FRECUENCIA_MINIMA,
  UMBRAL_MINIMO,
} from '../utils/constants.ts';

/**
 * Filtros y umbrales contra el ruido.
 *
 * Estrategia en 4 capas:
 * 1. Filtro pasa-banda 300–3000 Hz ANTES del análisis (este archivo).
 * 2. Umbral dinámico según el ruido medido (este archivo).
 * 3. Duración mínima por símbolo (ver `decoder.ts`).
 * 4. Suavizado temporal: varias ventanas seguidas (ver `decoder.ts`).
 *
 * Concepto físico: un filtro pasa-banda deja pasar solo la banda donde
 * "hablamos" y atenúa lo demás. Los ventiladores y pasos suenan grave
 * (<300 Hz) y los chillidos agudos (>3000 Hz): el filtro los recorta
 * antes de que lleguen al detector, mejorando la relación señal-ruido.
 */

/**
 * Frecuencias "vacías" (no pertenecen al mapeo) donde medimos el ruido
 * de fondo. Están dentro de la banda pero lejos de nuestras 13 notas:
 * si ahí hay energía, es ruido del ambiente, no una letra.
 */
export const FRECUENCIAS_REFERENCIA_RUIDO: readonly number[] = [
  310, 1200, 2320, 2500, 2750,
] as const;

/** Cadena de filtros pasa-banda construida sobre un AudioContext. */
export interface CadenaAntiRuido {
  /** Punto de entrada: conectar aquí la fuente del micrófono. */
  entrada: GainNode;
  /** Punto de salida: conectar aquí el analizador. */
  salida: GainNode;
  /** Recorta graves por debajo de 300 Hz (ventiladores, pasos). */
  filtroPasaAltas: BiquadFilterNode;
  /** Recorta agudos por encima de 3000 Hz (chillidos, ultrasonidos). */
  filtroPasaBajas: BiquadFilterNode;
}

/**
 * Crea la cadena pasa-banda: micrófono → pasa-altas (300 Hz) →
 * pasa-bajas (3000 Hz) → analizador.
 *
 * Se usan DOS filtros en serie (no uno solo) porque un único "bandpass"
 * deja pasar una campana estrecha; nosotros queremos una VENTANA ancha
 * y plana de 300 a 3000 Hz. Es el mismo truco de la telefonía clásica.
 */
export function crearCadenaAntiRuido(
  contexto: AudioContext,
): CadenaAntiRuido {
  const entrada = contexto.createGain();
  const salida = contexto.createGain();

  const filtroPasaAltas = contexto.createBiquadFilter();
  filtroPasaAltas.type = 'highpass';
  filtroPasaAltas.frequency.value = FRECUENCIA_MINIMA;
  filtroPasaAltas.Q.value = 0.7;

  const filtroPasaBajas = contexto.createBiquadFilter();
  filtroPasaBajas.type = 'lowpass';
  filtroPasaBajas.frequency.value = FRECUENCIA_MAXIMA;
  filtroPasaBajas.Q.value = 0.7;

  entrada.connect(filtroPasaAltas);
  filtroPasaAltas.connect(filtroPasaBajas);
  filtroPasaBajas.connect(salida);

  return { entrada, salida, filtroPasaAltas, filtroPasaBajas };
}

/**
 * Estima el ruido de fondo como el promedio de las magnitudes medidas
 * en las frecuencias "vacías". Promedio (no máximo) para que un pico
 * aislado no dispare el umbral.
 */
export function estimarRuidoDeFondo(
  magnitudesReferencia: readonly number[],
): number {
  if (magnitudesReferencia.length === 0) return 0;
  let suma = 0;
  for (const magnitud of magnitudesReferencia) suma += magnitud;
  return suma / magnitudesReferencia.length;
}

/**
 * Umbral dinámico: se adapta al ruido del aula.
 * - Aula silenciosa → umbral bajo → sensible.
 * - Aula ruidosa → umbral alto → solo acepta tonos claros y fuertes.
 * El suelo mínimo evita que con silencio total (ruido ≈ 0) cualquier
 * residuo matemático cuele como letra.
 */
export function calcularUmbralDinamico(nivelRuido: number): number {
  return Math.max(nivelRuido * FACTOR_UMBRAL, UMBRAL_MINIMO);
}

/**
 * Relación señal-ruido en decibelios (dB), el indicador estrella del stand:
 *   SNR(dB) = 20 · log₁₀(señal / ruido)
 * - > 20 dB: señal clarísima.  - 10–20 dB: bien.  - < 10 dB: dudoso.
 * Los dB son logarítmicos: +20 dB = señal 10× más fuerte que el ruido.
 */
export function calcularSnrDb(senal: number, ruido: number): number {
  if (senal <= 0) return 0;
  if (ruido <= 0) return 60; // Sin ruido medible: tope generoso del medidor.
  return 20 * Math.log10(senal / ruido);
}
