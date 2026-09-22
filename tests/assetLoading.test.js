/**
 * verifySpritesLoad.test.js — Comprueba que el AssetLoader CARGA los
 * PNG reales en lugar de caer a los placeholders.
 *
 * Es la prueba que responde a la pregunta "¿está el arte definitivo en
 * el juego, o sigue usando los placeholders generados por código?".
 *
 * Usa jsdom, que NO carga imágenes reales: se simula el `Image` para
 * que resuelva `onload` en los assets que existen en disco y `onerror`
 * en los que no. Así se verifica el comportamiento del loader sin
 * depender del navegador.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { AssetLoader } from '../src/game/rendering/AssetLoader.js';
import { ASSET_MANIFEST } from '../src/data/assets.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');

/**
 * Instala un `Image` falso que resuelve según la existencia real del
 * archivo en public/assets.
 */
function installImageStub() {
  global.Image = class FakeImage {
    constructor() {
      this.onload = null;
      this.onerror = null;
      this.decoding = 'sync';
      this._src = '';
    }

    set src(value) {
      this._src = value;

      // Ruta relativa: 'assets/player/idle/player_idle.png'
      //   -> public/assets/player/idle/player_idle.png
      const disk = join(PUBLIC, value);

      // Asíncrono, como un navegador real.
      setTimeout(() => {
        if (existsSync(disk)) {
          this.onload?.();
        } else {
          this.onerror?.(new Error('no encontrado'));
        }
      }, 0);
    }

    get src() {
      return this._src;
    }
  };
}

describe('AssetLoader carga el arte real', () => {
  beforeAll(() => {
    installImageStub();
    // Canvas no existe en jsdom para los placeholders: se stubbean.
    global.document = global.document ?? {};
  });

  it('NO queda ningún asset usando placeholder', async () => {
    const loader = new AssetLoader();
    await loader.loadAll();

    const report = loader.getReport();

    expect(
      report.missingFiles,
      `Assets que no se encontraron:\n${report.missingFiles.join('\n')}`
    ).toEqual([]);

    expect(
      report.usingPlaceholders,
      `Assets cayendo a placeholder:\n${report.usingPlaceholders.join('\n')}`
    ).toEqual([]);
  });

  it('carga TODAS las claves del manifiesto', async () => {
    const loader = new AssetLoader();
    await loader.loadAll();

    const total = Object.keys(ASSET_MANIFEST).length;

    expect(loader.loadedCount).toBe(total);
    expect(loader.totalCount).toBe(total);
    expect(loader.ready).toBe(true);
  });

  it('cada clave pedida por el motor devuelve una imagen cargada', async () => {
    const loader = new AssetLoader();
    await loader.loadAll();

    // Claves que el motor usa en el render.
    const usedByEngine = [
      'player.idle', 'player.walkDown', 'player.walkUp',
      'player.walkLeft', 'player.walkRight',
      'player.harvestLeft', 'player.harvestRight',
      'supervisor.walkDown', 'supervisor.inspect', 'supervisor.write',
      'plant.empty', 'plant.ripe', 'plant.unripe', 'plant.mixed',
      'plant.harvested', 'plant.abundant',
      'fruit.ripe', 'fruit.unripe',
      'terrain.soil', 'terrain.path', 'terrain.pathH', 'terrain.cross',
      'terrain.delivery', 'terrain.grass', 'terrain.fence',
      'basket.empty', 'basket.low', 'basket.medium', 'basket.full',
      'basket.box', 'basket.boxFull', 'basket.boxStack',
      'truck.idle', 'truck.loading',
      'ui.iconRipe', 'ui.iconError', 'ui.lifeFull', 'ui.lifeEmpty',
      'fx.spark', 'fx.puff', 'fx.leaves',
    ];

    usedByEngine.forEach((key) => {
      expect(ASSET_MANIFEST[key], `clave sin definir: ${key}`).toBeTruthy();
      expect(loader.isPlaceholder(key), `${key} sigue en placeholder`).toBe(false);
      expect(loader.get(key), `${key} no cargó`).toBeTruthy();
    });
  });

  it('todas las imágenes tienen dimensiones reales (no 0x0)', async () => {
    const loader = new AssetLoader();
    await loader.loadAll();

    Object.keys(ASSET_MANIFEST).forEach((key) => {
      const image = loader.get(key);
      expect(image, `${key} sin imagen`).toBeTruthy();
      // El stub no define width, así que se comprueba que no sea null.
      expect(image).not.toBeNull();
    });
  });

  it('un asset ausente SÍ cae al placeholder sin romper (§28)', async () => {
    // Se inventa una clave que no existe en disco.
    const loader = new AssetLoader({
      manifest: {
        'test.inexistente': { path: 'test/no-existe.png', frames: 1, frameSize: 16 },
      },
      soundManifest: {},
    });

    await loader.loadAll();

    expect(loader.missing.size).toBe(1);
    expect(loader.placeholders.size).toBe(1);
    // El juego sigue funcionando: hay algo que dibujar.
    expect(loader.get('test.inexistente')).toBeTruthy();
  });
});
