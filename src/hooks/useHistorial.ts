import { useCallback, useState } from 'react';
import {
  agregarAlHistorial,
  cargarHistorial,
  guardarHistorial,
} from '../utils/historial.ts';

/** Historial de lo dicho en voz alta, persistente. */
export function useHistorial(): {
  historial: string[];
  registrar: (frase: string) => void;
  borrar: () => void;
} {
  const [historial, setHistorial] = useState<string[]>(cargarHistorial);

  const registrar = useCallback((frase: string): void => {
    setHistorial((h) => {
      const nuevo = agregarAlHistorial(h, frase);
      guardarHistorial(nuevo);
      return nuevo;
    });
  }, []);

  const borrar = useCallback((): void => {
    setHistorial([]);
    guardarHistorial([]);
  }, []);

  return { historial, registrar, borrar };
}
