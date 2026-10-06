/**
 * Alfabeto cromático (modo instrumento, prototipo).
 *
 * Idea: en vez de DOS senos por letra (DTMF, solo para aparatos), UNA
 * nota musical por letra en escala cromática (semitonos), como una
 * melodía. Cualquier instrumento monofónico (guitarra, flauta, voz)
 * puede "hablar" tocando la melodía, y el detector de tono fundamental
 * (`tonoFundamental.ts`) la transcribe sin importar el timbre.
 *
 * Diseño:
 * - Base LA3 = 220 Hz (cuerda LA al aire de la guitarra: fácil de afinar).
 * - A = LA3, B = LA#3, C = SI3, … 26 semitonos hasta LA#5 (≈ 932 Hz).
 *   Todo el rango se toca en la guitarra entre cuerdas al aire y
 *   traste ~18, y cae en la banda limpia de 300–3000 Hz (casi todo;
 *   solo LA3/LA#3 rozan por debajo, sin problema).
 * - Signos (`. , ? ! ¿ ¡`): 6 semitonos POR DEBAJO de LA3 (155–208 Hz),
 *   todos en posiciones fáciles (cuerdas al aire y trastes 1–7).
 *   Cada signo se puede tocar como NOTA SOLA o como ACORDE con ese
 *   bajo: el detector oye la fundamental (≈ el bajo) en ambos casos.
 *   Ej. `.` = SOL3: vale la cuerda SOL al aire o un SOL mayor abierto.
 * - Espacio = RE3 (146.83 Hz, cuerda RE al aire, índice −7): el silencio
 *   no se oye, así que el espacio necesitaba nota propia; sin ella las
 *   palabras se pegaban ("HOLACOMO"). Es la nota más fácil de tocar.
 *
 * Física: en temperamento igual cada semitono multiplica por 2^(1/12)
 * (≈ 1.0595, un 6 % más agudo). El oído tolera ±45 cents (casi medio
 * semitono) de desafinación: margen pensado para manos humanas.
 */

/** Nota base del alfabeto: LA3 = 220 Hz. */
export const FRECUENCIA_BASE_CROMATICA = 220;

/** Letras cubiertas por el modo instrumento (A–Z). */
export const SIMBOLOS_CROMATICOS: readonly string[] = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;

/**
 * Signos de puntuación, de grave a agudo (índices −6…−1):
 * `.` = RE#3, `,` = MI3, `?` = FA3, `!` = FA#3, `¿` = SOL3, `¡` = SOL#3.
 */
export const SIMBOLOS_PUNTUACION: readonly string[] = [
  '.', ',', '?', '!', '¿', '¡',
] as const;

/** Índice cromático más grave: ESPACIO = RE3 (146.83 Hz). */
export const INDICE_MINIMO = -7;

/** Desafinación máxima aceptada, en cents (100 cents = 1 semitono). */
export const TOLERANCIA_CENTS = 45;

const NOMBRES_SEMITONO: readonly string[] = [
  'LA', 'LA#', 'SI', 'DO', 'DO#', 'RE',
  'RE#', 'MI', 'FA', 'FA#', 'SOL', 'SOL#',
] as const;

/** Frecuencia exacta (Hz) del semitono n.º i (0 = LA3). */
export function frecuenciaSemitono(indice: number): number {
  const frecuencia =
    FRECUENCIA_BASE_CROMATICA * Math.pow(2, indice / 12);
  return Math.round(frecuencia * 100) / 100;
}

/** Nombre musical del semitono n.º i (ej. 0 → "LA3", 3 → "DO4"). */
export function nombreNota(indice: number): string {
  // Módulo positivo: también vale para índices negativos (signos).
  const nombre = NOMBRES_SEMITONO[((indice % 12) + 12) % 12] ?? '?';
  // La octava cambia al llegar a DO (índices …, −9, 3, 15, …).
  const octava = 3 + Math.floor((indice + 9) / 12);
  return `${nombre}${octava}`;
}

/** Distancia entre dos frecuencias, en cents. */
export function centsEntre(f1: number, f2: number): number {
  if (f1 <= 0 || f2 <= 0) return Number.POSITIVE_INFINITY;
  return 1200 * Math.log2(f1 / f2);
}

/**
 * Normaliza un carácter del modo instrumento: mayúsculas y signos tal
 * cual; el espacio se conserva como silencio. El resto → `null`.
 */
export function normalizarSimboloCromatico(caracter: string): string | null {
  if (caracter.length === 0) return null;
  if (caracter === ' ') return ' ';
  if ((SIMBOLOS_PUNTUACION as readonly string[]).includes(caracter)) {
    return caracter;
  }
  const mayuscula = caracter.toUpperCase();
  return (SIMBOLOS_CROMATICOS as readonly string[]).includes(mayuscula)
    ? mayuscula
    : null;
}

/**
 * Índice cromático de un símbolo normalizado: letras 0…25,
 * signos −6…−1, espacio −7.
 */
function indiceDe(simbolo: string): number | null {
  if (simbolo === ' ') return INDICE_MINIMO; // ESPACIO = RE3.
  const indiceLetra = SIMBOLOS_CROMATICOS.indexOf(simbolo);
  if (indiceLetra >= 0) return indiceLetra;
  const indiceSigno = SIMBOLOS_PUNTUACION.indexOf(simbolo);
  if (indiceSigno >= 0) return indiceSigno + INDICE_MINIMO + 1;
  return null;
}

/** Frecuencia exacta (Hz) de letra, signo o espacio; `null` si ajeno. */
export function obtenerFrecuenciaNota(simbolo: string): number | null {
  const normalizado = normalizarSimboloCromatico(simbolo);
  if (normalizado === null) return null;
  const indice = indiceDe(normalizado);
  if (indice === null) return null;
  return frecuenciaSemitono(indice);
}

/** Nombre musical (ej. 'H' → "MI4", ' ' → "RE3"), o `null` si ajeno. */
export function obtenerNombreNota(simbolo: string): string | null {
  const normalizado = normalizarSimboloCromatico(simbolo);
  if (normalizado === null) return null;
  const indice = indiceDe(normalizado);
  if (indice === null) return null;
  return nombreNota(indice);
}

export interface NotaCercana {
  simbolo: string;
  /** Desafinación en cents (negativo = grave, positivo = agudo). */
  cents: number;
}

/**
 * Dada una frecuencia medida, devuelve la letra o signo más cercano
 * si cae dentro de la tolerancia (±45 cents). Fuera de rango o
 * demasiado desafinada → `null` (no inventamos símbolos).
 */
export function notaMasCercana(
  frecuencia: number,
  toleranciaCents: number = TOLERANCIA_CENTS,
): NotaCercana | null {
  if (!Number.isFinite(frecuencia) || frecuencia <= 0) return null;
  const flotante =
    12 * Math.log2(frecuencia / FRECUENCIA_BASE_CROMATICA);
  const indice = Math.round(flotante);
  if (indice < INDICE_MINIMO || indice >= SIMBOLOS_CROMATICOS.length) {
    return null;
  }
  const simbolo =
    indice === INDICE_MINIMO
      ? ' '
      : indice < 0
        ? (SIMBOLOS_PUNTUACION[indice - INDICE_MINIMO - 1] ?? null)
        : (SIMBOLOS_CROMATICOS[indice] ?? null);
  if (simbolo === null) return null;
  const cents = centsEntre(frecuencia, frecuenciaSemitono(indice));
  if (Math.abs(cents) > toleranciaCents) return null;
  return { simbolo, cents };
}
