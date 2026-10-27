export class ChessAudio {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.context = null;
    this.master = null;
  }

  ensure() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = this.enabled ? 0.7 : 0;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === "suspended") this.context.resume().catch(() => {});
    return this.context;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (this.master && this.context) {
      this.master.gain.setTargetAtTime(enabled ? 0.7 : 0, this.context.currentTime, 0.02);
    }
  }

  tone(frequency, duration = 0.16, type = "sine", delay = 0, gain = 0.07) {
    if (!this.enabled) return;
    const context = this.ensure();
    if (!context || !this.master) return;
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const envelope = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(envelope);
    envelope.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.03);
  }

  noise(duration = 0.12, gain = 0.035) {
    if (!this.enabled) return;
    const context = this.ensure();
    if (!context || !this.master) return;
    const length = Math.floor(context.sampleRate * duration);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    filter.type = "bandpass";
    filter.frequency.value = 900;
    filter.Q.value = 0.7;
    envelope.gain.value = gain;
    source.buffer = buffer;
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(this.master);
    source.start();
  }

  click() {
    this.tone(620, 0.055, "triangle", 0, 0.035);
  }

  move() {
    this.noise(0.07, 0.017);
    this.tone(240, 0.055, "triangle", 0, 0.045);
    this.tone(360, 0.07, "sine", 0.025, 0.03);
  }

  capture() {
    this.noise(0.16, 0.055);
    this.tone(150, 0.1, "triangle", 0, 0.07);
    this.tone(230, 0.12, "sawtooth", 0.02, 0.025);
  }

  castle() {
    this.noise(0.12, 0.03);
    this.tone(260, 0.09, "triangle", 0, 0.04);
    this.tone(390, 0.12, "sine", 0.06, 0.035);
  }

  check() {
    this.tone(720, 0.1, "sine", 0, 0.07);
    this.tone(960, 0.14, "triangle", 0.09, 0.055);
  }

  win() {
    [392, 523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, 0.3, "triangle", i * 0.1, 0.07));
  }

  lose() {
    [392, 329.63, 261.63].forEach((f, i) => this.tone(f, 0.36, "sine", i * 0.14, 0.06));
  }

  draw() {
    [392, 392, 329.63].forEach((f, i) => this.tone(f, 0.2, "sine", i * 0.16, 0.045));
  }

  dispose() {
    if (this.context && this.context.state !== "closed") this.context.close().catch(() => {});
  }
}
