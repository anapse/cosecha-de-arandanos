/**
 * Camera.js
 * ---------------------------------------------------------------
 * Cámara 2D (§38).
 *
 * El mapa es más grande que la pantalla: la cámara muestra una parte
 * del campo y sigue al jugador. En móvil esto es imprescindible.
 *
 * Trabaja siempre en coordenadas LÓGICAS (360x640), nunca en píxeles
 * de pantalla. El escalado lo hace el navegador.
 */

import { GAME_CONFIG } from '../config/gameConfig.js';
import { clamp, damp } from '../../utils/math.js';

export class Camera {
  /**
   * @param {object} options
   * @param {number} options.viewWidth  ancho del viewport lógico
   * @param {number} options.viewHeight alto del viewport lógico
   */
  constructor({
    viewWidth = GAME_CONFIG.logicalWidth,
    viewHeight = GAME_CONFIG.logicalHeight,
  } = {}) {
    this.viewWidth = viewWidth;
    this.viewHeight = viewHeight;

    // Centro de la cámara en coordenadas del mundo.
    this.x = 0;
    this.y = 0;

    // Límites del mundo (se fijan al generar el nivel).
    this.worldWidth = viewWidth;
    this.worldHeight = viewHeight;

    this.lerp = GAME_CONFIG.cameraLerp;
    this.deadZone = GAME_CONFIG.cameraDeadZone;

    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  /** Define el tamaño del mundo para poder acotar la cámara. */
  setWorldSize(width, height) {
    this.worldWidth = Math.max(width, this.viewWidth);
    this.worldHeight = Math.max(height, this.viewHeight);
    return this;
  }

  /** Coloca la cámara sin suavizado (al iniciar o regenerar). */
  snapTo(x, y) {
    const target = this.#clampTarget(x, y);
    this.x = target.x;
    this.y = target.y;
    return this;
  }

  /**
   * Sigue a un objetivo con suavizado y zona muerta.
   * @param {number} targetX centro del objetivo (mundo)
   * @param {number} targetY
   * @param {number} dt
   */
  follow(targetX, targetY, dt) {
    let desiredX = targetX;
    let desiredY = targetY;

    // Zona muerta vertical: la cámara no se mueve por micro-ajustes.
    // En un juego vertical esto hace el seguimiento más agradable.
    const dz = this.deadZone;
    const dyFromCenter = targetY - this.y;

    if (Math.abs(dyFromCenter) < dz) {
      desiredY = this.y;
    } else {
      desiredY = targetY - Math.sign(dyFromCenter) * dz;
    }

    const target = this.#clampTarget(desiredX, desiredY);

    this.x = damp(this.x, target.x, this.lerp, dt);
    this.y = damp(this.y, target.y, this.lerp, dt);

    return this;
  }

  #clampTarget(x, y) {
    // La cámara nunca muestra fuera del mundo.
    //
    // Dos casos por eje:
    //   a) El mundo es MÁS GRANDE que la vista → se acota al rango
    //      válido para no mostrar el exterior.
    //   b) El mundo cabe ENTERO en la vista → se fija el centro en la
    //      MITAD del mundo. Si se dejara en 0, el origen de dibujo
    //      (centro - vista/2) quedaría negativo y el mundo se pintaría
    //      desplazado hacia abajo, dejando una franja vacía arriba.
    const halfW = this.viewWidth / 2;
    const halfH = this.viewHeight / 2;

    const clampedX =
      this.worldWidth <= this.viewWidth
        ? this.worldWidth / 2
        : clamp(x, halfW, this.worldWidth - halfW);

    const clampedY =
      this.worldHeight <= this.viewHeight
        ? this.worldHeight / 2
        : clamp(y, halfH, this.worldHeight - halfH);

    return { x: clampedX, y: clampedY };
  }

  /**
   * Origen del mundo para aplicar en el contexto del canvas.
   *
   * Se acota a 0 como mínimo: si el mundo es más pequeño que la vista,
   * un origen negativo dibujaría el mundo desplazado y dejaría una
   * franja vacía en la parte superior de la pantalla.
   */
  get originX() {
    const raw = Math.round(this.x - this.viewWidth / 2 + this.offsetX);
    return Math.max(0, raw);
  }

  get originY() {
    const raw = Math.round(this.y - this.viewHeight / 2 + this.offsetY);
    return Math.max(0, raw);
  }

  /** Rectángulo visible en coordenadas del mundo. */
  get viewRect() {
    return {
      x: this.originX,
      y: this.originY,
      w: this.viewWidth,
      h: this.viewHeight,
    };
  }

  /** ¿Está este rectángulo (mundo) visible? Permite culling. */
  isVisible(rect, margin = 48) {
    const view = this.viewRect;
    return (
      rect.x + rect.w > view.x - margin &&
      rect.x < view.x + view.w + margin &&
      rect.y + rect.h > view.y - margin &&
      rect.y < view.y + view.h + margin
    );
  }

  /** Convierte coordenadas de pantalla a coordenadas del mundo. */
  screenToWorld(screenX, screenY, scale = 1) {
    return {
      x: this.originX + screenX / scale,
      y: this.originY + screenY / scale,
    };
  }

  /** Sacudida de cámara para el feedback de error (§39). */
  shake(intensity = 4, duration = 0.25) {
    this.shakeIntensity = intensity;
    this.shakeTimer = duration;
    return this;
  }

  update(dt) {
    if (this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      const decay = Math.max(0, this.shakeTimer / 0.25);
      const amount = this.shakeIntensity * decay;
      this.offsetX = (Math.random() - 0.5) * amount * 2;
      this.offsetY = (Math.random() - 0.5) * amount * 2;
    } else {
      this.offsetX = 0;
      this.offsetY = 0;
    }
  }
}

export default Camera;
