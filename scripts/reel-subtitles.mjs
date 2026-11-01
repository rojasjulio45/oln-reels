// Writes phrase-level SRT subtitles for both reel variants from the same
// timing the captions use. Usage: node scripts/reel-subtitles.mjs
import { buildSync } from "esbuild";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
const out = path.resolve("out/reel-script.bundle.mjs");
buildSync({ entryPoints: ["src/reel/script.ts"], bundle: true, format: "esm", platform: "node", outfile: out, logLevel: "error" });
const reel = await import(pathToFileURL(out).href);
const stamp = (frames) => {
  const ms = Math.round((frames / reel.REEL_FPS) * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const t = String(ms % 1000).padStart(3, "0");
  return `${h}:${m}:${s},${t}`;
};
for (const variant of Object.keys(reel.VARIANTS)) {
  const starts = reel.getBeatStarts(variant);
  const lines = [];
  let n = 1;
  for (const key of reel.VARIANTS[variant]) {
    const phrases = reel.getPhrases(key);
    phrases.forEach((p, i) => {
      const next = phrases[i + 1];
      const start = starts[key] + p.start;
      const end = starts[key] + (next ? next.start - 1 : p.end + 8);
      lines.push(`${n++}\n${stamp(start)} --> ${stamp(end)}\n${p.words.map((w) => w.text).join(" ")}\n`);
    });
  }
  const file = `videos/resaca-reel-${variant}.srt`;
  writeFileSync(file, lines.join("\n"));
  console.log(file, n - 1, "cues");
}
