import type { Dispatch, SetStateAction } from 'react';
import { obtenerFrecuenciaNota, obtenerNombreNota } from '../audio/cromatico.ts';
import { LIMITES, type Ajustes } from '../utils/ajustes.ts';
import TablaNotas from './TablaNotas.tsx';
import estilos from './InstrumentoPanel.module.css';

interface Props {
  mensaje: string;
  onMensaje: (mensaje: string) => void;
  tocando: boolean;
  onTocar: () => void;
  onDetenerMelodia: () => void;
  notaActual: string | null;
  ajustes: Ajustes;
  setAjustes: Dispatch<SetStateAction<Ajustes>>;
}

/**
 * Pestaña "Aprender": tocar melodías con el altavoz, ver qué nota es cada
 * letra y ajustar cuánto dura cada nota al tocar.
 */
export default function PestanaAprender(props: Props): React.JSX.Element {
  const { mensaje, tocando, notaActual, ajustes, setAjustes } = props;

  return (
    <>
      <p className={estilos.ayuda}>
        Escribe un mensaje y la app lo toca como melodía, con una{' '}
        <strong>nota por letra</strong> (A = LA3, 220 Hz; B = LA#3…). Sirve para aprender
        qué nota toca cada letra en tu guitarra. El espacio es la cuerda RE al aire
        (146,83 Hz).
      </p>

      <label className={estilos.etiqueta} htmlFor="campo-melodia">
        Mensaje (A–Z y signos . , ? ! ¿ ¡)
      </label>
      <input
        id="campo-melodia"
        className={estilos.texto}
        type="text"
        maxLength={60}
        value={mensaje}
        disabled={tocando}
        onChange={(e) => props.onMensaje(e.target.value)}
        placeholder="Ej. HOLA"
      />

      <div className={estilos.botones}>
        {!tocando ? (
          <button
            type="button"
            className={estilos.tocar}
            onClick={props.onTocar}
            disabled={mensaje.trim().length === 0}
          >
            <span aria-hidden="true">▶</span> Tocar melodía
          </button>
        ) : (
          <button type="button" onClick={props.onDetenerMelodia}>
            <span aria-hidden="true">■</span> Detener
          </button>
        )}
      </div>

      <div className={estilos.ajustes}>
        <label htmlFor="ajuste-duracion">
          Duración de cada nota al tocar: <strong>{ajustes.duracionNotaMs} ms</strong>
        </label>
        <input
          id="ajuste-duracion"
          type="range"
          min={LIMITES.duracionNotaMs.min}
          max={LIMITES.duracionNotaMs.max}
          step={LIMITES.duracionNotaMs.paso}
          value={ajustes.duracionNotaMs}
          onChange={(e) =>
            setAjustes({ ...ajustes, duracionNotaMs: Number(e.target.value) })
          }
        />
      </div>

      {notaActual !== null && (
        <div className={estilos.ahoraSuenaFila} role="status" aria-label="Nota que suena">
          <div className={estilos.ahoraSuena}>
            <span className={estilos.nota}>
              {notaActual === ' ' ? '␣ ESPACIO' : notaActual}
              <small>
                {' '}
                {`(${obtenerNombreNota(notaActual) ?? ''}, ${String(obtenerFrecuenciaNota(notaActual) ?? '').replace('.', ',')} Hz)`}
              </small>
            </span>
          </div>
        </div>
      )}

      <details className={estilos.tabla}>
        <summary>Ver notas, signos y espacio (para afinar la guitarra)</summary>
        <TablaNotas />
      </details>
    </>
  );
}
