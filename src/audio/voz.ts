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

/**
 * Pasa un texto a ortografía natural para la voz ("NO" → "No",
 * "ME DUELE" → "Me duele"). Imprescindible: la síntesis en español
 * interpreta "NO" en mayúsculas como la abreviatura de "noroeste"
 * (punto cardinal) y lo dice mal. Las minúsculas no se tocan y las
 * letras sueltas ("A") se conservan para que se deletreen.
 */
export function textoParaVoz(texto: string): string {
  return texto.replace(/[A-ZÁÉÍÓÚÜÑ]+/g, (palabra) =>
    palabra.length <= 1
      ? palabra
      : (palabra[0] ?? '') + palabra.slice(1).toLowerCase(),
  );
}

/** ¿Hay síntesis de voz en este navegador? */
export function hayVoz(): boolean {
  return (
    typeof window !== 'undefined' && 'speechSynthesis' in window
  );
}

/**
 * Habla un texto en español con ortografía natural ("NO" se dice "no",
 * no "noroeste"). Cancela lo anterior (no se pisa).
 * @param alTerminar se llama UNA vez al terminar o fallar (para que la
 * app sepa cuándo puede volver a escuchar sin oírse a sí misma).
 * @returns false si no hay soporte (la UI muestra el texto igual).
 */
export function hablar(texto: string, alTerminar?: () => void): boolean {
  let terminado = false;
  const avisarFin = (): void => {
    if (!terminado) {
      terminado = true;
      alTerminar?.();
    }
  };
  if (!hayVoz() || texto.trim().length === 0) {
    avisarFin();
    return false;
  }
  try {
    const sintesis = window.speechSynthesis;
    sintesis.cancel();
    const enunciado = new SpeechSynthesisUtterance(textoParaVoz(texto));
    enunciado.lang = 'es-ES';
    enunciado.rate = 0.95; // un poco más lento: más claro.
    enunciado.onend = avisarFin;
    enunciado.onerror = avisarFin;
    const voces = sintesis.getVoices();
    const indice = elegirVozEspanola(voces);
    if (indice >= 0) {
      const voz = voces[indice];
      if (voz !== undefined) enunciado.voice = voz;
    }
    sintesis.speak(enunciado);
    return true;
  } catch {
    avisarFin();
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
