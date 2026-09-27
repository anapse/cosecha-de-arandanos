/**
 * App.jsx
 * ---------------------------------------------------------------
 * Aplicación exterior (§3, §22, §35).
 *
 * React controla SOLO esto:
 *   MainMenu · Tutorial · GameShell · Pausa · Victoria · Derrota ·
 *   Resultados · Compartir
 *
 * El juego vive aislado detrás de GameShell → GameCanvas →
 * GameEngine. Este archivo NO conoce ninguna regla del juego: solo
 * decide qué pantalla se muestra.
 */

import { useState } from 'react';
import MainMenu from '../components/MainMenu/MainMenu.jsx';
import Tutorial from '../components/Tutorial/Tutorial.jsx';
import GameShell from '../components/GameShell/GameShell.jsx';
import { storage } from '../utils/storage.js';
import './App.css';

/** Pantallas de la aplicación exterior (§23). */
const SCREENS = {
  MENU: 'MENU',
  TUTORIAL: 'TUTORIAL',
  PLAYING: 'PLAYING',
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.MENU);
  const [levelId, setLevelId] = useState(1);
  const [soundEnabled, setSoundEnabled] = useState(
    () => storage.getSettings().soundEnabled ?? true
  );

  /* ---------- Acciones ---------- */

  const handlePlay = (level = 1) => {
    setLevelId(level);
    setScreen(SCREENS.PLAYING);
  };

  const handleTutorial = () => {
    setScreen(SCREENS.TUTORIAL);
  };

  const handleBackToMenu = () => {
    setScreen(SCREENS.MENU);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    storage.setSettings({ soundEnabled: next });
  };

  /* ---------- Render ---------- */

  return (
    <div className="app">
      {/* ---------- Botón de sonido: fuera del visor, no estorba ---------- */}
      <button
        type="button"
        className="app__sound-toggle"
        onClick={handleToggleSound}
        aria-label={soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
        title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>

      {/* ---------- Visor vertical centrado (§6, §7, §45) ---------- */}
      <div className="game-viewport">
        {screen === SCREENS.MENU && (
          <MainMenu
            onPlay={handlePlay}
            onTutorial={handleTutorial}
            onSelectLevel={handlePlay}
          />
        )}

        {screen === SCREENS.TUTORIAL && (
          <Tutorial
            onFinish={() => handlePlay(1)}
            onBackToMenu={handleBackToMenu}
          />
        )}

        {screen === SCREENS.PLAYING && (
          <GameShell
            levelId={levelId}
            soundEnabled={soundEnabled}
            onExit={handleBackToMenu}
          />
        )}
      </div>


    </div>
  );
}
