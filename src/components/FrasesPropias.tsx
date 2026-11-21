import { useState } from 'react';
import estilos from './InstrumentoPanel.module.css';

interface Props {
  personalizadas: string[];
  /** Intenta añadir una frase propia; true si se añadió. */
  onAnadir: (entrada: string) => boolean;
  onQuitar: (frase: string) => void;
}

/** Añadir y quitar frases propias (nombre, medicación…): se suman a las rápidas. */
export default function FrasesPropias({
  personalizadas,
  onAnadir,
  onQuitar,
}: Props): React.JSX.Element {
  const [nuevaFrase, setNuevaFrase] = useState('');

  const anadir = (): void => {
    if (onAnadir(nuevaFrase)) setNuevaFrase('');
  };

  return (
    <details className={estilos.tabla}>
      <summary>Mis frases propias (nombre, medicación…)</summary>
      <div className={estilos.nuevaFrase}>
        <label htmlFor="nueva-frase">Añadir una frase propia</label>
        <div className={estilos.nuevaFraseFila}>
          <input
            id="nueva-frase"
            type="text"
            maxLength={40}
            value={nuevaFrase}
            onChange={(e) => setNuevaFrase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') anadir();
            }}
            placeholder="Ej. Me llamo Ana"
          />
          <button type="button" onClick={anadir} disabled={nuevaFrase.trim() === ''}>
            Añadir
          </button>
        </div>
        {personalizadas.length > 0 && (
          <ul className={estilos.propias}>
            {personalizadas.map((frase) => (
              <li key={frase}>
                <span>{frase}</span>
                <button
                  type="button"
                  onClick={() => onQuitar(frase)}
                  aria-label={`Quitar la frase ${frase}`}
                >
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
