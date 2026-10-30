"""Narration for the reel with ElevenLabs v3 (voice "Jessica", playful/bright).

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
    # (text, stability): 0.5 = natural/even, 0.0 = creative/expressive
    "hookLinkedIn": ("Hasta 300 casos por cada profesional. Así trabaja la oficina que protege a los niños de tu comuna.", 0.5),
    "hookInstagram": ("[curious] Si un niño de tu comuna está en riesgo... esta oficina debe actuar primero. Se llama Oficina Local de la Niñez.", 0.0),
    "ley": ("Las Oficinas Locales de la Niñez nacieron con la Ley veintiún mil cuatrocientos treinta, de 2022, y reemplazan a las antiguas Oficinas de Protección de Derechos.", 0.5),
    "mision": ("[confident] Su misión es promover derechos, prevenir... y proteger.", 0.0),
    "puertas": ("Los casos a atender llegan por tres puertas: [excited] la familia, una alerta del colegio o del consultorio, ¡o un tribunal!", 0.0),
    "proceso": ("Luego, un gestor de casos evalúa, arma un plan con la familia y la conecta con el consultorio, el colegio y apoyo social.", 0.5),
    "grave": ("[serious] Si el caso es grave, deriva a Protección Especializada o al tribunal de familia.", 0.0),
    "reto": ("[determined] El reto: ¡cubrir las 346 comunas a más tardar en 2027! [sighs] Con gestores que en algunas comunas cargan... ¡300 casos!", 0.0),
    "ctaLinkedIn": ("[curious] ¿En tu comuna ya funciona la Oficina Local de la Niñez? [cheerful] ¡Te leo en comentarios!", 0.0),
    "ctaInstagram": ("[excited] ¡Guárdalo! [warm] Y compártelo con alguien que trabaje con niños.", 0.0),
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
