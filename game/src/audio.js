// Tiny procedural sound: every effect is a WebAudio oscillator, no audio
// files, no network. Sound starts on the first key or click (browsers
// require a user gesture before audio).

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type = 'sine', gain = 0.08, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  pickup() {
    this.tone(660, 0.09, 'sine', 0.07);
    setTimeout(() => this.tone(990, 0.12, 'sine', 0.07), 70);
  }

  coin() {
    this.tone(1180, 0.07, 'triangle', 0.06);
    setTimeout(() => this.tone(1560, 0.1, 'triangle', 0.05), 60);
  }

  alarmTick() {
    this.tone(220, 0.16, 'square', 0.035, 180);
  }

  spotted() {
    this.tone(180, 0.35, 'sawtooth', 0.07, 420);
  }

  noiseMaker() {
    this.tone(1400, 0.06, 'square', 0.05);
    setTimeout(() => this.tone(1400, 0.06, 'square', 0.05), 120);
    setTimeout(() => this.tone(1400, 0.06, 'square', 0.05), 240);
  }

  lockpick() {
    this.tone(520, 0.05, 'triangle', 0.05);
  }

  vaultOpen() {
    this.tone(320, 0.25, 'sine', 0.08, 640);
    setTimeout(() => this.tone(640, 0.3, 'sine', 0.06, 960), 180);
  }

  caught() {
    this.tone(300, 0.5, 'sawtooth', 0.09, 90);
    setTimeout(() => this.tone(150, 0.7, 'sawtooth', 0.08, 60), 200);
  }

  win() {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => this.tone(f, 0.22, 'triangle', 0.07), i * 130),
    );
  }
}
