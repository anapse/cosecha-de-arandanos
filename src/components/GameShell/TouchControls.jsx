/**
 * TouchControls.jsx
 * ---------------------------------------------------------------
 * Controles táctiles (§26, §37).
 *
 * CRUCETA + BOTONES GRANDES:
 *
 *        ↑
 *   ←    ↓    →
 *
 *   [RECOGER IZQUIERDA] [RECOGER DERECHA]  [ENTREGAR]
 *
 * Capa HTML/CSS sobre el canvas: se puede rediseñar sin tocar el
 * motor. Solo escribe en TouchInput; no sabe nada de reglas del juego.
 *
 * Se muestra automáticamente en dispositivos táctiles y también en
 * PC si se activa desde los ajustes (§9: aparecen cuando son
 * necesarios).
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import './TouchControls.css';

const DIRECTIONS = ['up', 'down', 'left', 'right'];

export default function TouchControls({ engine, visible = true, onDeliver }) {
  // Se detecta el soporte táctil una sola vez al montar.
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [pressed, setPressed] = useState({});
  const pointersRef = useRef(new Map());

  useEffect(() => {
    const hasTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0);
    setIsTouchDevice(hasTouch);
  }, []);

  const touch = engine?.touchInput ?? null;

  /** Marca visualmente un botón mientras está pulsado. */
  const setPressedState = useCallback((key, value) => {
    setPressed((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  /* ============================================================
     Direcciones — soportan arrastrar el dedo entre botones
     ============================================================ */
  const handleDirectionDown = useCallback(
    (direction) => (event) => {
      event.preventDefault();
      const el = event.currentTarget;
      // Guarda el puntero para poder soltarlo aunque el dedo salga
      // del botón.
      if (el.setPointerCapture && event.pointerId != null) {
        try {
          el.setPointerCapture(event.pointerId);
        } catch {
          // Algunos navegadores no lo permiten: no es crítico.
        }
      }
      pointersRef.current.set(event.pointerId, direction);
      touch?.setDirection(direction, true);
      setPressedState(`dir-${direction}`, true);
    },
    [touch, setPressedState]
  );

  const handleDirectionUp = useCallback(
    (direction) => (event) => {
      event.preventDefault();
      pointersRef.current.delete(event.pointerId);
      touch?.setDirection(direction, false);
      setPressedState(`dir-${direction}`, false);
    },
    [touch, setPressedState]
  );

  /* ============================================================
     Acciones
     ============================================================ */
  const handleHarvest = useCallback(
    (side) => (event) => {
      event.preventDefault();
      touch?.pressHarvest(side);
      setPressedState(`harvest-${side}`, true);
      // El botón se suelta solo: la acción ya quedó registrada.
      window.setTimeout(() => {
        setPressedState(`harvest-${side}`, false);
        touch?.releaseHarvest(side);
      }, 140);
    },
    [touch, setPressedState]
  );

  const handleDeliver = useCallback(
    (event) => {
      event.preventDefault();
      onDeliver?.();
      setPressedState('deliver', true);
      window.setTimeout(() => setPressedState('deliver', false), 140);
    },
    [onDeliver, setPressedState]
  );

  /* ============================================================
     Seguridad: si se pierde el foco, se sueltan todas las teclas
     ============================================================ */
  useEffect(() => {
    const releaseAll = () => {
      touch?.releaseAllDirections();
      setPressed({});
      pointersRef.current.clear();
    };

    window.addEventListener('blur', releaseAll);
    window.addEventListener('pointercancel', releaseAll);

    return () => {
      window.removeEventListener('blur', releaseAll);
      window.removeEventListener('pointercancel', releaseAll);
      releaseAll();
    };
  }, [touch]);

  // En PC sin táctil no se muestran (el teclado es mejor).
  if (!isTouchDevice || !visible) return null;

  return (
    <div className="touch-controls" aria-hidden="false">
      {/* ---------- Cruceta ---------- */}
      <div className="touch-dpad" role="group" aria-label="Movimiento">
        <button
          type="button"
          className={`touch-btn touch-btn--up ${pressed['dir-up'] ? 'is-active' : ''}`}
          onPointerDown={handleDirectionDown('up')}
          onPointerUp={handleDirectionUp('up')}
          onPointerLeave={handleDirectionUp('up')}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Subir"
        >
          ▲
        </button>

        <button
          type="button"
          className={`touch-btn touch-btn--left ${pressed['dir-left'] ? 'is-active' : ''}`}
          onPointerDown={handleDirectionDown('left')}
          onPointerUp={handleDirectionUp('left')}
          onPointerLeave={handleDirectionUp('left')}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Izquierda"
        >
          ◀
        </button>

        <button
          type="button"
          className={`touch-btn touch-btn--down ${pressed['dir-down'] ? 'is-active' : ''}`}
          onPointerDown={handleDirectionDown('down')}
          onPointerUp={handleDirectionUp('down')}
          onPointerLeave={handleDirectionUp('down')}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Bajar"
        >
          ▼
        </button>

        <button
          type="button"
          className={`touch-btn touch-btn--right ${pressed['dir-right'] ? 'is-active' : ''}`}
          onPointerDown={handleDirectionDown('right')}
          onPointerUp={handleDirectionUp('right')}
          onPointerLeave={handleDirectionUp('right')}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Derecha"
        >
          ▶
        </button>
      </div>

      {/* ---------- Botones de acción ---------- */}
      <div className="touch-actions" role="group" aria-label="Acciones">
        <button
          type="button"
          className={`touch-action-btn touch-action-btn--harvest-left ${
            pressed['harvest-left'] ? 'is-active' : ''
          }`}
          onPointerDown={handleHarvest('left')}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Recoger izquierda"
        >
          <span className="touch-action-btn__icon">🫐</span>
          <span className="touch-action-btn__label">
            RECOGER
            <br />
            IZQ
          </span>
        </button>

        <button
          type="button"
          className={`touch-action-btn touch-action-btn--deliver ${
            pressed.deliver ? 'is-active' : ''
          }`}
          onPointerDown={handleDeliver}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Entregar"
        >
          <span className="touch-action-btn__icon">🧺</span>
          <span className="touch-action-btn__label">
            ENTREGAR
          </span>
        </button>

        <button
          type="button"
          className={`touch-action-btn touch-action-btn--harvest-right ${
            pressed['harvest-right'] ? 'is-active' : ''
          }`}
          onPointerDown={handleHarvest('right')}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Recoger derecha"
        >
          <span className="touch-action-btn__icon">🫐</span>
          <span className="touch-action-btn__label">
            RECOGER
            <br />
            DER
          </span>
        </button>
      </div>
    </div>
  );
}
