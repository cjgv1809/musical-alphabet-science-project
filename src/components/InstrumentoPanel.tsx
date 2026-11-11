import { useEffect, useRef, useState } from 'react';
import { obtenerFrecuenciaNota, obtenerNombreNota } from '../audio/cromatico.ts';
import { FRASES_ESENCIALES, buscarFrase, normalizarFrase } from '../audio/frases.ts';
import {
  asegurarAudioListo,
  solicitarDetencionMelodia,
  tocarMelodia,
} from '../audio/instrumento.ts';
import { DetectorMelodia, type LecturaTono } from '../audio/melodia.ts';
import { callar, hablar, hayVoz } from '../audio/voz.ts';
import { motorEscucha } from '../audio/escucha.ts';
import type { NivelSenal } from '../types/index.ts';
import Afinador from './Afinador.tsx';
import MedidorSnr from './MedidorSnr.tsx';
import TablaNotas from './TablaNotas.tsx';
import estilos from './InstrumentoPanel.module.css';

/** Silencio (ms) tras la última nota antes de decir la frase en voz alta. */
const RETRASO_FRASE_MS = 1200;
/** Tope (ms) de espera al fin de la voz antes de reabrir el micrófono. */
const TOPE_VOZ_MS = 15000;
/** Máximo de letras que se conservan de la transcripción. */
const MAX_TEXTO = 200;

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
  const [confuso, setConfuso] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  /** Lo registra <MedidorSnr>: el nivel (25 Hz) no pasa por el estado del panel. */
  const receptorTonoRef = useRef<((lectura: LecturaTono | null) => void) | null>(null);
  const receptorNivelRef = useRef<((nivel: NivelSenal) => void) | null>(null);
  const detencionRef = useRef(false);
  /** El micro no transcribe mientras la app habla o toca (anti-eco). */
  const pausaTranscripcionRef = useRef(false);
  const finVozTimerRef = useRef(0);
  const ultimoHabladoRef = useRef('');

  // Fraseario: si lo transcrito equivale a una frase esencial, se habla.
  // (Se compara sin espacios: la guitarra no los emite.)
  // Se espera un momento sin notas nuevas antes de hablar: "NO" no debe
  // sonar si la persona sigue deletreando "NOCHE". Si el texto cambia, el
  // temporizador se cancela y se reinicia.
  useEffect(() => {
    const frase = buscarFrase(texto);
    setFraseDetectada(frase);
    // Texto nuevo (distinto al último hablado): permite repetir la misma
    // frase más tarde, p. ej. AGUA … AGUA.
    if (ultimoHabladoRef.current !== texto) ultimoHabladoRef.current = '';
    if (frase === null || ultimoHabladoRef.current === texto) return undefined;
    const id = window.setTimeout(() => {
      ultimoHabladoRef.current = texto;
      if (!hablarConPausa(frase) && !hayVoz()) {
        setErrorLocal(
          'Este navegador no tiene voz sintetizada: la frase se muestra pero no suena.',
        );
      }
    }, RETRASO_FRASE_MS);
    return () => window.clearTimeout(id);
  }, [texto]);

  useEffect(() => {
    return () => {
      detencionRef.current = true;
      solicitarDetencionMelodia();
      window.clearTimeout(finVozTimerRef.current);
      callar();
    };
  }, []);

  /**
   * Habla pausando la transcripción: sin esto, el micrófono oye el
   * propio altavoz (la frase hablada) y aparecen letras fantasma.
   * Se reanuda al terminar la voz, con temporizador de seguridad por
   * si el evento de fin no llega en algún navegador.
   */
  const hablarConPausa = (textoVoz: string): boolean => {
    pausaTranscripcionRef.current = true;
    window.clearTimeout(finVozTimerRef.current);
    const inicio = Date.now();
    const liberar = (): void => {
      window.clearTimeout(finVozTimerRef.current);
      pausaTranscripcionRef.current = false;
    };
    const ok = hablar(textoVoz, liberar);
    // Respaldo si `onend` no llega: mientras el navegador siga hablando se
    // espera (con tope), en vez de adivinar la duración por la longitud.
    const vigilar = (): void => {
      const sigueHablando =
        hayVoz() && window.speechSynthesis.speaking === true;
      if (sigueHablando && Date.now() - inicio < TOPE_VOZ_MS) {
        finVozTimerRef.current = window.setTimeout(vigilar, 400);
      } else {
        liberar();
      }
    };
    finVozTimerRef.current = window.setTimeout(
      vigilar,
      1200 + textoVoz.length * 150,
    );
    return ok;
  };

  const tocar = async (): Promise<void> => {
    if (tocando || mensaje.trim().length === 0) return;
    detencionRef.current = false;
    setTocando(true);
    setErrorLocal(null);
    // El micro no debe transcribir lo que toca el propio altavoz.
    pausaTranscripcionRef.current = true;
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
      pausaTranscripcionRef.current = false;
    }
  };

  const empezarEscucha = async (): Promise<void> => {
    if (motorEscucha.estaActivo()) return;
    setErrorLocal(null);
    try {
      await motorEscucha.iniciar(
        {
          alConfirmar: (simbolo) => {
            // Ignora lo que suena mientras la app habla o toca.
            if (pausaTranscripcionRef.current) return;
            setConfuso(false);
            // Vibración breve: confirma la letra sin mirar ni oír (si hay soporte).
            navigator.vibrate?.(25);
            // Si lo anterior ya se dijo en voz alta como frase, empieza
            // una frase nueva (así se puede decir AGUA, y luego AYUDA).
            setTexto((t) =>
              t !== '' && t === ultimoHabladoRef.current
                ? simbolo
                : (t + simbolo).slice(-MAX_TEXTO),
            );
          },
          // Sonido fuerte sin nota clara (acorde rasgueado): sugiere una cuerda.
          alConfuso: () => {
            if (pausaTranscripcionRef.current) return;
            setConfuso(true);
          },
          alTono: (lectura) => receptorTonoRef.current?.(lectura),
          alNivel: (nuevoNivel) => receptorNivelRef.current?.(nuevoNivel),
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
    setConfuso(false);
  };

  // Los móviles suspenden el audio al ocultar la app: al volver a ella,
  // se reanudan los contextos y, si el motor no revive, la escucha se
  // reinicia sola (sin pulsar nada).
  useEffect(() => {
    const alVolver = (): void => {
      if (document.hidden) return;
      // Emisor: despierta el contexto de audio.
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

  const borrarUltima = (): void => {
    setTexto((t) => t.slice(0, -1));
    setConfuso(false);
    callar();
  };

  const limpiarTexto = (): void => {
    setTexto('');
    setConfuso(false);
    setFraseDetectada(null);
    ultimoHabladoRef.current = '';
    callar();
  };

  const hablarTexto = (): void => {
    if (!hablarConPausa(fraseDetectada ?? texto)) {
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
      <h2 id="titulo-instrumento">De la guitarra a las palabras <span aria-hidden="true">🎸</span></h2>
      <p className={estilos.ayuda}>
        Una <strong>nota musical por letra</strong> (A = LA3 220 Hz, B = LA#3…):
        toca la melodía aquí o con una guitarra/flauta/voz afinada, de una
        nota cada vez. Si completas una frase esencial, la app la dice en voz
        alta. Espacio = cuerda RE al aire (146.83 Hz).
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
            <span aria-hidden="true">▶</span> Tocar melodía
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              detencionRef.current = true;
              solicitarDetencionMelodia();
            }}
          >
            <span aria-hidden="true">■</span> Detener
          </button>
        )}
        {!escuchando ? (
          <button type="button" onClick={() => void empezarEscucha()}>
            <span aria-hidden="true">●</span> Escuchar melodía
          </button>
        ) : (
          <button type="button" onClick={detenerEscucha}>
            <span aria-hidden="true">■</span> Dejar de escuchar
          </button>
        )}
        <button
          type="button"
          onClick={hablarTexto}
          disabled={texto.length === 0}
          aria-label="Leer en voz alta el texto transcrito"
        >
          <span aria-hidden="true">🔊</span> Hablar
        </button>
        <button
          type="button"
          onClick={borrarUltima}
          disabled={texto.length === 0}
          aria-label="Borrar la última letra"
        >
          <span aria-hidden="true">⌫</span> Borrar
        </button>
        <button
          type="button"
          onClick={limpiarTexto}
          disabled={texto.length === 0}
        >
          Limpiar
        </button>
      </div>

      {/* Anuncia el estado del micrófono a lectores de pantalla. */}
      <p className={estilos.soloLector} role="status">
        {escuchando ? 'Micrófono activado: escuchando.' : ''}
      </p>

      {errorLocal !== null && (
        <p className={estilos.error} role="alert">
          <span aria-hidden="true">⚠</span> {errorLocal}
        </p>
      )}

      <div className={estilos.doble}>
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
        <div className={estilos.resultado} role="log" aria-live="polite" aria-label="Melodía transcrita">
          {texto.length === 0 ? (
            <span className={estilos.vacio}>
              {escuchando
                ? 'Escuchando… toca notas cerca del micrófono.'
                : 'Aquí aparecerá la melodía transcrita.'}
            </span>
          ) : (
            texto
          )}
        </div>
        {escuchando && <Afinador receptor={receptorTonoRef} />}
        {escuchando && <MedidorSnr receptor={receptorNivelRef} />}
      </div>

      {fraseDetectada !== null && (
        <p className={estilos.fraseReconocida} role="status">
          <span aria-hidden="true">✅</span> Frase reconocida: <strong>{fraseDetectada}</strong>
        </p>
      )}

      {confuso && fraseDetectada === null && (
        <p className={estilos.aviso} role="status">
          <span aria-hidden="true">🎸</span> Se oye sonido pero ninguna nota clara: toca de a{' '}
          <strong>una sola cuerda</strong> por vez, despacio y cerca del
          micro. Los acordes rasgueados no se leen (suenan varias notas a
          la vez).
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
                if (!hablarConPausa(frase.texto)) {
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
        <summary>Ver notas, signos y espacio (para afinar la guitarra)</summary>
        <TablaNotas />
      </details>
    </section>
  );
}
