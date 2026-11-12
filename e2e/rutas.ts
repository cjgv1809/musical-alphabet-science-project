import { resolve } from 'node:path';

/** WAV generado en cada ejecución (no se versiona). */
export const RUTA_WAV = resolve(import.meta.dirname, '.audio', 'hola.wav');
