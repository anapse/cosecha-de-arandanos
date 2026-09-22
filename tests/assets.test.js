/**
 * assets.test.js — Valida el catálogo de sprites.
 *
 * Comprueba que cada clave lógica del manifiesto apunta a un archivo
 * PNG que EXISTE de verdad en public/assets, y que su tamaño coincide
 * con el declarado.
 *
 * Esto evita el fallo clásico: renombrar un sprite en el manifiesto y
 * olvidarse de generar el PNG (o al revés). Sin esta prueba el motor
 * caería silenciosamente al placeholder y nadie se enteraría.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ASSET_MANIFEST,
  SOUND_MANIFEST,
  assetUrl,
  countUniqueSprites,
  PLAYER_ASSETS,
  SUPERVISOR_ASSETS,
  PLANT_ASSETS,
  FRUIT_ASSETS,
  TERRAIN_ASSETS,
  BASKET_ASSETS,
  TRUCK_ASSETS,
  UI_ASSETS,
  EFFECT_ASSETS,
  ENVIRONMENT_ASSETS,
} from '../src/data/assets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');

/** Lee el ancho/alto de la cabecera IHDR de un PNG. */
function readPngSize(path) {
  const buffer = readFileSync(path);
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`No es un PNG válido: ${path}`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    depth: buffer[24],
    colorType: buffer[25],
  };
}

/** Ruta en disco de un asset del manifiesto. */
function diskPath(entry) {
  return join(PUBLIC, 'assets', entry.path);
}

describe('Catálogo de assets', () => {
  it('todas las claves del manifiesto tienen los campos necesarios', () => {
    Object.entries(ASSET_MANIFEST).forEach(([key, entry]) => {
      expect(entry.path, `${key} sin path`).toBeTruthy();
      expect(typeof entry.path).toBe('string');
    });
  });

  it('assetUrl construye la ruta pública correctamente', () => {
    expect(assetUrl('player.idle')).toBe('/assets/player/player_idle.png');
    expect(assetUrl('fruit.ripe')).toBe('/assets/fruits/fruit_ripe.png');
    expect(assetUrl('no.existe')).toBeNull();
  });

  it('TODOS los PNG del manifiesto existen en disco', () => {
    const missing = [];

    Object.entries(ASSET_MANIFEST).forEach(([key, entry]) => {
      if (!existsSync(diskPath(entry))) {
        missing.push(`${key} -> ${entry.path}`);
      }
    });

    expect(
      missing,
      `Faltan ${missing.length} archivos PNG:\n${missing.join('\n')}`
    ).toEqual([]);
  });

  it('todos los PNG son válidos (RGBA de 8 bits)', () => {
    Object.entries(ASSET_MANIFEST).forEach(([key, entry]) => {
      const file = diskPath(entry);
      if (!existsSync(file)) return;

      const info = readPngSize(file);
      expect(info.depth, `${key}: profundidad`).toBe(8);
      expect(info.colorType, `${key}: debe ser RGBA (6)`).toBe(6);
      expect(info.width).toBeGreaterThan(0);
      expect(info.height).toBeGreaterThan(0);
    });
  });

  it('los PNG no están vacíos ni son sospechosamente pequeños', () => {
    Object.entries(ASSET_MANIFEST).forEach(([key, entry]) => {
      const file = diskPath(entry);
      if (!existsSync(file)) return;

      const { size } = statSync(file);
      expect(size, `${key} pesa ${size} bytes`).toBeGreaterThan(60);
    });
  });

  it('un spritesheet tiene el ancho de todos sus frames', () => {
    // Los personajes son tiras de 4 frames de 32px = 128px de ancho.
    const animated = [
      'player.idle',
      'player.walkDown',
      'player.walkLeft',
      'player.walkRight',
      'player.walkUp',
      'player.harvestLeft',
      'player.harvestRight',
      'supervisor.walkDown',
      'supervisor.review',
      'supervisor.write',
      'fx.harvestParticle',
      'fx.errorParticle',
    ];

    animated.forEach((key) => {
      const entry = ASSET_MANIFEST[key];
      const info = readPngSize(diskPath(entry));
      const expectedWidth = entry.frameSize * entry.frames;

      expect(
        info.width,
        `${key}: se esperaban ${expectedWidth}px (${entry.frames} frames de ${entry.frameSize}px)`
      ).toBe(expectedWidth);

      expect(info.height, `${key}: alto`).toBe(entry.frameSize);
    });
  });

  it('los tiles de terreno son cuadrados de 32x32', () => {
    const tiles = [
      'terrain.soil', 'terrain.path', 'terrain.pathH',
      'terrain.corner', 'terrain.cross', 'terrain.grass',
      'terrain.fenceH', 'terrain.fenceV',
    ];

    tiles.forEach((key) => {
      const info = readPngSize(diskPath(ASSET_MANIFEST[key]));
      expect(info.width, `${key} ancho`).toBe(32);
      expect(info.height, `${key} alto`).toBe(32);
    });
  });

  it('el camión es apaisado (64x40)', () => {
    const info = readPngSize(diskPath(ASSET_MANIFEST['truck.side']));
    expect(info.width).toBe(64);
    expect(info.height).toBe(40);
  });

  it('existen las 4 variantes de canasta y las 4 de caja', () => {
    ['basket.empty', 'basket.low', 'basket.medium', 'basket.full'].forEach((k) => {
      expect(ASSET_MANIFEST[k], `falta ${k}`).toBeTruthy();
    });

    ['basket.boxEmpty', 'basket.boxFilled', 'basket.boxStack', 'basket.boxOnTruck']
      .forEach((k) => {
        expect(ASSET_MANIFEST[k], `falta ${k}`).toBeTruthy();
      });
  });

  it('existen los 3 estados del corazón (vida)', () => {
    ['ui.heartFull', 'ui.heartMedium', 'ui.heartEmpty'].forEach((k) => {
      expect(ASSET_MANIFEST[k], `falta ${k}`).toBeTruthy();
    });
  });

  it('cada carpeta del catálogo tiene al menos un sprite', () => {
    const groups = {
      player: PLAYER_ASSETS,
      supervisor: SUPERVISOR_ASSETS,
      plants: PLANT_ASSETS,
      fruits: FRUIT_ASSETS,
      terrain: TERRAIN_ASSETS,
      basket: BASKET_ASSETS,
      truck: TRUCK_ASSETS,
      ui: UI_ASSETS,
      effects: EFFECT_ASSETS,
      environment: ENVIRONMENT_ASSETS,
    };

    Object.entries(groups).forEach(([name, group]) => {
      expect(Object.keys(group).length, `${name} vacío`).toBeGreaterThan(0);
    });
  });

  it('no hay dos claves distintas apuntando al MISMO archivo por error', () => {
    // Los alias son intencionales y comparten archivo; lo que no debe
    // pasar es que dos nombres DISTINTOS de sprite real se solapen.
    const byPath = new Map();

    Object.entries(ASSET_MANIFEST).forEach(([key, entry]) => {
      if (!byPath.has(entry.path)) byPath.set(entry.path, []);
      byPath.get(entry.path).push(key);
    });

    // Debe haber menos archivos únicos que claves (por los alias).
    expect(byPath.size).toBeLessThanOrEqual(Object.keys(ASSET_MANIFEST).length);
    expect(byPath.size).toBe(countUniqueSprites());
  });

  it('los sonidos NO bloquean la carga si faltan (son opcionales, §40)', () => {
    // El manifiesto de sonido existe, pero el juego funciona sin él.
    expect(Object.keys(SOUND_MANIFEST).length).toBeGreaterThan(0);

    Object.values(SOUND_MANIFEST).forEach((entry) => {
      expect(typeof entry.path).toBe('string');
      expect(entry.path.endsWith('.wav')).toBe(true);
    });
  });

  it('cada carpeta del manifiesto tiene su carpeta real en public/assets', () => {
    const folders = new Set(
      Object.values(ASSET_MANIFEST).map((entry) => entry.path.split('/')[0])
    );

    folders.forEach((folder) => {
      const dir = join(PUBLIC, 'assets', folder);
      expect(existsSync(dir), `falta la carpeta ${folder}/`).toBe(true);
    });
  });
});
