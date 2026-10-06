/**
 * Salida de voz (modo accesible): la app HABLA lo transcrito.
 *
 * Usa la Web Speech API (`speechSynthesis`), disponible gratis en
 * Chrome/Edge/Firefox sin instalar nada. Las voces dependen del
 * sistema (Chrome trae Google español; en otros puede sonar robótico,
 * pero se entiende). Sin soporte → no rompe nada, solo avisa.
 */

export interface VozDisponible {
  lang: string;
  name: string;
}

/**
 * Elige la mejor voz española de la lista (pura: testeable sin micro
 * ni altavoz). Prefiere es-ES, luego cualquier es-*, si no hay, null
 * (= voz por defecto del sistema).
 */
export function elegirVozEspanola(
  voces: readonly VozDisponible[],
): number {
  let respaldo = -1;
  for (let i = 0; i < voces.length; i += 1) {
    const voz = voces[i];
    if (voz === undefined) continue;
    const lang = voz.lang.toLowerCase();
    if (lang === 'es-es' || lang === 'es_es') return i;
    if (lang.startsWith('es') && respaldo < 0) respaldo = i;
  }
  return respaldo;
}

/** ¿Hay síntesis de voz en este navegador? */
export function hayVoz(): boolean {
  return (
    typeof window !== 'undefined' && 'speechSynthesis' in window
  );
}

/**
 * Habla un texto en español. Cancela lo anterior (no se pisa).
 * Devuelve false si no hay soporte (la UI muestra el texto igual).
 */
export function hablar(texto: string): boolean {
  if (!hayVoz() || texto.trim().length === 0) return false;
  try {
    const sintesis = window.speechSynthesis;
    sintesis.cancel();
    const enunciado = new SpeechSynthesisUtterance(texto);
    enunciado.lang = 'es-ES';
    enunciado.rate = 0.95; // un poco más lento: más claro.
    const voces = sintesis.getVoices();
    const indice = elegirVozEspanola(voces);
    if (indice >= 0) {
      const voz = voces[indice];
      if (voz !== undefined) enunciado.voice = voz;
    }
    sintesis.speak(enunciado);
    return true;
  } catch {
    return false;
  }
}

/** Calla la voz (botón de parada de emergencia comunicativa). */
export function callar(): void {
  if (!hayVoz()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Sin voz no hay nada que callar.
  }
}
