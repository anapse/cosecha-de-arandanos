/**
 * TouchInput.js
 * ---------------------------------------------------------------
 * Entrada táctil y puntero (§26, §37).
 *
 * IMPORTANTE — separación de responsabilidades:
 * Este módulo NO dibuja botones. Solo mantiene el ESTADO lógico:
 *   - qué dirección está activa,
 *   - si se está recogiendo a izquierda o derecha,
 *   - si se pidió entregar.
 *
 * Quien dibuja la cruceta y los botones es TouchControls.jsx (capa
 * HTML/CSS sobre el canvas). Así los controles se pueden rediseñar
 * sin tocar el motor, y el motor funciona igual en PC.
 *
 * Los eventos llegan ya convertidos a coordenadas lógicas del juego.
 */

import { HARVEST_SIDES } from '../config/constants.js';

export class TouchInput {
  constructor() {
    /* ---------- Direcciones activas ---------- */
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;

    /* ---------- Acciones pendientes (se consumen en el update) ---------- */
    this.pendingHarvestLeft = false;
    this.pendingHarvestRight = false;
    this.pendingDeliver = false;
    this.pendingPause = false;

    /* ---------- Botones pulsados actualmente (feedback visual en React) ---------- */
    this.activeButtons = new Set();

    /* ---------- Detección automática de dispositivo táctil ---------- */
    this.touchDetected = TouchInput.detectTouchSupport();

    /* ---------- Modo joystick analógico (futuro) ---------- */
    this.joystick = { active: false, x: 0, y: 0, angle: 0, magnitude: 0 };

    this.enabled = true;
  }

  /** ¿El dispositivo soporta táctil? */
  static detectTouchSupport() {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
    );
  }

  /* ============================================================
     API que consume la capa React de controles
     ============================================================ */

  /** Botón de dirección pulsado/soltado. */
  setDirection(direction, isDown) {
    if (!this.enabled) return;
    if (direction in this) {
      this[direction] = isDown;
    }
    if (isDown) this.activeButtons.add(`dir-${direction}`);
    else this.activeButtons.delete(`dir-${direction}`);
  }

  /** Libera una dirección concreta. */
  releaseDirection(direction) {
    this.setDirection(direction, false);
  }

  /** Libera todas las direcciones (al soltar el dedo). */
  releaseAllDirections() {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    ['up', 'down', 'left', 'right'].forEach((d) => this.activeButtons.delete(`dir-${d}`));
  }

  /** Botón de recoger a un lado. El estado queda pendiente hasta el update. */
  pressHarvest(side) {
    if (!this.enabled) return;
    if (side === HARVEST_SIDES.LEFT) this.pendingHarvestLeft = true;
    else this.pendingHarvestRight = true;

    this.activeButtons.add(`harvest-${side}`);
  }

  releaseHarvest(side) {
    this.activeButtons.delete(`harvest-${side}`);
  }

  /** Botón de entregar. */
  pressDeliver() {
    if (!this.enabled) return;
    this.pendingDeliver = true;
    this.activeButtons.add('deliver');
  }

  releaseDeliver() {
    this.activeButtons.delete('deliver');
  }

  pressPause() {
    this.pendingPause = true;
  }

  /* ============================================================
     Joystick analógico (preparado, no usado en el MVP)
     ============================================================ */
  updateJoystick(x, y) {
    const magnitude = Math.min(1, Math.hypot(x, y));
    this.joystick = {
      active: magnitude > 0.15,
      x,
      y,
      angle: Math.atan2(y, x),
      magnitude,
    };

    if (!this.joystick.active) {
      this.releaseAllDirections();
      return;
    }

    // Convierte el joystick a las 4 direcciones discretas del juego.
    const deadZone = 0.35;
    this.up = y < -deadZone;
    this.down = y > deadZone;
    this.left = x < -deadZone;
    this.right = x > deadZone;
  }

  /* ============================================================
     Consultas para el motor (misma interfaz que KeyboardInput)
     ============================================================ */

  get axisX() {
    let x = 0;
    if (this.left) x -= 1;
    if (this.right) x += 1;
    return x;
  }

  get axisY() {
    let y = 0;
    if (this.up) y -= 1;
    if (this.down) y += 1;
    return y;
  }

  get isMoving() {
    return this.up || this.down || this.left || this.right;
  }

  /** ¿Hay alguna dirección activa? */
  hasDirection(direction) {
    return Boolean(this[direction]);
  }

  /* ============================================================
     Consumo de acciones (una vez por frame)
     ============================================================ */

  /** Devuelve y limpia si se pidió recoger a la izquierda. */
  consumeHarvestLeft() {
    const value = this.pendingHarvestLeft;
    this.pendingHarvestLeft = false;
    return value;
  }

  consumeHarvestRight() {
    const value = this.pendingHarvestRight;
    this.pendingHarvestRight = false;
    return value;
  }

  consumeDeliver() {
    const value = this.pendingDeliver;
    this.pendingDeliver = false;
    return value;
  }

  consumePause() {
    const value = this.pendingPause;
    this.pendingPause = false;
    return value;
  }

  /** Limpieza de fin de frame (consistente con KeyboardInput). */
  endFrame() {
    // Los pendientes ya se consumieron en las acciones. No se limpian
    // aquí para no perder una pulsación entre frames.
  }

  reset() {
    this.releaseAllDirections();
    this.pendingHarvestLeft = false;
    this.pendingHarvestRight = false;
    this.pendingDeliver = false;
    this.pendingPause = false;
    this.activeButtons.clear();
    this.joystick = { active: false, x: 0, y: 0, angle: 0, magnitude: 0 };
  }

  /** Texto de ayuda para el tutorial (§26, §36). */
  static get helpText() {
    return [
      { keys: '↑ ↓ ← →', action: 'Cruceta: caminar por los caminos' },
      { keys: 'RECOGER IZQ', action: 'Recoger el fruto de la izquierda' },
      { keys: 'RECOGER DER', action: 'Recoger el fruto de la derecha' },
      { keys: 'ENTREGAR', action: 'Vaciar la canasta en la zona de entrega' },
    ];
  }
}

export default TouchInput;
