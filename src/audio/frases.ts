/**
 * Fraseario esencial (modo accesible).
 *
 * Idea: deletrear letra a letra es lento (~4 s por palabra corta).
 * Estas 10 frases cubren las necesidades urgentes y sociales básicas:
 * si lo transcrito (ignorando espacios —la guitarra no produce
 * espacios, solo silencios) coincide con una frase, la app la muestra
 * en grande y la HABLA en voz alta (ver `voz.ts`).
 */

export interface FraseEsencial {
  /** Texto natural (se habla tal cual). */
  texto: string;
}

export const FRASES_ESENCIALES: readonly FraseEsencial[] = [
  { texto: 'HOLA' },
  { texto: 'SÍ' },
  { texto: 'NO' },
  { texto: 'GRACIAS' },
  { texto: 'POR FAVOR' },
  { texto: 'AGUA' },
  { texto: 'AYUDA' },
  { texto: 'BAÑO' },
  { texto: 'ME DUELE' },
  { texto: 'ADIÓS' },
] as const;

/** Normaliza para comparar: mayúsculas y sin espacios ni tildes. */
export function normalizarFrase(frase: string): string {
  return frase
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z]/g, '');
}

/**
 * ¿Lo transcrito equivale a alguna frase esencial?
 * (La guitarra no emite espacios: "MEDUELE" vale por "ME DUELE".)
 */
export function buscarFrase(
  textoTranscrito: string,
  personalizadas: readonly string[] = [],
): string | null {
  const clave = normalizarFrase(textoTranscrito);
  if (clave.length === 0) return null;
  for (const texto of [
    ...FRASES_ESENCIALES.map((f) => f.texto),
    ...personalizadas,
  ]) {
    if (normalizarFrase(texto) === clave) return texto;
  }
  return null;
}

/**
 * Frases que EMPIEZAN como lo transcrito (autocompletado): con al menos
 * 2 letras y sin ser ya la frase completa. Máximo `max` sugerencias.
 */
export function sugerirFrases(
  textoTranscrito: string,
  frases: readonly string[],
  max = 3,
): string[] {
  const clave = normalizarFrase(textoTranscrito);
  if (clave.length < 2) return [];
  const salida: string[] = [];
  for (const frase of frases) {
    const claveFrase = normalizarFrase(frase);
    if (claveFrase.length > clave.length && claveFrase.startsWith(clave)) {
      salida.push(frase);
      if (salida.length >= max) break;
    }
  }
  return salida;
}
