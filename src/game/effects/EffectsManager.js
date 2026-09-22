/**
 * EffectsManager.js
 * ---------------------------------------------------------------
 * Coordina todos los efectos visuales (§39):
 *   - partículas
 *   - textos flotantes
 *   - sacudida de cámara
 *   - flashes de pantalla
 *
 * Los sistemas llaman a métodos con NOMBRE DE INTENCIÓN
 * ("alRecoger", "alEntregar") en lugar de gestionar partículas
 * sueltas. Así se puede cambiar el arte del feedback sin tocar la
 * lógica del juego.
 */

import { ParticleSystem } from './ParticleSystem.js';
import { FloatingText, FloatingTextFactory } from './FloatingText.js';
import { PALETTE, withAlpha } from '../../utils/colors.js';
import { GAME_CONFIG } from '../config/gameConfig.js';

const MAX_TEXTS = 24;

export class EffectsManager {
  /**
   * @param {import('../rendering/Camera.js').Camera} camera
   */
  constructor(camera) {
    this.camera = camera;
    this.particles = new ParticleSystem();
    /** @type {FloatingText[]} */
    this.texts = [];

    /* Flash de pantalla completa (error, entrega) */
    this.flashColor = null;
    this.flashAlpha = 0;
    this.flashDecay = 2.5;

    /* Banner central temporal (mensajes grandes, §54) */
    this.banner = null;
    this.bannerTimer = 0;
  }

  /* ============================================================
     API de intención
     ============================================================ */

  /** Fruto maduro recogido (§6, §39). */
  onHarvest(x, y, points = GAME_CONFIG.scoreRipe) {
    this.particles.emitHarvest(x, y);
    this.addText(FloatingTextFactory.harvest(x, y, points));
  }

  /** Pintón recogido: error (§12). */
  onUnripeError(x, y, points = GAME_CONFIG.scoreUnripe) {
    this.particles.emitError(x, y);
    this.addText(FloatingTextFactory.unripeError(x, y, points));
    this.flash(PALETTE.danger, 0.35);
    this.camera?.shake(5, 0.28);
  }

  /** Error grave / penalización (§12). */
  onError(x, y, text = 'ERROR') {
    this.particles.emitError(x, y);
    this.addText(FloatingTextFactory.error(x, y, text));
    this.flash(PALETTE.danger, 0.4);
    this.camera?.shake(6, 0.3);
  }

  /** Entrega realizada (§15, §39). */
  onDelivery(x, y, points = GAME_CONFIG.scoreDelivery) {
    this.particles.emitDelivery(x, y);
    this.addText(FloatingTextFactory.delivery(x, y, points));
    this.flash(PALETTE.warn, 0.22);
  }

  /** Canasta llena (§14). */
  onBasketFull(x, y) {
    this.addText(FloatingTextFactory.warn(x, y, 'CANASTA LLENA'));
    this.particles.emit(x, y, {
      count: 8,
      color: PALETTE.warn,
      speed: 50,
      life: 0.6,
      size: 2,
      gravity: 80,
    });
  }

  /** Aviso de supervisor (§19). */
  onSupervisorAlert(x, y) {
    this.addText(FloatingTextFactory.warn(x, y, 'REVISION'));
    this.flash(PALETTE.warn, 0.2);
  }

  /** Calidad aprobada / rechazada (§20). */
  onInspectionResult(approved, x, y) {
    if (approved) {
      this.addText(FloatingTextFactory.ok(x, y, 'CALIDAD APROBADA'));
      this.particles.emit(x, y, { count: 8, color: PALETTE.ok, speed: 40, life: 0.7, size: 2 });
    } else {
      this.addText(FloatingTextFactory.error(x, y, 'CALIDAD RECHAZADA'));
      this.flash(PALETTE.danger, 0.4);
      this.camera?.shake(5, 0.3);
    }
  }

  /** Victoria (§25). */
  onVictory(x, y) {
    this.particles.emit(x, y, {
      count: 20,
      color: PALETTE.warn,
      speed: 90,
      spread: Math.PI * 1.5,
      angle: -Math.PI / 2,
      life: 1.1,
      size: 3,
      gravity: 130,
    });
  }

  /** Derrota (§26). */
  onDefeat() {
    this.flash(PALETTE.danger, 0.5);
    this.camera?.shake(7, 0.4);
  }

  /* ============================================================
     Utilidades
     ============================================================ */

  /** Añade un texto flotante respetando el límite. */
  addText(text) {
    if (this.texts.length >= MAX_TEXTS) this.texts.shift();
    this.texts.push(text);
    return text;
  }

  /** Flash de pantalla completa. */
  flash(color, alpha = 0.3) {
    this.flashColor = color;
    this.flashAlpha = alpha;
  }

  /** Banner grande y centrado, para mensajes de estado (§54). */
  showBanner(text, { duration = 1.6, color = PALETTE.text, subtext = null } = {}) {
    this.banner = { text, color, subtext };
    this.bannerTimer = duration;
  }

  /* ============================================================
     Bucle
     ============================================================ */

  update(dt) {
    this.particles.update(dt);

    // Textos flotantes: se recorren al revés para poder eliminarlos.
    for (let i = this.texts.length - 1; i >= 0; i -= 1) {
      if (!this.texts[i].update(dt)) this.texts.splice(i, 1);
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha = Math.max(0, this.flashAlpha - this.flashDecay * dt);
      if (this.flashAlpha === 0) this.flashColor = null;
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer -= dt;
      if (this.bannerTimer <= 0) this.banner = null;
    }
  }

  /**
   * Dibuja los efectos del MUNDO (ya con la cámara aplicada).
   * @param {import('../rendering/SpriteRenderer.js').SpriteRenderer} sprites
   */
  drawWorld(sprites) {
    this.particles.draw(sprites);
    this.texts.forEach((t) => t.draw(sprites));
  }

  /**
   * Dibuja los efectos de PANTALLA (coordenadas lógicas, sin cámara).
   * @param {import('../rendering/SpriteRenderer.js').SpriteRenderer} sprites
   */
  drawScreen(sprites) {
    const ctx = sprites.ctx;

    if (this.flashAlpha > 0 && this.flashColor) {
      ctx.save();
      ctx.fillStyle = withAlpha(this.flashColor, this.flashAlpha);
      ctx.fillRect(0, 0, GAME_CONFIG.logicalWidth, GAME_CONFIG.logicalHeight);
      ctx.restore();
    }

    if (this.banner) {
      const w = GAME_CONFIG.logicalWidth;
      const y = GAME_CONFIG.logicalHeight * 0.38;
      const h = this.banner.subtext ? 46 : 30;

      ctx.save();
      ctx.fillStyle = withAlpha('#000000', 0.78);
      ctx.fillRect(0, Math.round(y), w, h);
      ctx.fillStyle = this.banner.color;
      ctx.fillRect(0, Math.round(y), w, 2);
      ctx.fillRect(0, Math.round(y + h - 2), w, 2);

      sprites.drawText(this.banner.text, w / 2, y + (this.banner.subtext ? 14 : h / 2), {
        size: 11,
        color: this.banner.color,
        align: 'center',
        baseline: this.banner.subtext ? 'top' : 'middle',
      });

      if (this.banner.subtext) {
        sprites.drawText(this.banner.subtext, w / 2, y + 30, {
          size: 7,
          color: PALETTE.textSoft,
          align: 'center',
          baseline: 'top',
        });
      }
      ctx.restore();
    }
  }

  /** Resumen para el panel de depuración. */
  getStats() {
    return {
      particles: this.particles.activeCount,
      texts: this.texts.length,
    };
  }

  clear() {
    this.particles.clear();
    this.texts.length = 0;
    this.flashAlpha = 0;
    this.flashColor = null;
    this.banner = null;
    this.bannerTimer = 0;
  }
}

export default EffectsManager;
