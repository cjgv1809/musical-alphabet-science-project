import { generarWav } from './audio.ts';
import { RUTA_WAV } from './rutas.ts';

export default function globalSetup(): void {
  generarWav('HOLA', RUTA_WAV);
}
