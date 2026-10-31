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
VOICE = "85ilFs2t5qHaaSGUtLFW"  # Kadrath, narrador argentino enérgico (biblioteca). Antes: Martín Solís 0mAmJOs5QSoLsncK0QRu, Jessica cgSgspJ2msm6clMCkdW9
PERFORMANCE = {
    # (text, stability). A dynamic science narrator: lower stability lets the
    # delivery move, with lifts on the findings and a warm close. Acronyms are
    # written as spoken (Senda), never letter by letter.
    "hookLinkedIn": ("[excited] Noventa personas bebieron cerveza y vino en los dos órdenes posibles. [surprised] ¿Y la resaca? Fue la misma.", 0.35),
    "hookInstagram": ("[curious] ¿Cerveza y después vino te da más resaca? [excited] Un ensayo clínico dice que no.", 0.35),
    "ensayo": ("[enthusiastic] Un ensayo clínico de 2019 lo probó con noventa personas: cerveza y luego vino, o al revés. [excited] ¡La resaca fue la misma!", 0.4),
    "realidad": ("[serious] Lo que importa es cuánto etanol entra... [curious] y cuánto alcanza a salir.", 0.45),
    "higado": ("[confident] Tu hígado procesa cerca de un trago por hora. [excited] Si entra más rápido, el nivel sube.", 0.4),
    "congeneres": ("[curious] Lo que sí influye: los congéneres. [confident] Las bebidas oscuras, como el whisky, suelen dejar peor resaca que el vodka.", 0.45),
    "velocidad": ("[excited] También la velocidad, el estómago vacío, las burbujas... y dormir poco.", 0.4),
    "porque": ("[curious] Y el mito parece cierto porque al mezclar se pierde la cuenta, [confident] y los tragos dulces disimulan el alcohol.", 0.4),
    "chile": ("[serious] En Chile, según Senda, casi la mitad de quienes bebieron el último mes se emborrachó al menos una vez.", 0.5),
    "ctaLinkedIn": ("[confident] El orden no importa. La cantidad, sí. [warm] ¿Qué mito te enseñaron a ti? Te leo en comentarios.", 0.35),
    "ctaInstagram": ("[confident] El orden no importa. La cantidad y el cómo, sí. [warm] Guárdalo para la próxima vez que alguien diga: ¡no mezcles!", 0.35),
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("beats", nargs="*", help="only regenerate these beats (default: all)")
    parser.add_argument("--tempo", type=float, default=1.2, help="speed-up without pitch change, keeps the reel under 60 s")
    parser.add_argument("--voice", default=VOICE, help="ElevenLabs voice id (default: the reel's narrator)")
    parser.add_argument("--out", default="public/reel/narration", help="output folder (use another one to audition voices)")
    parser.add_argument("--no-manifest", action="store_true", help="do not touch src/reel/audio-manifest.json")
    parser.add_argument("--reprocess", action="store_true", help="reuse the raw audio already downloaded (change --tempo without new API calls)")
    args = parser.parse_args()
    out_dir = ROOT / args.out
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
            f"https://api.elevenlabs.io/v1/text-to-speech/{args.voice}?output_format=mp3_44100_128",
            data=body, headers={"Content-Type": "application/json"}, method="POST",
        )
        mp3 = out_dir / f"{key}.mp3"
        raw_file = out_dir / "raw" / f"{key}.mp3"
        if args.reprocess and raw_file.exists():
            raw = raw_file.read_bytes()
        else:
            raw = urllib.request.urlopen(req, timeout=120).read()
            raw_file.parent.mkdir(parents=True, exist_ok=True)
            raw_file.write_bytes(raw)
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
        manifest[key] = {"file": f"{Path(args.out).relative_to('public') if args.out.startswith('public/') else args.out}/{key}.mp3", "durationInSeconds": round(duration, 3)}
        print(f"🎙  {key}: {duration:.2f} s")
    if not args.no_manifest:
        manifest_file.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
