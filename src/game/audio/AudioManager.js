/**
 * AudioManager.js
 * ---------------------------------------------------------------
 * Sonido (§40).
 *
 * Los sonidos son OPCIONALES en el MVP: si los archivos no existen,
 * el manager queda en silencio sin lanzar errores. La arquitectura
 * ya está lista para cuando se añadan los .wav definitivos.
 *
 * Incluye un sintetizador mínimo con WebAudio para que el juego tenga
 * feedback sonoro desde el primer día sin necesitar ningún archivo.
 */

export class AudioManager {
  /**
   * @param {object} options
   * @param {import('../rendering/AssetLoader.js').AssetLoader} [options.assetLoader]
   */
  constructor({ assetLoader = null } = {}) {
    this.assetLoader = assetLoader;
    this.enabled = true;
    this.musicEnabled = false;

    this.masterVolume = 0.5;
    this.sfxVolume = 0.6;

    /** @type {Map<string, HTMLAudioElement>} */
    this.buffers = new Map();

    /* WebAudio para el sintetizador de respaldo */
    this.audioContext = null;
    this.synthEnabled = true;
    this.unlocked = false;
  }

  /**
   * Prepara el contexto de audio. Debe llamarse tras un gesto del
   * usuario (política de autoplay de los navegadores).
   */
  unlock() {
    if (this.unlocked) return;

    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) this.audioContext = new Ctx();
      this.unlocked = true;
    } catch {
      // Sin WebAudio: el juego funciona igual, en silencio.
      this.synthEnabled = false;
      this.unlocked = true;
    }
  }

  /**
   * Reproduce un sonido por clave lógica ('sfx.harvest').
   * Si no hay archivo, usa un tono sintetizado de respaldo.
   * @param {string} key
   * @param {object} [options] { volume, fallbackTone }
   */
  play(key, { volume = 1, fallbackTone = null } = {}) {
    if (!this.enabled || !this.unlocked) return;

    // 1) Intenta el archivo real (si el usuario añadió .wav)
    const audio = this.#getAudio(key);
    if (audio) {
      try {
        audio.currentTime = 0;
        audio.volume = Math.min(1, this.masterVolume * this.sfxVolume * volume);
        const promise = audio.play();
        if (promise && typeof promise.catch === 'function') promise.catch(() => {});
        return;
      } catch {
        // Continúa al sintetizador.
      }
    }

    // 2) Respaldo sintetizado
    if (fallbackTone) this.playTone(fallbackTone);
  }

  #getAudio(key) {
    if (!this.assetLoader) return null;
    if (this.buffers.has(key)) return this.buffers.get(key);
    const audio = this.assetLoader.loadSound(key);
    if (audio) this.buffers.set(key, audio);
    return audio;
  }

  /**
   * Genera un tono simple. Permite tener feedback sonoro sin assets.
   * @param {object} spec { frequency, duration, type, volume, sweepTo }
   */
  playTone({
    frequency = 440,
    duration = 0.1,
    type = 'square',
    volume = 0.12,
    sweepTo = null,
  } = {}) {
    if (!this.enabled || !this.synthEnabled || !this.audioContext) return;

    const ctx = this.audioContext;
    if (ctx.state === 'suspended') ctx.resume();

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    if (sweepTo) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(1, sweepTo),
        ctx.currentTime + duration
      );
    }

    const peak = Math.min(1, this.masterVolume * this.sfxVolume * volume * 2);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration + 0.02);
  }

  /* ============================================================
     Efectos concretos del juego (§40)
     ============================================================ */

  /** Recoger arándano maduro: pop agudo y corto. */
  harvest() {
    this.play('sfx.harvest', {
      fallbackTone: { frequency: 880, duration: 0.07, type: 'square', sweepTo: 1320 },
    });
  }

  /** Pintón / error: zumbido descendente. */
  error() {
    this.play('sfx.error', {
      fallbackTone: { frequency: 220, duration: 0.22, type: 'sawtooth', sweepTo: 90 },
    });
  }

  /** Entrega: arpegio ascendente. */
  delivery() {
    this.play('sfx.deliver', {
      fallbackTone: { frequency: 520, duration: 0.18, type: 'triangle', sweepTo: 1040 },
    });
  }

  /** Aviso de supervisor. */
  supervisorAlert() {
    this.play('sfx.supervisorAlert', {
      fallbackTone: { frequency: 660, duration: 0.3, type: 'square', sweepTo: 440 },
    });
  }

  victory() {
    this.play('sfx.victory', {
      fallbackTone: { frequency: 660, duration: 0.4, type: 'triangle', sweepTo: 1320 },
    });
  }

  defeat() {
    this.play('sfx.defeat', {
      fallbackTone: { frequency: 300, duration: 0.5, type: 'sawtooth', sweepTo: 80 },
    });
  }

  button() {
    this.play('sfx.button', {
      fallbackTone: { frequency: 1200, duration: 0.04, type: 'square' },
    });
  }

  truck() {
    this.play('sfx.truck', {
      fallbackTone: { frequency: 140, duration: 0.35, type: 'sawtooth' },
    });
  }

  /* ============================================================
     Control
     ============================================================ */

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    return this;
  }

  setVolume(value) {
    this.masterVolume = Math.max(0, Math.min(1, value));
    return this;
  }

  setAudioContextFromTest(ctx) {
    this.audioContext = ctx;
    this.unlocked = true;
    return this;
  }

  /** Limpieza al desmontar el juego. */
  dispose() {
    this.buffers.clear();
    if (this.audioContext && typeof this.audioContext.close === 'function') {
      try {
        this.audioContext.close();
      } catch {
        // Ignorado: el contexto ya estaba cerrado.
      }
    }
    this.audioContext = null;
    this.unlocked = false;
  }
}

export default AudioManager;
