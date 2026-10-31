// Synthesizes the reel's audio from code (no downloads, no licenses to track):
//  - public/reel/sfx/*.wav: click (a part seating), drip, tick, chime
//  - public/reel/bgm-<variant>.wav: a quiet product-film cue at 78 BPM,
//    pads, a piano motif and a bell with a long tail, no drums, growing
//    slowly toward the closing chord. It is arranged to the reel's beats.
// Usage: node scripts/build-reel-audio.mjs
import { buildSync } from "esbuild";
import { mkdirSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SR = 44100;

// ---------- helpers ----------
let seed = 3;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const noise = () => rnd() * 2 - 1;
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);
const buf = (sec) => new Float32Array(Math.ceil(sec * SR));
const mix = (dst, src, atSec, gain = 1) => {
  const off = Math.round(atSec * SR);
  for (let i = 0; i < src.length && off + i < dst.length; i++) if (off + i >= 0) dst[off + i] += src[i] * gain;
};
const lowpass = (b, cutoff) => {
  const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
  let y = 0;
  for (let i = 0; i < b.length; i++) b[i] = y += a * (b[i] - y);
  return b;
};
const normalize = (b, peak = 0.9) => {
  let m = 0;
  for (const v of b) m = Math.max(m, Math.abs(v));
  for (let i = 0; i < b.length; i++) b[i] *= peak / (m || 1);
  return b;
};
const wav = (samples) => {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), i * 2);
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVE", 8); h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(SR, 24);
  h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
};
// A small hall: four feedback delays and a soft low-pass in the loop.
const reverb = (dry, amount = 0.35, decay = 0.72) => {
  const delays = [0.0297, 0.0371, 0.0411, 0.0437, 0.0533, 0.0617].map((d) => Math.round(d * SR * 1.7));
  const out = new Float32Array(dry.length);
  for (const d of delays) {
    const line = new Float32Array(d);
    let y = 0;
    for (let i = 0; i < dry.length; i++) {
      const read = line[i % d];
      y += 0.35 * (read - y);
      const v = dry[i] + y * decay;
      line[i % d] = v;
      out[i] += read / delays.length;
    }
  }
  for (let i = 0; i < dry.length; i++) out[i] = dry[i] + out[i] * amount;
  return out;
};

// ---------- instruments ----------
const pad = (midis, dur) => {
  const out = buf(dur);
  for (const m of midis) {
    const f = mtof(m);
    const det = 1 + (rnd() - 0.5) * 0.004;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const env = Math.min(1, t / 0.9) * Math.min(1, (dur - t) / 1.4);
      out[i] += (Math.sin(2 * Math.PI * f * det * t) + 0.5 * Math.sin(2 * Math.PI * f * 2.001 * t) + 0.25 * Math.sin(2 * Math.PI * f * 0.5 * t)) * env;
    }
  }
  return lowpass(lowpass(out, 900), 1800);
};
const piano = (midi, dur = 1.8) => {
  // Karplus-Strong string, darkened, with a soft hammer transient.
  const f = mtof(midi);
  const out = buf(dur);
  const period = Math.round(SR / f);
  const ring = Float32Array.from({ length: period }, noise);
  lowpass(ring, 3000);
  for (let i = 0; i < out.length; i++) {
    const j = i % period;
    const next = ring[(j + 1) % period];
    ring[j] = 0.5 * (ring[j] + next) * 0.9975;
    const t = i / SR;
    out[i] = ring[j] * Math.min(1, (out.length - i) / (SR * 0.1)) + 0.35 * Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 5);
  }
  return lowpass(out, 2600);
};
const bell = (midi, dur = 3.2) => {
  const f = mtof(midi);
  const out = buf(dur);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    out[i] = (Math.sin(2 * Math.PI * f * t) + 0.45 * Math.sin(2 * Math.PI * f * 2.76 * t) * Math.exp(-t * 2.2) + 0.2 * Math.sin(2 * Math.PI * f * 5.4 * t) * Math.exp(-t * 4)) * Math.exp(-t * 1.4) * Math.min(1, t * 400);
  }
  return out;
};
const pulse = () => {
  const out = buf(0.4);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (42 + 40 * Math.exp(-t * 25))) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 7) * Math.min(1, t * 300);
  }
  return lowpass(out, 120);
};

// ---------- sound effects ----------
const SFX = {
  click() {
    // A small part seating: a damped tap with a little body.
    const out = buf(0.12);
    let prev = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const n = noise();
      out[i] = (n - prev) * Math.exp(-t * 180) * 0.6 + Math.sin(2 * Math.PI * 1500 * t) * Math.exp(-t * 90) * 0.5;
      prev = n;
    }
    return lowpass(out, 5000);
  },
  tick() {
    const out = buf(0.06);
    let prev = 0;
    for (let i = 0; i < out.length; i++) {
      const n = noise();
      out[i] = (n - prev) * Math.exp((-i / SR) * 260);
      prev = n;
    }
    return lowpass(out, 3500);
  },
  drip() {
    // A drop into water: a rising short chirp with a soft tail.
    const out = buf(0.3);
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (700 + 1400 * Math.min(1, t / 0.05))) / SR;
      out[i] = Math.sin(ph) * Math.exp(-t * 28) * Math.min(1, t * 600);
    }
    return out;
  },
  chime() {
    return reverb(bell(88, 2.6), 0.4, 0.7);
  },
};

const sfxDir = path.join(root, "public/reel/sfx");
mkdirSync(sfxDir, { recursive: true });
for (const [name, make] of Object.entries(SFX)) writeFileSync(path.join(sfxDir, `${name}.wav`), wav(normalize(make(), 0.8)));
console.log(`sfx: ${Object.keys(SFX).join(", ")}`);

// ---------- music arranged to the reel ----------
const tmp = path.join(os.tmpdir(), `reel-script-${process.pid}.mjs`);
buildSync({ entryPoints: [path.join(root, "src/reel/script.ts")], bundle: true, format: "esm", platform: "node", outfile: tmp, logLevel: "error" });
const reel = await import(pathToFileURL(tmp).href);

const BPM = 78;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
// Cmaj9 · Am9 · Fmaj7 · G6, voiced low for pads; the motif walks their tones.
const CHORDS = [
  [48, 55, 59, 62],
  [45, 52, 55, 59],
  [41, 48, 52, 57],
  [43, 50, 55, 59],
];
const MOTIF = [
  [76, 74, 71],
  [72, 71, 69],
  [69, 72, 76],
  [74, 71, 67],
];

const renderBgm = (variant) => {
  const fps = reel.REEL_FPS;
  const starts = reel.getBeatStarts(variant);
  const total = reel.getVariantDuration(variant) / fps;
  const keys = reel.VARIANTS[variant];
  const darkStart = starts.realidad / fps;
  const darkEnd = darkStart + reel.getBeatDuration("realidad") / fps;
  const ctaStart = starts[keys[keys.length - 1]] / fps;
  const out = buf(total + 3);
  const P = pulse();
  for (let bar = 0; bar * BAR < total; bar++) {
    const t0 = bar * BAR;
    const chord = CHORDS[bar % 4];
    const grow = 0.55 + 0.45 * Math.min(1, t0 / Math.max(1, ctaStart));
    const inDark = t0 >= darkStart - 0.2 && t0 < darkEnd;
    if (t0 >= ctaStart) {
      // Closing: one long chord, a bell and a last low note.
      mix(out, pad(chord.map((m) => m + 12), total - t0 + 1), t0, 0.5);
      mix(out, bell(chord[0] + 36, 4), t0 + 0.4, 0.35);
      mix(out, piano(chord[0] + 24, 3), t0, 0.3);
      mix(out, piano(chord[2] + 24, 3), t0 + BEAT, 0.25);
      mix(out, P, t0, 0.35);
      break;
    }
    mix(out, pad(chord, BAR + 0.8), t0, 0.28 * grow);
    if (!inDark) {
      // Piano motif on beats 2, 3 and the "and" of 4; sparser early on.
      const notes = MOTIF[bar % 4];
      const times = [BEAT, BEAT * 2, BEAT * 3.5];
      notes.forEach((m, k) => {
        if (bar < 2 && k === 2) return;
        mix(out, piano(m, 1.6), t0 + times[k], 0.16 * grow);
      });
      if (bar % 2 === 1) mix(out, bell(chord[1] + 24, 3), t0 + BEAT * 3, 0.12 * grow);
    } else {
      mix(out, bell(chord[0] + 24, 3.5), t0 + BEAT, 0.14);
    }
    mix(out, P, t0, 0.22 * grow);
  }
  const wet = reverb(out, 0.3, 0.68);
  for (let i = 0; i < wet.length; i++) {
    const t = i / SR;
    if (t > total - 1.2) wet[i] *= Math.max(0, (total - t) / 1.2);
  }
  return normalize(wet, 0.8);
};

for (const variant of Object.keys(reel.VARIANTS)) {
  const file = path.join(root, `public/reel/bgm-${variant}.wav`);
  writeFileSync(file, wav(renderBgm(variant)));
  console.log(`bgm: ${path.relative(root, file)} (${(reel.getVariantDuration(variant) / reel.REEL_FPS).toFixed(1)} s)`);
}
