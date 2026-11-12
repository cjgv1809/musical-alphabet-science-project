import { useEffect, useMemo, useRef, useState } from 'react';
import { FRASES_ESENCIALES, buscarFrase, sugerirFrases } from '../audio/frases.ts';
import { solicitarDetencionMelodia, tocarMelodia } from '../audio/instrumento.ts';
import { callar, hayVoz } from '../audio/voz.ts';
import { useAjustes } from '../hooks/useAjustes.ts';
import { useAviso } from '../hooks/useAviso.ts';
import { useEscucha } from '../hooks/useEscucha.ts';
import { useFrasesPersonalizadas } from '../hooks/useFrasesPersonalizadas.ts';
import { useHistorial } from '../hooks/useHistorial.ts';
import { useVoz } from '../hooks/useVoz.ts';
import { useVocesEspanolas } from '../hooks/useVocesEspanolas.ts';
import ListaPestanas, { type Pestana } from './ListaPestanas.tsx';
import PestanaAprender from './PestanaAprender.tsx';
import PestanaHablar from './PestanaHablar.tsx';
import estilos from './InstrumentoPanel.module.css';

/** Silencio (ms) tras la última nota antes de decir la frase en voz alta. */
const RETRASO_FRASE_MS = 1200;
/** Máximo de letras que se conservan de la transcripción. */
const MAX_TEXTO = 200;

const PESTANAS: readonly Pestana[] = [
  { id: 'hablar', etiqueta: 'Hablar', icono: '🎤' },
  { id: 'aprender', etiqueta: 'Aprender', icono: '🎸' },
];

/**
 * Panel principal: de la guitarra a las palabras (modo accesible).
 * Coordina el estado compartido y reparte la interfaz en dos pestañas:
 * - "Hablar": escucha la guitarra, transcribe y dice las frases en voz alta.
 * - "Aprender": toca melodías, muestra notas, frases y ajustes.
 * Las dos pestañas siguen montadas (solo se ocultan) para que cambiar de una
 * a otra no corte la escucha ni pierda la transcripción.
 */
export default function InstrumentoPanel(): React.JSX.Element {
  const [pestana, setPestana] = useState('hablar');
  const [mensaje, setMensaje] = useState('HOLA');
  const [tocando, setTocando] = useState(false);
  const [notaActual, setNotaActual] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const { ajustes, setAjustes, ajustesRef } = useAjustes();
  const voces = useVocesEspanolas();
  const { historial, registrar, borrar: borrarHistorial } = useHistorial();
  const { personalizadas, anadir, quitar: quitarFrase } = useFrasesPersonalizadas();
  const { aviso, mostrarAviso } = useAviso();
  const { hablarConPausa, pausaTranscripcionRef } = useVoz(ajustesRef, registrar);
  const detencionRef = useRef(false);
  const ultimoHabladoRef = useRef('');

  const escucha = useEscucha(
    pausaTranscripcionRef,
    (simbolo) => {
      // Si lo anterior ya se dijo en voz alta como frase, empieza una frase
      // nueva (así se puede decir AGUA, y luego AYUDA).
      setTexto((t) =>
        t !== '' && t === ultimoHabladoRef.current
          ? simbolo
          : (t + simbolo).slice(-MAX_TEXTO),
      );
    },
    setErrorLocal,
  );

  /** Frase esencial o propia que equivale a lo transcrito (derivada, sin estado). */
  const fraseDetectada = useMemo(
    () => buscarFrase(texto, personalizadas),
    [texto, personalizadas],
  );

  // Fraseario: si lo transcrito equivale a una frase esencial, se habla.
  // (Se compara sin espacios: la guitarra no los emite.)
  // Se espera un momento sin notas nuevas antes de hablar: "NO" no debe
  // sonar si la persona sigue deletreando "NOCHE". Si el texto cambia, el
  // temporizador se cancela y se reinicia.
  useEffect(() => {
    const frase = fraseDetectada;
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
  }, [texto, fraseDetectada, hablarConPausa]);

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
    // El micro no debe transcribir lo que toca el propio altavoz.
    pausaTranscripcionRef.current = true;
    try {
      await tocarMelodia(mensaje, {
        alIniciarNota: (simbolo) => setNotaActual(simbolo),
        debeDetener: () => detencionRef.current,
        duracionMs: ajustesRef.current.duracionNotaMs,
      });
    } catch {
      setErrorLocal('No se pudo reproducir. Revisa el volumen del equipo.');
    } finally {
      setTocando(false);
      setNotaActual(null);
      pausaTranscripcionRef.current = false;
    }
  };

  const detenerMelodia = (): void => {
    detencionRef.current = true;
    solicitarDetencionMelodia();
  };

  const textoCompartible = (): string => fraseDetectada ?? texto;

  const copiarTexto = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(textoCompartible());
      mostrarAviso('Texto copiado.');
    } catch {
      mostrarAviso('No se pudo copiar: selecciona el texto a mano.');
    }
  };

  const compartirTexto = async (): Promise<void> => {
    try {
      await navigator.share({ text: textoCompartible() });
    } catch {
      // La persona canceló el menú de compartir: no es un error.
    }
  };

  const borrarUltima = (): void => {
    setTexto((t) => t.slice(0, -1));
    escucha.limpiarConfuso();
    callar();
  };

  const limpiarTexto = (): void => {
    setTexto('');
    escucha.limpiarConfuso();
    ultimoHabladoRef.current = '';
    callar();
  };

  const decirFrase = (frase: string): void => {
    if (!hablarConPausa(frase)) {
      setErrorLocal('Este navegador no tiene voz sintetizada.');
    }
  };

  const hablarTexto = (): void => {
    if (!hablarConPausa(fraseDetectada ?? texto)) {
      setErrorLocal('Este navegador no tiene voz sintetizada: lee el texto en pantalla.');
    }
  };

  const anadirFrase = (entrada: string): boolean => {
    const error = anadir(entrada);
    setErrorLocal(error);
    return error === null;
  };

  const sugerencias =
    fraseDetectada === null
      ? sugerirFrases(texto, [
          ...FRASES_ESENCIALES.map((f) => f.texto),
          ...personalizadas,
        ])
      : [];

  return (
    <section className={estilos.panel} aria-labelledby="titulo-instrumento">
      <h2 id="titulo-instrumento">
        De la guitarra a las palabras <span aria-hidden="true">🎸</span>
      </h2>

      <ListaPestanas
        pestanas={PESTANAS}
        activa={pestana}
        onCambiar={setPestana}
        prefijo="instrumento"
        etiquetaLista="Secciones"
      />

      {/* Anuncia el estado del micrófono a lectores de pantalla. */}
      <p className={estilos.soloLector} role="status">
        {escucha.escuchando ? 'Micrófono activado: escuchando.' : ''}
      </p>

      {errorLocal !== null && (
        <p className={estilos.error} role="alert">
          <span aria-hidden="true">⚠</span> {errorLocal}
        </p>
      )}

      <div
        role="tabpanel"
        id="instrumento-panel-hablar"
        aria-labelledby="instrumento-tab-hablar"
        hidden={pestana !== 'hablar'}
      >
        <PestanaHablar
          escuchando={escucha.escuchando}
          onEmpezar={() => void escucha.empezar()}
          onDetener={escucha.detener}
          texto={texto}
          fraseDetectada={fraseDetectada}
          sugerencias={sugerencias}
          confuso={escucha.confuso}
          aviso={aviso}
          registrarTono={escucha.registrarTono}
          registrarNivel={escucha.registrarNivel}
          onHablar={hablarTexto}
          onCopiar={() => void copiarTexto()}
          onCompartir={() => void compartirTexto()}
          onBorrarUltima={borrarUltima}
          onLimpiar={limpiarTexto}
          historial={historial}
          onDecir={decirFrase}
          onBorrarHistorial={borrarHistorial}
        />
      </div>

      <div
        role="tabpanel"
        id="instrumento-panel-aprender"
        aria-labelledby="instrumento-tab-aprender"
        hidden={pestana !== 'aprender'}
      >
        <PestanaAprender
          mensaje={mensaje}
          onMensaje={setMensaje}
          tocando={tocando}
          onTocar={() => void tocar()}
          onDetenerMelodia={detenerMelodia}
          notaActual={notaActual}
          ajustes={ajustes}
          setAjustes={setAjustes}
          voces={voces}
          personalizadas={personalizadas}
          onAnadir={anadirFrase}
          onQuitar={quitarFrase}
          onDecir={decirFrase}
        />
      </div>
    </section>
  );
}
