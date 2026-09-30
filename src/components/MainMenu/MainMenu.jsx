/**
 * MainMenu.jsx — Pantalla de inicio (§35).
 *
 * Muestra:
 *   🫐
 *   COSECHA DE ARÁNDANOS
 *   Fundo San Jorge Ica - Perú
 *   [ JUGAR ]
 *   [ CÓMO JUGAR ]
 *
 * También refleja el récord guardado y los niveles desbloqueados.
 */

import { useEffect, useState } from 'react';
import { storage } from '../../utils/storage.js';
import { TOTAL_LEVELS } from '../../data/levels.js';
import { GAME_VERSION } from '../../config/version.js';
import './MainMenu.css';

export default function MainMenu({ onPlay, onTutorial, onSelectLevel }) {
  const [bestScore, setBestScore] = useState(0);
  const [maxLevel, setMaxLevel] = useState(1);
  const [showLevels, setShowLevels] = useState(false);

  useEffect(() => {
    setBestScore(storage.getBestScore());
    setMaxLevel(storage.getMaxLevel());
  }, []);

  return (
    <div className="main-menu">
      <div className="main-menu__inner">
        {/* ---------- Título ---------- */}
        <header className="main-menu__header">
          <div className="main-menu__berry" aria-hidden="true">
            🫐
          </div>
          <h1 className="main-menu__title">
            COSECHA DE
            <br />
            ARÁNDANOS
          </h1>
          <p className="main-menu__subtitle">Fundo San Jorge · Ica — Perú</p>
        </header>

        {/* ---------- Botones principales ---------- */}
        <nav className="main-menu__actions">
          <button
            type="button"
            className="menu-btn menu-btn--primary"
            onClick={() => onPlay(maxLevel)}
          >
            JUGAR
          </button>

          <button
            type="button"
            className="menu-btn"
            onClick={onTutorial}
          >
            CÓMO JUGAR
          </button>

          <button
            type="button"
            className="menu-btn menu-btn--ghost"
            onClick={() => setShowLevels((value) => !value)}
            aria-expanded={showLevels}
          >
            NIVELES {maxLevel}/{TOTAL_LEVELS}
          </button>
        </nav>

        {/* ---------- Selector de nivel ---------- */}
        {showLevels && (
          <div className="main-menu__levels">
            {Array.from({ length: TOTAL_LEVELS }, (_, index) => {
              const levelNumber = index + 1;
              const unlocked = levelNumber <= maxLevel;

              return (
                <button
                  key={levelNumber}
                  type="button"
                  className={`level-chip ${unlocked ? 'is-unlocked' : 'is-locked'}`}
                  disabled={!unlocked}
                  onClick={() => onSelectLevel?.(levelNumber)}
                  aria-label={
                    unlocked ? `Jugar nivel ${levelNumber}` : `Nivel ${levelNumber} bloqueado`
                  }
                >
                  {unlocked ? levelNumber : '🔒'}
                </button>
              );
            })}
          </div>
        )}

        {/* ---------- Récord ---------- */}
        <footer className="main-menu__footer">
          <div className="main-menu__version">
            v{GAME_VERSION}
            <br />
            build:6f32dad
          </div>
          <div className="main-menu__record">
            <span className="main-menu__record-label">RÉCORD</span>
            <span className="main-menu__record-value">{bestScore}</span>
          </div>
          <p className="main-menu__hint">W A S D / Flechas · E / Clic Cosechar · ESPACIO Entregar · Táctil en Móvil</p>
        </footer>
      </div>
    </div>
  );
}
