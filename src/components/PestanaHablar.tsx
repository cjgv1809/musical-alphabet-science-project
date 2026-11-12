import type { LecturaTono } from '../audio/melodia.ts';
import type { NivelSenal } from '../types/index.ts';
import Afinador from './Afinador.tsx';
import MedidorSnr from './MedidorSnr.tsx';
import estilos from './InstrumentoPanel.module.css';

interface Props {
  escuchando: boolean;
  onEmpezar: () => void;
  onDetener: () => void;
  texto: string;
  fraseDetectada: string | null;
  sugerencias: string[];
  confuso: boolean;
  aviso: string | null;
  registrarTono: (receptor: ((lectura: LecturaTono | null) => void) | null) => void;
  registrarNivel: (receptor: ((nivel: NivelSenal) => void) | null) => void;
  onHablar: () => void;
  onCopiar: () => void;
  onCompartir: () => void;
  onBorrarUltima: () => void;
  onLimpiar: () => void;
  historial: string[];
  onDecir: (frase: string) => void;
  onBorrarHistorial: () => void;
}

/**
 * Pestaña "Hablar": escuchar la guitarra, ver la transcripción y decirla en
 * voz alta. Es la pantalla de uso diario, así que lleva lo imprescindible.
 */
export default function PestanaHablar(props: Props): React.JSX.Element {
  const { escuchando, texto, fraseDetectada, historial } = props;
  return (
    <>
      <div className={estilos.botones}>
        {!escuchando ? (
          <button type="button" className={estilos.tocar} onClick={props.onEmpezar}>
            <span aria-hidden="true">●</span> Escuchar melodía
          </button>
        ) : (
          <button type="button" onClick={props.onDetener}>
            <span aria-hidden="true">■</span> Dejar de escuchar
          </button>
        )}
        <button
          type="button"
          onClick={props.onHablar}
          disabled={texto.length === 0}
          aria-label="Leer en voz alta el texto transcrito"
        >
          <span aria-hidden="true">🔊</span> Hablar
        </button>
        <button type="button" onClick={props.onCopiar} disabled={texto.length === 0}>
          <span aria-hidden="true">📋</span> Copiar
        </button>
        {typeof navigator.share === 'function' && (
          <button type="button" onClick={props.onCompartir} disabled={texto.length === 0}>
            <span aria-hidden="true">↗</span> Compartir
          </button>
        )}
        <button
          type="button"
          onClick={props.onBorrarUltima}
          disabled={texto.length === 0}
          aria-label="Borrar la última letra"
        >
          <span aria-hidden="true">⌫</span> Borrar
        </button>
        <button type="button" onClick={props.onLimpiar} disabled={texto.length === 0}>
          Limpiar
        </button>
      </div>

      <p className={estilos.exito} role="status">
        {props.aviso ?? ''}
      </p>

      <div className={estilos.doble}>
        <div
          className={estilos.resultado}
          role="log"
          aria-live="polite"
          aria-label="Melodía transcrita"
        >
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
        {escuchando && <Afinador registrar={props.registrarTono} />}
        {escuchando && <MedidorSnr registrar={props.registrarNivel} />}
      </div>

      {props.sugerencias.length > 0 && (
        <p className={estilos.sugerencias}>
          <span>¿Quieres decir?</span>
          {props.sugerencias.map((frase) => (
            <button
              key={frase}
              type="button"
              className={estilos.sugerencia}
              onClick={() => props.onDecir(frase)}
              aria-label={`Decir en voz alta: ${frase}`}
            >
              {frase}
            </button>
          ))}
        </p>
      )}

      {fraseDetectada !== null && (
        <p className={estilos.fraseReconocida} role="status">
          <span aria-hidden="true">✅</span> Frase reconocida:{' '}
          <strong>{fraseDetectada}</strong>
        </p>
      )}

      {props.confuso && fraseDetectada === null && (
        <p className={estilos.aviso} role="status">
          <span aria-hidden="true">🎸</span> Se oye sonido pero ninguna nota clara: toca
          de a <strong>una sola cuerda</strong> por vez, despacio y cerca del micro. Los
          acordes rasgueados no se leen (suenan varias notas a la vez).
        </p>
      )}

      <details className={estilos.tabla}>
        <summary>Historial (lo último que se dijo)</summary>
        {historial.length === 0 ? (
          <p className={estilos.ayuda}>Todavía no se ha dicho nada.</p>
        ) : (
          <>
            <ul className={estilos.propias}>
              {historial.map((frase) => (
                <li key={frase}>
                  <span>{frase}</span>
                  <button
                    type="button"
                    onClick={() => props.onDecir(frase)}
                    aria-label={`Decir otra vez: ${frase}`}
                  >
                    Decir
                  </button>
                </li>
              ))}
            </ul>
            <div className={estilos.nuevaFrase}>
              <button type="button" onClick={props.onBorrarHistorial}>
                Borrar historial
              </button>
            </div>
          </>
        )}
      </details>
    </>
  );
}
