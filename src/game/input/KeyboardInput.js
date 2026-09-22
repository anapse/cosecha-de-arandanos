/**
 * KeyboardInput.js
 * ---------------------------------------------------------------
 * Entrada por teclado (§25).
 *
 * PC:
 *   W / ↑  → subir
 *   S / ↓  → bajar
 *   A / ←  → izquierda
 *   D / →  → derecha
 *   E      → recoger (acción contextual / derecha)
 *   Q      → recoger izquierda
 *   ESPACIO→ entregar
 *   ESC    → pausa
 *
 * Mantiene un ESTADO (no eventos sueltos) para que el motor consulte
 * "¿qué teclas están pulsadas ahora?" en cada frame. Esto evita
 * perder pulsaciones rápidas y hace el movimiento independiente del
 * framerate.
 */

import { KEY_BINDINGS } from '../config/constants.js';

export class KeyboardInput {
  /**
   * @param {object} options
   * @param {HTMLElement|Window} [options.target]
   */
  constructor({ target = typeof window !== 'undefined' ? window : null } = {}) {
    this.target = target;

    /** @type {Set<string>} códigos de tecla pulsados */
    this.pressed = new Set();
    /** @type {Set<string>} teclas pulsadas en ESTE frame (para acciones) */
    this.justPressed = new Set();

    this.enabled = true;

    this._onKeyDown = this.#handleKeyDown.bind(this);
    this._onKeyUp = this.#handleKeyUp.bind(this);
    this._onBlur = this.#handleBlur.bind(this);

    /** Callback opcional para la tecla de pausa. */
    this.onPause = null;
  }

  attach() {
    if (!this.target) return this;
    this.target.addEventListener('keydown', this._onKeyDown);
    this.target.addEventListener('keyup', this._onKeyUp);
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', this._onBlur);
    }
    return this;
  }

  detach() {
    if (!this.target) return this;
    this.target.removeEventListener('keydown', this._onKeyDown);
    this.target.removeEventListener('keyup', this._onKeyUp);
    if (typeof window !== 'undefined') {
      window.removeEventListener('blur', this._onBlur);
    }
    this.pressed.clear();
    this.justPressed.clear();
    return this;
  }

  #handleKeyDown(event) {
    if (!this.enabled) return;

    // Evita el scroll de la página con flechas y espacio.
    if (SCROLL_KEYS.has(event.code)) {
      event.preventDefault();
    }

    if (event.repeat) return; // auto-repeat no aporta nada aquí

    this.pressed.add(event.code);
    this.justPressed.add(event.code);

    if (KEY_BINDINGS.pause.includes(event.code) && typeof this.onPause === 'function') {
      this.onPause();
    }
  }

  #handleKeyUp(event) {
    this.pressed.delete(event.code);
  }

  #handleBlur() {
    // Si la ventana pierde el foco, se sueltan todas las teclas:
    // evita que el jugador siga caminando solo.
    this.pressed.clear();
    this.justPressed.clear();
  }

  /* ---------- Consultas ---------- */

  isDown(codes) {
    return codes.some((code) => this.pressed.has(code));
  }

  wasPressed(codes) {
    return codes.some((code) => this.justPressed.has(code));
  }

  /** Eje de movimiento horizontal: -1, 0 o 1. */
  get axisX() {
    let x = 0;
    if (this.isDown(KEY_BINDINGS.left)) x -= 1;
    if (this.isDown(KEY_BINDINGS.right)) x += 1;
    return x;
  }

  /** Eje de movimiento vertical: -1, 0 o 1. */
  get axisY() {
    let y = 0;
    if (this.isDown(KEY_BINDINGS.up)) y -= 1;
    if (this.isDown(KEY_BINDINGS.down)) y += 1;
    return y;
  }

  /** ¿Se pidió recoger a un lado concreto en este frame? */
  get harvestLeftPressed() {
    return this.wasPressed(KEY_BINDINGS.harvestLeft) ||
      (this.wasPressed(KEY_BINDINGS.harvestContext) && this.isDown(KEY_BINDINGS.left));
  }

  get harvestRightPressed() {
    return this.wasPressed(KEY_BINDINGS.harvestRight) ||
      (this.wasPressed(KEY_BINDINGS.harvestContext) && !this.isDown(KEY_BINDINGS.left));
  }

  /** ¿Se pidió entregar? */
  get deliverPressed() {
    return this.wasPressed(KEY_BINDINGS.deliver);
  }

  /** Limpia las pulsaciones de un frame. Llamar al FINAL del update. */
  endFrame() {
    this.justPressed.clear();
  }

  reset() {
    this.pressed.clear();
    this.justPressed.clear();
  }

  /**
   * Ayuda contextual: descripción de los controles para el tutorial
   * y la UI externa (§25).
   */
  static get helpText() {
    return [
      { keys: 'W / ↑', action: 'Subir' },
      { keys: 'S / ↓', action: 'Bajar' },
      { keys: 'A / ←', action: 'Izquierda' },
      { keys: 'D / →', action: 'Derecha' },
      { keys: 'Q', action: 'Recoger izquierda' },
      { keys: 'E', action: 'Recoger derecha / contextual' },
      { keys: 'ESPACIO', action: 'Entregar' },
      { keys: 'ESC', action: 'Pausa' },
    ];
  }
}

/** Teclas cuyo comportamiento por defecto del navegador se anula. */
const SCROLL_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Space',
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
]);

export default KeyboardInput;
