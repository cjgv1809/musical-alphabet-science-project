import { describe, expect, it } from 'vitest';
import {
  GRUPO_FRECUENCIAS_ALTAS,
  GRUPO_FRECUENCIAS_BAJAS,
  MAPA_FRECUENCIAS,
  SIMBOLOS_SOPORTADOS,
  TODAS_LAS_FRECUENCIAS,
  estaEnBandaDeVoz,
  normalizarSimbolo,
  obtenerFrecuencias,
  obtenerSimboloPorPar,
} from './frequencies.ts';

/**
 * Tests del mapeo letra → frecuencias.
 * Verifican los requisitos del enunciado: cobertura de símbolos,
 * banda 300–3000 Hz, pares únicos y búsqueda invertible.
 */
describe('frequencies (mapeo DTMF extendido)', () => {
  it('cubre A-Z, 0-9, espacio, punto y coma', () => {
    for (let codigo = 65; codigo <= 90; codigo += 1) {
      expect(SIMBOLOS_SOPORTADOS).toContain(String.fromCharCode(codigo));
    }
    for (let digito = 0; digito <= 9; digito += 1) {
      expect(SIMBOLOS_SOPORTADOS).toContain(String(digito));
    }
    expect(SIMBOLOS_SOPORTADOS).toContain(' ');
    expect(SIMBOLOS_SOPORTADOS).toContain('.');
    expect(SIMBOLOS_SOPORTADOS).toContain(',');
    expect(SIMBOLOS_SOPORTADOS.length).toBeGreaterThanOrEqual(39);
  });

  it('todas las frecuencias están en la banda 300–3000 Hz', () => {
    for (const frecuencia of TODAS_LAS_FRECUENCIAS) {
      expect(estaEnBandaDeVoz(frecuencia)).toBe(true);
    }
  });

  it('cada símbolo tiene un par único (sin colisiones)', () => {
    const paresVistos = new Set<string>();
    for (const simbolo of SIMBOLOS_SOPORTADOS) {
      const par = MAPA_FRECUENCIAS[simbolo];
      expect(par).toBeDefined();
      if (par === undefined) continue;
      // Una frecuencia del grupo bajo y otra del alto (doble tono real).
      expect(GRUPO_FRECUENCIAS_BAJAS).toContain(par.fBaja);
      expect(GRUPO_FRECUENCIAS_ALTAS).toContain(par.fAlta);
      const clave = `${par.fBaja}+${par.fAlta}`;
      expect(paresVistos.has(clave)).toBe(false);
      paresVistos.add(clave);
    }
    expect(paresVistos.size).toBe(SIMBOLOS_SOPORTADOS.length);
  });

  it('la búsqueda inversa recupera el símbolo original', () => {
    for (const simbolo of SIMBOLOS_SOPORTADOS) {
      const par = MAPA_FRECUENCIAS[simbolo];
      if (par === undefined) continue;
      expect(obtenerSimboloPorPar(par.fBaja, par.fAlta)).toBe(simbolo);
    }
    // Combinación libre de reserva: fila 6 × columna 7 (1150 + 2250)
    // no tiene símbolo asignado (la parrilla admite 42, usamos 41).
    expect(obtenerSimboloPorPar(1150, 2250)).toBe(null);
    expect(obtenerSimboloPorPar(400, 9999)).toBe(null);
  });

  it('normaliza minúsculas y rechaza caracteres no soportados', () => {
    expect(normalizarSimbolo('h')).toBe('H');
    expect(obtenerFrecuencias('a')).toEqual(obtenerFrecuencias('A'));
    // La ñ no cabe en la parrilla: se rechaza (en la demo se usa N).
    expect(normalizarSimbolo('ñ')).toBe(null);
    expect(normalizarSimbolo('')).toBe(null);
    expect(obtenerFrecuencias('#')).toBe(null);
  });

  it('los grupos bajo y alto no se solapan (hueco de seguridad)', () => {
    const maxBaja = Math.max(...GRUPO_FRECUENCIAS_BAJAS);
    const minAlta = Math.min(...GRUPO_FRECUENCIAS_ALTAS);
    expect(minAlta - maxBaja).toBeGreaterThanOrEqual(100);
  });
});
