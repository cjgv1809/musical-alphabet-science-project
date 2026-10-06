import { useEffect, useRef, useState } from 'react';
import {
  SIMBOLOS_CROMATICOS,
  obtenerFrecuenciaNota,
  obtenerNombreNota,
} from '../audio/cromatico.ts';
import {
  solicitarDetencionMelodia,
  tocarMelodia,
} from '../audio/instrumento.ts';
import { DetectorMelodia } from '../audio/melodia.ts';
import { motorEscucha } from '../audio/escucha.ts';
import { useAppStore } from '../store/useAppStore.ts';
import estilos from './InstrumentoPanel.module.css';

/**
 * Panel del modo instrumento (prototipo): una nota musical por letra.
 * - "Tocar melodía": el emisor sintetizado (seno puro) toca el texto.
 * - "Escuchar melodía": transcribe lo que suene: el propio emisor,
 *   una guitarra, una flauta o tu voz (una nota cada vez, afinada).
 */
export default function InstrumentoPanel(): React.JSX.Element {
  const [mensaje, setMensaje] = useState('HOLA');
  const [tocando, setTocando] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [notaActual, setNotaActual] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const nivel = useAppStore((e) => e.nivel);
  const detencionRef = useRef(false);

  useEffect(() => {
    return () => {
      detencionRef.current = true;
      solicitarDetencionMelodia();
    };
  }, []);

  const tocar = async (): Promise<void> => {
    if (tocando || mensaje.trim().length === 0) return;
    detencionRef.current = false;
    setTocando(true);
    setErrorLocal(null);
    try {
      await tocarMelodia(mensaje, {
        alIniciarNota: (simbolo) => setNotaActual(simbolo),
        debeDetener: () => detencionRef.current,
      });
    } catch {
      setErrorLocal('No se pudo reproducir. Revisa el volumen del equipo.');
    } finally {
      setTocando(false);
      setNotaActual(null);
    }
  };

  const empezarEscucha = async (): Promise<void> => {
    if (escuchando) return;
    if (motorEscucha.estaActivo()) {
      setErrorLocal(
        'Ya hay una escucha activa en el otro panel. Detenla primero.',
      );
      return;
    }
    setErrorLocal(null);
    try {
      await motorEscucha.iniciar(
        {
          alConfirmar: (simbolo) => setTexto((t) => t + simbolo),
          alNivel: (nuevoNivel) => {
            useAppStore.getState().fijarNivel(nuevoNivel);
          },
        },
        new DetectorMelodia(),
      );
      setEscuchando(true);
    } catch (err) {
      setErrorLocal(
        err instanceof Error ? err.message : 'No se pudo activar el micrófono.',
      );
    }
  };

  const detenerEscucha = (): void => {
    motorEscucha.detener();
    setEscuchando(false);
    useAppStore.getState().fijarNivel({ senal: 0, ruido: 0, snrDb: 0 });
  };

  return (
    <section className={estilos.panel} aria-labelledby="titulo-instrumento">
      <h2 id="titulo-instrumento">Modo instrumento (prototipo) 🎸</h2>
      <p className={estilos.ayuda}>
        Una <strong>nota musical por letra</strong> (A = LA3 220 Hz, B = LA#3…):
        toca la melodía aquí o con una guitarra/flauta/voz afinada, de una
        nota cada vez. Espacio = silencio. Sin dígitos (prototipo).
      </p>

      <label className={estilos.etiqueta} htmlFor="campo-melodia">
        Mensaje (solo A–Z)
      </label>
      <input
        id="campo-melodia"
        className={estilos.texto}
        type="text"
        maxLength={60}
        value={mensaje}
        disabled={tocando}
        onChange={(e) => setMensaje(e.target.value)}
        placeholder="Ej. HOLA"
      />

      <div className={estilos.botones}>
        {!tocando ? (
          <button
            type="button"
            className={estilos.tocar}
            onClick={() => void tocar()}
            disabled={mensaje.trim().length === 0}
          >
            ▶ Tocar melodía
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              detencionRef.current = true;
              solicitarDetencionMelodia();
            }}
          >
            ■ Detener
          </button>
        )}
        {!escuchando ? (
          <button type="button" onClick={() => void empezarEscucha()}>
            ● Escuchar melodía
          </button>
        ) : (
          <button type="button" onClick={detenerEscucha}>
            ■ Dejar de escuchar
          </button>
        )}
        <button
          type="button"
          onClick={() => setTexto('')}
          disabled={texto.length === 0}
        >
          Limpiar
        </button>
      </div>

      {errorLocal !== null && (
        <p className={estilos.error} role="alert">
          ⚠ {errorLocal}
        </p>
      )}

      <div className={estilos.doble}>
        <div className={estilos.ahoraSuena} aria-live="polite">
          {notaActual === null ? (
            <span className={estilos.apagado}>—</span>
          ) : (
            <span className={estilos.nota}>
              {notaActual === ' ' ? '␣' : notaActual}
              <small>
                {' '}
                {notaActual === ' '
                  ? '(silencio)'
                  : `(${obtenerNombreNota(notaActual) ?? ''} · ${obtenerFrecuenciaNota(notaActual) ?? ''} Hz)`}
              </small>
            </span>
          )}
        </div>
        <div className={estilos.resultado} aria-live="polite" aria-label="Melodía transcrita">
          {texto.length === 0 ? (
            <span className={estilos.vacio}>
              {escuchando
                ? `Escuchando… SNR ${nivel.snrDb.toFixed(0)} dB.`
                : 'Aquí aparecerá la melodía transcrita.'}
            </span>
          ) : (
            texto
          )}
        </div>
      </div>

      <details className={estilos.tabla}>
        <summary>Ver las 26 notas (para afinar la guitarra)</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">Letra</th>
              <th scope="col">Nota</th>
              <th scope="col">Hz</th>
            </tr>
          </thead>
          <tbody>
            {SIMBOLOS_CROMATICOS.map((s) => (
              <tr key={s}>
                <td>{s}</td>
                <td>{obtenerNombreNota(s)}</td>
                <td>{obtenerFrecuenciaNota(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}
