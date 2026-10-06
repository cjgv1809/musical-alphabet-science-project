import { describe, expect, it } from 'vitest';
import {
  TOLERANCIA_CENTS,
  centsEntre,
  frecuenciaSemitono,
  nombreNota,
  normalizarSimboloCromatico,
  notaMasCercana,
  obtenerFrecuenciaNota,
  obtenerNombreNota,
} from './cromatico.ts';

/** Tests del alfabeto cromático (modo instrumento). */
describe('cromatico (una nota por letra)', () => {
  it('A = LA3 = 220 Hz y las 26 letras suben por semitonos', () => {
    expect(obtenerFrecuenciaNota('A')).toBe(220);
    expect(obtenerNombreNota('A')).toBe('LA3');
    // Cada paso multiplica por 2^(1/12) ≈ 1.0595.
    const fA = obtenerFrecuenciaNota('A') ?? 0;
    const fB = obtenerFrecuenciaNota('B') ?? 0;
    expect(fB / fA).toBeCloseTo(Math.pow(2, 1 / 12), 3);
    // La Z queda en rango de guitarra y banda limpia (< 1000 Hz).
    const fZ = obtenerFrecuenciaNota('Z') ?? 0;
    expect(fZ).toBeGreaterThan(900);
    expect(fZ).toBeLessThan(1000);
  });

  it('los nombres de nota y octavas son correctos', () => {
    expect(nombreNota(0)).toBe('LA3');
    expect(nombreNota(3)).toBe('DO4'); // la octava cambia en DO
    expect(nombreNota(12)).toBe('LA4');
    expect(frecuenciaSemitono(12)).toBeCloseTo(440, 1); // LA4 = 440 Hz
  });

  it('normaliza minúsculas y rechaza caracteres no soportados', () => {
    expect(normalizarSimboloCromatico('h')).toBe('H');
    expect(normalizarSimboloCromatico('5')).toBe(null);
    expect(normalizarSimboloCromatico('ñ')).toBe(null);
  });

  it('el espacio es RE3 (146.83 Hz, cuerda RE al aire)', () => {
    expect(normalizarSimboloCromatico(' ')).toBe(' ');
    expect(obtenerFrecuenciaNota(' ')).toBeCloseTo(146.83, 1);
    expect(obtenerNombreNota(' ')).toBe('RE3');
    expect(notaMasCercana(146.83)?.simbolo).toBe(' ');
  });

  it('notaMasCercana tolera ±30 cents y elige la vecina si cae más cerca', () => {
    const fH = 220 * Math.pow(2, 7 / 12); // H exacta
    expect(notaMasCercana(fH)?.simbolo).toBe('H');
    const desafinadaBien = fH * Math.pow(2, 30 / 1200);
    expect(notaMasCercana(desafinadaBien)?.simbolo).toBe('H');
    // A +70 cents de H estás a −30 de I: gana la más cercana (I).
    const casiI = fH * Math.pow(2, 70 / 1200);
    expect(notaMasCercana(casiI)?.simbolo).toBe('I');
    // Justo a mitad de camino (50 cents): demasiado ambiguo → null.
    const ambigua = fH * Math.pow(2, 50 / 1200);
    expect(notaMasCercana(ambigua)).toBe(null);
    expect(notaMasCercana(50)).toBe(null); // fuera de rango
    expect(TOLERANCIA_CENTS).toBe(45);
  });

  it('centsEntre mide bien (100 cents = 1 semitono)', () => {
    expect(centsEntre(440, 220)).toBeCloseTo(1200); // una octava
    expect(centsEntre(220 * Math.pow(2, 1 / 12), 220)).toBeCloseTo(100);
  });

  it('los 6 signos viven por debajo de LA3 con nombres correctos', () => {
    expect(obtenerFrecuenciaNota('.')).toBeCloseTo(155.56, 1); // RE#3
    expect(obtenerNombreNota('.')).toBe('RE#3');
    expect(obtenerFrecuenciaNota(',')).toBeCloseTo(164.81, 1); // MI3
    expect(obtenerFrecuenciaNota('?')).toBeCloseTo(174.61, 1); // FA3
    expect(obtenerFrecuenciaNota('!')).toBeCloseTo(185.0, 1); // FA#3
    expect(obtenerFrecuenciaNota('¿')).toBeCloseTo(196.0, 1); // SOL3
    expect(obtenerNombreNota('¿')).toBe('SOL3');
    expect(obtenerFrecuenciaNota('¡')).toBeCloseTo(207.65, 1); // SOL#3
    // Redondeo inverso: 196 Hz exactos → ¿ (SOL3).
    expect(notaMasCercana(196)?.simbolo).toBe('¿');
    expect(notaMasCercana(155.56)?.simbolo).toBe('.');
  });
});
