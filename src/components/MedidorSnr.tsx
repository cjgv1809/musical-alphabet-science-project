import { useEffect, useState } from 'react';
import type { MutableRefObject } from 'react';
import type { NivelSenal } from '../types/index.ts';
import estilos from './InstrumentoPanel.module.css';

/**
 * Medidor de señal/ruido con estado PROPIO.
 *
 * El motor de escucha emite un nivel cada 40 ms (25 veces por segundo).
 * Si ese estado viviera en el panel, cada medición volvería a pintar el
 * panel entero (tablas y frases incluidas). Aquí solo se re-renderiza
 * este párrafo, y solo cuando cambia el valor entero en dB.
 */
export default function MedidorSnr({
  receptor,
}: {
  /** El panel llama a `receptor.current(nivel)` en cada medición. */
  receptor: MutableRefObject<((nivel: NivelSenal) => void) | null>;
}): React.JSX.Element {
  const [snrDb, setSnrDb] = useState(0);

  useEffect(() => {
    receptor.current = (nivel) => setSnrDb(Math.round(nivel.snrDb));
    return () => {
      receptor.current = null;
    };
  }, [receptor]);

  return (
    <p className={estilos.snr}>
      Señal/ruido: <strong>{snrDb} dB</strong>
    </p>
  );
}
