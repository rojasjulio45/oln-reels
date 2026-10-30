# ¿Cómo funcionan las OLN en Chile? — videos Remotion

El proyecto tiene tres composiciones:

| Composición | Formato | Duración | Salida |
|---|---|---|---|
| `ReelLinkedIn` | 1080×1920 (9:16) | ~51 s | `out/oln-reel-linkedin.mp4` |
| `ReelInstagram` | 1080×1920 (9:16) | ~51 s | `out/oln-reel-instagram.mp4` |
| `OLNChile` | 1920×1080 (16:9) | ~3 min | `out/oln-chile.mp4` |

## Reel (LinkedIn e Instagram)

Las dos versiones comparten el cuerpo y cambian el hook y el cierre. Los textos para publicar están en `reel-copy.md`, junto con las reglas de cada skill que se aplicaron.

| Archivo | Qué contiene |
|---|---|
| `src/reel/script.ts` | Guion (`NARRATION`), versiones (`VARIANTS`) y tiempos palabra a palabra |
| `src/reel/beats/` | Hooks, cuerpo (ley, misión, puertas, proceso, grave, reto) y cierres |
| `src/reel/kit.tsx` | Stickers, texto que golpea, contadores, ráfagas, vibración, flechas y subtítulos estilo TikTok |
| `src/reel/assets/` | Emojis Fluent (Microsoft, MIT) y mapa de Chile con 346 puntos (Natural Earth, dominio público) |
| `scripts/build-reel-assets.mjs` | Regenera `src/reel/assets/` desde npm |
| `scripts/build-reel-audio.mjs` | Sintetiza los SFX y una música de 120 BPM ajustada a las escenas (sin descargas ni licencias) |

```bash
npm run dev            # genera la música y abre Remotion Studio
npm run render:reels   # exporta las dos versiones y las comprime (~7 MB c/u)
npm run reel:voice     # regenera la voz y ajusta la música a sus tiempos
```

**Voz:** la narración usa la voz neuronal Piper "claude" (español de México, femenina, licencia Apache 2.0), que funciona sin internet una vez descargada. `npm run reel:voice` necesita `pip install piper-tts` y ffmpeg; la primera vez descarga el modelo (63 MB) en `.voices/`, que no se sube a git. El diccionario `LEXICON` de `scripts/generate-voice.py` corrige cómo se leen las siglas y los números ("OLN" → "o ele ene", "21.430" → "veintiún mil cuatrocientos treinta").

Con voz, cada escena dura lo que dura su frase y los subtítulos se ajustan a ella. Verifica que el reel siga bajo 60 s (Studio muestra la duración) y, si se pasa, usa `python3 scripts/generate-voice.py --speed 1.2`.

Para cambiar un texto, edita `NARRATION` en `src/reel/script.ts`. Las palabras entre `*asteriscos*` salen destacadas en amarillo. Las animaciones usan `cue("escena", "palabra")` para aparecer cuando se dice esa palabra; si borras una que alguna escena usa, la vista previa te muestra cuál falta.

## Video largo (OLNChile)

Video horizontal de unos 3 minutos sobre las **Oficinas Locales de la Niñez** (Ley 21.430). Está hecho con código, en estilo Kurzgesagt: ilustraciones SVG planas, colores saturados, fondo nocturno y animaciones sincronizadas con la narración.

### Estructura

| Archivo | Qué contiene |
|---|---|
| `script.md` | Guion completo, notas de ritmo y fuentes |
| `src/constants.ts` | Texto narrado (`NARRATION`), paleta y cálculo de tiempos |
| `src/scenes/*.tsx` | Las 10 escenas (intro → cierre) |
| `src/components/` | Fondo, subtítulos, personajes, edificios e íconos SVG |
| `src/audio-manifest.json` | Duraciones reales de la voz (vacío = tiempos estimados) |
| `scripts/generate-tts.mjs` | Genera la voz y actualiza el manifiesto |

### Uso

```bash
npm i
npm run dev      # Remotion Studio: vista previa interactiva
npm run tts      # (opcional) genera la voz con edge-tts
npm run render   # exporta out/oln-chile.mp4
```

#### Voz

`npm run tts` necesita `pip install edge-tts` y ffmpeg. Usa por defecto la voz chilena `es-CL-CatalinaNeural`; para la masculina, ejecuta `npm run tts -- --voice es-CL-LorenzoNeural`.

El script mide cada audio y los subtítulos y las animaciones se ajustan solos. Las animaciones usan `cue()` para aparecer cuando la narración dice la palabra que les corresponde.

Mientras `src/audio-manifest.json` esté vacío (`{}`), el video sale sin voz y con tiempos estimados según la longitud del texto.

#### Cambiar el guion

Edita `NARRATION` en `src/constants.ts`. Si borras una frase que alguna escena usa como `cue("escena", "fragmento")`, TypeScript no lo detecta, pero la vista previa muestra el error con el fragmento que falta.
