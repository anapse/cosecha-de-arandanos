/**
 * levels.test.js — Valida la tabla de los 12 niveles (§20, §27, §28).
 * Detecta errores de configuración que romperían la progresión.
 */

import { describe, it, expect } from 'vitest';
import { LEVELS, TOTAL_LEVELS, getLevelConfig } from '../src/data/levels.js';

describe('Tabla de niveles', () => {
  it('contiene exactamente 12 niveles', () => {
    expect(TOTAL_LEVELS).toBe(12);
    expect(LEVELS).toHaveLength(12);
  });

  it('los ids son secuenciales de 1 a 12', () => {
    LEVELS.forEach((level, index) => {
      expect(level.id).toBe(index + 1);
    });
  });

  it('todos los niveles tienen los campos obligatorios', () => {
    const required = [
      'id', 'name', 'rows', 'plantsPerRow', 'ripeChance', 'unripeChance',
      'targetHarvest', 'minimumQuality', 'deliveries', 'timeLimit',
      'supervisorInterval', 'basketCapacity', 'difficulty',
    ];

    LEVELS.forEach((level) => {
      required.forEach((field) => {
        expect(level[field], `Nivel ${level.id} sin campo ${field}`).toBeDefined();
      });
    });
  });

  it('las probabilidades están en el rango 0-1', () => {
    LEVELS.forEach((level) => {
      expect(level.ripeChance).toBeGreaterThanOrEqual(0);
      expect(level.ripeChance).toBeLessThanOrEqual(1);
      expect(level.unripeChance).toBeGreaterThanOrEqual(0);
      expect(level.unripeChance).toBeLessThanOrEqual(1);
    });
  });

  it('la dificultad crece de forma monótona', () => {
    for (let i = 1; i < LEVELS.length; i += 1) {
      expect(LEVELS[i].difficulty).toBeGreaterThan(LEVELS[i - 1].difficulty);
    }
  });

  it('el nivel 12 es el más exigente (§27 GRAN COSECHA)', () => {
    const last = LEVELS[LEVELS.length - 1];
    const first = LEVELS[0];

    expect(last.rows).toBeGreaterThan(first.rows);
    expect(last.targetHarvest).toBeGreaterThan(first.targetHarvest);
    expect(last.timeLimit).toBeLessThanOrEqual(first.timeLimit);
    expect(last.supervisorInterval).toBeLessThan(first.supervisorInterval);
    expect(last.unripeChance).toBeGreaterThan(first.unripeChance);
  });

  it('la velocidad del jugador NO es un factor de dificultad (§28)', () => {
    // Ningún nivel define velocidad: solo la config global.
    LEVELS.forEach((level) => {
      expect(level.playerSpeed).toBeUndefined();
    });
  });

  it('getLevelConfig acota fuera de rango', () => {
    expect(getLevelConfig(0).id).toBe(1);
    expect(getLevelConfig(-5).id).toBe(1);
    expect(getLevelConfig(99).id).toBe(12);
    expect(getLevelConfig(5).id).toBe(5);
  });
});
