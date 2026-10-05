import type { ParFrecuencias } from '../types/index.ts';
import { FRECUENCIA_MAXIMA, FRECUENCIA_MINIMA } from '../utils/constants.ts';

/**
 * Mapeo letra → par de frecuencias (DTMF extendido).
 *
 * Concepto físico (para la feria de ciencias):
 * - Como los teléfonos de tonos (DTMF), cada símbolo se codifica con DOS
 *   tonos simultáneos: uno del grupo bajo (filas) y otro del grupo alto
 *   (columnas). El oído lo percibe como un "acorde" de dos notas.
 * - Usar dos tonos en vez de uno evita colisiones: un ruido que contenga
 *   UNA frecuencia (ej. un silbido) no se confunde con una letra, porque
 *   para aceptar un símbolo exigimos ver el PAR completo con intensidades
 *   parecidas (ver `decoder.ts`, control de "twist").
 * - Todas las frecuencias están en 300–3000 Hz (banda de voz/telefonía):
 *   el altavoz y el micrófono de un móvil responden bien ahí, y evitamos
 *   el ruido grave (<300 Hz: ventiladores, pasos, mesas).
 *
 * Diseño de la parrilla (6 filas × 7 columnas = 42 combinaciones):
 * - Filas (grupo bajo):  400, 550, 700, 850, 1000, 1150 Hz (separación 150 Hz)
 * - Columnas (grupo alto): 1350, 1500, 1650, 1800, 1950, 2100, 2250 Hz
 * - Separación mínima de 150 Hz: con ventanas de 1024 muestras a 44100 Hz
 *   la resolución es ~43 Hz, así que 150 Hz da margen de sobra para que el
 *   algoritmo de Goertzel distinga tonos vecinos incluso con ruido.
 * - Hay un hueco de 200 Hz entre grupos (1150 → 1350) para que nunca se
 *   confunda una frecuencia baja con una alta.
 *
 * Nota honesta sobre armónicos: todo sonido real genera armónicos
 * (múltiplos: 400 Hz → 800, 1200…). Algunos caen cerca de otras notas de
 * la parrilla, pero suenan mucho más flojos que la fundamental, y como
 * exigimos el PAR con intensidades equilibradas, no provocan falsos
 * positivos. ¡Es un gran tema para explicar en el stand!
 */

/** Grupo bajo (filas de la parrilla). */
export const GRUPO_FRECUENCIAS_BAJAS: readonly number[] = [
  400, 550, 700, 850, 1000, 1150,
] as const;

/** Grupo alto (columnas de la parrilla). */
export const GRUPO_FRECUENCIAS_ALTAS: readonly number[] = [
  1350, 1500, 1650, 1800, 1950, 2100, 2250,
] as const;

/**
 * Símbolos soportados, en el orden en que ocupan la parrilla
 * (por filas: A-G en fila 1, H-N en fila 2, …).
 * Total: 26 letras + 10 dígitos + espacio + `.` `,` `?` `!` = 41 símbolos.
 * La parrilla admite 42: queda UNA combinación libre (reserva futura).
 */
export const SIMBOLOS_SOPORTADOS: readonly string[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U',
  'V', 'W', 'X', 'Y', 'Z', '0',
  '1', '2', '3', '4', '5', '6',
  '7', '8', '9', ' ', '.', ',',
  '?', '!',
] as const;

function construirMapa(): Readonly<Record<string, ParFrecuencias>> {
  const mapa: Record<string, ParFrecuencias> = {};
  const columnas = GRUPO_FRECUENCIAS_ALTAS.length;
  for (let i = 0; i < SIMBOLOS_SOPORTADOS.length; i += 1) {
    const simbolo = SIMBOLOS_SOPORTADOS[i];
    const fila = Math.floor(i / columnas);
    const columna = i % columnas;
    const fBaja = GRUPO_FRECUENCIAS_BAJAS[fila];
    const fAlta = GRUPO_FRECUENCIAS_ALTAS[columna];
    // Las tablas están dimensionadas para que esto siempre exista;
    // la guarda es solo para satisfacer a TypeScript estricto.
    if (simbolo === undefined || fBaja === undefined || fAlta === undefined) {
      continue;
    }
    mapa[simbolo] = { fBaja, fAlta };
  }
  return mapa;
}

/** Símbolo → su par de frecuencias. */
export const MAPA_FRECUENCIAS: Readonly<Record<string, ParFrecuencias>> =
  construirMapa();

/** Todas las frecuencias del mapeo (bajas + altas), para el detector. */
export const TODAS_LAS_FRECUENCIAS: readonly number[] = [
  ...GRUPO_FRECUENCIAS_BAJAS,
  ...GRUPO_FRECUENCIAS_ALTAS,
] as const;

/**
 * Normaliza un carácter: minúsculas → mayúsculas.
 * Devuelve `null` si el carácter no es transmisible (ej. tildes, ñ, #).
 * Nota educativa: la "ñ" no cabe en 41 símbolos; en la demo se escribe "N".
 */
export function normalizarSimbolo(caracter: string): string | null {
  if (caracter.length === 0) return null;
  const mayuscula = caracter.toUpperCase();
  return mayuscula in MAPA_FRECUENCIAS ? mayuscula : null;
}

/** ¿Este símbolo se puede transmitir? */
export function esSimboloSoportado(simbolo: string): boolean {
  return simbolo in MAPA_FRECUENCIAS;
}

/**
 * Obtiene el par de frecuencias de un símbolo (acepta minúsculas).
 * Devuelve `null` si no es soportado.
 */
export function obtenerFrecuencias(simbolo: string): ParFrecuencias | null {
  const normalizado = normalizarSimbolo(simbolo);
  if (normalizado === null) return null;
  const par = MAPA_FRECUENCIAS[normalizado];
  return par ?? null;
}

/**
 * Búsqueda inversa: dado un par (fBaja, fAlta), devuelve el símbolo.
 * Devuelve `null` para la combinación libre de reserva.
 */
export function obtenerSimboloPorPar(
  fBaja: number,
  fAlta: number,
): string | null {
  for (const simbolo of SIMBOLOS_SOPORTADOS) {
    const par = MAPA_FRECUENCIAS[simbolo];
    if (par !== undefined && par.fBaja === fBaja && par.fAlta === fAlta) {
      return simbolo;
    }
  }
  return null;
}

/** Valida que una frecuencia esté dentro de la banda de voz. */
export function estaEnBandaDeVoz(frecuencia: number): boolean {
  return frecuencia >= FRECUENCIA_MINIMA && frecuencia <= FRECUENCIA_MAXIMA;
}
