import { GuitarIcon } from '@phosphor-icons/react';
import InstrumentoPanel from './components/InstrumentoPanel/InstrumentoPanel.tsx';
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
        <h1 className={estilos.titulo}>
          Notas que hablan <GuitarIcon aria-hidden="true" weight="duotone" />
        </h1>
        <p className={estilos.subtitulo}>
          Toca una melodía con la guitarra y la app la convierte en palabras y voz.
        </p>
      </header>

      <main className={estilos.rejilla}>
        <InstrumentoPanel />
      </main>

      <footer className={estilos.pie}>
        Proyecto de Física (Acústica). Hecho para comunicar sin barreras.
      </footer>
    </div>
  );
}
