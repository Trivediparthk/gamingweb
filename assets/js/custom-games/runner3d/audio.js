/**
 * Original procedural audio for Ruin Runner 3D.
 * Every sound is synthesised at runtime with the Web Audio API.
 * No third-party samples, music or sound files are used.
 */
export class RunnerAudio {
  constructor({ enabled = true } = {}) {
    this.enabled = enabled;
    this.ctx = null;
    this.master = null;
    this.noiseBuffer = null;
    this.ambient = null;
    this.ambientTimer = 0;
    this.stepTimer = 0;
    this.disposed = false;
  }

  ensure() {
    if (this.disposed) return null;
    if (this.ctx) {
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      return this.ctx;
    }
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 0.55 : 0;
    this.master.connect(this.ctx.destination);
    this.noiseBuffer = this.makeNoiseBuffer();
    if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  makeNoiseBuffer() {
    const length = Math.floor(this.ctx.sampleRate * 1.2);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = last * 0.72 + white * 0.28;
      data[i] = last;
    }
    return buffer;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(enabled ? 0.55 : 0, now, 0.05);
  }

  duck(on) {
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(on ? 0.1 : this.enabled ? 0.55 : 0, now, 0.08);
  }

  tone({ freq = 440, endFreq = freq, duration = 0.18, type = "sine", gain = 0.12, attack = 0.01, delay = 0 }) {
    if (!this.ensure() || !this.enabled) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(amp);
    amp.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  noise({ duration = 0.15, gain = 0.08, type = "bandpass", freq = 800, q = 0.8, delay = 0 }) {
    if (!this.ensure() || !this.enabled) return;
    const ctx = this.ctx;
    const start = ctx.currentTime + delay;
    const source = ctx.createBufferSource();
    source.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain), start + 0.012);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(amp);
    amp.connect(this.master);
    source.start(start);
    source.stop(start + duration + 0.03);
  }

  startAmbient() {
    if (!this.ensure() || this.ambient || !this.enabled) return;
    const ctx = this.ctx;
    const group = ctx.createGain();
    group.gain.value = 0.0001;
    group.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 2.4);
    group.connect(this.master);

    const drone = ctx.createOscillator();
    const droneGain = ctx.createGain();
    drone.type = "sine";
    drone.frequency.value = 55;
    droneGain.gain.value = 0.06;
    drone.connect(droneGain);
    droneGain.connect(group);
    drone.start();

    const drone2 = ctx.createOscillator();
    const drone2Gain = ctx.createGain();
    drone2.type = "triangle";
    drone2.frequency.value = 82.4;
    drone2Gain.gain.value = 0.025;
    drone2.connect(drone2Gain);
    drone2Gain.connect(group);
    drone2.start();

    const wind = ctx.createBufferSource();
    wind.buffer = this.noiseBuffer;
    wind.loop = true;
    const windFilter = ctx.createBiquadFilter();
    windFilter.type = "bandpass";
    windFilter.frequency.value = 420;
    windFilter.Q.value = 0.55;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.05;
    wind.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(group);
    wind.start();

    this.ambient = { group, drone, drone2, wind, windFilter };
    this.ambientTimer = 2.5;
  }

  stopAmbient() {
    if (!this.ambient || !this.ctx) return;
    const now = this.ctx.currentTime;
    const { group, drone, drone2, wind } = this.ambient;
    group.gain.cancelScheduledValues(now);
    group.gain.setTargetAtTime(0.0001, now, 0.15);
    try {
      drone.stop(now + 0.4);
      drone2.stop(now + 0.4);
      wind.stop(now + 0.4);
    } catch {
      /* already stopped */
    }
    this.ambient = null;
  }

  update(dt) {
    if (!this.ctx || !this.ambient) return;
    this.ambientTimer -= dt;
    if (this.ambientTimer <= 0) {
      this.ambientTimer = 3.5 + Math.random() * 5;
      const base = 1100 + Math.random() * 700;
      this.tone({ freq: base, endFreq: base * 1.35, duration: 0.12, type: "sine", gain: 0.018 });
      this.tone({ freq: base * 1.35, endFreq: base * 1.7, duration: 0.1, type: "sine", gain: 0.012, delay: 0.11 });
    }
  }

  step() {
    if (this.stepTimer > 0) return;
    this.stepTimer = 0.11;
    this.noise({ duration: 0.07, gain: 0.035, type: "lowpass", freq: 420, q: 0.6 });
  }

  jump() {
    this.tone({ freq: 240, endFreq: 560, duration: 0.18, type: "triangle", gain: 0.09 });
    this.noise({ duration: 0.12, gain: 0.03, type: "highpass", freq: 900 });
  }

  land() {
    this.tone({ freq: 110, endFreq: 55, duration: 0.16, type: "sine", gain: 0.12 });
    this.noise({ duration: 0.14, gain: 0.06, type: "lowpass", freq: 500 });
  }

  slide() {
    this.noise({ duration: 0.32, gain: 0.06, type: "bandpass", freq: 700, q: 0.7 });
    this.tone({ freq: 320, endFreq: 140, duration: 0.25, type: "sawtooth", gain: 0.025 });
  }

  coin() {
    this.tone({ freq: 988, endFreq: 988, duration: 0.1, type: "sine", gain: 0.075 });
    this.tone({ freq: 1480, endFreq: 1480, duration: 0.11, type: "sine", gain: 0.06, delay: 0.055 });
  }

  powerup() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      this.tone({ freq, endFreq: freq, duration: 0.14, type: "triangle", gain: 0.07, delay: i * 0.07 });
    });
  }

  shieldBreak() {
    this.noise({ duration: 0.35, gain: 0.09, type: "highpass", freq: 1200 });
    this.tone({ freq: 600, endFreq: 120, duration: 0.4, type: "sawtooth", gain: 0.06 });
  }

  hit() {
    this.noise({ duration: 0.45, gain: 0.13, type: "lowpass", freq: 900 });
    this.tone({ freq: 180, endFreq: 45, duration: 0.55, type: "sawtooth", gain: 0.12 });
  }

  gameover() {
    [392, 311, 233].forEach((freq, i) => {
      this.tone({ freq, endFreq: freq * 0.95, duration: 0.35, type: "triangle", gain: 0.06, delay: 0.2 + i * 0.17 });
    });
  }

  countdown(final = false) {
    this.tone({ freq: final ? 880 : 440, endFreq: final ? 880 : 440, duration: final ? 0.28 : 0.12, type: "square", gain: 0.035 });
  }

  ui() {
    this.tone({ freq: 660, endFreq: 660, duration: 0.06, type: "sine", gain: 0.035 });
  }

  tick(dt) {
    this.stepTimer = Math.max(0, this.stepTimer - dt);
  }

  dispose() {
    this.disposed = true;
    this.stopAmbient();
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
