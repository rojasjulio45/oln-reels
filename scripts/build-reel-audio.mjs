// Synthesizes the reel's audio from code (no downloads, no licenses to track):
//  - public/reel/sfx/*.wav: whoosh, pop, ding, thud, alarm, click
//  - public/reel/bgm-<variant>.wav: 120 BPM track arranged to the reel's
//    beats (minor and tense during "grave", a final chord on the CTA).
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

// ---------- instruments ----------
const pluck = (freq, dur = 0.9) => {
  // Karplus-Strong string.
  const out = buf(dur);
  const period = Math.round(SR / freq);
  const ring = Float32Array.from({ length: period }, noise);
  for (let i = 0; i < out.length; i++) {
    const j = i % period;
    const next = ring[(j + 1) % period];
    ring[j] = 0.5 * (ring[j] + next) * 0.996;
    out[i] = ring[j] * Math.min(1, (out.length - i) / (SR * 0.05));
  }
  return out;
};
const kick = () => {
  const out = buf(0.35);
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (50 + 110 * Math.exp(-t * 30))) / SR;
    out[i] = Math.sin(ph) * Math.exp(-t * 9);
  }
  return out;
};
const hat = (len = 0.05) => {
  const out = buf(len);
  let prev = 0;
  for (let i = 0; i < out.length; i++) {
    const n = noise();
    out[i] = (n - prev) * Math.exp((-i / SR) * 70);
    prev = n;
  }
  return out;
};
const clap = () => {
  const out = buf(0.2);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const burst = [0, 0.01, 0.02].reduce((a, d) => a + (t >= d ? Math.exp(-(t - d) * 60) : 0), 0);
    out[i] = noise() * burst * 0.5;
  }
  return lowpass(out, 3000);
};
const bass = (freq, dur = 0.4) => {
  const out = buf(dur);
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    const saw = 2 * ((t * freq) % 1) - 1;
    out[i] = saw * Math.exp(-t * 4) * Math.min(1, t * 200);
  }
  return lowpass(out, 600);
};

// ---------- sound effects ----------
const SFX = {
  whoosh() {
    const out = buf(0.45);
    let y = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / out.length;
      const cutoff = 300 + 5000 * Math.sin(Math.PI * t);
      const a = 1 - Math.exp((-2 * Math.PI * cutoff) / SR);
      y += a * (noise() - y);
      out[i] = y * Math.sin(Math.PI * t) ** 1.5;
    }
    return out;
  },
  pop() {
    const out = buf(0.14);
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (1100 - 4000 * t)) / SR;
      out[i] = Math.sin(ph) * Math.exp(-t * 30);
    }
    return out;
  },
  ding() {
    const out = buf(1.1);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      out[i] = (Math.sin(2 * Math.PI * 1318.5 * t) + 0.5 * Math.sin(2 * Math.PI * 2637 * t) * Math.exp(-t * 3)) * Math.exp(-t * 4);
    }
    return out;
  },
  thud() {
    const out = kick();
    mix(out, lowpass(hat(0.12), 1800), 0, 0.6);
    return out;
  },
  alarm() {
    const out = buf(0.9);
    for (let i = 0; i < out.length; i++) {
      const t = i / SR;
      const f = Math.floor(t / 0.15) % 2 ? 660 : 880;
      out[i] = Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.4 * Math.min(1, (0.9 - t) * 10);
    }
    return lowpass(out, 2500);
  },
  click() {
    return hat(0.04);
  },
};

const sfxDir = path.join(root, "public/reel/sfx");
mkdirSync(sfxDir, { recursive: true });
for (const [name, make] of Object.entries(SFX)) writeFileSync(path.join(sfxDir, `${name}.wav`), wav(normalize(make())));
console.log(`sfx: ${Object.keys(SFX).join(", ")}`);

// ---------- music arranged to the reel ----------
// Load the reel timing straight from the TypeScript source.
const tmp = path.join(os.tmpdir(), `reel-script-${process.pid}.mjs`);
buildSync({ entryPoints: [path.join(root, "src/reel/script.ts")], bundle: true, format: "esm", platform: "node", outfile: tmp, logLevel: "error" });
const reel = await import(pathToFileURL(tmp).href);

const BEAT = 0.5; // 120 BPM
const MAJOR = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]; // C Am F G
const MINOR = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]]; // Am F Dm E

const renderBgm = (variant) => {
  const fps = reel.REEL_FPS;
  const starts = reel.getBeatStarts(variant);
  const total = reel.getVariantDuration(variant) / fps;
  const keys = reel.VARIANTS[variant];
  const graveStart = starts.grave / fps;
  const graveEnd = graveStart + reel.getBeatDuration("grave") / fps;
  const ctaStart = starts[keys[keys.length - 1]] / fps;
  const out = buf(total + 2);
  const K = kick(), H = hat(), C = clap();
  for (let bar = 0; bar * 4 * BEAT < total; bar++) {
    const t0 = bar * 4 * BEAT;
    const tense = t0 >= graveStart - 0.01 && t0 < graveEnd;
    const chord = (tense ? MINOR : MAJOR)[bar % 4];
    if (t0 >= ctaStart) {
      // Ending: one sustained chord.
      chord.concat(chord[0] + 12).forEach((m, k) => mix(out, pluck(mtof(m + 12), 2.4), t0 + k * 0.02, 0.35));
      mix(out, bass(mtof(chord[0] - 24), 1.5), t0, 0.5);
      mix(out, K, t0, 0.8);
      break;
    }
    for (let b = 0; b < 8; b++) {
      const t = t0 + b * BEAT * 0.5;
      // Off-beat plucked chords, a hi-hat every 8th, kick and clap pattern.
      if (b % 2 === 1 || b === 0) chord.forEach((m, k) => mix(out, pluck(mtof(m + 12), 0.5), t + k * 0.012, 0.22));
      mix(out, H, t, b % 2 ? 0.12 : 0.2);
      if (b === 0 || b === 4 || (b === 5 && bar % 2 === 1)) mix(out, K, t, 0.85);
      if (b === 2 || b === 6) mix(out, C, t, tense ? 0.25 : 0.45);
      if (b % 2 === 0) mix(out, bass(mtof(chord[0] - 24), 0.35), t, tense ? 0.55 : 0.45);
    }
  }
  // Fade out over the last second.
  for (let i = 0; i < out.length; i++) {
    const t = i / SR;
    if (t > total - 1) out[i] *= Math.max(0, total - t);
  }
  return normalize(out, 0.8);
};

for (const variant of Object.keys(reel.VARIANTS)) {
  const file = path.join(root, `public/reel/bgm-${variant}.wav`);
  writeFileSync(file, wav(renderBgm(variant)));
  console.log(`bgm: ${path.relative(root, file)} (${(reel.getVariantDuration(variant) / reel.REEL_FPS).toFixed(1)} s)`);
}
