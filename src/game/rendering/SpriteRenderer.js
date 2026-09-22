/**
 * SpriteRenderer.js
 * ---------------------------------------------------------------
 * Dibuja sprites con soporte para:
 *   - hojas de sprites (spritesheets) de N frames;
 *   - placeholders generados por código;
 *   - escalado sin suavizado (pixel art, §12);
 *   - volteo horizontal cuando haga falta.
 *
 * Es la ÚNICA capa que conoce cómo se dibuja un sprite. El resto del
 * motor trabaja con claves lógicas y posiciones.
 */

import { PALETTE, withAlpha } from '../../utils/colors.js';

export class SpriteRenderer {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {import('./AssetLoader.js').AssetLoader} assetLoader
   */
  constructor(ctx, assetLoader) {
    this.ctx = ctx;
    this.assets = assetLoader;

    // Pixel art: nunca suavizar (§12).
    this.ctx.imageSmoothingEnabled = false;
  }

  /**
   * Dibuja un sprite.
   * @param {string} key clave lógica ('player.walkDown')
   * @param {number} x esquina superior izquierda (coordenadas ya transformadas)
   * @param {number} y
   * @param {object} [options]
   * @param {number} [options.frame] frame de la tira
   * @param {number} [options.frameSize] tamaño de cada frame en px
   * @param {number} [options.width] ancho destino (por defecto frameSize)
   * @param {number} [options.height] alto destino
   * @param {boolean} [options.flipX] voltear horizontalmente
   * @param {number} [options.alpha] 0-1
   * @param {string} [options.tint] color de tinte (para el flash de error)
   */
  draw(key, x, y, options = {}) {
    const image = this.assets?.get(key);
    if (!image) return false;

    const {
      frame = 0,
      frameSize = null,
      width = null,
      height = null,
      flipX = false,
      alpha = 1,
      tint = null,
    } = options;

    const ctx = this.ctx;
    const srcFrameSize = frameSize ?? this.#inferFrameSize(image, key);
    const drawW = width ?? srcFrameSize;
    const drawH = height ?? srcFrameSize;

    const sx = frame * srcFrameSize;
    const sy = 0;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    if (alpha !== 1) ctx.globalAlpha = alpha;

    if (flipX) {
      ctx.translate(Math.round(x) + drawW, Math.round(y));
      ctx.scale(-1, 1);
      ctx.drawImage(
        image,
        sx, sy, srcFrameSize, srcFrameSize,
        0, 0, drawW, drawH
      );
    } else {
      ctx.drawImage(
        image,
        sx, sy, srcFrameSize, srcFrameSize,
        Math.round(x), Math.round(y), drawW, drawH
      );
    }

    ctx.restore();

    // Tinte superpuesto (feedback de error / selección)
    if (tint) {
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = alpha * 0.35;
      ctx.fillStyle = tint;
      ctx.fillRect(Math.round(x), Math.round(y), drawW, drawH);
      ctx.restore();
    }

    return true;
  }

  /**
   * Dibuja un rectángulo pixel art (con borde opcional).
   * Usado por el HUD y por los placeholders de terreno en bloque.
   */
  drawRect(x, y, w, h, color, { borderColor = null, borderWidth = 1 } = {}) {
    const ctx = this.ctx;
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));

    if (borderColor) {
      ctx.fillStyle = borderColor;
      for (let i = 0; i < borderWidth; i += 1) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          Math.round(x) + i + 0.5,
          Math.round(y) + i + 0.5,
          Math.round(w) - i * 2 - 1,
          Math.round(h) - i * 2 - 1
        );
      }
    }
  }

  /** Rectángulo simple sin bordes. */
  fillRect(x, y, w, h, color) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  /** Círculo (para frutos y partículas cuando no hay sprite). */
  drawCircle(cx, cy, radius, color, { strokeColor = null, lineWidth = 1 } = {}) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  /** Sombra elíptica bajo una entidad (da sensación de profundidad). */
  drawShadow(cx, cy, radiusX, radiusY, alpha = 0.22) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.ellipse(cx, cy, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha('#000000', alpha);
    ctx.fill();
  }

  /**
   * Texto con estilo pixel art y sombra dura.
   * Se usa una fuente monoespaciada como sustituto de la fuente pixel
   * hasta que se cargue 'Press Start 2P'.
   */
  drawText(text, x, y, {
    size = 8,
    color = PALETTE.text,
    align = 'left',
    baseline = 'top',
    shadow = true,
    weight = 'bold',
  } = {}) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `${weight} ${size}px "Press Start 2P", "Courier New", monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    if (shadow) {
      ctx.fillStyle = withAlpha('#000000', 0.7);
      ctx.fillText(text, Math.round(x) + 1, Math.round(y) + 1);
    }

    ctx.fillStyle = color;
    ctx.fillText(text, Math.round(x), Math.round(y));
    ctx.restore();
  }

  /** Ancho de un texto con el estilo dado (para centrar y medir). */
  measureText(text, size = 8, weight = 'bold') {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = `${weight} ${size}px "Press Start 2P", "Courier New", monospace`;
    const width = ctx.measureText(text).width;
    ctx.restore();
    return width;
  }

  /** Aplica el transform de un contexto con traslación y escala. */
  static applyTransform(ctx, translateX, translateY, scale = 1) {
    ctx.setTransform(scale, 0, 0, scale, -translateX * scale, -translateY * scale);
    ctx.imageSmoothingEnabled = false;
  }

  /** Estima el tamaño de frame de una imagen si no se especifica. */
  #inferFrameSize(image, key) {
    const declared = this.assets?.manifest?.[key]?.frameSize;
    if (declared) return declared;

    const frames = this.assets?.manifest?.[key]?.frames ?? 1;
    if (frames > 1) return Math.floor(image.width / frames);
    return image.width || 32;
  }
}

export default SpriteRenderer;
