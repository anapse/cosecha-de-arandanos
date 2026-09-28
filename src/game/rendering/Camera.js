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

  /**
   * Define el tamaño del mundo para poder acotar la cámara.
   *
   * Se usa el tamaño REAL del mapa, sin forzarlo al del viewport: el
   * campo solo se ve en la franja entre los dos HUD (playHeight), y
   * inflar worldHeight al alto completo del viewport hacía que la
   * cámara creyera que había mundo donde no lo hay, mostrando una
   * banda vacía por debajo del campo.
   */
  setWorldSize(width, height) {
    this.worldWidth = Math.max(width, 1);
    this.worldHeight = Math.max(height, 1);
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
    // La cámara es completamente fija: el mapa completo (paisaje superior,
    // 4 hileras de cultivo y zona de entrega amplia) se ve en una sola
    // pantalla arcade estática sin ningún desplazamiento horizontal ni vertical.
    this.x = this.viewWidth / 2;
    this.y = this.viewHeight / 2;
    return this;
  }

  #clampTarget(x, y) {
    return {
      x: this.worldWidth / 2,
      y: this.worldHeight / 2,
    };
  }

  /**
   * Origen del mundo para aplicar en el contexto del canvas.
   * Totalmente fijo en 0 (solo vibra durante el shake de error).
   */
  get originX() {
    return Math.round(this.offsetX);
  }

  get originY() {
    return Math.round(this.offsetY);
  }

  /**
   * Desplazamiento vertical del mundo en pantalla.
   * En modo arcade estático el mundo empieza en y=0 para que el cielo
   * y las montañas se vean siempre en la parte superior detrás del HUD.
   */
  get worldOffsetY() {
    return 0;
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

  /**
   * Convierte un punto de la PANTALLA DEL JUEGO a coordenadas del mundo,
   * teniendo en cuenta el desplazamiento por el HUD superior.
   *
   * El mundo se dibuja trasladado hacia abajo por `worldOffsetY` (el
   * alto del HUD de arriba), así que un toque en (sx, sy) de pantalla
   * corresponde al punto (sx/scale, sy/scale - worldOffsetY) del
   * lienzo lógico, y de ahí al mundo.
   *
   * @param {number} screenX x en px de pantalla (relativo al canvas)
   * @param {number} screenY y en px de pantalla
   * @param {number} scale escala aplicada al canvas
   */
  screenToWorldWithHud(screenX, screenY, scale = 1) {
    const logicalX = screenX / scale;
    const logicalY = screenY / scale - this.worldOffsetY;

    return {
      x: this.originX + logicalX,
      y: this.originY + logicalY,
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
