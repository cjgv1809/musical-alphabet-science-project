import { FRECUENCIA_MAXIMA, FRECUENCIA_MINIMA } from '../utils/constants.ts';

/**
 * Acondicionamiento de la señal del micrófono.
 *
 * Filtro pasa-banda 300–3000 Hz ANTES del análisis: deja pasar la
 * banda donde "hablamos" (nuestras notas van de 220 a 932 Hz) y
 * atenúa graves (<300 Hz: ventiladores, pasos) y agudos (>3000 Hz).
 *
 * Concepto físico: un filtro deja pasar unas frecuencias y recorta
 * otras. Usamos DOS en serie (pasa-altas + pasa-bajas) porque un único
 * "bandpass" deja una campana estrecha; nosotros queremos una VENTANA
 * ancha y plana. Es el mismo truco de la telefonía clásica.
 */

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
 * Relación señal-ruido en decibelios (dB), el medidor del panel:
 *   SNR(dB) = 20 · log₁₀(señal / ruido)
 * - > 20 dB: señal clarísima.  - 10–20 dB: bien.  - < 10 dB: dudoso.
 * Los dB son logarítmicos: +20 dB = señal 10× más fuerte que el ruido.
 */
export function calcularSnrDb(senal: number, ruido: number): number {
  if (senal <= 0) return 0;
  if (ruido <= 0) return 60; // Sin ruido medible: tope generoso del medidor.
  return 20 * Math.log10(senal / ruido);
}
