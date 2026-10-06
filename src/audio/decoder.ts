import {
  DURACION_MINIMA_MS,
  MARGEN_GRUPO_MINIMO,
  TWIST_MAXIMO,
  VENTANAS_CONSECUTIVAS,
} from '../utils/constants.ts';
import {
  GRUPO_FRECUENCIAS_ALTAS,
  GRUPO_FRECUENCIAS_BAJAS,
  TODAS_LAS_FRECUENCIAS,
  obtenerSimboloPorPar,
} from './frequencies.ts';
import { goertzel } from './goertzel.ts';
import type { DetectorDeSimbolos } from './melodia.ts';
import {
  FRECUENCIAS_REFERENCIA_RUIDO,
  calcularSnrDb,
  calcularUmbralDinamico,
  estimarRuidoDeFondo,
} from './noiseFilter.ts';

/**
 * Decodificación audio → texto.
 *
 * Cómo decide que hay una letra (5 condiciones a la vez):
 * 1. Las DOS frecuencias del par superan el umbral dinámico.
 * 2. Son las más fuertes de su grupo (la mejor fila y la mejor columna).
 * 3. Cada una GANA SU GRUPO con margen (≥ 2× sobre su rival más cercana):
 *    tolera altavoces con graves flojos; un silbido solo no pasa porque
 *    en el otro grupo no hay ningún ganador claro.
 * 4. El par está razonablemente equilibrado ("twist" ≤ 8×, red de seguridad).
 * 5. El par corresponde a un símbolo real (la combinación libre se ignora).
 *
 * Encima, `DecodificadorSuavizado` añade:
 * 5. Duración mínima (50 ms): anti-palmadas.
 * 6. Ventanas consecutivas (2): anti-ruidos breves.
 */

/** Detección cruda de UNA ventana de audio (sin suavizado temporal). */
export interface ResultadoDeteccion {
  simbolo: string;
  fBaja: number;
  fAlta: number;
  /** Suma de ambas magnitudes: intensidad del "acorde". */
  magnitudCombinada: number;
  umbral: number;
  ruido: number;
  snrDb: number;
}

interface MejorCandidata {
  frecuencia: number;
  magnitud: number;
}

/** Lo más fuerte de cada grupo en una ventana, sin exigir nada más. */
export interface AnalisisVentana {
  mejorBaja: MejorCandidata;
  mejorAlta: MejorCandidata;
  /** Umbral dinámico de ese instante (ruido × factor, con suelo mínimo). */
  umbral: number;
  ruido: number;
  /** Todas las magnitudes (para el margen por grupo y el diagnóstico). */
  magnitudes: Readonly<Record<number, number>>;
}

/**
 * Mide una ventana: calcula las 13 magnitudes, el ruido de fondo,
 * el umbral y la mejor fila/columna. Es la materia prima que usan
 * tanto el detector (`detectarEnVentana`) como el panel de
 * diagnóstico en vivo (para ver qué está "oyendo" el móvil).
 */
export function analizarVentana(
  muestras: Float32Array,
  sampleRate: number,
): AnalisisVentana | null {
  if (muestras.length === 0 || sampleRate <= 0) return null;

  const magnitudes: Record<number, number> = {};
  for (const f of TODAS_LAS_FRECUENCIAS) {
    magnitudes[f] = goertzel(muestras, f, sampleRate);
  }
  const magnitudesRuido: number[] = FRECUENCIAS_REFERENCIA_RUIDO.map(
    (f) => goertzel(muestras, f, sampleRate),
  );

  const ruido = estimarRuidoDeFondo(magnitudesRuido);
  const umbral = calcularUmbralDinamico(ruido);

  const mejorBaja = buscarMejor(magnitudes, GRUPO_FRECUENCIAS_BAJAS);
  const mejorAlta = buscarMejor(magnitudes, GRUPO_FRECUENCIAS_ALTAS);
  if (mejorBaja === null || mejorAlta === null) return null;
  return { mejorBaja, mejorAlta, umbral, ruido, magnitudes };
}

/**
 * ¿La mejor nota gana CLARAMENTE en su grupo? Debe sonar al menos
 * el doble que su rival más cercana. Es la prueba estrella contra
 * altavoces flojos: la nota grave puede llegar débil, pero si aun así
 * es la más fuerte de su grupo, la letra vale.
 */
function ganaConMargen(
  magnitudes: Readonly<Record<number, number>>,
  grupo: readonly number[],
  mejor: MejorCandidata,
): boolean {
  let segundo = 0;
  for (const frecuencia of grupo) {
    if (frecuencia === mejor.frecuencia) continue;
    const magnitud = magnitudes[frecuencia] ?? 0;
    if (magnitud > segundo) segundo = magnitud;
  }
  if (segundo <= 0) return true; // sin rivales: victoria total.
  return mejor.magnitud >= MARGEN_GRUPO_MINIMO * segundo;
}

function buscarMejor(
  magnitudes: Readonly<Record<number, number>>,
  grupo: readonly number[],
): MejorCandidata | null {
  let mejor: MejorCandidata | null = null;
  for (const frecuencia of grupo) {
    const magnitud = magnitudes[frecuencia] ?? 0;
    if (mejor === null || magnitud > mejor.magnitud) {
      mejor = { frecuencia, magnitud };
    }
  }
  return mejor;
}

/**
 * Analiza UNA ventana de muestras y devuelve el símbolo detectado,
 * o `null` si no hay nada claro (silencio, ruido o tono incompleto).
 */
export function detectarEnVentana(
  muestras: Float32Array,
  sampleRate: number,
): ResultadoDeteccion | null {
  const analisis = analizarVentana(muestras, sampleRate);
  if (analisis === null) return null;
  const { mejorBaja, mejorAlta, umbral, ruido, magnitudes } = analisis;

  // 1+2. Ambas superan el umbral y son las mejores de su grupo
  // (eso ya lo garantiza `analizarVentana` + esta comparación).
  if (mejorBaja.magnitud < umbral || mejorAlta.magnitud < umbral) {
    return null;
  }

  // 3. Cada tono gana su grupo con margen (≥ 2× sobre su rival).
  if (!ganaConMargen(magnitudes, GRUPO_FRECUENCIAS_BAJAS, mejorBaja)) {
    return null;
  }
  if (!ganaConMargen(magnitudes, GRUPO_FRECUENCIAS_ALTAS, mejorAlta)) {
    return null;
  }

  // 4. Red de seguridad ("twist"): el par no puede estar absurdamente
  // desequilibrado. (En telefonía "twist" = diferencia de nivel del par).
  const mayor = Math.max(mejorBaja.magnitud, mejorAlta.magnitud);
  const menor = Math.min(mejorBaja.magnitud, mejorAlta.magnitud);
  if (menor <= 0 || mayor / menor > TWIST_MAXIMO) return null;

  // 5. El par debe existir en el alfabeto (hay 1 combinación libre).
  const simbolo = obtenerSimboloPorPar(
    mejorBaja.frecuencia,
    mejorAlta.frecuencia,
  );
  if (simbolo === null) return null;

  const magnitudCombinada = mejorBaja.magnitud + mejorAlta.magnitud;
  return {
    simbolo,
    fBaja: mejorBaja.frecuencia,
    fAlta: mejorAlta.frecuencia,
    magnitudCombinada,
    umbral,
    ruido,
    snrDb: calcularSnrDb(magnitudCombinada, ruido),
  };
}

/**
 * Decodificador con memoria: solo confirma un símbolo si aparece en
 * varias ventanas SEGUIDAS durante un tiempo mínimo. Así una palmada
 * (fuerte pero de 20 ms) jamás se convierte en letra.
 *
 * Además evita duplicados: mientras el tono sigue sonando, solo emite
 * UNA vez; el siguiente símbolo igual requiere un silencio intermedio.
 * (Igual que al hablar: "AA" son dos sonidos separados por una pausa).
 */
export class DecodificadorSuavizado implements DetectorDeSimbolos {
  private candidata: string | null = null;
  private ventanasSeguidas = 0;
  private inicioCandidataMs = 0;
  private ultimoEmitido: string | null = null;

  reiniciar(): void {
    this.candidata = null;
    this.ventanasSeguidas = 0;
    this.ultimoEmitido = null;
  }

  /**
   * Procesa una ventana. Devuelve el símbolo CONFIRMADO o `null`.
   * @param ahoraMs Marca temporal (ej. `performance.now()`).
   */
  procesar(
    muestras: Float32Array,
    sampleRate: number,
    ahoraMs: number,
  ): ResultadoDeteccion | null {
    const deteccion = detectarEnVentana(muestras, sampleRate);

    // Silencio/ruido: se olvida la candidata y se abre paso al próximo
    // símbolo (así "A <pausa> A" emite dos veces).
    if (deteccion === null) {
      this.candidata = null;
      this.ventanasSeguidas = 0;
      this.ultimoEmitido = null;
      return null;
    }

    if (deteccion.simbolo === this.candidata) {
      this.ventanasSeguidas += 1;
    } else {
      this.candidata = deteccion.simbolo;
      this.ventanasSeguidas = 1;
      this.inicioCandidataMs = ahoraMs;
    }

    const tiempoSostenido = ahoraMs - this.inicioCandidataMs;
    const confirmada =
      this.ventanasSeguidas >= VENTANAS_CONSECUTIVAS &&
      tiempoSostenido >= DURACION_MINIMA_MS;

    if (!confirmada) return null;
    // Ya emitida mientras el tono continúa: no duplicar.
    if (this.ultimoEmitido === deteccion.simbolo) return null;

    this.ultimoEmitido = deteccion.simbolo;
    return deteccion;
  }
}
