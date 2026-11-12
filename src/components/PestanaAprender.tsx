import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { obtenerFrecuenciaNota, obtenerNombreNota } from '../audio/cromatico.ts';
import { FRASES_ESENCIALES, normalizarFrase } from '../audio/frases.ts';
import { AJUSTES_POR_DEFECTO, LIMITES, type Ajustes } from '../utils/ajustes.ts';
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
  voces: string[];
  personalizadas: string[];
  /** Intenta añadir una frase propia; true si se añadió. */
  onAnadir: (entrada: string) => boolean;
  onQuitar: (frase: string) => void;
  onDecir: (frase: string) => void;
}

/** Secuencia de notas de una frase (para aprenderla en la guitarra). */
const notasDe = (frase: string): string =>
  [...normalizarFrase(frase)].map((c) => obtenerNombreNota(c) ?? '?').join(' · ');

/**
 * Pestaña "Aprender": tocar melodías con el altavoz, ver qué nota es cada
 * letra, practicar frases y ajustar velocidad y voz.
 */
export default function PestanaAprender(props: Props): React.JSX.Element {
  const { mensaje, tocando, notaActual, ajustes, setAjustes, voces, personalizadas } =
    props;
  const [nuevaFrase, setNuevaFrase] = useState('');

  const anadir = (): void => {
    if (props.onAnadir(nuevaFrase)) setNuevaFrase('');
  };

  return (
    <>
      <p className={estilos.ayuda}>
        Una <strong>nota musical por letra</strong> (A = LA3 220 Hz, B = LA#3…): toca la
        melodía aquí o con una guitarra/flauta/voz afinada, de una nota cada vez. Si
        completas una frase esencial, la app la dice en voz alta. Espacio = cuerda RE al
        aire (146.83 Hz).
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

      <div className={estilos.ahoraSuenaFila}>
        <div className={estilos.ahoraSuena}>
          {notaActual === null ? (
            <span className={estilos.apagado}>—</span>
          ) : (
            <span className={estilos.nota}>
              {notaActual === ' ' ? '␣ ESPACIO' : notaActual}
              <small>
                {' '}
                {`(${obtenerNombreNota(notaActual) ?? ''} · ${obtenerFrecuenciaNota(notaActual) ?? ''} Hz)`}
              </small>
            </span>
          )}
        </div>
      </div>

      <details className={estilos.tabla}>
        <summary>Frases rápidas (se hablan solas al deletrearlas)</summary>
        <div className={estilos.frasesGrid}>
          {[...FRASES_ESENCIALES.map((f) => f.texto), ...personalizadas].map((frase) => (
            <button
              key={frase}
              type="button"
              className={estilos.fraseBtn}
              onClick={() => props.onDecir(frase)}
              aria-label={`Decir en voz alta: ${frase}. Notas: ${notasDe(frase)}`}
            >
              <span>{frase}</span>
              <small>{notasDe(frase)}</small>
            </button>
          ))}
        </div>

        <div className={estilos.nuevaFrase}>
          <label htmlFor="nueva-frase">
            Añadir tu propia frase (nombre, medicación…)
          </label>
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
                    onClick={() => props.onQuitar(frase)}
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

      <details className={estilos.tabla}>
        <summary>Ajustes (velocidad y voz)</summary>
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
          <label htmlFor="ajuste-velocidad-voz">
            Velocidad de la voz: <strong>{ajustes.velocidadVoz.toFixed(2)}×</strong>
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
          <button type="button" onClick={() => setAjustes({ ...AJUSTES_POR_DEFECTO })}>
            Restablecer ajustes
          </button>
        </div>
      </details>

      <details className={estilos.tabla}>
        <summary>Ver notas, signos y espacio (para afinar la guitarra)</summary>
        <TablaNotas />
      </details>
    </>
  );
}
