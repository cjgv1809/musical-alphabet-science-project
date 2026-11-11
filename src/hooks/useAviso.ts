import { useCallback, useEffect, useRef, useState } from 'react';

/** Mensaje breve que desaparece solo (p. ej. "Texto copiado."). */
export function useAviso(duracionMs = 2500): {
  aviso: string | null;
  mostrarAviso: (mensaje: string) => void;
} {
  const [aviso, setAviso] = useState<string | null>(null);
  const timerRef = useRef(0);

  const mostrarAviso = useCallback(
    (mensaje: string): void => {
      setAviso(mensaje);
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setAviso(null), duracionMs);
    },
    [duracionMs],
  );

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return { aviso, mostrarAviso };
}
