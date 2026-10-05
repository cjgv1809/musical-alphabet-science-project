import { describe, expect, it } from 'vitest';
import { DecodificadorSuavizado } from './decoder.ts';
import { normalizarSimbolo, obtenerFrecuencias } from './frequencies.ts';
import { TAMANO_VENTANA } from '../utils/constants.ts';

/**
 * Test de INTEGRACIÓN: el flujo completo sin hardware.
 *
 * Simula con fidelidad lo que hacen `tocarMensaje` + `MotorEscucha`:
 * 1. Síntesis: cada letra → sus dos tonos durante X ms + pausa de silencio
 *    (igual que el emisor Tone.js, pero con senos matemáticos exactos).
 * 2. Muestreo: una "foto" de 1024 muestras cada tickMs (igual que el
 *    motor de escucha en vivo: instantáneas, no audio continuo).
 * 3. Decodificación con `DecodificadorSuavizado` y marcas de tiempo.
 *
 * Si este test pasa, la cadena frecuencias→síntesis→Goertzel→umbral→
 * suavizado funciona de punta a punta; el único eslabón no cubierto
 * es el aire + altavoz/micrófono reales (se prueba en el aula).
 */

const SAMPLE_RATE = 44100;
/**
 * Ritmo de muestreo en vivo: espejo del `setInterval` de `MotorEscucha`
 * (ver `escucha.ts`). Si se cambia allí, cambiar aquí también.
 */
const TICK_MS = 40;

/**
 * Construye la señal completa de un mensaje: tono + silencio por letra.
 * Amplitud 0.4 por seno (suma pico 0.8: sin recorte, como un altavoz).
 */
function sintetizarMensaje(
  mensaje: string,
  duracionMs: number,
  pausaMs: number,
): Float32Array {
  const porMs = SAMPLE_RATE / 1000;
  const muestrasTono = Math.round(duracionMs * porMs);
  const muestrasPausa = Math.round(pausaMs * porMs);
  const trozos: Float32Array[] = [];

  for (const caracter of mensaje) {
    const par = obtenerFrecuencias(caracter);
    if (par === null) continue;
    const tono = new Float32Array(muestrasTono);
    for (let i = 0; i < muestrasTono; i += 1) {
      tono[i] =
        0.4 * Math.sin((2 * Math.PI * par.fBaja * i) / SAMPLE_RATE) +
        0.4 * Math.sin((2 * Math.PI * par.fAlta * i) / SAMPLE_RATE);
    }
    trozos.push(tono, new Float32Array(muestrasPausa));
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

/** Normaliza como el emisor: mayúsculas y solo símbolos soportados. */
function textoEsperado(mensaje: string): string {
  let resultado = '';
  for (const caracter of mensaje) {
    const s = normalizarSimbolo(caracter);
    if (s !== null) resultado += s;
  }
  return resultado;
}

/** Bucle de escucha simulado: espejo de `MotorEscucha.leerVentana`. */
function decodificarSenal(senal: Float32Array): string {
  const decodificador = new DecodificadorSuavizado();
  const pasoMuestras = Math.round((TICK_MS * SAMPLE_RATE) / 1000);
  let texto = '';
  for (
    let offset = 0;
    offset + TAMANO_VENTANA <= senal.length;
    offset += pasoMuestras
  ) {
    const ventana = senal.slice(offset, offset + TAMANO_VENTANA);
    const ahoraMs = (offset / SAMPLE_RATE) * 1000;
    const resultado = decodificador.procesar(ventana, SAMPLE_RATE, ahoraMs);
    if (resultado !== null) texto += resultado.simbolo;
  }
  return texto;
}

describe('flujo completo (escribir → tocar → escuchar → decodificar)', () => {
  it('"HOLA 123." a 500 ms por letra se decodifica exacto', () => {
    const mensaje = 'HOLA 123.';
    const senal = sintetizarMensaje(mensaje, 500, 60);
    expect(decodificarSenal(senal)).toBe(textoEsperado(mensaje));
  });

  it('letra doble separada por pausa ("CASA") no se pierde', () => {
    const senal = sintetizarMensaje('CASA', 500, 60);
    expect(decodificarSenal(senal)).toBe('CASA');
  });

  it('una ráfaga breve (30 ms) NO confirma: anti-palmadas', () => {
    const senal = sintetizarMensaje('E', 30, 200);
    expect(decodificarSenal(senal)).toBe('');
  });
});
