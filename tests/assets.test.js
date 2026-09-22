/**
 * assets.test.js — Valida el catálogo de sprites.
 *
 * Comprueba que cada clave lógica del manifiesto apunta a un PNG que
 * EXISTE de verdad en public/assets, y que su tamaño coincide con el
 * declarado.
 *
 * Esto evita el fallo clásico: renombrar un sprite en el manifiesto y
 * olvidarse de generar el PNG (o al revés). Sin esta prueba el motor
 * caería silenciosamente al placeholder y nadie se enteraría.
 *
 * ESTRUCTURA: las rutas del catálogo son absolutas desde la raíz web
 * ('/assets/player/idle/player_idle.png'). Para llegar al archivo hay
 * que quitarlas el prefijo '/assets/' y unirlas a public/assets/.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ASSET_MANIFEST,
  ASSETS,
  SOUND_MANIFEST,
  ASSET_STATUS,
  assetUrl,
  assetEntry,
  frameCount,
  assetStatus,
  countUniqueSprites,
  uniquePaths,
  statusSummary,
  PLAYER_ASSETS,
  SUPERVISOR_ASSETS,
  PLANT_ASSETS,
  FRUIT_ASSETS,
  TERRAIN_ASSETS,
  BASKET_ASSETS,
  UI_ASSETS,
  EFFECT_ASSETS,
  ENVIRONMENT_ASSETS,
} from '../src/data/assets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');

/**
 * Ruta en disco de un asset del manifiesto.
 * '/assets/player/idle/player_idle.png'
 *   → public/assets/player/idle/player_idle.png
 */
function diskPath(assetPath) {
  const rel = assetPath.replace(/^\/assets\//, '');
  return join(PUBLIC, 'assets', rel);
}

/** Lee el ancho/alto/color de la cabecera IHDR de un PNG. */
function readPngInfo(path) {
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

describe('Catálogo de assets', () => {
  it('todas las claves del manifiesto tienen los campos necesarios', () => {
    Object.entries(ASSET_MANIFEST).forEach(([key, entry]) => {
      expect(entry.path, `${key} sin path`).toBeTruthy();
      expect(typeof entry.path).toBe('string');
      expect(entry.path.startsWith('/assets/'), `${key} debe ser ruta web`).toBe(true);
      expect(entry.frames, `${key} sin frames`).toBeGreaterThan(0);
      expect(entry.frameSize, `${key} sin frameSize`).toBeGreaterThan(0);
      expect(Object.values(ASSET_STATUS)).toContain(entry.status);
    });
  });

  it('assetUrl construye la ruta pública con la nueva estructura', () => {
    // Estructura con subcarpetas (§5-§13)
    expect(assetUrl('player.walkDown')).toBe(
      '/assets/player/walk/player_walk_down.png'
    );
    expect(assetUrl('player.idle')).toBe('/assets/player/idle/player_idle.png');
    expect(assetUrl('fruit.ripe')).toBe('/assets/fruits/fruit_ripe.png');
    expect(assetUrl('ui.iconsHeartFull')).toBe('/assets/ui/icons/heart_full.png');
    expect(assetUrl('no.existe')).toBeNull();
  });

  it('assetEntry, frameCount y assetStatus funcionan', () => {
    const entry = assetEntry('player.walkDown');
    expect(entry.frames).toBe(4);
    expect(frameCount('player.walkDown')).toBe(4);
    expect(frameCount('no.existe')).toBe(1);
    expect(assetStatus('player.walkDown')).toBe(ASSET_STATUS.DEFINITIVO);
    expect(assetStatus('no.existe')).toBe(ASSET_STATUS.PENDIENTE);
  });

  it('TODOS los PNG del manifiesto existen en disco', () => {
    const missing = [];

    uniquePaths().forEach((assetPath) => {
      if (!existsSync(diskPath(assetPath))) {
        missing.push(assetPath);
      }
    });

    expect(
      missing,
      `Faltan ${missing.length} archivos PNG:\n${missing.join('\n')}`
    ).toEqual([]);
  });

  it('todas las claves del motor resuelven a un archivo existente', () => {
    const missing = [];

    Object.entries(ASSET_MANIFEST).forEach(([key, entry]) => {
      if (!existsSync(diskPath(entry.path))) {
        missing.push(`${key} -> ${entry.path}`);
      }
    });

    expect(missing, `Sin archivo:\n${missing.join('\n')}`).toEqual([]);
  });

  it('todos los PNG son válidos (RGBA de 8 bits)', () => {
    uniquePaths().forEach((assetPath) => {
      const file = diskPath(assetPath);
      if (!existsSync(file)) return;

      const info = readPngInfo(file);
      expect(info.depth, `${assetPath}: profundidad`).toBe(8);
      expect(info.colorType, `${assetPath}: debe ser RGBA (6)`).toBe(6);
      expect(info.width).toBeGreaterThan(0);
      expect(info.height).toBeGreaterThan(0);
    });
  });

  it('los PNG no están vacíos ni son sospechosamente pequeños', () => {
    uniquePaths().forEach((assetPath) => {
      const file = diskPath(assetPath);
      if (!existsSync(file)) return;

      const { size } = statSync(file);
      expect(size, `${assetPath} pesa ${size} bytes`).toBeGreaterThan(60);
    });
  });

  it('un spritesheet mide frames x frameSize de ancho', () => {
    const animated = [
      'player.idle',
      'player.walkDown',
      'player.walkLeft',
      'player.walkRight',
      'player.walkUp',
      'player.harvestLeft',
      'player.harvestRight',
      'supervisor.walkDown',
      'supervisor.walkUp',
      'supervisor.inspectionReview',
      'supervisor.inspectionWrite',
      'supervisor.statesTalk',
    ];

    animated.forEach((key) => {
      const entry = ASSET_MANIFEST[key];
      expect(entry, `falta ${key}`).toBeTruthy();

      const info = readPngInfo(diskPath(entry.path));
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
      'ground_soil', 'path_vertical', 'path_horizontal',
      'path_corner', 'path_intersection', 'grass',
      'fence_horizontal', 'fence_vertical',
    ];

    tiles.forEach((name) => {
      const info = readPngInfo(diskPath(`/assets/terrain/${name}.png`));
      expect(info.width, `${name} ancho`).toBe(32);
      expect(info.height, `${name} alto`).toBe(32);
    });
  });

  it('el camión es apaisado (64px de ancho)', () => {
    const info = readPngInfo(diskPath(assetUrl('truck.side')));
    expect(info.width).toBe(64);
    expect(info.height).toBe(40);
  });

  it('las plantas y los frutos miden 32 y 16 px', () => {
    const plantKeys = Object.values(PLANT_ASSETS).map((e) => e.path);
    plantKeys.forEach((assetPath) => {
      const info = readPngInfo(diskPath(assetPath));
      expect(info.width).toBe(32);
    });

    const fruitKeys = Object.values(FRUIT_ASSETS).map((e) => e.path);
    fruitKeys.forEach((assetPath) => {
      const info = readPngInfo(diskPath(assetPath));
      expect(info.width).toBe(16);
      expect(info.height).toBe(16);
    });
  });

  it('existen las 4 variantes de canasta y las 4 de caja (§10)', () => {
    ['basket.empty', 'basket.low', 'basket.medium', 'basket.full'].forEach((k) => {
      expect(ASSET_MANIFEST[k], `falta ${k}`).toBeTruthy();
    });

    ['basket.box', 'basket.boxFilled', 'basket.boxStack', 'basket.boxOnTruck']
      .forEach((k) => {
        expect(ASSET_MANIFEST[k], `falta ${k}`).toBeTruthy();
      });
  });

  it('existen los 3 estados del corazón (vida) (§11)', () => {
    ['ui.heartFull', 'ui.heartMedium', 'ui.heartEmpty'].forEach((k) => {
      expect(ASSET_MANIFEST[k], `falta ${k}`).toBeTruthy();
    });
  });

  it('existen las 8 variantes de planta (§7)', () => {
    const variants = [
      'plant.empty', 'plant.few', 'plant.medium', 'plant.abundant',
      'plant.ripe', 'plant.unripe', 'plant.mixed', 'plant.harvested',
    ];

    variants.forEach((k) => {
      expect(ASSET_MANIFEST[k], `falta ${k}`).toBeTruthy();
    });

    // Y las piezas de composición planta + frutos
    expect(ASSET_MANIFEST['plant.base'], 'falta la planta base').toBeTruthy();
    expect(ASSET_MANIFEST['fruit.ripe'], 'falta el fruto maduro').toBeTruthy();
  });

  it('cada categoría del catálogo anidado tiene contenido', () => {
    const groups = {
      player: PLAYER_ASSETS,
      supervisor: SUPERVISOR_ASSETS,
      plants: PLANT_ASSETS,
      fruits: FRUIT_ASSETS,
      terrain: TERRAIN_ASSETS,
      basket: BASKET_ASSETS,
      ui: UI_ASSETS,
      effects: EFFECT_ASSETS,
      environment: ENVIRONMENT_ASSETS,
    };

    Object.entries(groups).forEach(([name, group]) => {
      expect(Object.keys(group).length, `${name} vacío`).toBeGreaterThan(0);
    });
  });

  it('las subcarpetas de UI y EFFECTS existen (§11, §12)', () => {
    ['hud', 'icons', 'buttons', 'bars', 'panels', 'prompts'].forEach((sub) => {
      expect(ASSETS.ui[sub], `falta ui/${sub}`).toBeTruthy();
      const dir = join(PUBLIC, 'assets', 'ui', sub);
      expect(existsSync(dir), `falta la carpeta ui/${sub}/`).toBe(true);
    });

    ['harvest', 'error', 'inspection', 'particles', 'shadows', 'floatingText']
      .forEach((sub) => {
        expect(ASSETS.effects[sub], `falta effects/${sub}`).toBeTruthy();
        const dirName = sub === 'floatingText' ? 'floating-text' : sub;
        const dir = join(PUBLIC, 'assets', 'effects', dirName);
        expect(existsSync(dir), `falta la carpeta effects/${dirName}/`).toBe(true);
      });
  });

  it('las subcarpetas de ENVIRONMENT existen (§13)', () => {
    ['sky', 'clouds', 'mountains', 'trees', 'signs', 'decorations'].forEach((sub) => {
      expect(ASSETS.environment[sub], `falta environment/${sub}`).toBeTruthy();
      const dir = join(PUBLIC, 'assets', 'environment', sub);
      expect(existsSync(dir), `falta la carpeta environment/${sub}/`).toBe(true);
    });
  });

  it('las subcarpetas de PLAYER y SUPERVISOR existen (§5, §6)', () => {
    ['idle', 'walk', 'harvest', 'states'].forEach((sub) => {
      expect(ASSETS.player[sub], `falta player/${sub}`).toBeTruthy();
      expect(existsSync(join(PUBLIC, 'assets', 'player', sub))).toBe(true);
    });

    ['walk', 'inspection', 'states'].forEach((sub) => {
      expect(ASSETS.supervisor[sub], `falta supervisor/${sub}`).toBeTruthy();
      expect(existsSync(join(PUBLIC, 'assets', 'supervisor', sub))).toBe(true);
    });
  });

  it('no hay dos sprite DISTINTOS apuntando al mismo archivo', () => {
    // Los alias son intencionales y comparten archivo. Lo que no debe
    // pasar es que el catálogo anidado (la vista "oficial") tenga
    // duplicados: cada sprite real tiene su propio PNG.
    const byPath = new Map();

    uniquePaths().forEach((assetPath) => {
      byPath.set(assetPath, (byPath.get(assetPath) ?? 0) + 1);
    });

    expect(byPath.size).toBe(countUniqueSprites());

    // Las claves lógicas pueden ser más que los archivos (por los alias),
    // pero nunca menos.
    const keys = Object.keys(ASSET_MANIFEST).length;
    expect(keys).toBeGreaterThanOrEqual(byPath.size);
  });

  it('el resumen de estados cuadra (§17)', () => {
    const summary = statusSummary();

    expect(summary.keys).toBe(Object.keys(ASSET_MANIFEST).length);
    expect(summary.files).toBe(countUniqueSprites());

    const total = Object.values(summary.byStatus).reduce((a, b) => a + b, 0);
    expect(total).toBe(summary.keys);
  });

  it('los sonidos son opcionales y no bloquean la carga (§40)', () => {
    expect(Object.keys(SOUND_MANIFEST).length).toBeGreaterThan(0);

    Object.values(SOUND_MANIFEST).forEach((entry) => {
      expect(typeof entry.path).toBe('string');
      expect(entry.path.endsWith('.wav')).toBe(true);
    });
  });

  it('el ASSET_MANIFEST.md existe y está actualizado (§14)', () => {
    const manifestDoc = join(PUBLIC, 'assets', 'ASSET_MANIFEST.md');
    expect(existsSync(manifestDoc), 'falta ASSET_MANIFEST.md').toBe(true);

    const text = readFileSync(manifestDoc, 'utf8');

    // Debe declarar el número correcto de archivos
    expect(text).toContain('ASSET MANIFEST');
    expect(text).toContain(String(countUniqueSprites()));

    // Y contener rutas reales del catálogo
    expect(text).toContain('/assets/player/walk/player_walk_down.png');
  });
});
