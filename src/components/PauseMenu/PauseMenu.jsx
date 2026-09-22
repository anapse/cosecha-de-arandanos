/**
 * PauseMenu.jsx — Menú de pausa (§38).
 *
 *   JUEGO PAUSADO
 *   [CONTINUAR] [REINICIAR] [SALIR]
 *
 * ESC también reanuda (lo gestiona el motor y avisa por callback).
 */

import './PauseMenu.css';

export default function PauseMenu({ levelId = 1, onResume, onRestart, onExit }) {
  return (
    <div className="pause-menu" role="dialog" aria-modal="true" aria-label="Juego pausado">
      <div className="pause-menu__panel">
        <h2 className="pause-menu__title">JUEGO PAUSADO</h2>
        <p className="pause-menu__level">Nivel {levelId}</p>

        <div className="pause-menu__actions">
          <button type="button" className="menu-btn menu-btn--primary" onClick={onResume}>
            CONTINUAR
          </button>

          <button type="button" className="menu-btn" onClick={onRestart}>
            REINICIAR
          </button>

          <button type="button" className="menu-btn menu-btn--ghost" onClick={onExit}>
            SALIR
          </button>
        </div>

        <p className="pause-menu__hint">Pulsa ESC para continuar</p>
      </div>
    </div>
  );
}
