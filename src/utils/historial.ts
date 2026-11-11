/**
 * Historial de lo que la app dijo en voz alta (frases y textos).
 * Lista corta, la más reciente primero, guardada en el dispositivo.
 */

const CLAVE = 'notas-que-hablan:historial:v1';
export const MAX_HISTORIAL = 10;

/** Pone `frase` primera, sin repetidos y con un máximo (puro). */
export function agregarAlHistorial(
  historial: readonly string[],
  frase: string,
  max: number = MAX_HISTORIAL,
): string[] {
  const limpia = frase.trim();
  if (limpia === '') return [...historial];
  return [limpia, ...historial.filter((f) => f !== limpia)].slice(0, max);
}

export function cargarHistorial(): string[] {
  try {
    const texto = window.localStorage.getItem(CLAVE);
    const datos: unknown = texto === null ? [] : JSON.parse(texto);
    if (!Array.isArray(datos)) return [];
    return datos
      .filter((f): f is string => typeof f === 'string' && f.trim() !== '')
      .slice(0, MAX_HISTORIAL);
  } catch {
    return [];
  }
}

export function guardarHistorial(historial: readonly string[]): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(historial));
  } catch {
    // Sin almacenamiento: el historial vale solo para esta sesión.
  }
}
