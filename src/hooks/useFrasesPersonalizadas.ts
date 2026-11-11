import { useState } from 'react';
import {
  agregarFrase,
  cargarFrasesPersonalizadas,
  guardarFrasesPersonalizadas,
} from '../utils/fraseario.ts';

/** Frases propias del usuario, persistentes y validadas. */
export function useFrasesPersonalizadas(): {
  personalizadas: string[];
  /** Devuelve un mensaje de error, o null si se añadió. */
  anadir: (entrada: string) => string | null;
  quitar: (frase: string) => void;
} {
  const [personalizadas, setPersonalizadas] = useState<string[]>(
    cargarFrasesPersonalizadas,
  );

  const anadir = (entrada: string): string | null => {
    const resultado = agregarFrase(personalizadas, entrada);
    if (resultado.error !== null) return resultado.error;
    setPersonalizadas(resultado.frases);
    guardarFrasesPersonalizadas(resultado.frases);
    return null;
  };

  const quitar = (frase: string): void => {
    const restantes = personalizadas.filter((f) => f !== frase);
    setPersonalizadas(restantes);
    guardarFrasesPersonalizadas(restantes);
  };

  return { personalizadas, anadir, quitar };
}
