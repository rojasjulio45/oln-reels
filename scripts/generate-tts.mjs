// Generates one narration MP3 per scene with edge-tts and writes
// src/audio-manifest.json with the real durations. The video then stretches
// subtitles and animation cues to the measured audio automatically.
//
// Requirements: `pip install edge-tts` and ffmpeg (ffprobe) on PATH.
// Usage: node scripts/generate-tts.mjs [--voice es-CL-CatalinaNeural] [--rate +0%] [--reel]
//   --reel: voices the vertical reel (src/reel/script.ts) instead of the long video.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : fallback;
};
const voice = arg("--voice", "es-CL-CatalinaNeural");
const reel = args.includes("--reel");
const rate = arg("--rate", reel ? "+12%" : "+0%");
const sourceFile = reel ? "src/reel/script.ts" : "src/constants.ts";
const manifestFile = reel ? "src/reel/audio-manifest.json" : "src/audio-manifest.json";
const audioDir = reel ? "reel/narration" : "audio/narration";

// Read NARRATION straight from constants.ts so the script and the video
// never disagree about the text.
const source = readFileSync(path.join(root, sourceFile), "utf8");
const block = source.match(/export const NARRATION = \{([\s\S]*?)\} as const;/);
if (!block) throw new Error(`NARRATION block not found in ${sourceFile}`);
const narration = {};
for (const m of block[1].matchAll(/(\w+):\s*"((?:[^"\\]|\\.)*)"/g)) {
  // *asterisks* only mark highlighted caption words.
  narration[m[1]] = m[2].replace(/\*/g, "");
}

const outDir = path.join(root, "public", audioDir);
mkdirSync(outDir, { recursive: true });
const manifest = {};
for (const [key, text] of Object.entries(narration)) {
  const file = `${audioDir}/${key}.mp3`;
  const target = path.join(root, "public", file);
  console.log(`🎙  ${key}`);
  execFileSync("edge-tts", [`--voice=${voice}`, `--rate=${rate}`, `--text=${text}`, `--write-media=${target}`], {
    stdio: "inherit",
  });
  const duration = Number(
    execFileSync("ffprobe", ["-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", target], {
      encoding: "utf8",
    }).trim(),
  );
  manifest[key] = { file, durationInSeconds: Number(duration.toFixed(3)) };
}
writeFileSync(path.join(root, manifestFile), JSON.stringify(manifest, null, 2) + "\n");
console.log(`✅ ${manifestFile} actualizado. Abre \`npm run dev\` o renderiza de nuevo.`);
