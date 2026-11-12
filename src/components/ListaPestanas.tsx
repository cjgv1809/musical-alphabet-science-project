import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import estilos from './InstrumentoPanel.module.css';

export interface Pestana {
  id: string;
  etiqueta: string;
  icono: string;
}

interface Props {
  pestanas: readonly Pestana[];
  activa: string;
  onCambiar: (id: string) => void;
  /** Prefijo de los ids (cada pestaña es `${prefijo}-tab-${id}` y su panel `${prefijo}-panel-${id}`). */
  prefijo: string;
  etiquetaLista: string;
}

/**
 * Barra de pestañas accesible (patrón WAI-ARIA "tabs", activación automática):
 * flechas izquierda/derecha, Inicio y Fin; solo la pestaña activa entra en el
 * orden de tabulación.
 */
export default function ListaPestanas({
  pestanas,
  activa,
  onCambiar,
  prefijo,
  etiquetaLista,
}: Props): React.JSX.Element {
  const botonesRef = useRef<Record<string, HTMLButtonElement | null>>({});

  const alTeclear = (evento: KeyboardEvent<HTMLButtonElement>, indice: number): void => {
    const total = pestanas.length;
    const destino =
      evento.key === 'ArrowRight'
        ? (indice + 1) % total
        : evento.key === 'ArrowLeft'
          ? (indice - 1 + total) % total
          : evento.key === 'Home'
            ? 0
            : evento.key === 'End'
              ? total - 1
              : null;
    if (destino === null) return;
    evento.preventDefault();
    const siguiente = pestanas[destino];
    if (siguiente === undefined) return;
    onCambiar(siguiente.id);
    botonesRef.current[siguiente.id]?.focus();
  };

  return (
    <div role="tablist" aria-label={etiquetaLista} className={estilos.pestanas}>
      {pestanas.map((p, i) => (
        <button
          key={p.id}
          ref={(el) => {
            botonesRef.current[p.id] = el;
          }}
          type="button"
          role="tab"
          id={`${prefijo}-tab-${p.id}`}
          aria-selected={p.id === activa}
          aria-controls={`${prefijo}-panel-${p.id}`}
          tabIndex={p.id === activa ? 0 : -1}
          className={estilos.pestana}
          onClick={() => onCambiar(p.id)}
          onKeyDown={(e) => alTeclear(e, i)}
        >
          <span aria-hidden="true">{p.icono}</span> {p.etiqueta}
        </button>
      ))}
    </div>
  );
}
