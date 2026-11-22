import {
  BackspaceIcon,
  CheckCircleIcon,
  CopyIcon,
  GuitarIcon,
  MicrophoneIcon,
  ShareNetworkIcon,
  SpeakerHighIcon,
  StopIcon,
} from '@phosphor-icons/react';
import { notasDeFrase } from '../../audio/frases.ts';
import type { LecturaTono } from '../../audio/melodia.ts';
import type { NivelSenal } from '../../types/index.ts';
import type { Dispatch, SetStateAction } from 'react';
import type { Ajustes } from '../../utils/ajustes.ts';
import Afinador from '../Afinador/Afinador.tsx';
import AjustesVoz from '../AjustesVoz/AjustesVoz.tsx';
import FrasesPropias from '../FrasesPropias/FrasesPropias.tsx';
import MedidorSnr from '../MedidorSnr/MedidorSnr.tsx';
import comun from '../compartido/compartido.module.css';
import estilos from './PestanaHablar.module.css';

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
  /** Frases esenciales y propias, para decirlas con un toque. */
  frases: string[];
  personalizadas: string[];
  onAnadir: (entrada: string) => boolean;
  onQuitar: (frase: string) => void;
  ajustes: Ajustes;
  setAjustes: Dispatch<SetStateAction<Ajustes>>;
  voces: string[];
  historial: string[];
  onDecir: (frase: string) => void;
  onBorrarHistorial: () => void;
}

/**
 * Pestaña "Hablar": escuchar la guitarra, ver la transcripción y decirla en
 * voz alta, con sus frases (rápidas y propias) y los ajustes de la voz.
 */
export default function PestanaHablar(props: Props): React.JSX.Element {
  const { escuchando, texto, fraseDetectada, historial } = props;
  return (
    <>
      <p className={comun.ayuda}>
        Toca con la guitarra, <strong>una nota por letra</strong>, cerca del micrófono: la
        app las escribe y <strong>dice la frase en voz alta</strong>. Está pensada para la
        guitarra: la voz hablada casi no se lee.
      </p>

      <div className={comun.botones}>
        {!escuchando ? (
          <button type="button" className={comun.tocar} onClick={props.onEmpezar}>
            <MicrophoneIcon aria-hidden="true" weight="fill" /> Escuchar melodía
          </button>
        ) : (
          <button type="button" onClick={props.onDetener}>
            <StopIcon aria-hidden="true" weight="fill" /> Dejar de escuchar
          </button>
        )}
        <button
          type="button"
          onClick={props.onHablar}
          disabled={texto.length === 0}
          aria-label="Leer en voz alta el texto transcrito"
        >
          <SpeakerHighIcon aria-hidden="true" /> Decir en voz alta
        </button>
        {/* Siempre montados: así el espacio está reservado y nada se mueve al
            aparecer el primer texto. Ocultos (visibility) no reciben foco ni se leen. */}
        <div
          className={`${estilos.accionesTexto} ${texto.length === 0 ? estilos.oculto : ''}`}
        >
          <button type="button" onClick={props.onCopiar}>
            <CopyIcon aria-hidden="true" /> Copiar
          </button>
          {typeof navigator.share === 'function' && (
            <button type="button" onClick={props.onCompartir}>
              <ShareNetworkIcon aria-hidden="true" /> Compartir
            </button>
          )}
          <button
            type="button"
            onClick={props.onBorrarUltima}
            aria-label="Borrar la última letra"
          >
            <BackspaceIcon aria-hidden="true" /> Borrar
          </button>
          <button type="button" onClick={props.onLimpiar}>
            Limpiar
          </button>
        </div>
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
              className={comun.pildora}
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
          <CheckCircleIcon aria-hidden="true" weight="fill" /> Frase reconocida:{' '}
          <strong>{fraseDetectada}</strong>
        </p>
      )}

      {props.confuso && fraseDetectada === null && (
        <p className={estilos.aviso} role="status">
          <GuitarIcon aria-hidden="true" /> Se oye sonido pero ninguna nota clara: toca de
          a <strong>una sola cuerda</strong> por vez, despacio y cerca del micro. Los
          acordes rasgueados no se leen (suenan varias notas a la vez).
        </p>
      )}

      <section className={estilos.frasesRapidas} aria-labelledby="titulo-frases-rapidas">
        <h3 id="titulo-frases-rapidas">Frases rápidas</h3>
        <p className={comun.ayuda}>
          Tócalas con la guitarra, o pulsa una para decirla. Debajo de cada una están sus
          notas.
        </p>
        <div className={estilos.frasesGrid}>
          {props.frases.map((frase) => (
            <button
              key={frase}
              type="button"
              className={estilos.fraseBtn}
              onClick={() => props.onDecir(frase)}
              aria-label={`Decir en voz alta: ${frase}. Notas: ${notasDeFrase(frase)}`}
            >
              <span>{frase}</span>
              <small>{notasDeFrase(frase)}</small>
            </button>
          ))}
        </div>
      </section>

      <FrasesPropias
        personalizadas={props.personalizadas}
        onAnadir={props.onAnadir}
        onQuitar={props.onQuitar}
      />

      <details className={comun.desplegable}>
        <summary>Historial (lo último que se dijo)</summary>
        {historial.length === 0 ? (
          <p className={comun.ayuda}>Todavía no se ha dicho nada.</p>
        ) : (
          <>
            <ul className={comun.lista}>
              {historial.map((frase) => (
                <li key={frase}>
                  <span>{frase}</span>
                  <button
                    type="button"
                    className={comun.pildora}
                    onClick={() => props.onDecir(frase)}
                    aria-label={`Decir otra vez: ${frase}`}
                  >
                    Decir
                  </button>
                </li>
              ))}
            </ul>
            <div className={estilos.borrarHistorial}>
              <button
                type="button"
                className={comun.pildora}
                onClick={props.onBorrarHistorial}
              >
                Borrar historial
              </button>
            </div>
          </>
        )}
      </details>

      <AjustesVoz
        ajustes={props.ajustes}
        setAjustes={props.setAjustes}
        voces={props.voces}
      />
    </>
  );
}
