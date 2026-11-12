import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { obtenerFrecuenciaNota } from '../src/audio/cromatico.ts';

const FRECUENCIA_MUESTREO = 48000;
const NOTA_MS = 700;
const PAUSA_MS = 250;
/** Silencio inicial: el micrófono falso recorta el arranque del archivo. */
const SILENCIO_INICIAL_MS = 1500;
/** Silencio final: debe superar el retraso con que la app dice la frase (1,2 s). */
const SILENCIO_FINAL_MS = 4000;
const AMPLITUD = 0.5;
const RAMPA_MS = 10;

/**
 * Genera un WAV (mono, 16 bits) que "toca" las letras de `texto`, una nota
 * por letra, con la misma tabla que usa la app. Chromium lo reproduce como
 * micrófono falso (`--use-file-for-fake-audio-capture`), en bucle.
 */
export function generarWav(texto: string, ruta: string): void {
  const muestras: number[] = [];
  const silencio = (ms: number): void => {
    for (let i = 0; i < (FRECUENCIA_MUESTREO * ms) / 1000; i += 1) muestras.push(0);
  };
  silencio(SILENCIO_INICIAL_MS);
  for (const letra of texto) {
    const frecuencia = obtenerFrecuenciaNota(letra);
    if (frecuencia === null) throw new Error(`Sin nota para "${letra}"`);
    const total = Math.round((FRECUENCIA_MUESTREO * NOTA_MS) / 1000);
    const rampa = Math.round((FRECUENCIA_MUESTREO * RAMPA_MS) / 1000);
    for (let i = 0; i < total; i += 1) {
      const envolvente = Math.min(1, i / rampa, (total - i) / rampa);
      muestras.push(
        AMPLITUD *
          envolvente *
          Math.sin((2 * Math.PI * frecuencia * i) / FRECUENCIA_MUESTREO),
      );
    }
    silencio(PAUSA_MS);
  }
  silencio(SILENCIO_FINAL_MS);

  const datos = Buffer.alloc(muestras.length * 2);
  muestras.forEach((m, i) => datos.writeInt16LE(Math.round(m * 32767), i * 2));
  const cabecera = Buffer.alloc(44);
  cabecera.write('RIFF', 0);
  cabecera.writeUInt32LE(36 + datos.length, 4);
  cabecera.write('WAVEfmt ', 8);
  cabecera.writeUInt32LE(16, 16); // tamaño del bloque fmt
  cabecera.writeUInt16LE(1, 20); // PCM
  cabecera.writeUInt16LE(1, 22); // mono
  cabecera.writeUInt32LE(FRECUENCIA_MUESTREO, 24);
  cabecera.writeUInt32LE(FRECUENCIA_MUESTREO * 2, 28); // bytes por segundo
  cabecera.writeUInt16LE(2, 32); // bytes por muestra
  cabecera.writeUInt16LE(16, 34); // bits por muestra
  cabecera.write('data', 36);
  cabecera.writeUInt32LE(datos.length, 40);

  mkdirSync(dirname(ruta), { recursive: true });
  writeFileSync(ruta, Buffer.concat([cabecera, datos]));
}
