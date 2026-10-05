import { create } from 'zustand';
import type { EstadoAudio, NivelSenal } from '../types/index.ts';

/**
 * Estado global con Zustand: solo lo que comparten varios paneles
 * (mensaje, reproducción, escucha, niveles, errores).
 * Todo lo demás vive en el estado local de cada componente.
 */
interface EstadoApp {
  /** Texto que el usuario quiere "tocar" como música. */
  mensaje: string;
  /** Símbolo que se está reproduciendo ahora (resaltado en UI). */
  simboloActual: string | null;
  /** ¿Está sonando la secuencia? */
  tocando: boolean;
  /** ¿Está activo el micrófono? */
  escuchando: boolean;
  /** Texto reconstruido por el decodificador. */
  textoDecodificado: string;
  /** Nivel de señal/ruido para el indicador en tiempo real. */
  nivel: NivelSenal;
  /** Estado del motor de audio (para el indicador de estado). */
  estadoAudio: EstadoAudio;
  /** Mensaje de error legible (ej. micrófono denegado). */
  error: string | null;

  fijarMensaje: (mensaje: string) => void;
  fijarSimboloActual: (simbolo: string | null) => void;
  fijarTocando: (tocando: boolean) => void;
  fijarEscuchando: (escuchando: boolean) => void;
  fijarTextoDecodificado: (texto: string) => void;
  fijarNivel: (nivel: NivelSenal) => void;
  limpiarDecodificado: () => void;
  fijarEstadoAudio: (estado: EstadoAudio) => void;
  fijarError: (error: string | null) => void;
}

export const useAppStore = create<EstadoApp>()((set) => ({
  mensaje: 'HOLA COMO ESTAS',
  simboloActual: null,
  tocando: false,
  escuchando: false,
  textoDecodificado: '',
  nivel: { senal: 0, ruido: 0, snrDb: 0 },
  estadoAudio: 'inactivo',
  error: null,

  fijarMensaje: (mensaje) => set({ mensaje }),
  fijarSimboloActual: (simboloActual) => set({ simboloActual }),
  fijarTocando: (tocando) => set({ tocando }),
  fijarEscuchando: (escuchando) => set({ escuchando }),
  fijarTextoDecodificado: (textoDecodificado) => set({ textoDecodificado }),
  fijarNivel: (nivel) => set({ nivel }),
  limpiarDecodificado: () => set({ textoDecodificado: '' }),
  fijarEstadoAudio: (estadoAudio) => set({ estadoAudio }),
  fijarError: (error) => set({ error }),
}));
