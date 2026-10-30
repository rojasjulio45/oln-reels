"""Offline narration for the reel with a Piper neural voice.

Default voice: "claude" (Spanish, Mexico, female, high quality, Apache-2.0),
downloaded from the sherpa-onnx model releases on GitHub. The model is downloaded once into
.voices/ (git-ignored). Writes public/reel/narration/<beat>.mp3 and
src/reel/audio-manifest.json; subtitles and animation cues then follow the
real audio length.

Requirements: pip install piper-tts, and ffmpeg on PATH.
Usage: python3 scripts/generate-voice.py [--speed 1.1] [--voice es_MX-claude-high]
"""

import argparse
import json
import re
import subprocess
import tarfile
import urllib.request
from pathlib import Path

import numpy as np
from piper import PiperVoice
from piper.config import SynthesisConfig

ROOT = Path(__file__).resolve().parent.parent
RELEASES = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models"

# How the narrator should say things the captions write differently.
LEXICON = [
    (r"\bOLN\b", "o ele ene"),
    (r"\bOPD\b", "o pe de"),
    (r"\b21\.430\b", "veintiún mil cuatrocientos treinta"),
    (r"\bCESFAM\b", "cesfam"),
]


def read_narration() -> dict[str, str]:
    source = (ROOT / "src/reel/script.ts").read_text(encoding="utf-8")
    block = re.search(r"export const NARRATION = \{([\s\S]*?)\} as const;", source)
    if not block:
        raise SystemExit("NARRATION block not found in src/reel/script.ts")
    return {k: v.replace("*", "") for k, v in re.findall(r'(\w+):\s*"((?:[^"\\]|\\.)*)"', block.group(1))}


def spoken(text: str) -> str:
    for pattern, replacement in LEXICON:
        text = re.sub(pattern, replacement, text)
    return text


def ensure_voice(voice: str) -> Path:
    name = f"vits-piper-{voice}"
    folder = ROOT / ".voices" / name
    if not folder.exists():
        folder.parent.mkdir(exist_ok=True)
        archive = folder.parent / f"{name}.tar.bz2"
        print(f"Descargando la voz {voice}…")
        urllib.request.urlretrieve(f"{RELEASES}/{name}.tar.bz2", archive)
        with tarfile.open(archive) as tar:
            tar.extractall(folder.parent, filter="data")
        archive.unlink()
    return folder


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", default="es_MX-claude-high")
    parser.add_argument("--speed", type=float, default=1.1, help="1.0 = natural; reels sound better slightly faster")
    args = parser.parse_args()

    folder = ensure_voice(args.voice)
    voice = PiperVoice.load(folder / f"{args.voice}.onnx", folder / f"{args.voice}.onnx.json")
    config = SynthesisConfig(length_scale=1 / args.speed)

    out_dir = ROOT / "public/reel/narration"
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for key, text in read_narration().items():
        # Piper yields one chunk per sentence; join them with a short breath.
        chunks = list(voice.synthesize(spoken(text), syn_config=config))
        rate = chunks[0].sample_rate
        breath = np.zeros(int(rate * 0.12), dtype=np.float32)
        samples = np.concatenate([part for c in chunks for part in (c.audio_float_array, breath)])
        # Trim leading/trailing silence so captions start with the voice.
        voiced = np.nonzero(np.abs(samples) > 0.01)[0]
        samples = samples[max(0, voiced[0] - 200) : voiced[-1] + 2000]
        pcm = (np.clip(samples, -1, 1) * 32767).astype("<i2").tobytes()
        mp3 = out_dir / f"{key}.mp3"
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-f", "s16le", "-ar", str(rate), "-ac", "1", "-i", "-",
             "-af", "loudnorm=I=-16:TP=-1.5", "-ar", "44100", "-b:a", "128k", str(mp3)],
            input=pcm,
            check=True,
        )
        duration = len(samples) / rate
        manifest[key] = {"file": f"reel/narration/{key}.mp3", "durationInSeconds": round(duration, 3)}
        print(f"🎙  {key}: {duration:.2f} s")

    (ROOT / "src/reel/audio-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print("✅ src/reel/audio-manifest.json actualizado")


if __name__ == "__main__":
    main()
