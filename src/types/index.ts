/**
 * Tipos compartidos de la WebApp "Alfabeto Musical Tocado".
 *
 * Convención de idioma (pedida en el proyecto):
 * - Español cuando es natural (tocarMensaje, textoDecodificado).
 * - Inglés para términos técnicos estándar (sampleRate, magnitude, frequency).
 */

/** Símbolo transmisible: letra, número o signo soportado por el mapeo. */
export type Simbolo = string;

/** Par de frecuencias (Hz) que codifica un símbolo, estilo DTMF. */
export interface ParFrecuencias {
  /** Frecuencia baja del par (grupo de filas). */
  fBaja: number;
  /** Frecuencia alta del par (grupo de columnas). */
  fAlta: number;
}

/** Entrada del alfabeto: símbolo visible + su par de frecuencias. */
export interface EntradaAlfabeto {
  simbolo: Simbolo;
  frecuencias: ParFrecuencias;
}

/** Estado del motor de audio (Tone.js / Web Audio API). */
export type EstadoAudio = 'inactivo' | 'tocando' | 'escuchando' | 'error';

/** Nivel de señal medido para el indicador señal/ruido. */
export interface NivelSenal {
  /** Magnitud de la señal detectada (0..1 normalizado aprox.). */
  senal: number;
  /** Nivel de ruido de fondo estimado (0..1). */
  ruido: number;
  /** Relación señal-ruido en dB (concepto educativo clave). */
  snrDb: number;
}
