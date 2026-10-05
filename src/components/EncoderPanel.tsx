import { useRef } from 'react';
import { solicitarDetencion, tocarMensaje } from '../audio/toneGenerator.ts';
import { normalizarSimbolo } from '../audio/frequencies.ts';
import { useAppStore } from '../store/useAppStore.ts';
import { DURACION_SIMBOLO_MS } from '../utils/constants.ts';
import estilos from './EncoderPanel.module.css';

/**
 * Panel de codificación: escribir → "tocar" el mensaje como música.
 * El botón dispara `tocarMensaje` (Tone.js) y `alIniciarSimbolo`
 * resalta en grande la letra que está sonando (aria-live).
 */
export default function EncoderPanel(): React.JSX.Element {
  const mensaje = useAppStore((e) => e.mensaje);
  const tocando = useAppStore((e) => e.tocando);
  const simboloActual = useAppStore((e) => e.simboloActual);

  const detencionRef = useRef(false);

  // Caracteres que se perderán al tocar (tildes, ñ, #…): avisar es
  // más educativo que silenciar el problema.
  const noSoportados = [...mensaje]
    .filter((c) => c !== '\n' && normalizarSimbolo(c) === null)
    .slice(0, 12);

  const tocar = async (): Promise<void> => {
    const estado = useAppStore.getState();
    if (estado.tocando || estado.mensaje.trim().length === 0) return;
    detencionRef.current = false;
    estado.fijarTocando(true);
    estado.fijarEstadoAudio('tocando');
    estado.fijarError(null);
    try {
      await tocarMensaje(estado.mensaje, {
        duracionMs: DURACION_SIMBOLO_MS,
        alIniciarSimbolo: (simbolo) => {
          useAppStore.getState().fijarSimboloActual(simbolo);
        },
        debeDetener: () => detencionRef.current,
      });
    } catch {
      useAppStore
        .getState()
        .fijarError(
          'No se pudo reproducir el audio. Revisa el volumen y los permisos del navegador.',
        );
      useAppStore.getState().fijarEstadoAudio('error');
    } finally {
      const fin = useAppStore.getState();
      fin.fijarTocando(false);
      fin.fijarSimboloActual(null);
      if (fin.estadoAudio === 'tocando') fin.fijarEstadoAudio('inactivo');
    }
  };

  const detener = (): void => {
    detencionRef.current = true;
    solicitarDetencion();
  };

  return (
    <section className={estilos.panel} aria-labelledby="titulo-encoder">
      <h2 id="titulo-encoder">1 · Codificar y tocar 🎹</h2>
      <p className={estilos.ayuda}>
        Escribe un mensaje y la app lo convierte en una melodía: cada letra
        suena como un acorde de dos notas ({DURACION_SIMBOLO_MS} ms por letra).
      </p>

      <label className={estilos.etiqueta} htmlFor="campo-mensaje">
        Mensaje
      </label>
      <textarea
        id="campo-mensaje"
        className={estilos.texto}
        rows={3}
        maxLength={140}
        value={mensaje}
        disabled={tocando}
        onChange={(e) => useAppStore.getState().fijarMensaje(e.target.value)}
        placeholder="Ej. HOLA COMO ESTAS"
      />
      {noSoportados.length > 0 && (
        <p className={estilos.aviso} role="note">
          Estos caracteres no tienen nota y se saltarán:{' '}
          {noSoportados.join(' ')} (usa N en vez de Ñ, sin tildes).
        </p>
      )}

      <div className={estilos.botones}>
        <button
          type="button"
          className={estilos.tocar}
          onClick={() => void tocar()}
          disabled={tocando || mensaje.trim().length === 0}
        >
          {tocando ? 'Tocando…' : '▶ Tocar mensaje'}
        </button>
        <button
          type="button"
          onClick={detener}
          disabled={!tocando}
          aria-label="Detener reproducción"
        >
          ■ Detener
        </button>
      </div>

      <div className={estilos.ahoraSuena} aria-live="polite">
        {simboloActual === null ? (
          <span className={estilos.apagado}>—</span>
        ) : (
          <span className={estilos.nota}>
            {simboloActual === ' ' ? '␣ (espacio)' : simboloActual}
          </span>
        )}
      </div>
    </section>
  );
}
