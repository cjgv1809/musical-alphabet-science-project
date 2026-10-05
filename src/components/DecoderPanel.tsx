import { useEffect, useState } from 'react';
import { motorEscucha } from '../audio/escucha.ts';
import type { AnalisisVentana } from '../audio/decoder.ts';
import { useAppStore } from '../store/useAppStore.ts';
import estilos from './DecoderPanel.module.css';

/** Última foto cruda del micrófono (para el panel de diagnóstico). */
interface FotoDebug {
  analisis: AnalisisVentana;
  sampleRate: number;
}

/**
 * Panel de decodificación: escuchar → texto reconstruido.
 * Controla el `motorEscucha` (micrófono + Goertzel en vivo):
 * cada símbolo confirmado se añade al texto.
 */
export default function DecoderPanel(): React.JSX.Element {
  const escuchando = useAppStore((e) => e.escuchando);
  const textoDecodificado = useAppStore((e) => e.textoDecodificado);
  const nivel = useAppStore((e) => e.nivel);
  const error = useAppStore((e) => e.error);
  const [foto, setFoto] = useState<FotoDebug | null>(null);

  // Apagar el micrófono si el componente se desmonta (higiene de recursos).
  useEffect(() => {
    return () => {
      if (motorEscucha.estaActivo()) motorEscucha.detener();
    };
  }, []);

  const empezar = async (): Promise<void> => {
    const estado = useAppStore.getState();
    if (estado.escuchando) return;
    estado.fijarError(null);
    try {
      await motorEscucha.iniciar({
        alConfirmar: (simbolo) => {
          const actual = useAppStore.getState();
          actual.fijarTextoDecodificado(actual.textoDecodificado + simbolo);
        },
        alNivel: (nuevoNivel) => {
          useAppStore.getState().fijarNivel(nuevoNivel);
        },
        alDebug: (analisis, sampleRate) => {
          setFoto({ analisis, sampleRate });
        },
      });
      const ok = useAppStore.getState();
      ok.fijarEscuchando(true);
      ok.fijarEstadoAudio('escuchando');
    } catch (err) {
      const mensaje =
        err instanceof Error ? err.message : 'No se pudo activar el micrófono.';
      const fallo = useAppStore.getState();
      fallo.fijarError(mensaje);
      fallo.fijarEstadoAudio('error');
    }
  };

  const detener = (): void => {
    const estado = useAppStore.getState();
    motorEscucha.detener();
    estado.fijarEscuchando(false);
    if (estado.estadoAudio === 'escuchando') {
      estado.fijarEstadoAudio('inactivo');
    }
    estado.fijarNivel({ senal: 0, ruido: 0, snrDb: 0 });
    setFoto(null);
  };

  const calidad =
    nivel.snrDb > 20 ? 'Excelente' : nivel.snrDb > 10 ? 'Buena' : 'Débil';

  return (
    <section className={estilos.panel} aria-labelledby="titulo-decoder">
      <h2 id="titulo-decoder">2 · Escuchar y decodificar 🎧</h2>
      <p className={estilos.ayuda}>
        Pulsa Escuchar y acerca el altavoz que está tocando. El detector
        Goertzel reconoce cada par de notas en tiempo real.
      </p>

      <div className={estilos.botones}>
        {!escuchando ? (
          <button
            type="button"
            className={estilos.escuchar}
            onClick={() => void empezar()}
          >
            ● Escuchar
          </button>
        ) : (
          <button type="button" onClick={detener}>
            ■ Dejar de escuchar
          </button>
        )}
        <button
          type="button"
          onClick={() => useAppStore.getState().limpiarDecodificado()}
          disabled={textoDecodificado.length === 0}
        >
          Limpiar texto
        </button>
      </div>

      {error !== null && (
        <p className={estilos.error} role="alert">
          ⚠ {error}
        </p>
      )}

      <div
        className={estilos.medidor}
        aria-label={`Nivel de señal: calidad ${calidad}, ${nivel.snrDb.toFixed(0)} decibelios de relación señal-ruido`}
      >
        <div className={estilos.barraFila}>
          <span>Señal</span>
          <div className={estilos.barra}>
            <div
              className={estilos.rellenoSenal}
              style={{ width: `${Math.round(nivel.senal * 100)}%` }}
            />
          </div>
        </div>
        <div className={estilos.barraFila}>
          <span>Ruido</span>
          <div className={estilos.barra}>
            <div
              className={estilos.rellenoRuido}
              style={{ width: `${Math.round(nivel.ruido * 100)}%` }}
            />
          </div>
        </div>
        <p className={estilos.snr}>
          SNR: <strong>{nivel.snrDb.toFixed(1)} dB</strong> ({calidad})
        </p>
      </div>

      <div className={estilos.resultado} aria-live="polite" aria-label="Texto decodificado">
        {textoDecodificado.length === 0 ? (
          <span className={estilos.vacio}>
            {escuchando
              ? 'Escuchando… toca un mensaje cerca del micrófono.'
              : 'Aquí aparecerá el mensaje decodificado.'}
          </span>
        ) : (
          textoDecodificado
        )}
      </div>

      {escuchando && (
        <details className={estilos.diagnostico}>
          <summary>🔧 Diagnóstico: ¿qué está oyendo el micrófono?</summary>
          {foto === null ? (
            <p>Aún sin datos…</p>
          ) : (
            <>
              <p>
                Micro a {foto.sampleRate} Hz · umbral ahora:{' '}
                {foto.analisis.umbral.toFixed(1)}
              </p>
              <div className={estilos.barraFila}>
                <span>{foto.analisis.mejorBaja.frecuencia} Hz</span>
                <div className={estilos.barra}>
                  <div
                    className={estilos.rellenoSenal}
                    style={{
                      width: `${Math.min(100, Math.round((foto.analisis.mejorBaja.magnitud / Math.max(1, foto.analisis.umbral)) * 50))}%`,
                    }}
                  />
                </div>
              </div>
              <div className={estilos.barraFila}>
                <span>{foto.analisis.mejorAlta.frecuencia} Hz</span>
                <div className={estilos.barra}>
                  <div
                    className={estilos.rellenoSenal}
                    style={{
                      width: `${Math.min(100, Math.round((foto.analisis.mejorAlta.magnitud / Math.max(1, foto.analisis.umbral)) * 50))}%`,
                    }}
                  />
                </div>
              </div>
              <p className={estilos.pista}>
                Toca la nota A en la tabla: deberías ver 400 y 1350 Hz
                destacados (barra ≥ mitad = supera el umbral).
              </p>
            </>
          )}
        </details>
      )}
    </section>
  );
}
