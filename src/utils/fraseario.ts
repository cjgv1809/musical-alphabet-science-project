import { FRASES_ESENCIALES, normalizarFrase } from '../audio/frases.ts';

/**
 * Frases personalizadas del usuario (nombre, medicación, dirección…).
 * Se guardan en el dispositivo; la lógica de validación es pura.
 */

const CLAVE = 'notas-que-hablan:frases:v1';
export const MAX_FRASES = 20;
export const MAX_LONGITUD = 40;

export interface ResultadoAgregar {
  frases: string[];
  /** Mensaje para el usuario si no se pudo añadir. */
  error: string | null;
}

/** Valida y añade una frase. Compara sin tildes ni espacios (como la guitarra). */
export function agregarFrase(
  actuales: readonly string[],
  entrada: string,
): ResultadoAgregar {
  const frase = entrada.trim().replace(/\s+/g, ' ');
  const sinCambios = [...actuales];
  const clave = normalizarFrase(frase);
  if (clave.length === 0) {
    return { frases: sinCambios, error: 'La frase necesita al menos una letra (A–Z).' };
  }
  if (frase.length > MAX_LONGITUD) {
    return { frases: sinCambios, error: `Máximo ${MAX_LONGITUD} caracteres.` };
  }
  if (actuales.length >= MAX_FRASES) {
    return { frases: sinCambios, error: `Máximo ${MAX_FRASES} frases propias.` };
  }
  const existentes = [...FRASES_ESENCIALES.map((f) => f.texto), ...actuales];
  if (existentes.some((f) => normalizarFrase(f) === clave)) {
    return { frases: sinCambios, error: 'Esa frase ya existe.' };
  }
  return { frases: [...actuales, frase], error: null };
}

export function cargarFrasesPersonalizadas(): string[] {
  try {
    const texto = window.localStorage.getItem(CLAVE);
    const datos: unknown = texto === null ? [] : JSON.parse(texto);
    if (!Array.isArray(datos)) return [];
    return datos
      .filter((f): f is string => typeof f === 'string')
      .filter((f) => f.length <= MAX_LONGITUD && normalizarFrase(f).length > 0)
      .slice(0, MAX_FRASES);
  } catch {
    return [];
  }
}

export function guardarFrasesPersonalizadas(frases: readonly string[]): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(frases));
  } catch {
    // Sin almacenamiento: las frases valen solo para esta sesión.
  }
}
