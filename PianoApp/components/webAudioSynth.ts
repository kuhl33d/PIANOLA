// Simple polyphonic synth for web using Web Audio API
// Usage: synth.play(keyId, frequency), synth.stop(keyId)


class WebAudioSynth {
  private ctx: AudioContext | null = null;
  private oscillators: { [key: string]: OscillatorNode } = {};
  private gains: { [key: string]: GainNode } = {};
  private masterGain: GainNode | null = null;
  private _volume: number = 0.15;

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
  }

  setVolume(vol: number) {
    this._volume = vol;
    if (this.masterGain) {
      this.masterGain.gain.value = vol;
    }
  }

  getVolume() {
    return this._volume;
  }

  play(keyId: string, frequency: number) {
    if (typeof window === 'undefined') return;
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    if (this.oscillators[keyId]) return; // already playing

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    const gain = this.ctx.createGain();
    gain.gain.value = 1.0;
    osc.connect(gain).connect(this.masterGain);
    osc.start();
    this.oscillators[keyId] = osc;
    this.gains[keyId] = gain;
  }

  stop(keyId: string) {
    if (typeof window === 'undefined') return;
    if (this.oscillators[keyId]) {
      this.gains[keyId].gain.setTargetAtTime(0, this.ctx!.currentTime, 0.03);
      this.oscillators[keyId].stop(this.ctx!.currentTime + 0.05);
      delete this.oscillators[keyId];
      delete this.gains[keyId];
    }
  }

  stopAll() {
    Object.keys(this.oscillators).forEach(keyId => this.stop(keyId));
  }
}

const synth = new WebAudioSynth();
export default synth;
