# Reels y video explicativo en Remotion

El proyecto tiene tres composiciones:

| Composición | Formato | Duración | Salida |
|---|---|---|---|
| `ReelLinkedIn` | 1080×1920 (9:16) | < 60 s | `out/resaca-reel-linkedin.mp4` |
| `ReelInstagram` | 1080×1920 (9:16) | < 60 s | `out/resaca-reel-instagram.mp4` |
| `OLNChile` | 1920×1080 (16:9) | ~3 min | `out/oln-chile.mp4` |

## Reel (LinkedIn e Instagram): ¿mezclar alcoholes da más resaca?

Las dos versiones comparten el cuerpo y cambian el hook y el cierre. Los textos para publicar y la ficha de fuentes están en `reel-copy-resaca.md`.

El reel sigue la idea de la skill **Anatomy** (`.claude/skills/anatomy`, MIT): el objeto es la explicación. Un banco de ensayo isométrico, dibujado pieza por pieza con el kit de Anatomy (`src/iso/`), hace de modelo: tres botellas invertidas llenan por un colector un tanque graduado, un flotador mueve la aguja de un indicador de carátula que marca el etanol total, una válvula de goteo drena al ritmo del hígado y una bandeja de sedimentos se oscurece con las bebidas oscuras. El aparato es continuo durante todo el reel; las escenas son estados de la misma máquina y una cámara de producto (`src/reel/bench/camera.ts`) va a cada pieza cuando la narración la nombra: zooms, giros de azimut, cambios de elevación y un rótulo corto sobre la pieza. La estética es de keynote: fondo claro, Inter Display, un solo acento azul, dos interludios en negro, sin flashes ni vibración.

| Archivo | Qué contiene |
|---|---|
| `src/reel/script.ts` | Guion (`NARRATION`), fuentes por escena (`SOURCES`), versiones (`VARIANTS`), tiempos por palabra y por frase |
| `src/reel/bench/model.ts` | Modelo puro: vertidos, drenaje, pieza iluminada, despiece y cámara por fotograma (`programOf`, `stateAt`) |
| `src/reel/bench/view.ts`, `geometry.ts`, `Bench.tsx` | Mundo, piezas (70) en orden de pintor y el SVG del banco |
| `src/reel/bench/camera.ts` | Planos sobre las palabras del guion: foco, zoom, azimut, elevación, deriva lenta y rótulo |
| `src/reel/beats/Beats.tsx` | Titulares y notas de cada escena |
| `src/reel/kit.tsx` | Tipografía keynote: titulares, subtítulos por frases, notas al pie y SFX |
| `src/iso/` | Kit de Anatomy (`iso-kit.ts`, `iso.css`, `draw.tsx`) |
| `scripts/build-reel-audio.mjs` | Sintetiza los SFX (clic, goteo, campana) y una música de 78 BPM sin batería ajustada a las escenas |
| `scripts/generate-voice-elevenlabs.py` | Voz por escena con ElevenLabs v3 (Kadrath, narrador argentino de la biblioteca; `--voice` para probar otra, `--reprocess` para cambiar el `--tempo` sin volver a llamar a la API) |

```bash
npm i
npm run dev            # genera la música y abre Remotion Studio
python3 scripts/generate-voice-elevenlabs.py --tempo 1.12   # voz Kadrath (narrador argentino), ElevenLabs v3 (la clave la inyecta el entorno)
node scripts/build-reel-audio.mjs                           # música ajustada a la voz
npm run render:reels   # exporta las dos versiones y las comprime (~7 MB c/u)
```

Para revisar fotogramas: `npx remotion still src/index.ts ReelLinkedIn out/f.png --frame=40`; `BenchStill` y `BenchZoom` muestran solo el aparato (este último a 4000 px para recortes 4×). `node scripts/reel-starts.mjs` imprime el fotograma inicial de cada escena.

Para cambiar un texto, edita `NARRATION` en `src/reel/script.ts`. Las palabras entre `*asteriscos*` salen en azul en los subtítulos. El modelo y las escenas usan `cue("escena", "palabra")` para sincronizarse con la voz; si borras una palabra que alguien usa, la vista previa te muestra cuál falta.

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
