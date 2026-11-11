import { useEffect, useState } from 'react';
import { hayVoz, listarVocesEspanolas } from '../audio/voz.ts';

/** Nombres de las voces en español instaladas (se cargan de forma asíncrona). */
export function useVocesEspanolas(): string[] {
  const [voces, setVoces] = useState<string[]>([]);

  useEffect(() => {
    if (!hayVoz()) return undefined;
    const leer = (): void => setVoces(listarVocesEspanolas().map((v) => v.name));
    leer();
    window.speechSynthesis.addEventListener('voiceschanged', leer);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', leer);
  }, []);

  return voces;
}
