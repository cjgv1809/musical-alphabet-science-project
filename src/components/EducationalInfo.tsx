import estilos from './EducationalInfo.module.css';

/**
 * Sección educativa: la física detrás del proyecto en 5 tarjetas.
 * Sin partes interactivas: para oír y ver las notas están la tabla
 * de notas y el espectro en vivo.
 */
export default function EducationalInfo(): React.JSX.Element {
  return (
    <section className={estilos.panel} aria-labelledby="titulo-edu">
      <h2 id="titulo-edu">La física del proyecto 📚</h2>

      <div className={estilos.tarjetas}>
        <article>
          <h3>🌊 Ondas sonoras</h3>
          <p>
            El sonido es aire vibrando. Cada vibración completa por segundo
            es 1 hercio (Hz): pocas vibraciones = grave, muchas = agudo.
          </p>
        </article>
        <article>
          <h3>🎵 Frecuencia</h3>
          <p>
            Cada letra suena como un acorde de DOS frecuencias puras entre
            300 y 3000 Hz, la banda donde el oído y los móviles rinden mejor.
          </p>
        </article>
        <article>
          <h3>🔬 Fourier y Goertzel</h3>
          <p>
            Fourier demostró que todo sonido es suma de notas. La FFT halla
            todas; Goertzel solo pregunta por NUESTRAS 13 notas: 13 preguntas
            en vez de miles, ideal para un móvil.
          </p>
        </article>
        <article>
          <h3>☎️ DTMF</h3>
          <p>
            Los teléfonos de teclas usan el mismo truco (2 tonos por tecla).
            Nosotros ampliamos su parrilla de 16 a 42 combinaciones para todo
            el alfabeto.
          </p>
        </article>
        <article>
          <h3>📶 Señal-ruido (SNR)</h3>
          <p>
            Con barullo de fondo, el umbral dinámico mide el ruido en
            frecuencias vacías y solo acepta tonos claramente más fuertes.
            Más dB = mensaje más fiable.
          </p>
        </article>
      </div>
    </section>
  );
}
