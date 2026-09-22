/**
 * DeliverySystem.js
 * ---------------------------------------------------------------
 * Sistema de entrega (§15, §16).
 *
 * Cuando el jugador llega a la zona de entrega con cosecha puede
 * entregar:
 *   - la canasta se vacía;
 *   - los frutos pasan al total de cosecha;
 *   - se suman puntos;
 *   - se actualiza el objetivo;
 *   - una caja se llena (§16).
 */

import { CollisionSystem } from '../collision/CollisionSystem.js';

export const DELIVERY_RESULT = Object.freeze({
  NONE: 'none',
  NOT_IN_ZONE: 'notInZone',
  EMPTY_BASKET: 'emptyBasket',
  DELIVERED: 'delivered',
});

export class DeliverySystem {
  /**
   * @param {object} deps
   * @param {import('../map/Map.js').Map} deps.map
   * @param {import('../entities/Basket.js').Basket} deps.basket
   * @param {import('../entities/Box.js').Box[]} deps.boxes
   */
  constructor({ map, basket, boxes = [] }) {
    this.map = map;
    this.basket = basket;
    this.boxes = boxes;
  }

  setMap(map) {
    this.map = map;
  }

  setBasket(basket) {
    this.basket = basket;
  }

  setBoxes(boxes) {
    this.boxes = boxes;
  }

  /** ¿El jugador está en la zona de entrega? (§15) */
  isPlayerInZone(player) {
    if (!this.map || !player) return false;
    const zone = this.map.deliveryZone;
    if (!zone) return false;
    return CollisionSystem.overlaps(player.feetRect, zone);
  }

  /** ¿Se puede mostrar el aviso "ENTREGAR"? (§54) */
  canDeliver(player) {
    return this.isPlayerInZone(player) && this.basket && this.basket.current > 0;
  }

  /**
   * Realiza la entrega.
   * @param {import('../entities/Player.js').Player} player
   * @returns {object} resultado
   */
  deliver(player) {
    if (!this.isPlayerInZone(player)) {
      return { result: DELIVERY_RESULT.NOT_IN_ZONE };
    }

    if (!this.basket || this.basket.current === 0) {
      return { result: DELIVERY_RESULT.EMPTY_BASKET };
    }

    const delivered = this.basket.current;
    const wasFull = this.basket.isFull;
    const unripeInBasket = this.basket.totalUnripe;

    // La canasta se vacía (§15)
    this.basket.empty();

    // Una caja se llena con la cosecha entregada (§16)
    const box = this.#nextEmptyBox();
    if (box) box.fill(delivered);

    return {
      result: DELIVERY_RESULT.DELIVERED,
      delivered,
      wasFull,
      unripeInBasket,
      box,
      position: { x: this.basket.centerX, y: this.basket.centerY },
    };
  }

  /** Devuelve la primera caja vacía disponible. */
  #nextEmptyBox() {
    return this.boxes.find((box) => box.contents === 0) ?? null;
  }

  /** ¿Todas las cajas están llenas? (el camión puede venir, §16) */
  get allBoxesFull() {
    return this.boxes.length > 0 && this.boxes.every((box) => box.contents > 0);
  }

  /** Nº de cajas llenas. */
  get filledBoxCount() {
    return this.boxes.filter((box) => box.contents > 0).length;
  }

  /** Vacía las cajas (cuando el camión se las lleva, §16). */
  clearBoxes() {
    this.boxes.forEach((box) => box.reset());
    return this.boxes.length;
  }
}

export default DeliverySystem;
