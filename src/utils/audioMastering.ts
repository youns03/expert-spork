/**
 * Studio-Grade Audio Mastering & Acoustic Polish Engine
 * Transforms raw 24kHz TTS speech into broadcast-quality, natural, click-free audio:
 * - Anti-click & anti-pop micro-fading (Hann window at sentence boundaries)
 * - Vocal presence & warmth equalization (biquad DSP filter)
 * - Subsonic rumble & DC-offset removal
 * - True-peak loudness normalization to -1.0 dBFS with soft-knee limiting
 * - High-quality cubic resampling to 44.1 kHz studio standard
 * - Natural acoustic room tone during pauses (no abrupt digital silence)
 */

export interface MasteringOptions {
  enableStudioEQ?: boolean;
  enableDeClicking?: boolean;
  enableNormalization?: boolean;
  vocalWarmth?: boolean;
  vocalClarity?: boolean;
  targetPeakDb?: number;
  targetSampleRate?: number;
  interSentenceComfortTone?: boolean;
}

export function applyDeClickMicroFade(samples: Float32Array, sampleRate: number, fadeDurationMs: number = 4): void {
  const fadeLength = Math.min(Math.floor((fadeDurationMs / 1000) * sampleRate), Math.floor(samples.length / 2));
  if (fadeLength <= 1) return;
  for (let i = 0; i < fadeLength; i++) {
    const factor = 0.5 * (1 - Math.cos((Math.PI * i) / fadeLength));
    samples[i] *= factor;
  }
  const endIndex = samples.length - 1;
  for (let i = 0; i < fadeLength; i++) {
    const factor = 0.5 * (1 - Math.cos((Math.PI * i) / fadeLength));
    samples[endIndex - i] *= factor;
  }
}

class BiquadFilter {
  private b0 = 1; private b1 = 0; private b2 = 0; private a1 = 0; private a2 = 0;
  private x1 = 0; private x2 = 0; private y1 = 0; private y2 = 0;
  public configureHighPass(cutoffFreq: number, sampleRate: number, q: number = 0.707): void {
    const w0 = (2 * Math.PI * cutoffFreq) / sampleRate; const cosw0 = Math.cos(w0);
    const alpha = Math.sin(w0) / (2 * q); const a0 = 1 + alpha;
    this.b0 = ((1 + cosw0) / 2) / a0; this.b1 = (-(1 + cosw0)) / a0; this.b2 = ((1 + cosw0) / 2) / a0;
    this.a1 = (-2 * cosw0) / a0; this.a2 = (1 - alpha) / a0; this.reset();
  }
  public configurePeaking(centerFreq: number, gainDb: number, q: number, sampleRate: number): void {
    const A = Math.pow(10, gainDb / 40); const w0 = (2 * Math.PI * centerFreq) / sampleRate;
    const alpha = Math.sin(w0) / (2 * q); const cosw0 = Math.cos(w0); const a0 = 1 + alpha / A;
    this.b0 = (1 + alpha * A) / a0; this.b1 = (-2 * cosw0) / a0; this.b2 = (1 - alpha * A) / a0;
    this.a1 = (-2 * cosw0) / a0; this.a2 = (1 - alpha / A) / a0; this.reset();
  }
  public configureHighShelf(cutoffFreq: number, gainDb: number, sampleRate: number): void {
    const A = Math.pow(10, gainDb / 40); const w0 = (2 * Math.PI * cutoffFreq) / sampleRate;
    const cosw0 = Math.cos(w0); const sinw0 = Math.sin(w0); const alpha = (sinw0 / 2) * Math.sqrt(2);
    const a0 = (A + 1) - (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha;
    this.b0 = (A * ((A + 1) + (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha)) / a0;
    this.b1 = (-2 * A * ((A - 1) + (A + 1) * cosw0)) / a0;
    this.b2 = (A * ((A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha)) / a0;
    this.a1 = (2 * ((A - 1) - (A + 1) * cosw0)) / a0;
    this.a2 = ((A + 1) - (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha) / a0; this.reset();
  }
  public reset(): void { this.x1 = 0; this.x2 = 0; this.y1 = 0; this.y2 = 0; }
  public process(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y;
  }
}

export function applyStudioVocalMastering(samples: Float32Array, sampleRate: number, options: MasteringOptions = {}): void {
  const hpFilter = new BiquadFilter(); hpFilter.configureHighPass(75, sampleRate, 0.707);
  const warmthFilter = new BiquadFilter(); const warmthGain = options.vocalWarmth !== false ? 1.8 : 0; warmthFilter.configurePeaking(220, warmthGain, 0.9, sampleRate);
  const clarityFilter = new BiquadFilter(); const clarityGain = options.vocalClarity !== false ? 2.4 : 0; clarityFilter.configurePeaking(3200, clarityGain, 1.1, sampleRate);
  const airFilter = new BiquadFilter(); airFilter.configureHighShelf(10500, -0.8, sampleRate);
  for (let i = 0; i < samples.length; i++) {
    let s = samples[i]; s = hpFilter.process(s); if (warmthGain !== 0) s = warmthFilter.process(s);
    if (clarityGain !== 0) s = clarityFilter.process(s); s = airFilter.process(s); samples[i] = s;
  }
}

export function normalizeAndSoftLimitAudio(samples: Float32Array, targetPeakDb: number = -1.0): void {
  let maxAbs = 0; for (let i = 0; i < samples.length; i++) { const val = Math.abs(samples[i]); if (val > maxAbs) maxAbs = val; }
  if (maxAbs < 0.0001) return;
  const targetLinear = Math.pow(10, targetPeakDb / 20); const gain = targetLinear / maxAbs;
  for (let i = 0; i < samples.length; i++) {
    let s = samples[i] * gain;
    if (s > 0.96) s = 0.96 + (1 - 0.96) * Math.tanh((s - 0.96) / (1 - 0.96));
    else if (s < -0.96) s = -0.96 + (-1 + 0.96) * Math.tanh((s + 0.96) / (1 - 0.96));
    samples[i] = Math.max(-0.999, Math.min(0.999, s));
  }
}

export function resampleCubic(input: Float32Array, sourceRate: number, targetRate: number): Float32Array {
  if (sourceRate === targetRate) return new Float32Array(input);
  const ratio = sourceRate / targetRate; const outputLength = Math.round(input.length / ratio); const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio; const i0 = Math.floor(srcIndex); const t = srcIndex - i0;
    const y0 = i0 > 0 ? input[i0 - 1] : input[0]; const y1 = input[i0] || 0;
    const y2 = i0 + 1 < input.length ? input[i0 + 1] : y1; const y3 = i0 + 2 < input.length ? input[i0 + 2] : y2;
    const a = -0.5 * y0 + 1.5 * y1 - 1.5 * y2 + 0.5 * y3; const b = y0 - 2.5 * y1 + 2 * y2 - 0.5 * y3;
    const c = -0.5 * y0 + 0.5 * y2; const d = y1; output[i] = a * t * t * t + b * t * t + c * t + d;
  }
  return output;
}

export function fillComfortSilence(samples: Float32Array, sampleRate: number): void {
  const amplitude = 0.00025; let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < samples.length; i++) {
    const white = (Math.random() * 2 - 1) * amplitude;
    b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759; b2 = 0.96900 * b2 + white * 0.1538520;
    samples[i] = b0 + b1 + b2 + white * 0.5362;
  }
  applyDeClickMicroFade(samples, sampleRate, 6);
}
