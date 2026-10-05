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
}

export class DetectorMelodia implements DetectorDeSimbolos {
  private candidata: string | null = null;
  private ventanasSeguidas = 0;
  private inicioCandidataMs = 0;
  private ultimoEmitido: string | null = null;

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
    const estimacion = estimarFrecuenciaFundamental(muestras, sampleRate);
    if (estimacion === null) {
      this.reiniciar();
      return null;
    }

    // 2. ¿A qué letra corresponde? Fuera de tolerancia → nada.
    const nota = notaMasCercana(estimacion.frecuencia);
    if (nota === null) {
      this.reiniciar();
      return null;
    }

    // 3. Confirmación temporal (igual que el modo DTMF).
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
}
