import { describe, expect, it } from 'vitest';
import { DetectorMelodia } from './melodia.ts';
import {
  normalizarSimboloCromatico,
  obtenerFrecuenciaNota,
} from './cromatico.ts';
import { TAMANO_VENTANA } from '../utils/constants.ts';

/**
 * Tests del modo instrumento de punta a punta.
 * La prueba estrella: el MISMO mensaje sintetizado como seno puro
 * y como "guitarra" (fundamental + armónicos) se transcribe IGUAL.
 * Eso demuestra que el detector oye NOTAS, no timbres.
 */

const SAMPLE_RATE = 44100;
const TICK_MS = 40;

/** Síntesis de una nota con el timbre pedido (armonicos[0] = fundamental). */
function sintetizarNota(
  frecuencia: number,
  nMuestras: number,
  armonicos: readonly number[] = [1],
): Float32Array {
  const muestras = new Float32Array(nMuestras);
  for (let i = 0; i < nMuestras; i += 1) {
    let valor = 0;
    for (let k = 0; k < armonicos.length; k += 1) {
      const parcial = k + 1;
      valor +=
        (armonicos[k] ?? 0) *
        Math.sin((2 * Math.PI * frecuencia * parcial * i) / SAMPLE_RATE);
    }
    muestras[i] = 0.4 * valor;
  }
  return muestras;
}

function sintetizarMelodia(
  mensaje: string,
  duracionMs: number,
  pausaMs: number,
  armonicos: readonly number[] = [1],
): Float32Array {
  const porMs = SAMPLE_RATE / 1000;
  const trozos: Float32Array[] = [];
  for (const caracter of mensaje) {
    const simbolo = normalizarSimboloCromatico(caracter);
    if (simbolo === null) continue;
    if (simbolo === ' ') {
      trozos.push(new Float32Array(Math.round((duracionMs + pausaMs) * porMs)));
      continue;
    }
    const frecuencia = obtenerFrecuenciaNota(simbolo) ?? 0;
    trozos.push(
      sintetizarNota(frecuencia, Math.round(duracionMs * porMs), armonicos),
      new Float32Array(Math.round(pausaMs * porMs)),
    );
  }
  const total = trozos.reduce((acc, t) => acc + t.length, 0);
  const senal = new Float32Array(total);
  let offset = 0;
  for (const trozo of trozos) {
    senal.set(trozo, offset);
    offset += trozo.length;
  }
  return senal;
}

function transcribir(senal: Float32Array): string {
  const detector = new DetectorMelodia();
  const paso = Math.round((TICK_MS * SAMPLE_RATE) / 1000);
  let texto = '';
  for (
    let offset = 0;
    offset + TAMANO_VENTANA <= senal.length;
    offset += paso
  ) {
    const ventana = senal.slice(offset, offset + TAMANO_VENTANA);
    const ahoraMs = (offset / SAMPLE_RATE) * 1000;
    const resultado = detector.procesar(ventana, SAMPLE_RATE, ahoraMs);
    if (resultado !== null) texto += resultado.simbolo;
  }
  return texto;
}

const GUITARRA = [1, 0.5, 0.25, 0.12] as const;

describe('melodia (instrumento → texto)', () => {
  it('"HOLA" en senos puros se transcribe exacto', () => {
    expect(transcribir(sintetizarMelodia('HOLA', 500, 60))).toBe('HOLA');
  });

  it('"HOLA" con timbre de guitarra se transcribe IGUAL', () => {
    expect(transcribir(sintetizarMelodia('HOLA', 500, 60, GUITARRA))).toBe(
      'HOLA',
    );
  });

  it('nota repetida con pausa ("CASA") emite dos veces la A', () => {
    expect(transcribir(sintetizarMelodia('CASA', 500, 60, GUITARRA))).toBe(
      'CASA',
    );
  });

  it('"HOLA." con timbre de guitarra incluye el punto (nota grave)', () => {
    expect(transcribir(sintetizarMelodia('HOLA.', 500, 60, GUITARRA))).toBe(
      'HOLA.',
    );
  });

  it('un punteo breve (30 ms) no confirma', () => {
    const senal = sintetizarMelodia('E', 30, 200, GUITARRA);
    expect(transcribir(senal)).toBe('');
  });
});
