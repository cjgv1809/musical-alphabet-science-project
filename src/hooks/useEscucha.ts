import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';
import { motorEscucha } from '../audio/escucha.ts';
import { asegurarAudioListo } from '../audio/instrumento.ts';
import { DetectorMelodia, type LecturaTono } from '../audio/melodia.ts';
import type { NivelSenal } from '../types/index.ts';

type Receptor<T> = ((valor: T) => void) | null;

export interface UsoEscucha {
  escuchando: boolean;
  /** Hubo sonido fuerte sin nota clara (acorde rasgueado). */
  confuso: boolean;
  empezar: () => Promise<void>;
  detener: () => void;
  /** Apaga el aviso de confusión (p. ej. al borrar o limpiar el texto). */
  limpiarConfuso: () => void;
  /** Los componentes del afinador y del medidor se registran aquí. */
  registrarTono: (receptor: Receptor<LecturaTono | null>) => void;
  registrarNivel: (receptor: Receptor<NivelSenal>) => void;
}

/**
 * Escucha del micrófono: arranque y parada del motor, reanudación al volver
 * a la app (los móviles suspenden el audio al ocultarla) y puente hacia el
 * afinador y el medidor, que se actualizan a 25 Hz sin pasar por el estado
 * del panel.
 *
 * @param pausaTranscripcionRef vale true mientras la app habla o toca: lo que
 *   suene entonces se ignora (anti-eco).
 * @param alSimbolo se llama con cada letra confirmada.
 * @param alError mensaje para el usuario (o null para borrarlo).
 */
export function useEscucha(
  pausaTranscripcionRef: MutableRefObject<boolean>,
  alSimbolo: (simbolo: string) => void,
  alError: (mensaje: string | null) => void,
): UsoEscucha {
  const [escuchando, setEscuchando] = useState(false);
  const [confuso, setConfuso] = useState(false);
  const receptorTonoRef = useRef<Receptor<LecturaTono | null>>(null);
  const receptorNivelRef = useRef<Receptor<NivelSenal>>(null);

  // Siempre las últimas funciones, sin recrear `empezar`.
  const alSimboloRef = useRef(alSimbolo);
  const alErrorRef = useRef(alError);
  useEffect(() => {
    alSimboloRef.current = alSimbolo;
    alErrorRef.current = alError;
  }, [alSimbolo, alError]);

  const registrarTono = useCallback((receptor: Receptor<LecturaTono | null>) => {
    receptorTonoRef.current = receptor;
  }, []);
  const registrarNivel = useCallback((receptor: Receptor<NivelSenal>) => {
    receptorNivelRef.current = receptor;
  }, []);

  const empezar = useCallback(async (): Promise<void> => {
    if (motorEscucha.estaActivo()) return;
    alErrorRef.current(null);
    try {
      await motorEscucha.iniciar(
        {
          alConfirmar: (simbolo) => {
            // Ignora lo que suena mientras la app habla o toca.
            if (pausaTranscripcionRef.current) return;
            setConfuso(false);
            // Vibración breve: confirma la letra sin mirar ni oír (si hay soporte).
            navigator.vibrate?.(25);
            alSimboloRef.current(simbolo);
          },
          // Sonido fuerte sin nota clara (acorde rasgueado): sugiere una cuerda.
          alConfuso: () => {
            if (pausaTranscripcionRef.current) return;
            setConfuso(true);
          },
          alTono: (lectura) => receptorTonoRef.current?.(lectura),
          alNivel: (nivel) => receptorNivelRef.current?.(nivel),
        },
        new DetectorMelodia(),
      );
      setEscuchando(true);
    } catch (err) {
      alErrorRef.current(
        err instanceof Error ? err.message : 'No se pudo activar el micrófono.',
      );
    }
  }, [pausaTranscripcionRef]);

  const detener = useCallback((): void => {
    motorEscucha.detener();
    setEscuchando(false);
    setConfuso(false);
  }, []);

  const limpiarConfuso = useCallback((): void => setConfuso(false), []);

  // Al volver a la app se reanudan los contextos y, si el motor no revive,
  // la escucha se reinicia sola (sin pulsar nada).
  useEffect(() => {
    const alVolver = (): void => {
      if (document.hidden) return;
      // Emisor: despierta el contexto de audio.
      void asegurarAudioListo().catch(() => undefined);
      // Receptor: solo si estaba escuchando.
      if (!motorEscucha.estaActivo()) return;
      void (async () => {
        const vive = await motorEscucha.reanudar();
        if (!vive) {
          motorEscucha.detener();
          setEscuchando(false);
          await empezar();
        }
      })().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', alVolver);
    return () => document.removeEventListener('visibilitychange', alVolver);
  }, [empezar]);

  return {
    escuchando,
    confuso,
    empezar,
    detener,
    limpiarConfuso,
    registrarTono,
    registrarNivel,
  };
}
