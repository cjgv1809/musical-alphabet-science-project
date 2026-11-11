import { normalizarSimboloCromatico, obtenerFrecuenciaNota } from './cromatico.ts';
import { DURACION_SIMBOLO_MS, PAUSA_ENTRE_SIMBOLOS_MS } from '../utils/constants.ts';

/**
 * Emisor de melodías: UNA nota por letra, con Web Audio nativo.
 *
 * Suena un solo oscilador senoidal en la frecuencia cromática de la
 * letra. ¿Por qué seno puro y no "sonido de guitarra"? Porque primero
 * validamos la CADENA (emisor → aire → detector) con la señal más
 * limpia posible; la robustez ante timbres reales (guitarra) la
 * demuestra el detector en `melodia.test.ts` con armónicos sintéticos.
 *
 * Sin librerías: un `OscillatorNode` + un `GainNode` bastan, y la
 * envolvente (subida/bajada anti-clic) se programa sobre el reloj del
 * audio (`currentTime`), que no se desvía como los temporizadores.
 */

/** Volumen de pico y rampas de la envolvente (segundos). */
const GANANCIA_PICO = 0.5;
const ATAQUE_S = 0.02;
const RELEVO_S = 0.03;

let contexto: AudioContext | null = null;

function obtenerContexto(): AudioContext {
  contexto ??= new AudioContext();
  return contexto;
}

/**
 * Desbloquea el audio del navegador. Los navegadores exigen un gesto
 * del usuario (clic) antes de sonar: hay que llamar a esto desde un
 * botón. Sin esto, el contexto queda suspendido y en silencio.
 */
export async function asegurarAudioListo(): Promise<void> {
  const ctx = obtenerContexto();
  if (ctx.state !== 'running') await ctx.resume();
}

/** Pausa asíncrona entre notas. */
function esperarMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

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

  const ctx = obtenerContexto();
  if (ctx.state !== 'running') await ctx.resume();

  const oscilador = ctx.createOscillator();
  oscilador.type = 'sine';
  oscilador.frequency.value = frecuencia;
  const ganancia = ctx.createGain();
  oscilador.connect(ganancia);
  ganancia.connect(ctx.destination);

  // Toda la envolvente se programa de una vez sobre el reloj del audio.
  const inicio = ctx.currentTime;
  const finSostenido = inicio + duracionMs / 1000;
  ganancia.gain.setValueAtTime(0, inicio);
  ganancia.gain.linearRampToValueAtTime(GANANCIA_PICO, inicio + ATAQUE_S);
  ganancia.gain.setValueAtTime(GANANCIA_PICO, finSostenido);
  ganancia.gain.linearRampToValueAtTime(0, finSostenido + RELEVO_S);
  oscilador.start(inicio);
  oscilador.stop(finSostenido + RELEVO_S + 0.01);
  oscilador.onended = () => {
    oscilador.disconnect();
    ganancia.disconnect();
  };

  await esperarMs(duracionMs + RELEVO_S * 1000 + 10);
  return true;
}

/**
 * Toca un mensaje como melodía. Lo no soportado se salta con una
 * pausa; el espacio tiene nota propia (RE3), ver `cromatico.ts`.
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
  const detenido = (): boolean => detenerMelodia || debeDetener?.() === true;
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
