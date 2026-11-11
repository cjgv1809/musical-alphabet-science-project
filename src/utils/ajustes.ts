/**
 * Ajustes del usuario (se guardan en el dispositivo).
 * Funciones puras + acceso a localStorage con try/catch: en ventanas
 * privadas o con datos bloqueados el almacenamiento puede fallar y la
 * app debe seguir funcionando con los valores por defecto.
 */

export interface Ajustes {
  /** Duración de cada nota al "Tocar melodía" (ms). */
  duracionNotaMs: number;
  /** Velocidad de la voz (1 = normal). */
  velocidadVoz: number;
  /** Nombre de la voz elegida; '' = automática (mejor voz española). */
  vozNombre: string;
}

export const AJUSTES_POR_DEFECTO: Ajustes = {
  duracionNotaMs: 500,
  velocidadVoz: 0.95,
  vozNombre: '',
};

export const LIMITES = {
  duracionNotaMs: { min: 300, max: 1000, paso: 50 },
  velocidadVoz: { min: 0.6, max: 1.4, paso: 0.05 },
} as const;

const CLAVE = 'notas-que-hablan:ajustes:v1';

function acotar(valor: unknown, min: number, max: number, defecto: number): number {
  return typeof valor === 'number' && Number.isFinite(valor)
    ? Math.min(max, Math.max(min, valor))
    : defecto;
}

/** Convierte cualquier valor guardado en ajustes válidos (puro, testeable). */
export function sanearAjustes(crudo: unknown): Ajustes {
  const o = (typeof crudo === 'object' && crudo !== null ? crudo : {}) as Record<string, unknown>;
  return {
    duracionNotaMs: acotar(
      o['duracionNotaMs'],
      LIMITES.duracionNotaMs.min,
      LIMITES.duracionNotaMs.max,
      AJUSTES_POR_DEFECTO.duracionNotaMs,
    ),
    velocidadVoz: acotar(
      o['velocidadVoz'],
      LIMITES.velocidadVoz.min,
      LIMITES.velocidadVoz.max,
      AJUSTES_POR_DEFECTO.velocidadVoz,
    ),
    vozNombre: typeof o['vozNombre'] === 'string' ? o['vozNombre'] : '',
  };
}

export function cargarAjustes(): Ajustes {
  try {
    const texto = window.localStorage.getItem(CLAVE);
    return sanearAjustes(texto === null ? null : JSON.parse(texto));
  } catch {
    return { ...AJUSTES_POR_DEFECTO };
  }
}

export function guardarAjustes(ajustes: Ajustes): void {
  try {
    window.localStorage.setItem(CLAVE, JSON.stringify(ajustes));
  } catch {
    // Sin almacenamiento: los ajustes valen solo para esta sesión.
  }
}
