/**
 * storage.js — Persistencia local opcional (§46).
 * No hay base de datos ni backend: solo localStorage.
 */

const PREFIX = 'cosecha-arandanos:';

const KEYS = {
  BEST_SCORE: `${PREFIX}bestScore`,
  MAX_LEVEL: `${PREFIX}maxLevel`,
  LEVEL_SCORES: `${PREFIX}levelScores`,
  STATS: `${PREFIX}stats`,
  SETTINGS: `${PREFIX}settings`,
  PLAYER_NAME: `${PREFIX}playerName`,
};

/** localStorage puede no existir (SSR, modo privado). Nunca debe romper. */
function safeGet(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const storage = {
  KEYS,

  getBestScore() {
    return safeGet(KEYS.BEST_SCORE, 0);
  },

  /** Guarda el récord solo si mejora. Devuelve true si hubo nuevo récord. */
  setBestScore(score) {
    const current = this.getBestScore();
    if (score > current) {
      safeSet(KEYS.BEST_SCORE, score);
      return true;
    }
    return false;
  },

  getMaxLevel() {
    return safeGet(KEYS.MAX_LEVEL, 1);
  },

  /** Desbloquea un nivel si es superior al máximo guardado. */
  unlockLevel(levelId) {
    const current = this.getMaxLevel();
    if (levelId > current) {
      safeSet(KEYS.MAX_LEVEL, levelId);
      return true;
    }
    return false;
  },

  getLevelScores() {
    return safeGet(KEYS.LEVEL_SCORES, {});
  },

  setLevelScore(levelId, score) {
    const all = this.getLevelScores();
    const key = String(levelId);
    if (!all[key] || score > all[key]) {
      all[key] = score;
      safeSet(KEYS.LEVEL_SCORES, all);
    }
  },

  getStats() {
    return safeGet(KEYS.STATS, {
      totalHarvested: 0,
      totalDeliveries: 0,
      totalErrors: 0,
      gamesPlayed: 0,
    });
  },

  addStats(delta) {
    const stats = this.getStats();
    const merged = {
      totalHarvested: stats.totalHarvested + (delta.totalHarvested ?? 0),
      totalDeliveries: stats.totalDeliveries + (delta.totalDeliveries ?? 0),
      totalErrors: stats.totalErrors + (delta.totalErrors ?? 0),
      gamesPlayed: stats.gamesPlayed + (delta.gamesPlayed ?? 0),
    };
    safeSet(KEYS.STATS, merged);
    return merged;
  },

  getSettings() {
    return safeGet(KEYS.SETTINGS, {
      soundEnabled: true,
      musicEnabled: false,
      vibrationEnabled: true,
      showTouchControls: 'auto', // 'auto' | 'always' | 'never'
    });
  },

  setSettings(partial) {
    const merged = { ...this.getSettings(), ...partial };
    safeSet(KEYS.SETTINGS, merged);
    return merged;
  },

  getPlayerName() {
    return safeGet(KEYS.PLAYER_NAME, 'Cosechador');
  },

  setPlayerName(name) {
    safeSet(KEYS.PLAYER_NAME, String(name).slice(0, 24));
  },

  /** Borra todo lo guardado por el juego. */
  clearAll() {
    Object.values(KEYS).forEach(safeRemove);
  },

  isAvailable() {
    return safeSet(`${PREFIX}__probe`, 1) && safeRemove(`${PREFIX}__probe`);
  },
};

export default storage;
