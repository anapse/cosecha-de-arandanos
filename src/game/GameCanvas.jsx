/**
 * GameCanvas.jsx
 * ---------------------------------------------------------------
 * Puente entre React y el motor (§5, §35).
 *
 * Responsabilidades — y solo estas:
 *   1. crear el <canvas>
 *   2. instanciar GameEngine
 *   3. ajustar el tamaño del canvas
 *   4. pasar los eventos de entrada (táctil)
 *   5. DESTRUIR el engine al desmontar
 *
 * NO renderiza la lógica del juego. React no dibuja ni un frame.
 */

import { useEffect, useRef, useState } from 'react';
import { GameEngine } from './GameEngine.js';
import TouchControls from '../components/GameShell/TouchControls.jsx';

export default function GameCanvas({
  levelId = 1,
  paused = false,
  soundEnabled = true,
  onEngineReady,
  onHudUpdate,
  onLevelComplete,
  onGameOver,
  onToast,
  onRequestPause,
}) {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const engineRef = useRef(null);

  const [engineReady, setEngineReady] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Los callbacks cambian en cada render de React; se guardan en refs
  // para que el engine no se recree y para no re-suscribir listeners.
  const callbacksRef = useRef({});
  callbacksRef.current = { onHudUpdate, onLevelComplete, onGameOver, onToast, onRequestPause };

  /* ============================================================
     Montaje del motor — se ejecuta UNA vez
     ============================================================ */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let engine = null;
    let cancelled = false;

    try {
      engine = new GameEngine({
        canvas,
        callbacks: {
          onHudUpdate: (hud) => callbacksRef.current.onHudUpdate?.(hud),
          onLevelComplete: (s) => callbacksRef.current.onLevelComplete?.(s),
          onGameOver: (s) => callbacksRef.current.onGameOver?.(s),
          onToast: (t) => callbacksRef.current.onToast?.(t),
        },
      });
    } catch (error) {
      setLoadError(error.message ?? 'No se pudo iniciar el motor del juego.');
      return undefined;
    }

    engineRef.current = engine;

    let resizeObserver = null;
    let unwirePause = () => {};
    let unwireTouch = () => {};

    engine
      .init()
      .then(() => {
        if (cancelled) return;

        // Carga del primer nivel.
        engine.loadLevel(levelId, { seed: 20260922 + levelId });

        engine.setSoundEnabled(soundEnabled);

        // Escucha del atajo de pausa que emite el engine (ESC).
        const onPauseEvent = () => callbacksRef.current.onRequestPause?.();
        window.addEventListener('engine:pauseRequest', onPauseEvent);
        unwirePause = () => window.removeEventListener('engine:pauseRequest', onPauseEvent);

        // Redimensionado: ResizeObserver es más fiable que window.resize
        // dentro de un contenedor con aspect-ratio.
        if (typeof ResizeObserver !== 'undefined' && wrapperRef.current) {
          resizeObserver = new ResizeObserver(() => engine.resize());
          resizeObserver.observe(wrapperRef.current);
        }

        setEngineReady(true);

        // Expone el engine para depuración y para pruebas automatizadas.
        // Es solo lectura de diagnóstico: no afecta a la lógica.
        if (typeof window !== 'undefined') {
          window.__COSECHA_ENGINE__ = engine;
        }

        onEngineReady?.(engine);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(error.message ?? 'Error al cargar los recursos.');
      });

    return () => {
      cancelled = true;
      unwirePause();
      unwireTouch();
      resizeObserver?.disconnect();
      // Destruye el engine: para el bucle y suelta todos los listeners.
      engine.destroy();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ============================================================
     Pausa: React manda, el motor obedece
     ============================================================ */
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !engineReady) return;

    if (paused) engine.pause();
    else if (engine.getStatus() === 'PAUSED') engine.resume();
  }, [paused, engineReady]);

  /* ============================================================
     Sonido
     ============================================================ */
  useEffect(() => {
    engineRef.current?.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  if (loadError) {
    return (
      <div className="game-canvas-error" role="alert">
        <strong>No se pudo iniciar el juego</strong>
        <span>{loadError}</span>
      </div>
    );
  }

  return (
    <div className="game-canvas-wrap" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        className="game-canvas pixelated"
        tabIndex={0}
        aria-label="Área de juego de Cosecha de Arándanos"
      />

      {engineReady && (
        <TouchControls
          engine={engineRef.current}
          visible={!paused}
          onDeliver={() => engineRef.current?.touchInput.pressDeliver()}
        />
      )}
    </div>
  );
}
