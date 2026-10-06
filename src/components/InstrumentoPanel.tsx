import { useEffect, useRef, useState } from 'react';
import {
  SIMBOLOS_CROMATICOS,
  SIMBOLOS_PUNTUACION,
  obtenerFrecuenciaNota,
  obtenerNombreNota,
} from '../audio/cromatico.ts';
import { FRASES_ESENCIALES, buscarFrase, normalizarFrase } from '../audio/frases.ts';
import {
  asegurarAudioListo,
  solicitarDetencionMelodia,
  tocarMelodia,
} from '../audio/instrumento.ts';
import { DetectorMelodia } from '../audio/melodia.ts';
import { callar, hablar, hayVoz } from '../audio/voz.ts';
import { motorEscucha } from '../audio/escucha.ts';
import type { NivelSenal } from '../types/index.ts';
import estilos from './InstrumentoPanel.module.css';

/**
 * Panel principal: de la guitarra a las palabras (modo accesible).
 * - "Tocar melodía": el emisor sintetizado toca el texto.
 * - "Escuchar melodía": transcribe guitarra/flauta/voz (una nota afinada).
 * - Fraseario: si lo transcrito equivale a una frase esencial, se muestra
 *   en grande y se HABLA en voz alta. Botón Hablar para texto libre.
 */
export default function InstrumentoPanel(): React.JSX.Element {
  const [mensaje, setMensaje] = useState('HOLA');
  const [tocando, setTocando] = useState(false);
  const [escuchando, setEscuchando] = useState(false);
  const [notaActual, setNotaActual] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [fraseDetectada, setFraseDetectada] = useState<string | null>(null);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [nivel, setNivel] = useState<NivelSenal>({ senal: 0, ruido: 0, snrDb: 0 });
  const detencionRef = useRef(false);
  const ultimoHabladoRef = useRef('');

  // Fraseario: si lo transcrito equivale a una frase esencial, se habla.
  // (Se compara sin espacios: la guitarra no los emite.)
  useEffect(() => {
    const frase = buscarFrase(texto);
    setFraseDetectada(frase);
    if (frase !== null && ultimoHabladoRef.current !== texto) {
      ultimoHabladoRef.current = texto;
      if (!hablar(frase) && !hayVoz()) {
        setErrorLocal(
          'Este navegador no tiene voz sintetizada: la frase se muestra pero no suena.',
        );
      }
    }
  }, [texto]);

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
    if (motorEscucha.estaActivo()) return;
    setErrorLocal(null);
    try {
      await motorEscucha.iniciar(
        {
          alConfirmar: (simbolo) => setTexto((t) => t + simbolo),
          alNivel: (nuevoNivel) => setNivel(nuevoNivel),
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
    setNivel({ senal: 0, ruido: 0, snrDb: 0 });
  };

  // Los móviles suspenden el audio al ocultar la app: al volver a ella,
  // se reanudan los contextos y, si el motor no revive, la escucha se
  // reinicia sola (sin pulsar nada).
  useEffect(() => {
    const alVolver = (): void => {
      if (document.hidden) return;
      // Emisor: despierta el contexto de Tone.js.
      void asegurarAudioListo().catch(() => undefined);
      // Receptor: solo si estaba escuchando.
      if (!motorEscucha.estaActivo()) return;
      void (async () => {
        const vive = await motorEscucha.reanudar();
        if (!vive) {
          motorEscucha.detener();
          setEscuchando(false);
          await empezarEscucha();
        }
      })().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, []);

  const limpiarTexto = (): void => {
    setTexto('');
    setFraseDetectada(null);
    ultimoHabladoRef.current = '';
    callar();
  };

  const hablarTexto = (): void => {
    if (!hablar(fraseDetectada ?? texto)) {
      setErrorLocal(
        'Este navegador no tiene voz sintetizada: lee el texto en pantalla.',
      );
    }
  };

  /** Secuencia de notas de una frase (para aprenderla en la guitarra). */
  const notasDe = (frase: string): string =>
    [...normalizarFrase(frase)]
      .map((c) => obtenerNombreNota(c) ?? '?')
      .join(' · ');

  return (
    <section className={estilos.panel} aria-labelledby="titulo-instrumento">
      <h2 id="titulo-instrumento">De la guitarra a las palabras 🎸</h2>
      <p className={estilos.ayuda}>
        Una <strong>nota musical por letra</strong> (A = LA3 220 Hz, B = LA#3…):
        toca la melodía aquí o con una guitarra/flauta/voz afinada, de una
        nota cada vez. Si completas una frase esencial, la app la dice en voz
        alta. Espacio = silencio.
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
          onClick={hablarTexto}
          disabled={texto.length === 0}
          aria-label="Leer en voz alta el texto transcrito"
        >
          🔊 Hablar
        </button>
        <button
          type="button"
          onClick={limpiarTexto}
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

      {fraseDetectada !== null && (
        <p className={estilos.fraseReconocida} role="status">
          ✅ Frase reconocida: <strong>{fraseDetectada}</strong>
        </p>
      )}

      <details className={estilos.tabla}>
        <summary>Frases rápidas (se hablan solas al deletrearlas)</summary>
        <div className={estilos.frasesGrid}>
          {FRASES_ESENCIALES.map((frase) => (
            <button
              key={frase.texto}
              type="button"
              className={estilos.fraseBtn}
              onClick={() => {
                if (!hablar(frase.texto)) {
                  setErrorLocal(
                    'Este navegador no tiene voz sintetizada.',
                  );
                }
              }}
              aria-label={`Decir en voz alta: ${frase.texto}. Notas: ${notasDe(frase.texto)}`}
            >
              <span>{frase.texto}</span>
              <small>{notasDe(frase.texto)}</small>
            </button>
          ))}
        </div>
      </details>

      <details className={estilos.tabla}>
        <summary>Ver las 26 notas + 6 signos (para afinar la guitarra)</summary>
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
            {SIMBOLOS_PUNTUACION.map((s) => (
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
