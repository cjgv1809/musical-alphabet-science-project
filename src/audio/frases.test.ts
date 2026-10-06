import { describe, expect, it } from 'vitest';
import {
  FRASES_ESENCIALES,
  buscarFrase,
  normalizarFrase,
} from './frases.ts';
import { elegirVozEspanola } from './voz.ts';
import { normalizarSimboloCromatico } from './cromatico.ts';

/**
 * Tests del fraseario: toda frase debe ser "tocable" (solo letras
 * del alfabeto cromático + espacios) y la búsqueda debe ignorar
 * espacios, porque la guitarra no los produce.
 */
describe('frases (modo accesible)', () => {
  it('todas las frases son tocables con la guitarra (sin tildes)', () => {
    expect(FRASES_ESENCIALES.length).toBeGreaterThanOrEqual(8);
    for (const frase of FRASES_ESENCIALES) {
      expect(frase.texto.length).toBeGreaterThan(0);
      // Se toca la versión sin tildes (SÍ → SI); la tilde solo vive
      // en pantalla y en la voz, nunca en las notas.
      for (const caracter of normalizarFrase(frase.texto)) {
        expect(normalizarSimboloCromatico(caracter)).not.toBe(null);
      }
    }
  });

  it('buscarFrase ignora espacios (la guitarra no los emite)', () => {
    expect(buscarFrase('MEDUELE')).toBe('ME DUELE');
    expect(buscarFrase('AGUA')).toBe('AGUA');
    expect(buscarFrase('')).toBe(null);
    expect(buscarFrase('XYZ')).toBe(null);
    expect(normalizarFrase('SÍ')).toBe('SI');
  });
});

describe('voz (elección de voz española)', () => {
  it('prefiere es-ES, luego cualquier es-*, si no null', () => {
    const voces = [
      { lang: 'en-US', name: 'Google US English' },
      { lang: 'es-US', name: 'Google español' },
      { lang: 'es-ES', name: 'Google español de España' },
    ];
    expect(elegirVozEspanola(voces)).toBe(2);
    expect(elegirVozEspanola(voces.slice(0, 2))).toBe(1);
    expect(elegirVozEspanola([voces[0] as { lang: string; name: string }])).toBe(-1);
    expect(elegirVozEspanola([])).toBe(-1);
  });
});
