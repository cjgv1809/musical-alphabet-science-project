/**
 * Constantes globales del proyecto.
 *
 * Física involucrada:
 * - Trabajamos en 300–3000 Hz (banda de voz/telefonía): propaga bien por aire
 *   en un aula ruidosa y evita el ruido grave (<300 Hz: ventiladores, pasos).
 * - La duración mínima de 50 ms por símbolo evita que ruidos impulsivos
 *   (palmadas, golpes) se confundan con una letra.
 */

// Banda de trabajo (Hz). Todo símbolo usa frecuencias dentro de este rango.
export const FRECUENCIA_MINIMA = 300;
export const FRECUENCIA_MAXIMA = 3000;

// Ventana de análisis para Goertzel (n.º de muestras por bloque).
// 1024 muestras a 44100 Hz ≈ 23 ms por ventana.
export const TAMANO_VENTANA = 1024;

// Duración mínima (ms) que un símbolo debe mantenerse para validarse.
// Mitiga ruidos impulsivos: un golpe dura <50 ms, una letra real dura más.
export const DURACION_MINIMA_MS = 50;

// N.º de ventanas consecutivas con la misma detección para aceptar el símbolo.
export const VENTANAS_CONSECUTIVAS = 2;

// Factor del umbral dinámico: umbral = ruidoPromedio * FACTOR.
// El ruido se mide en frecuencias "vacías" (no usadas por el mapeo).
export const FACTOR_UMBRAL = 3;

// Duración de cada símbolo al "tocar" (ms): fija, sin control de velocidad.
// 500 ms dan margen de sobra al decodificador (confirma en ~80 ms).
export const DURACION_SIMBOLO_MS = 500;
export const PAUSA_ENTRE_SIMBOLOS_MS = 60;
