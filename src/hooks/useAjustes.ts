import { useEffect, useRef, useState } from 'react';
import type { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { cargarAjustes, guardarAjustes, type Ajustes } from '../utils/ajustes.ts';

/**
 * Ajustes del usuario con persistencia. `ajustesRef` siempre apunta al
 * valor más reciente: los callbacks de larga vida (voz, melodía) lo leen
 * sin quedarse con una copia vieja.
 */
export function useAjustes(): {
  ajustes: Ajustes;
  setAjustes: Dispatch<SetStateAction<Ajustes>>;
  ajustesRef: MutableRefObject<Ajustes>;
} {
  const [ajustes, setAjustes] = useState<Ajustes>(cargarAjustes);
  const ajustesRef = useRef(ajustes);

  useEffect(() => {
    ajustesRef.current = ajustes;
    guardarAjustes(ajustes);
  }, [ajustes]);

  return { ajustes, setAjustes, ajustesRef };
}
