import { useEffect, useState } from 'react';
import type { LecturaTono } from '../audio/melodia.ts';
import { obtenerNombreNota } from '../audio/cromatico.ts';
import estilos from './InstrumentoPanel.module.css';

/** Cents que cubre la barra a cada lado del centro. */
const RANGO_CENTS = 50;
/** Dentro de ±10 cents se considera "afinada". */
const AFINADA_CENTS = 10;

/** Estado visible; redondeado para no re-renderizar a 25 Hz sin motivo. */
interface Vista {
  simbolo: string;
  /** Cents redondeados de 5 en 5. */
  cents: number;
  confirmada: boolean;
}

/**
 * Afinador en vivo: muestra qué nota oye el micrófono y cuánto se desvía,
 * para que quien toca sepa si va bien ANTES de que la letra se confirme.
 * Es una ayuda visual (aria-hidden): el texto transcrito y el aviso de
 * micrófono ya cubren a quien usa lector de pantalla.
 * Tiene estado propio y solo se actualiza si cambia lo que se ve.
 */
export default function Afinador({
  registrar,
}: {
  /** Entrega al panel la función que actualiza el afinador (null al desmontar). */
  registrar: (receptor: ((lectura: LecturaTono | null) => void) | null) => void;
}): React.JSX.Element {
  const [vista, setVista] = useState<Vista | null>(null);

  useEffect(() => {
    registrar((lectura) => {
      if (lectura === null) {
        setVista((anterior) => (anterior === null ? anterior : null));
        return;
      }
      const cents = Math.round(lectura.cents / 5) * 5;
      setVista((anterior) =>
        anterior !== null &&
        anterior.simbolo === lectura.simbolo &&
        anterior.cents === cents &&
        anterior.confirmada === lectura.confirmada
          ? anterior
          : { simbolo: lectura.simbolo, cents, confirmada: lectura.confirmada },
      );
    });
    return () => registrar(null);
  }, [registrar]);

  const afinada = vista !== null && Math.abs(vista.cents) <= AFINADA_CENTS;
  const posicion =
    vista === null
      ? 50
      : 50 +
        (Math.max(-RANGO_CENTS, Math.min(RANGO_CENTS, vista.cents)) / RANGO_CENTS) * 50;
  const nombre = vista === null ? null : obtenerNombreNota(vista.simbolo);
  const etiqueta =
    vista === null
      ? 'Toca una nota'
      : afinada
        ? 'Afinada'
        : vista.cents < 0
          ? 'Un poco grave: sube'
          : 'Un poco aguda: baja';

  return (
    <div className={estilos.afinador} aria-hidden="true">
      <div className={estilos.afinadorNota}>
        <span className={estilos.afinadorLetra}>
          {vista === null ? '·' : vista.simbolo === ' ' ? '␣' : vista.simbolo}
        </span>
        <span className={estilos.afinadorNombre}>{nombre ?? ''}</span>
        {vista?.confirmada === true && <span className={estilos.afinadorOk}>✓</span>}
      </div>
      <div className={estilos.afinadorBarra}>
        <span className={estilos.afinadorCentro} />
        <span
          className={`${estilos.afinadorAguja} ${
            vista === null
              ? estilos.afinadorInactiva
              : afinada
                ? estilos.afinadorBien
                : ''
          }`}
          style={{ left: `${posicion}%` }}
        />
      </div>
      <div className={estilos.afinadorTexto}>
        {etiqueta}
        {vista !== null &&
          !afinada &&
          ` (${vista.cents > 0 ? '+' : ''}${vista.cents} cents)`}
      </div>
    </div>
  );
}
