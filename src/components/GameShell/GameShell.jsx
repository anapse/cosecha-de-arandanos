/**
 * GameShell.jsx
 * ---------------------------------------------------------------
 * Contenedor del juego (§3, §35).
 *
 * Es el ÚNICO punto donde React y el motor se tocan. Su trabajo:
 *   - decidir qué se muestra (juego, pausa, victoria, derrota);
 *   - pasar el nivel y las opciones al motor;
 *   - recibir el HUD y los resultados;
 *   - mantener el estado de la aplicación.
 *
 * El motor nunca importa React, y React nunca dibuja un frame.
 */

import { useCallback, useRef, useState } from 'react';
import GameCanvas from '../../game/GameCanvas.jsx';
import GameHud from './GameHud.jsx';
import PauseMenu from '../PauseMenu/PauseMenu.jsx';
import LevelComplete from '../LevelComplete/LevelComplete.jsx';
import GameOver from '../GameOver/GameOver.jsx';
import { storage } from '../../utils/storage.js';
import './GameShell.css';

export default function GameShell({ levelId = 1, soundEnabled = true, onExit }) {
  const engineRef = useRef(null);

  /* ---------- Estado de la interfaz ---------- */
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState(null);      // resultado del nivel
  const [outcome, setOutcome] = useState(null);    // 'victory' | 'defeat'
  const [hud, setHud] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  /* ============================================================
     Callbacks del motor
     ============================================================ */

  const handleEngineReady = useCallback((engine) => {
    engineRef.current = engine;
    engine.setSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleHudUpdate = useCallback((snapshot) => {
    setHud(snapshot);
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  const handleToast = useCallback((payload) => {
    showToast(payload?.text ?? '');
  }, [showToast]);

  const handleRequestPause = useCallback(() => {
    setPaused(true);
  }, []);

  const handleLevelComplete = useCallback((summary) => {
    // Guarda récord y desbloquea el nivel siguiente (§46, §48)
    storage.setBestScore(summary.score);
    storage.setLevelScore(summary.levelId, summary.levelScore);
    storage.unlockLevel(summary.levelId + 1);
    storage.addStats({
      totalHarvested: summary.harvested,
      totalDeliveries: summary.deliveries,
      totalErrors: summary.errors,
      gamesPlayed: 1,
    });

    setResult(summary);
    setOutcome('victory');
    setPaused(false);
  }, []);

  const handleGameOver = useCallback((summary) => {
    storage.setBestScore(summary.score);
    storage.addStats({
      totalHarvested: summary.harvested,
      totalDeliveries: summary.deliveries,
      totalErrors: summary.errors,
      gamesPlayed: 1,
    });

    setResult(summary);
    setOutcome('defeat');
    setPaused(false);
  }, []);

  /* ============================================================
     Acciones de los menús
     ============================================================ */

  const handleResume = useCallback(() => {
    setPaused(false);
  }, []);

  const handleRestart = useCallback(() => {
    engineRef.current?.restartLevel({ seed: Date.now() % 100000 });
    setPaused(false);
    setResult(null);
    setOutcome(null);
  }, []);

  const handleNextLevel = useCallback(() => {
    const nextLevel = (result?.levelId ?? levelId) + 1;
    engineRef.current?.loadLevel(nextLevel, { seed: Date.now() % 100000 });
    setResult(null);
    setOutcome(null);
  }, [result, levelId]);

  const handleExit = useCallback(() => {
    engineRef.current?.goToMenu();
    onExit?.();
  }, [onExit]);

  /* ============================================================
     Render
     ============================================================ */

  return (
    <div className="game-shell">
      {/* ---------- Visor vertical (la "arcade") ---------- */}
      <div className="game-canvas-wrap">
        <GameCanvas
          levelId={levelId}
          paused={paused}
          soundEnabled={soundEnabled}
          onEngineReady={handleEngineReady}
          onHudUpdate={handleHudUpdate}
          onLevelComplete={handleLevelComplete}
          onGameOver={handleGameOver}
          onToast={handleToast}
          onRequestPause={handleRequestPause}
        />

        {/* ---------- HUD HTML sobre el canvas ---------- */}
        {hud && (
          <GameHud
            hud={hud}
            onPause={handleRequestPause}
          />
        )}

        {/* ---------- Avisos breves ---------- */}
        {toast && !paused && !result && (
          <div className="game-toast" role="status">
            {toast}
          </div>
        )}

        {/* ---------- Pausa (§38) ---------- */}
        {paused && !result && (
          <PauseMenu
            levelId={hud?.level ?? levelId}
            onResume={handleResume}
            onRestart={handleRestart}
            onExit={handleExit}
          />
        )}

        {/* ---------- Nivel completado (§25) ---------- */}
        {result && outcome === 'victory' && (
          <LevelComplete
            summary={result}
            onNextLevel={handleNextLevel}
            onRestart={handleRestart}
            onExit={handleExit}
          />
        )}

        {/* ---------- Derrota (§26) ---------- */}
        {result && outcome === 'defeat' && (
          <GameOver
            summary={result}
            onRestart={handleRestart}
            onExit={handleExit}
          />
        )}
      </div>
    </div>
  );
}