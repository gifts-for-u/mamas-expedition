/**
 * ============================================================
 * SFX.JS — Procedural Web Audio API Sound Effects (Zero Assets)
 * ============================================================
 * Ringan, instan, tidak membutuhkan file MP3 eksternal.
 * Aman terhadap kebijakan autoplay mobile browser.
 */

class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  unlock() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      this.unlock();
      this.tap();
    }
    return this.enabled;
  }

  _ensureRunning(callback) {
    if (!this.enabled) return;
    this.unlock();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => callback(this.ctx)).catch(() => {});
    } else {
      callback(this.ctx);
    }
  }

  _playTone({ freq = 440, endFreq = null, type = 'sine', duration = 0.12, gain = 0.08, delay = 0 }) {
    this._ensureRunning((ctx) => {
      const now = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), now + duration);
      }

      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.linearRampToValueAtTime(gain, now + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(amp);
      amp.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.02);
    });
  }

  _playNoiseBurst({ duration = 0.28, startFreq = 700, endFreq = 2400, gain = 0.14, delay = 0 }) {
    this._ensureRunning((ctx) => {
      const now = ctx.currentTime + delay;
      const sampleCount = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const src = ctx.createBufferSource();
      src.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(1.4, now);
      filter.frequency.setValueAtTime(startFreq, now);
      filter.frequency.exponentialRampToValueAtTime(endFreq, now + duration);

      const amp = ctx.createGain();
      amp.gain.setValueAtTime(0.0001, now);
      amp.gain.linearRampToValueAtTime(gain, now + 0.04);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      src.connect(filter);
      filter.connect(amp);
      amp.connect(ctx.destination);

      src.start(now);
      src.stop(now + duration + 0.02);
    });
  }

  tap() {
    this._playTone({ freq: 520, endFreq: 380, type: 'triangle', duration: 0.065, gain: 0.09 });
  }

  bootTick() {
    this._playTone({ freq: 680, endFreq: 720, type: 'square', duration: 0.035, gain: 0.03 });
  }

  errorBeep() {
    this._playTone({ freq: 340, endFreq: 240, type: 'sawtooth', duration: 0.12, gain: 0.04 });
  }

  typeTick() {
    const jitter = (Math.random() - 0.5) * 70;
    this._playTone({ freq: 580 + jitter, type: 'triangle', duration: 0.026, gain: 0.026 });
  }

  boxOpen() {
    // 1. Ribbon untie & cardboard unseal rustle
    this._playNoiseBurst({ duration: 0.28, startFreq: 650, endFreq: 2600, gain: 0.15, delay: 0 });
    // 2. Soft lid pop thump as hinged lid swings open
    this._playTone({ freq: 210, endFreq: 78, type: 'triangle', duration: 0.16, gain: 0.18, delay: 0.22 });
    this._playNoiseBurst({ duration: 0.16, startFreq: 1200, endFreq: 450, gain: 0.09, delay: 0.24 });
    // 3. Warm magical reveal sparkle chord as items emerge
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66, 1567.98];
    notes.forEach((n, idx) => {
      this._playTone({
        freq: n,
        type: idx % 2 === 0 ? 'triangle' : 'sine',
        duration: 0.55,
        gain: 0.11,
        delay: 0.34 + idx * 0.075,
      });
    });
  }

  flowerChime() {
    this._playTone({ freq: 659.25, type: 'sine', duration: 0.28, gain: 0.06, delay: 0 });
    this._playTone({ freq: 987.77, type: 'sine', duration: 0.36, gain: 0.05, delay: 0.08 });
  }

  letterOpen() {
    this._playTone({ freq: 440, endFreq: 554.37, type: 'sine', duration: 0.18, gain: 0.055 });
  }

  voucherClaim() {
    // Cheerful 3-note stamp jingle
    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((n, i) => {
      this._playTone({
        freq: n,
        type: 'triangle',
        duration: 0.24,
        gain: 0.07,
        delay: i * 0.06,
      });
    });
  }
}

export const sfx = new SoundEffects();
