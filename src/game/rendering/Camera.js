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

    /**
     * Márgenes en px lógicos ocupados por la interfaz:
     * el HUD superior arriba y el HUD inferior abajo.
     *
     * La cámara NO dibuja el mundo bajo esos márgenes: el campo se ve
     * entre los dos paneles, como en la referencia. Se expresan como
     * alto total reservado y se aplican centrando la vista.
     */
    this.insetTop = 0;
    this.insetBottom = 0;
  }

  /**
   * Reserva espacio de pantalla para la interfaz.
   * @param {number} top px lógicos del HUD superior
   * @param {number} bottom px lógicos del HUD inferior
   */
  setInsets(top, bottom) {
    this.insetTop = Math.max(0, top);
    this.insetBottom = Math.max(0, bottom);
    return this;
  }

  /** Alto útil del viewport (sin contar la interfaz). */
  get playHeight() {
    return Math.max(1, this.viewHeight - this.insetTop - this.insetBottom);
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
    // La cámara trabaja SOLO en unidades del mundo.
    //
    // En horizontal la franja visible mide viewWidth; en vertical mide
    // playHeight (el viewport menos los dos HUD). El desplazamiento del
    // HUD se aplica al dibujar (worldOffsetY), no aquí.
    //
    //   franja visible del mundo = [originY, originY + playHeight]
    //   restricción: 0 <= originY  y  originY + playHeight <= worldHeight
    //   con originY = camera.y - playHeight / 2
    //
    //   =>  camera.y en [playHeight/2, worldHeight - playHeight/2]
    const halfW = this.viewWidth / 2;
    const playH = this.playHeight;
    const halfPlay = playH / 2;

    const clampedX =
      this.worldWidth <= this.viewWidth
        ? this.worldWidth / 2
        : clamp(x, halfW, this.worldWidth - halfW);

    const clampedY =
      this.worldHeight <= playH
        // El mundo cabe entero: se centra en la franja.
        ? this.worldHeight / 2
        : clamp(y, halfPlay, this.worldHeight - halfPlay);

    return { x: clampedX, y: clampedY };
  }

  /**
   * Origen del mundo para aplicar en el contexto del canvas.
   *
   * En Y se usa playHeight, porque la franja visible del campo es el
   * viewport menos los dos HUD. El desplazamiento del HUD superior se
   * aplica aparte con worldOffsetY.
   */
  get originX() {
    const raw = Math.round(this.x - this.viewWidth / 2 + this.offsetX);
    return Math.max(0, raw);
  }

  get originY() {
    const raw = Math.round(this.y - this.playHeight / 2 + this.offsetY);
    return Math.max(0, raw);
  }

  /**
   * Desplazamiento vertical del mundo en pantalla.
   *
   * El mundo se dibuja en la franja entre los dos HUD, así que se
   * traslada hacia abajo por el alto del HUD superior.
   */
  get worldOffsetY() {
    return this.insetTop;
  }

  /** Rectángulo visible del MUNDO (franja útil entre los dos HUD). */
  get viewRect() {
    return {
      x: this.originX,
      y: this.originY,
      w: this.viewWidth,
      h: this.playHeight,
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
