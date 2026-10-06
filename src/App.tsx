import DecoderPanel from './components/DecoderPanel.tsx';
import EducationalInfo from './components/EducationalInfo.tsx';
import EncoderPanel from './components/EncoderPanel.tsx';
import FrequencyTable from './components/FrequencyTable.tsx';
import InstrumentoPanel from './components/InstrumentoPanel.tsx';
import SpectrumVisualizer from './components/SpectrumVisualizer.tsx';
import { useAppStore } from './store/useAppStore.ts';
import estilos from './App.module.css';

/**
 * App raíz: codificador, decodificador, espectro, tabla de notas
 * y sección educativa.
 */
export default function App(): React.JSX.Element {
  const estadoAudio = useAppStore((e) => e.estadoAudio);

  const estadoVisible =
    estadoAudio === 'tocando'
      ? '🔊 Tocando mensaje…'
      : estadoAudio === 'escuchando'
        ? '🎧 Escuchando…'
        : estadoAudio === 'error'
          ? '⚠ Error de audio'
          : '💤 Inactivo';

  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecera}>
        <div>
          <h1 className={estilos.titulo}>Alfabeto Musical Tocado 🎶</h1>
          <p className={estilos.subtitulo}>
            Habla con música: cada letra es un acorde de dos notas · Proyecto
            de Física (Acústica)
          </p>
        </div>
        <span
          className={estilos.estado}
          data-estado={estadoAudio}
          role="status"
          aria-label={`Estado del audio: ${estadoVisible}`}
        >
          {estadoVisible}
        </span>
      </header>

      <main className={estilos.rejilla}>
        <EncoderPanel />
        <DecoderPanel />
        <div className={estilos.anchoCompleto}>
          <SpectrumVisualizer />
        </div>
        <FrequencyTable />
        <div className={estilos.anchoCompleto}>
          <EducationalInfo />
        </div>
        <div className={estilos.anchoCompleto}>
          <InstrumentoPanel />
        </div>
      </main>

      <footer className={estilos.pie}>
        Banda 300–3000 Hz · Goertzel + DTMF extendido · Hecho para la feria de
        ciencias
      </footer>
    </div>
  );
}
