"""Narration for the reel with ElevenLabs v3 (voice "Jessica", serene, presentation-like).

Each beat has a performance version of its NARRATION text: same words, plus
v3 audio tags and punctuation that drive the delivery. The API key is added
to requests by the environment's network secret (header xi-api-key), so this
script never reads it. Writes public/reel/narration/<beat>.mp3 and
src/reel/audio-manifest.json.

Usage: python3 scripts/generate-voice-elevenlabs.py [--stability 0.0]
"""

import argparse
import json
import subprocess
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VOICE = "cgSgspJ2msm6clMCkdW9"  # Jessica
PERFORMANCE = {
    # (text, stability): 0.5–0.6 = serene, presentation-like; lower only where the
    # delivery should lift (hooks and closings). Acronyms are written as spoken.
    "hookLinkedIn": ("Noventa personas bebieron cerveza y vino en los dos órdenes posibles. La resaca fue la misma.", 0.5),
    "hookInstagram": ("[curious] ¿Cerveza y después vino te da más resaca? [confident] Un ensayo clínico dice que no.", 0.4),
    "ensayo": ("Un ensayo clínico de 2019 lo probó con noventa personas: cerveza y luego vino, o al revés. La resaca fue la misma.", 0.55),
    "realidad": ("[calm] Lo que importa es cuánto etanol entra... y cuánto alcanza a salir.", 0.5),
    "higado": ("Tu hígado procesa cerca de un trago por hora. Si entra más rápido, el nivel sube.", 0.55),
    "congeneres": ("Lo que sí influye: los congéneres. Las bebidas oscuras, como el whisky, suelen dejar peor resaca que el vodka.", 0.55),
    "velocidad": ("También la velocidad, el estómago vacío, las burbujas, y dormir poco.", 0.55),
    "porque": ("Y el mito parece cierto porque al mezclar se pierde la cuenta, y lo dulce esconde el alcohol.", 0.55),
    "chile": ("En Chile, según Senda, casi la mitad de quienes bebieron el último mes se emborrachó al menos una vez.", 0.55),
    "ctaLinkedIn": ("El orden no importa. La cantidad, sí. [warm] ¿Qué mito te enseñaron a ti? Te leo en comentarios.", 0.4),
    "ctaInstagram": ("El orden no importa. La cantidad y el cómo, sí. [warm] Guárdalo para la próxima vez que alguien diga: no mezcles.", 0.4),
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("beats", nargs="*", help="only regenerate these beats (default: all)")
    parser.add_argument("--tempo", type=float, default=1.2, help="speed-up without pitch change, keeps the reel under 60 s")
    args = parser.parse_args()
    out_dir = ROOT / "public/reel/narration"
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest_file = ROOT / "src/reel/audio-manifest.json"
    manifest = json.loads(manifest_file.read_text()) if manifest_file.exists() else {}
    for key, (text, stability) in PERFORMANCE.items():
        if args.beats and key not in args.beats:
            continue
        body = json.dumps({
            "text": text,
            "model_id": "eleven_v3",
            "language_code": "es",
            "voice_settings": {"stability": stability},
        }).encode()
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
            data=body, headers={"Content-Type": "application/json"}, method="POST",
        )
        raw = urllib.request.urlopen(req, timeout=120).read()
        mp3 = out_dir / f"{key}.mp3"
        # Trim edge silence and even out loudness so beats cut tightly.
        subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-y", "-i", "-", "-af",
             f"silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse,atempo={args.tempo},loudnorm=I=-16:TP=-1.5",
             "-ar", "44100", "-b:a", "128k", str(mp3)],
            input=raw, check=True,
        )
        duration = float(subprocess.run(
            ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp3)],
            capture_output=True, text=True, check=True).stdout)
        manifest[key] = {"file": f"reel/narration/{key}.mp3", "durationInSeconds": round(duration, 3)}
        print(f"🎙  {key}: {duration:.2f} s")
    manifest_file.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
