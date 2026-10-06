import * as Tone from 'tone';
import {
  DURACION_SIMBOLO_MS,
  PAUSA_ENTRE_SIMBOLOS_MS,
} from '../utils/constants.ts';
import { normalizarSimbolo, obtenerFrecuencias } from './frequencies.ts';

/**
 * Generación de tonos con Tone.js (el "altavoz" del proyecto).
 *
 * Concepto físico: cada símbolo suena como un ACORDE de dos notas
 * (dos ondas sinusoidales simultáneas). Usamos ondas SENOIDALES puras
 * —sin armónicos— porque son las más limpias de detectar: todo lo que
 * mida el Goertzel fuera de esas dos frecuencias será ruido.
 *
 * Detalle técnico importante (anti-clics): encender/apagar un tono de
 * golpe crea una discontinuidad que suena como "clic" y ensucia el
 * espectro (energía en todas las frecuencias). Por eso aplicamos una
 * envolvente de ataque/liberación de ~20–30 ms: el volumen sube y baja
 * suavemente. Escúchalo: sin envolvente se oye áspero; con ella, musical.
 */

export interface OpcionesTocarMensaje {
  /** Duración de cada símbolo en ms (500 ms fijos en esta versión). */
  duracionMs?: number;
  /** Silencio entre símbolos (necesario para separar letras iguales). */
  pausaMs?: number;
  /** Callback para resaltar en la UI qué símbolo está sonando. */
  alIniciarSimbolo?: (simbolo: string, indice: number) => void;
  /** Si devuelve true, la reproducción se detiene tras el símbolo actual. */
  debeDetener?: () => boolean;
}

/** Pausa asíncrona (reutilizada por el emisor de melodías). */
export function esperarMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

let reproduciendo = false;
let detencionSolicitada = false;

/** ¿Hay una secuencia sonando ahora? (para deshabilitar botones). */
export function estaReproduciendo(): boolean {
  return reproduciendo;
}

/**
 * Desbloquea el audio del navegador. Los navegadores exigen un gesto
 * del usuario (clic) antes de sonar: hay que llamar a esto desde el
 * botón "Tocar mensaje". Sin esto, Tone.js queda en silencio.
 */
export async function asegurarAudioListo(): Promise<void> {
  await Tone.start();
}

/**
 * Toca UN símbolo (su par de frecuencias) durante `duracionMs`.
 * Devuelve false si el símbolo no es transmisible (se omite).
 */
export async function tocarSimbolo(
  simbolo: string,
  duracionMs: number = DURACION_SIMBOLO_MS,
): Promise<boolean> {
  const par = obtenerFrecuencias(simbolo);
  if (par === null) return false;

  // Dos osciladores senoidales con ganancias SEPARADAS → altavoces.
  // Pre-énfasis de graves: los altavoces pequeños (portátil, móvil)
  // reproducen flojo por debajo de ~800 Hz, así que la nota baja sale
  // más fuerte de fábrica (0.5 frente a 0.35) para llegar equilibrada
  // al micrófono. Pico total 0.85: sin recorte (clipping).
  const osciladorBajo = new Tone.Oscillator(par.fBaja, 'sine');
  const osciladorAlto = new Tone.Oscillator(par.fAlta, 'sine');
  const gananciaBaja = new Tone.Gain(0);
  const gananciaAlta = new Tone.Gain(0);
  osciladorBajo.connect(gananciaBaja);
  osciladorAlto.connect(gananciaAlta);
  gananciaBaja.connect(Tone.getDestination());
  gananciaAlta.connect(Tone.getDestination());

  const ahora = Tone.now();
  // Envolvente: subida suave de 20 ms (evita el "clic" de encendido).
  gananciaBaja.gain.rampTo(0.5, 0.02, ahora);
  gananciaAlta.gain.rampTo(0.35, 0.02, ahora);
  osciladorBajo.start(ahora);
  osciladorAlto.start(ahora);

  await esperarMs(duracionMs);

  // Bajada suave de 30 ms antes de apagar (evita el "clic" de apagado).
  gananciaBaja.gain.rampTo(0, 0.03, Tone.now());
  gananciaAlta.gain.rampTo(0, 0.03, Tone.now());
  await esperarMs(40);

  osciladorBajo.stop();
  osciladorAlto.stop();
  osciladorBajo.dispose();
  osciladorAlto.dispose();
  gananciaBaja.dispose();
  gananciaAlta.dispose();
  return true;
}

/**
 * Toca un mensaje completo, símbolo por símbolo ("hablar con música").
 * Los caracteres no soportados (tildes, ñ, #…) se saltan con una pausa
 * corta, sin romper la secuencia.
 */
export async function tocarMensaje(
  mensaje: string,
  opciones: OpcionesTocarMensaje = {},
): Promise<void> {
  const {
    duracionMs = DURACION_SIMBOLO_MS,
    pausaMs = PAUSA_ENTRE_SIMBOLOS_MS,
    alIniciarSimbolo,
    debeDetener,
  } = opciones;

  await asegurarAudioListo();
  reproduciendo = true;
  detencionSolicitada = false;
  const detenido = (): boolean =>
    detencionSolicitada || debeDetener?.() === true;
  try {
    let indiceVisible = 0;
    for (const caracter of mensaje) {
      if (detenido()) break;
      const simbolo = normalizarSimbolo(caracter);
      if (simbolo === null) {
        await esperarMs(pausaMs);
        indiceVisible += 1;
        continue;
      }
      alIniciarSimbolo?.(simbolo, indiceVisible);
      await tocarSimbolo(simbolo, duracionMs);
      if (detenido()) break;
      // Pausa entre símbolos: imprescindible para que el decodificador
      // distinga "A A" (dos letras) de "A" (una larga).
      await esperarMs(pausaMs);
      indiceVisible += 1;
    }
  } finally {
    reproduciendo = false;
  }
}

/**
 * Señal de parada: la comprueba `tocarMensaje` entre símbolos.
 * Se conecta al botón "Detener" de la UI (ver `EncoderPanel` en Fase 3).
 */
export function solicitarDetencion(): void {
  detencionSolicitada = true;
}
