import { useCallback, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { callar, hablar, hayVoz } from '../audio/voz.ts';
import type { Ajustes } from '../utils/ajustes.ts';

/** Tope (ms) de espera al fin de la voz antes de reabrir el micrófono. */
const TOPE_VOZ_MS = 15000;

/**
 * Voz con anti-eco. Habla pausando la transcripción: sin esto, el
 * micrófono oye el propio altavoz (la frase hablada) y aparecen letras
 * fantasma. `pausaTranscripcionRef` vale true mientras la app habla (o
 * toca); el panel lo consulta antes de aceptar notas.
 *
 * Se reanuda al terminar la voz; si `onend` no llega, un respaldo espera
 * mientras el navegador siga hablando (con tope).
 */
export function useVoz(
  ajustesRef: MutableRefObject<Ajustes>,
  alHablar: (texto: string) => void,
): {
  hablarConPausa: (textoVoz: string) => boolean;
  pausaTranscripcionRef: MutableRefObject<boolean>;
} {
  const pausaTranscripcionRef = useRef(false);
  const timerRef = useRef(0);
  // Siempre la última función, sin recrear `hablarConPausa`.
  const alHablarRef = useRef(alHablar);

  useEffect(() => {
    alHablarRef.current = alHablar;
  }, [alHablar]);

  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      callar();
    },
    [],
  );

  const hablarConPausa = useCallback(
    (textoVoz: string): boolean => {
      alHablarRef.current(textoVoz);
      pausaTranscripcionRef.current = true;
      window.clearTimeout(timerRef.current);
      const inicio = Date.now();
      const liberar = (): void => {
        window.clearTimeout(timerRef.current);
        pausaTranscripcionRef.current = false;
      };
      const ok = hablar(textoVoz, liberar, {
        velocidad: ajustesRef.current.velocidadVoz,
        vozNombre: ajustesRef.current.vozNombre,
      });
      const vigilar = (): void => {
        const sigueHablando = hayVoz() && window.speechSynthesis.speaking === true;
        if (sigueHablando && Date.now() - inicio < TOPE_VOZ_MS) {
          timerRef.current = window.setTimeout(vigilar, 400);
        } else {
          liberar();
        }
      };
      timerRef.current = window.setTimeout(vigilar, 1200 + textoVoz.length * 150);
      return ok;
    },
    [ajustesRef],
  );

  return { hablarConPausa, pausaTranscripcionRef };
}
