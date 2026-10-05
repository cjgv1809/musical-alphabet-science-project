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
 * - Espacio = SILENCIO (una pausa larga). Dígitos y signos no incluidos
 *   en el prototipo (se deletrean o se omiten): 26 notas ya exigen
 *   afinar bien, y cada símbolo extra acerca los semitonos al oído.
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
  const nombre = NOMBRES_SEMITONO[indice % 12] ?? '?';
  // La octava cambia al llegar a DO (índice 3, 15, …).
  const octava = 3 + Math.floor((indice + 9) / 12);
  return `${nombre}${octava}`;
}

/** Distancia entre dos frecuencias, en cents. */
export function centsEntre(f1: number, f2: number): number {
  if (f1 <= 0 || f2 <= 0) return Number.POSITIVE_INFINITY;
  return 1200 * Math.log2(f1 / f2);
}

/**
 * Normaliza un carácter del modo instrumento: mayúsculas; el espacio
 * se conserva como silencio. El resto → `null` (sin nota).
 */
export function normalizarSimboloCromatico(caracter: string): string | null {
  if (caracter.length === 0) return null;
  if (caracter === ' ') return ' ';
  const mayuscula = caracter.toUpperCase();
  return (SIMBOLOS_CROMATICOS as readonly string[]).includes(mayuscula)
    ? mayuscula
    : null;
}

/** Frecuencia exacta (Hz) de una letra, o `null` (espacio/letra ajena). */
export function obtenerFrecuenciaNota(simbolo: string): number | null {
  const normalizado = normalizarSimboloCromatico(simbolo);
  if (normalizado === null || normalizado === ' ') return null;
  const indice = SIMBOLOS_CROMATICOS.indexOf(normalizado);
  if (indice < 0) return null;
  return frecuenciaSemitono(indice);
}

/** Nombre musical de una letra (ej. 'H' → "MI4"), o `null`. */
export function obtenerNombreNota(simbolo: string): string | null {
  const normalizado = normalizarSimboloCromatico(simbolo);
  if (normalizado === null || normalizado === ' ') return null;
  const indice = SIMBOLOS_CROMATICOS.indexOf(normalizado);
  if (indice < 0) return null;
  return nombreNota(indice);
}

export interface NotaCercana {
  simbolo: string;
  /** Desafinación en cents (negativo = grave, positivo = agudo). */
  cents: number;
}

/**
 * Dada una frecuencia medida, devuelve la letra más cercana si cae
 * dentro de la tolerancia (±45 cents). Fuera de rango o demasiado
 * desafinada → `null` (no inventamos letras).
 */
export function notaMasCercana(
  frecuencia: number,
  toleranciaCents: number = TOLERANCIA_CENTS,
): NotaCercana | null {
  if (!Number.isFinite(frecuencia) || frecuencia <= 0) return null;
  const flotante =
    12 * Math.log2(frecuencia / FRECUENCIA_BASE_CROMATICA);
  const indice = Math.round(flotante);
  if (indice < 0 || indice >= SIMBOLOS_CROMATICOS.length) return null;
  const simbolo = SIMBOLOS_CROMATICOS[indice];
  if (simbolo === undefined) return null;
  const cents = centsEntre(frecuencia, frecuenciaSemitono(indice));
  if (Math.abs(cents) > toleranciaCents) return null;
  return { simbolo, cents };
}
