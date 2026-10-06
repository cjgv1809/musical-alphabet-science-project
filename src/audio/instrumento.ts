import * as Tone from 'tone';
import {
  normalizarSimboloCromatico,
  obtenerFrecuenciaNota,
} from './cromatico.ts';
import {
  DURACION_SIMBOLO_MS,
  PAUSA_ENTRE_SIMBOLOS_MS,
} from '../utils/constants.ts';

/**
 * Desbloquea el audio del navegador. Los navegadores exigen un gesto
 * del usuario (clic) antes de sonar: hay que llamar a esto desde un
 * botón. Sin esto, Tone.js queda en silencio.
 */
export async function asegurarAudioListo(): Promise<void> {
  await Tone.start();
}

/** Pausa asíncrona entre notas. */
function esperarMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

/**
 * Emisor de melodías: UNA nota por letra.
 *
 * Suena un solo oscilador senoidal en la frecuencia cromática de la
 * letra. ¿Por qué seno puro y no "sonido de guitarra"? Porque primero
 * validamos la CADENA (emisor → aire → detector) con la señal más
 * limpia posible; la robustez ante timbres reales (guitarra) la
 * demuestra el detector en `melodia.test.ts` con armónicos sintéticos.
 */

export interface OpcionesTocarMelodia {
  duracionMs?: number;
  pausaMs?: number;
  alIniciarNota?: (simbolo: string, indice: number) => void;
  debeDetener?: () => boolean;
}

let sonandoMelodia = false;
let detenerMelodia = false;

/** ¿Hay una melodía sonando ahora? */
export function estaSonandoMelodia(): boolean {
  return sonandoMelodia;
}

/** Señal de parada (botón Detener del panel instrumento). */
export function solicitarDetencionMelodia(): void {
  detenerMelodia = true;
}

/** Toca UNA nota cromática (un solo seno + envolvente anti-clic). */
export async function tocarNota(
  simbolo: string,
  duracionMs: number = DURACION_SIMBOLO_MS,
): Promise<boolean> {
  const frecuencia = obtenerFrecuenciaNota(simbolo);
  if (frecuencia === null) return false;

  const oscilador = new Tone.Oscillator(frecuencia, 'sine');
  const ganancia = new Tone.Gain(0);
  oscilador.connect(ganancia);
  ganancia.connect(Tone.getDestination());

  const ahora = Tone.now();
  ganancia.gain.rampTo(0.5, 0.02, ahora);
  oscilador.start(ahora);

  await esperarMs(duracionMs);

  ganancia.gain.rampTo(0, 0.03, Tone.now());
  await esperarMs(40);

  oscilador.stop();
  oscilador.dispose();
  ganancia.dispose();
  return true;
}

/**
 * Toca un mensaje como melodía. El espacio suena como silencio largo
 * (así se oye dónde termina cada palabra); lo no soportado se salta.
 */
export async function tocarMelodia(
  mensaje: string,
  opciones: OpcionesTocarMelodia = {},
): Promise<void> {
  const {
    duracionMs = DURACION_SIMBOLO_MS,
    pausaMs = PAUSA_ENTRE_SIMBOLOS_MS,
    alIniciarNota,
    debeDetener,
  } = opciones;

  await asegurarAudioListo();
  sonandoMelodia = true;
  detenerMelodia = false;
  const detenido = (): boolean =>
    detenerMelodia || debeDetener?.() === true;
  try {
    let indiceVisible = 0;
    for (const caracter of mensaje) {
      if (detenido()) break;
      const simbolo = normalizarSimboloCromatico(caracter);
      if (simbolo === null) {
        await esperarMs(pausaMs);
        indiceVisible += 1;
        continue;
      }
      alIniciarNota?.(simbolo, indiceVisible);
      // El espacio también suena (RE3, cuerda al aire): así las palabras
      // no se pegan. El silencio entre notas lo pone la pausa posterior.
      await tocarNota(simbolo, duracionMs);
      if (detenido()) break;
      await esperarMs(pausaMs);
      indiceVisible += 1;
    }
  } finally {
    sonandoMelodia = false;
  }
}
