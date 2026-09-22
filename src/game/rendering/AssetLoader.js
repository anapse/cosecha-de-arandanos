/**
 * AssetLoader.js
 * ---------------------------------------------------------------
 * Carga sprites y sonidos de forma tolerante a fallos (§28).
 *
 * CONTRATO IMPORTANTE:
 *   - Si un asset no existe todavía en /public/assets, NO se lanza
 *     error ni se rompe el juego. Se marca como "missing" y el
 *     SpriteRenderer dibuja el placeholder generado por código.
 *   - Cuando llegue el PNG definitivo, basta con dejarlo en la ruta
 *     indicada en src/data/assets.js. El motor no cambia.
 *
 * Los placeholders viven en PlaceholderFactory.js para mantener este
 * archivo centrado en la carga.
 */

import { ASSET_MANIFEST, SOUND_MANIFEST, assetUrl } from '../../data/assets.js';
import { createPlaceholder } from './PlaceholderFactory.js';

export class AssetLoader {
  constructor({ manifest = ASSET_MANIFEST, soundManifest = SOUND_MANIFEST } = {}) {
    this.manifest = manifest;
    this.soundManifest = soundManifest;

    /** @type {Map<string, HTMLImageElement|HTMLCanvasElement>} */
    this.images = new Map();
    /** @type {Set<string>} claves que usaron placeholder */
    this.placeholders = new Set();
    /** @type {Set<string>} claves cuyo archivo no se encontró */
    this.missing = new Set();
    /** @type {Map<string, HTMLAudioElement>} */
    this.sounds = new Map();

    this.ready = false;
    this.loadedCount = 0;
    this.totalCount = 0;
  }

  /**
   * Carga todos los sprites del manifiesto.
   * Nunca rechaza: los fallos se registran y se sustituyen por
   * placeholders.
   * @returns {Promise<AssetLoader>}
   */
  async loadAll(onProgress) {
    const entries = Object.entries(this.manifest);
    this.totalCount = entries.length;

    await Promise.all(
      entries.map(async ([key, def]) => {
        const image = await this.#loadImage(key, def);
        this.images.set(key, image);
        this.loadedCount += 1;
        if (typeof onProgress === 'function') {
          onProgress(this.loadedCount, this.totalCount);
        }
      })
    );

    this.ready = true;
    return this;
  }

  /**
   * Carga una imagen individual. Si el archivo no existe, devuelve
   * un placeholder del tamaño correcto.
   */
  #loadImage(key, def) {
    const url = assetUrl(key, this.manifest) ?? `${def.path}`;

    return new Promise((resolve) => {
      if (typeof Image === 'undefined') {
        // Entorno sin DOM (tests, Node). Placeholder directo.
        this.placeholders.add(key);
        resolve(createPlaceholder(key, def));
        return;
      }

      const img = new Image();
      let settled = false;

      const finish = (result, isPlaceholder) => {
        if (settled) return;
        settled = true;
        if (isPlaceholder) {
          this.placeholders.add(key);
          this.missing.add(key);
        }
        resolve(result);
      };

      img.onload = () => finish(img, false);
      img.onerror = () => finish(createPlaceholder(key, def), true);

      img.decoding = 'sync';
      img.src = url;
    });
  }

  /** Devuelve el sprite (imagen real o placeholder). */
  get(key) {
    if (this.images.has(key)) return this.images.get(key);
    const def = this.manifest[key];
    if (!def) return null;
    const placeholder = createPlaceholder(key, def);
    this.images.set(key, placeholder);
    this.placeholders.add(key);
    return placeholder;
  }

  has(key) {
    return this.images.has(key);
  }

  /** true si el asset es un placeholder (no hay arte definitivo aún). */
  isPlaceholder(key) {
    return this.placeholders.has(key);
  }

  /**
   * Precarga de sonidos bajo demanda. Los sonidos son opcionales en
   * el MVP (§40), por eso no bloquean la carga inicial.
   */
  loadSound(key) {
    if (this.sounds.has(key)) return this.sounds.get(key);
    const def = this.soundManifest[key];
    if (!def || typeof Audio === 'undefined') return null;

    const audio = new Audio(`${assetUrl(key, this.soundManifest) ?? def.path}`);
    audio.preload = 'auto';
    // Un sonido ausente no debe generar errores en consola.
    audio.addEventListener('error', () => this.sounds.delete(key));
    this.sounds.set(key, audio);
    return audio;
  }

  /** Resumen para el panel de depuración y el README. */
  getReport() {
    return {
      total: this.totalCount,
      loaded: this.loadedCount,
      usingPlaceholders: [...this.placeholders],
      missingFiles: [...this.missing],
    };
  }

  dispose() {
    this.images.clear();
    this.sounds.clear();
    this.placeholders.clear();
    this.missing.clear();
    this.ready = false;
  }
}

export default AssetLoader;
