import { useState } from 'react';
import { MAPA_FRECUENCIAS, SIMBOLOS_SOPORTADOS } from '../audio/frequencies.ts';
import { asegurarAudioListo, tocarSimbolo } from '../audio/toneGenerator.ts';
import estilos from './FrequencyTable.module.css';

/**
 * Tabla educativa letra → frecuencias, con reproducción individual.
 * Cada fila suena su acorde: el oído comprueba lo que dicen los números.
 */
export default function FrequencyTable(): React.JSX.Element {
  const [filtro, setFiltro] = useState('');
  const [sonando, setSonando] = useState<string | null>(null);

  const simbolos = SIMBOLOS_SOPORTADOS.filter((s) =>
    s.toLowerCase().includes(filtro.trim().toLowerCase()),
  );

  const probar = async (simbolo: string): Promise<void> => {
    if (sonando !== null) return;
    setSonando(simbolo);
    try {
      await asegurarAudioListo();
      await tocarSimbolo(simbolo, 400);
    } catch {
      // Sin audio disponible: se ignora (la tabla sigue siendo útil).
    } finally {
      setSonando(null);
    }
  };

  const nombreVisible = (simbolo: string): string =>
    simbolo === ' ' ? '␣ ESPACIO' : simbolo;

  return (
    <section className={estilos.panel} aria-labelledby="titulo-tabla">
      <h2 id="titulo-tabla">Alfabeto de notas 🎼</h2>
      <p className={estilos.ayuda}>
        41 símbolos × 2 notas = 13 frecuencias en total. Pulsa ▶ para oír
        cada acorde.
      </p>
      <label className={estilos.etiqueta} htmlFor="filtro-simbolos">
        Buscar símbolo
      </label>
      <input
        id="filtro-simbolos"
        className={estilos.filtro}
        type="search"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        placeholder="Ej. A, 5, ?"
      />
      <div className={estilos.tablaContenedor}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              <th scope="col">Letra</th>
              <th scope="col">Nota baja (Hz)</th>
              <th scope="col">Nota alta (Hz)</th>
              <th scope="col">Oír</th>
            </tr>
          </thead>
          <tbody>
            {simbolos.map((simbolo) => {
              const par = MAPA_FRECUENCIAS[simbolo];
              if (par === undefined) return null;
              return (
                <tr key={simbolo}>
                  <td className={estilos.simbolo}>{nombreVisible(simbolo)}</td>
                  <td>{par.fBaja}</td>
                  <td>{par.fAlta}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => void probar(simbolo)}
                      disabled={sonando !== null}
                      aria-label={`Reproducir el tono de ${nombreVisible(simbolo)}`}
                    >
                      {sonando === simbolo ? '…' : '▶'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
