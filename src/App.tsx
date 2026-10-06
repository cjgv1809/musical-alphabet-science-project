import InstrumentoPanel from './components/InstrumentoPanel.tsx';
import estilos from './App.module.css';

/**
 * App raíz: comunicación accesible guitarra → palabras.
 * Un solo panel que lo hace todo: tocar, escuchar, transcribir,
 * detectar frases esenciales y hablarlas en voz alta.
 */
export default function App(): React.JSX.Element {
  return (
    <div className={estilos.pagina}>
      <header className={estilos.cabecera}>
        <h1 className={estilos.titulo}>Notas que hablan <span aria-hidden="true">🎸</span></h1>
        <p className={estilos.subtitulo}>
          Toca una melodía con la guitarra y la app la convierte en palabras
          y voz · Proyecto de Física (Acústica) accesible
        </p>
      </header>

      <main className={estilos.rejilla}>
        <InstrumentoPanel />
      </main>

      <footer className={estilos.pie}>
        Una nota por letra (LA3–LA#5) · Detector YIN + fraseario con voz ·
        Hecho para comunicar sin barreras
      </footer>
    </div>
  );
}
