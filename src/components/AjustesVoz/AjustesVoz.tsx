import type { Dispatch, SetStateAction } from 'react';
import { AJUSTES_POR_DEFECTO, LIMITES, type Ajustes } from '../../utils/ajustes.ts';
import comun from '../compartido/compartido.module.css';

interface Props {
  ajustes: Ajustes;
  setAjustes: Dispatch<SetStateAction<Ajustes>>;
  voces: string[];
}

/** Ajustes de la voz con la que habla la app: velocidad y voz. */
export default function AjustesVoz({
  ajustes,
  setAjustes,
  voces,
}: Props): React.JSX.Element {
  return (
    <details className={comun.desplegable}>
      <summary>Ajustes de voz</summary>
      <div className={comun.controles}>
        <label htmlFor="ajuste-velocidad-voz">
          Velocidad de la voz:{' '}
          <strong>{ajustes.velocidadVoz.toFixed(2).replace('.', ',')}×</strong>
        </label>
        <input
          id="ajuste-velocidad-voz"
          type="range"
          min={LIMITES.velocidadVoz.min}
          max={LIMITES.velocidadVoz.max}
          step={LIMITES.velocidadVoz.paso}
          value={ajustes.velocidadVoz}
          onChange={(e) =>
            setAjustes({ ...ajustes, velocidadVoz: Number(e.target.value) })
          }
        />
        {voces.length > 0 && (
          <>
            <label htmlFor="ajuste-voz">Voz</label>
            <select
              id="ajuste-voz"
              value={ajustes.vozNombre}
              onChange={(e) => setAjustes({ ...ajustes, vozNombre: e.target.value })}
            >
              <option value="">Automática (mejor voz en español)</option>
              {voces.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </>
        )}
        <button
          type="button"
          onClick={() =>
            setAjustes({
              ...ajustes,
              velocidadVoz: AJUSTES_POR_DEFECTO.velocidadVoz,
              vozNombre: AJUSTES_POR_DEFECTO.vozNombre,
            })
          }
        >
          Restablecer voz
        </button>
      </div>
    </details>
  );
}
