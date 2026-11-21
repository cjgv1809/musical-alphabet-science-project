/**
 * Constantes globales del proyecto.
 *
 * Física involucrada:
 * - El micrófono se filtra entre 100 y 3000 Hz: deja pasar todas las notas
 *   (146.83–932 Hz) y evita el ruido grave (<100 Hz: ventiladores, pasos).
 * - La duración mínima por símbolo (100 ms) evita que ruidos impulsivos
 *   (palmadas, golpes) se confundan con una letra.
 */

// Corte del pasa-altas del micrófono (Hz). Las notas más graves (espacio
// RE3 = 146.83 Hz, signos 155–208 Hz y A–F = 220–293 Hz) caen por debajo
// de 300 Hz: un corte a 300 Hz las atenuaría (hasta -13 dB) y con timbres
// ricos en armónicos YIN podría confundirlas con su octava. A 100 Hz se
// sigue recortando el ruido grave.
export const FRECUENCIA_CORTE_GRAVES = 100;

// Corte del pasa-bajas del micrófono (Hz): recorta chillidos y ultrasonidos.
export const FRECUENCIA_MAXIMA = 3000;

// Ventana de análisis para YIN (n.º de muestras por bloque).
// 1024 muestras a 44100 Hz ≈ 23 ms por ventana.
export const TAMANO_VENTANA = 1024;

// Duración mínima (ms) que un símbolo debe mantenerse para validarse.
// Mitiga ruidos impulsivos (un golpe dura <50 ms) y sílabas habladas: una
// nota de guitarra se sostiene bastante más que una sílaba con tono fijo.
export const DURACION_MINIMA_MS = 80;

// N.º de ventanas consecutivas (con tono estable) para aceptar el símbolo.
// Con ventanas cada 40 ms, 3 ventanas son unos 80 ms.
export const VENTANAS_CONSECUTIVAS = 3;

// Duración de cada símbolo al "tocar" (ms): fija, sin control de velocidad.
// 500 ms dan margen de sobra al decodificador (confirma en ~80 ms).
export const DURACION_SIMBOLO_MS = 500;
export const PAUSA_ENTRE_SIMBOLOS_MS = 60;
