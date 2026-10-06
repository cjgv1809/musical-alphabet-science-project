/**
 * Tipos compartidos de la WebApp (guitarra → palabras).
 *
 * Convención de idioma:
 * - Español cuando es natural (textoTranscrito, fraseDetectada).
 * - Inglés para términos técnicos estándar (sampleRate, snrDb).
 */

/** Nivel de señal medido para el indicador señal/ruido. */
export interface NivelSenal {
  /** Magnitud de la señal detectada (0..1 normalizado aprox.). */
  senal: number;
  /** Nivel de ruido de fondo estimado (0..1). */
  ruido: number;
  /** Relación señal-ruido en dB (concepto educativo clave). */
  snrDb: number;
}
