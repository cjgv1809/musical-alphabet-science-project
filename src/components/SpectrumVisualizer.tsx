import { useEffect, useRef } from 'react';
import { motorEscucha } from '../audio/escucha.ts';
import {
  GRUPO_FRECUENCIAS_ALTAS,
  GRUPO_FRECUENCIAS_BAJAS,
} from '../audio/frequencies.ts';
import { FRECUENCIAS_REFERENCIA_RUIDO } from '../audio/noiseFilter.ts';
import { FACTOR_UMBRAL } from '../utils/constants.ts';
import estilos from './SpectrumVisualizer.module.css';

/**
 * Visualizador de espectro en Canvas 2D (tiempo real).
 *
 * Qué muestra:
 * - El espectro del micrófono (área verde): cuánta energía hay en cada
 *   frecuencia, de 0 a 3000 Hz (nuestra banda).
 * - Líneas azules = notas del grupo bajo, naranjas = grupo alto. Cuando
 *   una supera el umbral, brilla: ¡ahí hay medio acorde sonando!
 * - Línea roja = umbral dinámico (ruido × factor). Todo lo que quede por
 *   debajo se ignora: así se ve POR QUÉ el ruido de la feria no cuela.
 *
 * Nota honesta: el umbral dibujado se estima en el dominio del
 * visualizador (bytes 0–255), mientras el detector usa magnitudes de
 * Goertzel. La IDEA es idéntica (ruido × factor) aunque la escala difiera.
 */

const FRECUENCIA_MAX_DIBUJO = 3000;
const ALTO_CANVAS = 200;

function binDeFrecuencia(frecuencia: number, sampleRate: number, fftSize: number): number {
  return Math.round((frecuencia * fftSize) / sampleRate);
}

export default function SpectrumVisualizer(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let datos: Uint8Array | null = null;

    const dibujar = (): void => {
      raf = requestAnimationFrame(dibujar);
      const canvas = canvasRef.current;
      if (canvas === null) return;
      const ctx = canvas.getContext('2d');
      // jsdom (tests) no implementa Canvas: salir sin romper nada.
      if (ctx === null) return;

      // Alta resolución en pantallas retina (nítido en el proyector).
      const dpr = window.devicePixelRatio || 1;
      const anchoCss = canvas.clientWidth || 600;
      if (canvas.width !== Math.round(anchoCss * dpr)) {
        canvas.width = Math.round(anchoCss * dpr);
        canvas.height = Math.round(ALTO_CANVAS * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const ancho = anchoCss;
      const alto = ALTO_CANVAS;

      const analizador = motorEscucha.obtenerAnalizador();

      ctx.clearRect(0, 0, ancho, alto);
      ctx.fillStyle = '#10142a';
      ctx.fillRect(0, 0, ancho, alto);

      if (analizador === null) {
        ctx.fillStyle = '#8b93b0';
        ctx.font = '14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(
          'Pulsa «Escuchar» para ver el espectro en vivo (0–3000 Hz)',
          ancho / 2,
          alto / 2,
        );
        return;
      }

      const sampleRate = motorEscucha.obtenerSampleRate();
      const fftSize = analizador.fftSize;
      if (datos === null || datos.length !== analizador.frequencyBinCount) {
        datos = new Uint8Array(analizador.frequencyBinCount);
      }
      analizador.getByteFrequencyData(datos as Uint8Array<ArrayBuffer>);

      const xDeFrecuencia = (f: number): number =>
        (f / FRECUENCIA_MAX_DIBUJO) * ancho;
      const yDeNivel = (v: number): number => alto - (v / 255) * (alto - 18);

      // Umbral dinámico (dominio del visualizador): ruido × factor.
      let sumaRuido = 0;
      for (const f of FRECUENCIAS_REFERENCIA_RUIDO) {
        const bin = binDeFrecuencia(f, sampleRate, fftSize);
        sumaRuido += datos[bin] ?? 0;
      }
      const ruido = sumaRuido / FRECUENCIAS_REFERENCIA_RUIDO.length;
      const umbralBytes = Math.min(255, ruido * FACTOR_UMBRAL);

      // Curva del espectro.
      ctx.beginPath();
      ctx.moveTo(0, alto);
      const pasoBin = sampleRate / fftSize;
      const binMax = Math.min(
        datos.length - 1,
        Math.floor(FRECUENCIA_MAX_DIBUJO / pasoBin),
      );
      for (let bin = 0; bin <= binMax; bin += 1) {
        const f = bin * pasoBin;
        const valor = datos[bin] ?? 0;
        ctx.lineTo(xDeFrecuencia(f), yDeNivel(valor));
      }
      ctx.lineTo(xDeFrecuencia(FRECUENCIA_MAX_DIBUJO), alto);
      ctx.closePath();
      ctx.fillStyle = 'rgba(42, 157, 143, 0.55)';
      ctx.fill();

      // Línea de umbral dinámico.
      ctx.strokeStyle = '#e63946';
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(0, yDeNivel(umbralBytes));
      ctx.lineTo(ancho, yDeNivel(umbralBytes));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#e63946';
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`umbral ×${FACTOR_UMBRAL}`, 6, yDeNivel(umbralBytes) - 4);

      // Marcadores de nuestras 13 notas (brillan al superar el umbral).
      const dibujarMarcador = (f: number, color: string): void => {
        const bin = binDeFrecuencia(f, sampleRate, fftSize);
        const valor = datos?.[bin] ?? 0;
        const activa = valor > umbralBytes;
        ctx.strokeStyle = activa ? '#ffd166' : color;
        ctx.lineWidth = activa ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(xDeFrecuencia(f), 0);
        ctx.lineTo(xDeFrecuencia(f), alto - 16);
        ctx.stroke();
        ctx.lineWidth = 1;
        if (activa) {
          ctx.fillStyle = '#ffd166';
          ctx.beginPath();
          ctx.arc(xDeFrecuencia(f), yDeNivel(valor), 4, 0, Math.PI * 2);
          ctx.fill();
        }
      };
      for (const f of GRUPO_FRECUENCIAS_BAJAS) dibujarMarcador(f, '#4a90d9');
      for (const f of GRUPO_FRECUENCIAS_ALTAS) dibujarMarcador(f, '#e76f51');

      // Eje de frecuencias.
      ctx.fillStyle = '#8b93b0';
      ctx.font = '10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (let f = 0; f <= FRECUENCIA_MAX_DIBUJO; f += 500) {
        ctx.fillText(`${f}`, xDeFrecuencia(f), alto - 3);
      }
    };

    raf = requestAnimationFrame(dibujar);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section className={estilos.panel} aria-label="Espectro de frecuencias en tiempo real">
      <h2>Espectro en vivo 🔬</h2>
      <canvas
        ref={canvasRef}
        className={estilos.canvas}
        style={{ height: `${ALTO_CANVAS}px` }}
        role="img"
        aria-label="Gráfico del espectro de frecuencias del micrófono con las notas del alfabeto marcadas y la línea del umbral dinámico"
      />
      <p className={estilos.leyenda}>
        <span className={estilos.baja}>— notas bajas</span>{' '}
        <span className={estilos.alta}>— notas altas</span>{' '}
        <span className={estilos.umbral}>- - umbral dinámico</span> ·
        el marcador dorado parpadea al detectar media letra.
      </p>
    </section>
  );
}
