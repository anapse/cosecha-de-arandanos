/**
 * TouchControls.jsx
 * ---------------------------------------------------------------
 * Controles móviles transparentes y control por deslizamiento (swipe).
 *
 * Características:
 *   1. Deslizamiento en cualquier parte de la pantalla (swipe / drag continuo)
 *      para mover al jugador en cualquier dirección con total fluidez.
 *   2. Botones de dirección transparentes (50% de tamaño) situados en los bordes:
 *      - Arriba (centro superior)
 *      - Abajo (centro inferior)
 *      - Izquierda (mitad izquierda)
 *      - Derecha (mitad derecha)
 *   3. Botones de acción compactos y translúcidos en la parte inferior:
 *      - [🫐 COSECHAR] (cosecha inteligente hacia el fruto más cercano)
 *      - [🧺 ENTREGAR] (entrega en la cesta central)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import './TouchControls.css';

export default function TouchControls({ engine, visible = true, onDeliver }) {
  const [pressed, setPressed] = useState({});
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const hasTouch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0);
    setIsTouchDevice(hasTouch);
  }, []);

  const touchStateRef = useRef({
    activePointerId: null,
    startX: 0,
    startY: 0,
    currentDir: null,
    isDragging: false,
    startTime: 0,
  });

  const touch = engine?.touchInput ?? null;

  const setPressedState = useCallback((key, value) => {
    setPressed((prev) => (prev[key] === value ? prev : { ...prev, [key]: value }));
  }, []);

  /* ============================================================
     1. Manejadores de Botones de Dirección Específicos
     ============================================================ */
  const handleDirDown = useCallback(
    (dir) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      touch?.setDirection(dir, true);
      setPressedState(`dir-${dir}`, true);
    },
    [touch, setPressedState]
  );

  const handleDirUp = useCallback(
    (dir) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      touch?.setDirection(dir, false);
      setPressedState(`dir-${dir}`, false);
    },
    [touch, setPressedState]
  );

  /* ============================================================
     2. Control por Deslizamiento / Swipe en Cualquier Parte de la Pantalla
     ============================================================ */
  const handleSurfacePointerDown = useCallback(
    (e) => {
      // Solo capturamos si no fue en un botón interactivo
      if (e.target.closest('button')) return;

      const state = touchStateRef.current;
      state.activePointerId = e.pointerId;
      state.startX = e.clientX;
      state.startY = e.clientY;
      state.startTime = Date.now();
      state.isDragging = false;
      state.currentDir = null;

      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Ignorar si no soporta pointer capture
      }
    },
    []
  );

  const handleSurfacePointerMove = useCallback(
    (e) => {
      const state = touchStateRef.current;
      if (state.activePointerId !== e.pointerId) return;

      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      const dist = Math.hypot(dx, dy);

      // Si se mueve más de 8px, activamos el deslizamiento
      if (dist > 8) {
        state.isDragging = true;
        let newDir = null;

        if (Math.abs(dx) > Math.abs(dy)) {
          newDir = dx > 0 ? 'right' : 'left';
        } else {
          newDir = dy > 0 ? 'down' : 'up';
        }

        if (state.currentDir !== newDir) {
          // Soltamos la dirección previa
          if (state.currentDir) {
            touch?.setDirection(state.currentDir, false);
            setPressedState(`dir-${state.currentDir}`, false);
          }
          // Activamos la nueva
          if (newDir) {
            touch?.setDirection(newDir, true);
            setPressedState(`dir-${newDir}`, true);
          }
          state.currentDir = newDir;
        }
      }
    },
    [touch, setPressedState]
  );

  const handleSurfacePointerUp = useCallback(
    (e) => {
      const state = touchStateRef.current;
      if (state.activePointerId !== e.pointerId) return;

      if (state.currentDir) {
        touch?.setDirection(state.currentDir, false);
        setPressedState(`dir-${state.currentDir}`, false);
      }

      // Si fue un toque rápido sin arrastre, intentar cosechar en ese punto del canvas
      const elapsed = Date.now() - state.startTime;
      if (!state.isDragging && elapsed < 350 && engine) {
        const canvas = engine.canvas;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const cssX = e.clientX - rect.left;
          const cssY = e.clientY - rect.top;
          engine.harvestAtScreen(cssX, cssY);
        }
      }

      state.activePointerId = null;
      state.isDragging = false;
      state.currentDir = null;
      touch?.releaseAllDirections();
    },
    [engine, touch, setPressedState]
  );

  /* ============================================================
     3. Botones de Acción: Cosechar y Entregar
     ============================================================ */
  const handleActionHarvest = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Acción contextual inteligente
      if (engine) {
        const side = engine.harvestSystem?.findBestSide?.(engine.player) || 'right';
        touch?.pressHarvest(side);
      } else {
        touch?.pressHarvest('right');
      }
      setPressedState('action-harvest', true);
      window.setTimeout(() => {
        setPressedState('action-harvest', false);
        touch?.releaseHarvest('left');
        touch?.releaseHarvest('right');
      }, 160);
    },
    [engine, touch, setPressedState]
  );

  const handleActionDeliver = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      onDeliver?.();
      touch?.pressDeliver();
      setPressedState('action-deliver', true);
      window.setTimeout(() => {
        setPressedState('action-deliver', false);
        touch?.releaseDeliver();
      }, 160);
    },
    [onDeliver, touch, setPressedState]
  );

  /* ============================================================
     Seguridad: Liberar todo al perder foco o cancelar
     ============================================================ */
  useEffect(() => {
    const releaseAll = () => {
      touch?.releaseAllDirections();
      setPressed({});
      touchStateRef.current.activePointerId = null;
      touchStateRef.current.isDragging = false;
      touchStateRef.current.currentDir = null;
    };

    window.addEventListener('blur', releaseAll);
    window.addEventListener('pointercancel', releaseAll);

    return () => {
      window.removeEventListener('blur', releaseAll);
      window.removeEventListener('pointercancel', releaseAll);
      releaseAll();
    };
  }, [touch]);

  if (!visible) return null;

  return (
    <div
      className="touch-overlay"
      onPointerDown={handleSurfacePointerDown}
      onPointerMove={handleSurfacePointerMove}
      onPointerUp={handleSurfacePointerUp}
      onPointerCancel={handleSurfacePointerUp}
      aria-label="Superficie de control táctil"
    >
      {/* ---------- Botones de Dirección (solo en dispositivos táctiles / móvil) ---------- */}
      {isTouchDevice && (
        <>
          {/* Botón Superior (Arriba) */}
          <button
            type="button"
            className={`touch-dir-btn touch-dir-btn--up ${pressed['dir-up'] ? 'is-active' : ''}`}
            onPointerDown={handleDirDown('up')}
            onPointerUp={handleDirUp('up')}
            onPointerLeave={handleDirUp('up')}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Subir"
          >
            ▲
          </button>

          {/* Botón Izquierdo (Mitad Izquierda) */}
          <button
            type="button"
            className={`touch-dir-btn touch-dir-btn--left ${pressed['dir-left'] ? 'is-active' : ''}`}
            onPointerDown={handleDirDown('left')}
            onPointerUp={handleDirUp('left')}
            onPointerLeave={handleDirUp('left')}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Izquierda"
          >
            ◀
          </button>

          {/* Botón Derecho (Mitad Derecha) */}
          <button
            type="button"
            className={`touch-dir-btn touch-dir-btn--right ${pressed['dir-right'] ? 'is-active' : ''}`}
            onPointerDown={handleDirDown('right')}
            onPointerUp={handleDirUp('right')}
            onPointerLeave={handleDirUp('right')}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Derecha"
          >
            ▶
          </button>

          {/* Botón Inferior (Abajo) */}
          <button
            type="button"
            className={`touch-dir-btn touch-dir-btn--down ${pressed['dir-down'] ? 'is-active' : ''}`}
            onPointerDown={handleDirDown('down')}
            onPointerUp={handleDirUp('down')}
            onPointerLeave={handleDirUp('down')}
            onContextMenu={(e) => e.preventDefault()}
            aria-label="Bajar"
          >
            ▼
          </button>
        </>
      )}

      {/* ---------- Botones de Acción Inferiores (Disponibles siempre) ---------- */}
      <div className="touch-actions-bar" role="group" aria-label="Acciones de juego">
        <button
          type="button"
          className={`touch-action-pill touch-action-pill--harvest ${
            pressed['action-harvest'] ? 'is-active' : ''
          }`}
          onPointerDown={handleActionHarvest}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Cosechar arándano"
        >
          <span className="touch-pill__icon">🫐</span>
          <span className="touch-pill__label">COSECHAR</span>
        </button>

        <button
          type="button"
          className={`touch-action-pill touch-action-pill--deliver ${
            pressed['action-deliver'] ? 'is-active' : ''
          }`}
          onPointerDown={handleActionDeliver}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Entregar en la cesta"
        >
          <span className="touch-pill__icon">🧺</span>
          <span className="touch-pill__label">ENTREGAR</span>
        </button>
      </div>
    </div>
  );
}
