import { TAMANO_VENTANA } from '../utils/constants.ts';
import type { NivelSenal } from '../types/index.ts';
import { calcularSnrDb, crearCadenaAntiRuido } from './noiseFilter.ts';
import { DetectorMelodia, type DetectorDeSimbolos } from './melodia.ts';

/**
 * Motor de escucha: micrófono → filtro pasa-banda → detector en vivo.
 *
 * Cómo funciona (cadena de audio):
 *   micrófono → pasa-altas 300 Hz → pasa-bajas 3000 Hz → AnalyserNode
 * Cada 40 ms copiamos una ventana de muestras en el dominio del tiempo
 * y la pasamos por el detector (`DetectorMelodia`: estima la fundamental
 * y la redondea a la letra más cercana).
 * El mismo AnalyserNode lo lee `SpectrumVisualizer` para dibujar.
 *
 * El medidor de nivel es APROXIMADO (RMS de la ventana + seguidor de
 * mínimo como "ruido base"): sirve para el indicador visual y para
 * explicar la SNR, no es instrumentación de laboratorio.
 */

export interface CallbacksEscucha {
  /** Se llama cada vez que se CONFIRMA un símbolo (tras el suavizado). */
  alConfirmar: (simbolo: string, snrDb: number) => void;
  /** Se llama en cada ventana con el nivel aproximado (para el medidor). */
  alNivel: (nivel: NivelSenal) => void;
}

/** Traduce errores técnicos del micrófono a mensajes para estudiantes. */
export function mensajeAmigableErrorMic(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Permiso de micrófono denegado. Pulsa el icono del candado en la barra del navegador y permite el micrófono, luego reintenta.';
    }
    if (error.name === 'NotFoundError' || error.name === 'OverconstrainedError') {
      return 'No se encontró ningún micrófono en este dispositivo. Conecta uno o prueba en otro equipo.';
    }
    if (error.name === 'NotReadableError') {
      return 'El micrófono está ocupado por otra aplicación (videollamada, grabadora…). Ciérrala y reintenta.';
    }
  }
  if (error instanceof Error && /https|secure|context/i.test(error.message)) {
    return 'El micrófono requiere una conexión segura (HTTPS) o localhost.';
  }
  return 'No se pudo activar el micrófono. Revisa los permisos del navegador e inténtalo de nuevo.';
}

function calcularRms(muestras: Float32Array): number {
  let suma = 0;
  for (let i = 0; i < muestras.length; i += 1) {
    const m = muestras[i] ?? 0;
    suma += m * m;
  }
  return Math.sqrt(suma / muestras.length);
}

export class MotorEscucha {
  private contexto: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private analizador: AnalyserNode | null = null;
  private bufferTiempo: Float32Array | null = null;
  private intervaloId = 0;
  /**
   * Detector intercambiable (por defecto, melodía cromática).
   * El motor no distingue: solo pide `procesar(ventana) → símbolo o null`.
   */
  private detector: DetectorDeSimbolos = new DetectorMelodia();
  private callbacks: CallbacksEscucha | null = null;
  private ruidoBase = 0.02;
  private activo = false;

  estaActivo(): boolean {
    return this.activo;
  }

  /** El visualizador lee de aquí (no destructivo: puede leer a la vez). */
  obtenerAnalizador(): AnalyserNode | null {
    return this.analizador;
  }

  obtenerSampleRate(): number {
    return this.contexto?.sampleRate ?? 44100;
  }

  async iniciar(
    callbacks: CallbacksEscucha,
    detector: DetectorDeSimbolos = new DetectorMelodia(),
  ): Promise<void> {
    if (this.activo) return;
    if (
      typeof navigator === 'undefined' ||
      navigator.mediaDevices?.getUserMedia === undefined
    ) {
      throw new Error(
        'Tu navegador no ofrece acceso al micrófono (se necesita HTTPS o localhost en Chrome/Edge/Firefox).',
      );
    }

    let stream: MediaStream;
    try {
      // Pedimos el sonido CRUDO: sin cancelación de eco, sin supresión
      // de ruido y sin ganancia automática. Esos procesados del móvil
      // están pensados para voz y pueden deformar o comerse tonos puros
      // (la supresión de ruido ataca justo lo estacionario, como un tono
      // sostenido). Nuestro propio filtro pasa-banda ya limpia la señal.
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
    } catch (error) {
      // Algunos navegadores no aceptan estos ajustes: reintento simple.
      // (Si el fallo es de permiso o falta de micro, el segundo intento
      // falla igual y se muestra el mensaje amigable correspondiente.)
      if (
        error instanceof DOMException &&
        error.name === 'OverconstrainedError'
      ) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (segundoError) {
          throw new Error(mensajeAmigableErrorMic(segundoError));
        }
      } else {
        throw new Error(mensajeAmigableErrorMic(error));
      }
    }

    const contexto = new AudioContext();
    if (contexto.state === 'suspended') {
      await contexto.resume();
    }
    const fuente = contexto.createMediaStreamSource(stream);
    const { entrada, salida } = crearCadenaAntiRuido(contexto);
    fuente.connect(entrada);

    // fftSize 2048 → 2048 muestras (~46 ms a 44.1 kHz): resolución ~21 Hz,
    // suficiente para separar notas a 150 Hz. Analizamos 1024 centrales.
    const analizador = contexto.createAnalyser();
    analizador.fftSize = 2048;
    analizador.smoothingTimeConstant = 0;
    salida.connect(analizador);

    this.contexto = contexto;
    this.stream = stream;
    this.analizador = analizador;
    this.bufferTiempo = new Float32Array(analizador.fftSize);
    this.callbacks = callbacks;
    this.detector = detector;
    this.ruidoBase = 0.02;
    this.activo = true;

    // Ventana de análisis cada 40 ms: el decodificador necesita
    // 2 ventanas + 50 ms, así que confirma a los ~80 ms de tono.
    // Ningún tono real (500 ms) se escapa entre fotos.
    this.intervaloId = window.setInterval(() => this.leerVentana(), 40);
  }

  private leerVentana(): void {
    if (
      this.analizador === null ||
      this.bufferTiempo === null ||
      this.callbacks === null
    ) {
      return;
    }
    this.analizador.getFloatTimeDomainData(
      this.bufferTiempo as Float32Array<ArrayBuffer>,
    );
    // Ventana central de 1024 muestras (evita bordes del buffer).
    const inicio = Math.floor((this.bufferTiempo.length - TAMANO_VENTANA) / 2);
    const ventana = this.bufferTiempo.slice(inicio, inicio + TAMANO_VENTANA);
    const ahora = performance.now();

    // Medidor aproximado: el ruido base sigue al mínimo (lento) para
    // que un tono sostenido no "se coma" su propia referencia.
    const rms = calcularRms(ventana);
    this.ruidoBase = Math.min(rms, this.ruidoBase + 0.0004);
    this.callbacks.alNivel({
      senal: Math.min(1, rms * 2),
      ruido: Math.min(1, this.ruidoBase * 2),
      snrDb: calcularSnrDb(rms, this.ruidoBase),
    });

    const resultado = this.detector.procesar(
      ventana,
      this.obtenerSampleRate(),
      ahora,
    );
    if (resultado !== null) {
      this.callbacks.alConfirmar(resultado.simbolo, resultado.snrDb);
    }
  }

  detener(): void {
    window.clearInterval(this.intervaloId);
    this.intervaloId = 0;
    this.analizador?.disconnect();
    this.analizador = null;
    this.bufferTiempo = null;
    this.stream?.getTracks().forEach((pista) => pista.stop());
    this.stream = null;
    if (this.contexto !== null) {
      void this.contexto.close().catch(() => undefined);
      this.contexto = null;
    }
    this.callbacks = null;
    this.activo = false;
  }
}

/** Instancia compartida: DecoderPanel la controla, el visualizador la lee. */
export const motorEscucha = new MotorEscucha();
