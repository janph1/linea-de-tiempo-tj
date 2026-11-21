class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensureContext() {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  tone(freq, duration, type = 'sine', volume = 0.12, delay = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playSelect() {
    this.tone(520, 0.08, 'triangle', 0.08);
  }

  playFlip() {
    this.tone(330, 0.12, 'triangle', 0.09, 0);
    this.tone(440, 0.14, 'triangle', 0.09, 0.08);
  }

  playSuccess() {
    this.tone(523.25, 0.18, 'sine', 0.13, 0); // C5
    this.tone(659.25, 0.18, 'sine', 0.13, 0.1); // E5
    this.tone(783.99, 0.32, 'sine', 0.15, 0.2); // G5
    this.tone(1046.5, 0.4, 'triangle', 0.12, 0.3); // C6
  }

  playError() {
    this.tone(260, 0.2, 'sawtooth', 0.08, 0);
    this.tone(195, 0.32, 'sawtooth', 0.09, 0.16);
  }

  playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 987.77, 1046.5];
    const times = [0, 0.11, 0.22, 0.35, 0.52, 0.66];
    notes.forEach((n, idx) => {
      this.tone(n, 0.35, 'triangle', 0.14, times[idx]);
    });
  }

  playTick() {
    this.tone(880, 0.05, 'sine', 0.04);
  }
}

export const soundFX = new SoundFX();
