import { DURACION_MINIMA_MS, VENTANAS_CONSECUTIVAS } from '../utils/constants.ts';
import { notaMasCercana } from './cromatico.ts';
import { estimarFrecuenciaFundamental } from './tonoFundamental.ts';

/**
 * Detector de melodías (modo instrumento).
 *
 * Cadena por ventana: estima la fundamental (YIN) → la redondea a la
 * letra más cercana (±45 cents) → exige confirmación temporal, igual
 * que el modo DTMF: 2 ventanas seguidas + 50 ms mínimos, y una sola
 * emisión por nota sostenida (la repetición exige un silencio intermedio).
 *
 * Limitación conocida del prototipo: ventanas fijas cada 40 ms, así que
 * quien toque (persona o emisor) debe sostener cada nota ~500 ms con
 * pausas entre notas. La segmentación por ataques (onsets) queda como
 * mejora futura (ver README).
 */

/** Lo mínimo que un detector entrega al motor de escucha. */
export interface DeteccionSimple {
  simbolo: string;
  /** SNR aproximada (dB) para el medidor: periodicidad × 30. */
  snrDb: number;
}

/** Contrato que cumple cualquier detector (DTMF o melodía). */
export interface DetectorDeSimbolos {
  procesar(
    muestras: Float32Array,
    sampleRate: number,
    ahoraMs: number,
  ): DeteccionSimple | null;
  reiniciar(): void;
  /**
   * ¿Lleva un rato oyendo sonido FUERTE sin ninguna nota clara
   * (acorde rasgueado, golpe, barullo)? Devuelve true UNA vez y se
   * resetea: la UI lo usa para sugerir "toca de a una cuerda".
   * Opcional para no obligar a todos los detectores.
   */
  leerConfusion?(): boolean;
}

// RMS a partir del cual hay "sonido de verdad" (no silencio).
const UMBRAL_SONIDO_FUERTE = 0.05;
// Ventanas seguidas de sonido-sin-nota antes de avisar (≈ 320 ms).
const VENTANAS_PARA_AVISO = 8;

function rmsVentana(muestras: Float32Array): number {
  let suma = 0;
  for (let i = 0; i < muestras.length; i += 1) {
    const m = muestras[i] ?? 0;
    suma += m * m;
  }
  return Math.sqrt(suma / muestras.length);
}

export class DetectorMelodia implements DetectorDeSimbolos {
  private candidata: string | null = null;
  private ventanasSeguidas = 0;
  private inicioCandidataMs = 0;
  private ultimoEmitido: string | null = null;
  private rachaSinTono = 0;

  reiniciar(): void {
    this.candidata = null;
    this.ventanasSeguidas = 0;
    this.ultimoEmitido = null;
  }

  procesar(
    muestras: Float32Array,
    sampleRate: number,
    ahoraMs: number,
  ): DeteccionSimple | null {
    // 1. ¿Hay un tono claro? Si no (silencio/ruido), se olvida todo y
    // se abre paso a la próxima nota ("A <pausa> A" emite dos veces).
    // Pero OJO: si hay sonido FUERTE sin tono (un acorde rasgueado),
    // se cuenta racha para el aviso de confusión (ver leerConfusion).
    const rms = rmsVentana(muestras);
    const estimacion = estimarFrecuenciaFundamental(muestras, sampleRate);
    const nota =
      estimacion === null ? null : notaMasCercana(estimacion.frecuencia);
    if (estimacion === null || nota === null) {
      if (rms >= UMBRAL_SONIDO_FUERTE) this.rachaSinTono += 1;
      else this.rachaSinTono = 0;
      this.reiniciar();
      return null;
    }
    this.rachaSinTono = 0;

    // 2. Confirmación temporal: 2 ventanas seguidas + 50 ms mínimos.
    if (nota.simbolo === this.candidata) {
      this.ventanasSeguidas += 1;
    } else {
      this.candidata = nota.simbolo;
      this.ventanasSeguidas = 1;
      this.inicioCandidataMs = ahoraMs;
    }
    const tiempoSostenido = ahoraMs - this.inicioCandidataMs;
    const confirmada =
      this.ventanasSeguidas >= VENTANAS_CONSECUTIVAS &&
      tiempoSostenido >= DURACION_MINIMA_MS;
    if (!confirmada) return null;
    if (this.ultimoEmitido === nota.simbolo) return null;

    this.ultimoEmitido = nota.simbolo;
    // La claridad (0–1) como SNR aproximada para el medidor.
    return { simbolo: nota.simbolo, snrDb: 5 + estimacion.claridad * 25 };
  }

  leerConfusion(): boolean {
    if (this.rachaSinTono >= VENTANAS_PARA_AVISO) {
      this.rachaSinTono = 0;
      return true;
    }
    return false;
  }
}
