import audioManifest from "./audio-manifest.json";

// Vertical reel for LinkedIn and Instagram (9:16). Two hooks and two CTAs
// share the same body. *Asterisks* mark the words highlighted in captions;
// they are stripped before text-to-speech.
export const REEL_FPS = 30;
export const REEL_W = 1080;
export const REEL_H = 1920;

export const NARRATION = {
  // LinkedIn: number-first line (F7) + plain-language explainer (F15), no question opener.
  hookLinkedIn:
    "Hasta *300* casos por cada profesional. Así trabaja la oficina que protege a los niños de *tu comuna*.",
  // Instagram: if-you/situation hook, viewer as protagonist, claim lands by 1.5 s.
  hookInstagram:
    "Si un niño de *tu comuna* está en riesgo, esta oficina debe actuar primero. Se llama *Oficina Local de la Niñez*.",
  ley: "Las *Oficinas Locales de la Niñez* nacieron con la *Ley 21.430*, de 2022, y reemplazan a las antiguas *Oficinas de Protección de Derechos*.",
  mision: "Su misión es *promover* derechos, *prevenir* y *proteger*.",
  puertas:
    "Los casos a atender llegan por *tres puertas*: la *familia*, una *alerta* del colegio o del consultorio, o un *tribunal*.",
  // At comuna level, health means the consultorio (CESFAM, primary care), not a hospital.
  proceso:
    "Luego, un *gestor de casos* evalúa, arma un *plan* con la familia y la conecta con el *consultorio*, el colegio y apoyo social.",
  grave: "Si el caso es *grave*, deriva a *Protección Especializada* o al *tribunal de familia*.",
  reto: "El reto: cubrir las *346 comunas* a más tardar en *2027*, con gestores que en algunas comunas cargan *300 casos*.",
  // LinkedIn closes with a specific question (+3% vs. opening with one).
  ctaLinkedIn: "¿En tu comuna ya funciona la Oficina Local de la Niñez? Te leo en *comentarios*.",
  ctaInstagram: "*Guárdalo* y compártelo con alguien que trabaje con niños.",
} as const;

export type BeatKey = keyof typeof NARRATION;

export const AUTHOR = "Julio Rojas";

// Discreet per-beat source line under the author credit.
export const SOURCES: Record<BeatKey, string> = {
  hookLinkedIn: "Dato: OLN Los Ángeles · La Tribuna, 30/09/2026",
  hookInstagram: "Ley 21.430 · BCN LeyChile",
  ley: "Ley 21.430, publicada el 15/03/2022 · BCN LeyChile",
  mision: "Ley 21.430 · Orientaciones técnicas OLN, Subsecretaría de la Niñez",
  puertas: "Orientaciones técnicas OLN · Guía de instituciones NNA, 2025",
  proceso: "Piloto OLN, Dipres · UNICEF Chile, Serie Protección Integral n.º 1",
  grave: "Ley 21.430 · Servicio Nacional de Protección Especializada",
  reto: "Ley 21.430, plazo de 5 años · La Tribuna, 30/09/2026",
  ctaLinkedIn: "Fuentes: BCN · Subsecretaría de la Niñez · UNICEF Chile · Dipres · La Tribuna",
  ctaInstagram: "Fuentes: BCN · Subsecretaría de la Niñez · UNICEF Chile · Dipres · La Tribuna",
};

export const VARIANTS = {
  linkedin: ["hookLinkedIn", "ley", "mision", "puertas", "proceso", "grave", "reto", "ctaLinkedIn"],
  instagram: ["hookInstagram", "ley", "mision", "puertas", "proceso", "grave", "reto", "ctaInstagram"],
} satisfies Record<string, BeatKey[]>;
export type Variant = keyof typeof VARIANTS;

// Pacing: brisk reel delivery. The first word lands at LEAD frames (< 0.5 s).
export const LEAD = 6;
const TAIL = 10;
const CHARS_PER_SECOND = 16;

export type Word = { text: string; emphasis: boolean; start: number; end: number };

type ManifestEntry = { file: string; durationInSeconds: number };
const manifest = audioManifest as Partial<Record<BeatKey, ManifestEntry>>;
export const getBeatAudio = (key: BeatKey) => manifest[key];
// With narration, effects and music step back so the voice stays clear.
export const HAS_VOICE = Object.keys(manifest).length > 0;

// Word-level timing. Without audio it is estimated from length plus pauses
// at punctuation; with audio the same weights are stretched to its length.
export const getWords = (key: BeatKey): Word[] => {
  const tokens = NARRATION[key].split(/\s+/);
  const weights = tokens.map((t) => {
    const clean = t.replace(/\*/g, "");
    const pause = /[.!?]$/.test(clean) ? 6 : /[,:;]$/.test(clean) ? 3 : 0;
    return clean.length + 1 + pause;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  const audio = getBeatAudio(key);
  const speech = audio
    ? audio.durationInSeconds * REEL_FPS
    : (total / CHARS_PER_SECOND) * REEL_FPS;
  let cursor = LEAD;
  let open = false;
  return tokens.map((t, i) => {
    // An emphasis span may cover several words: *tres puertas*.
    const starts = t.startsWith("*");
    const ends = t.replace(/[.,:;!?]+$/, "").endsWith("*");
    const emphasis = open || starts;
    if (starts) open = true;
    if (ends) open = false;
    const len = (weights[i] / total) * speech;
    const word = {
      text: t.replace(/\*/g, ""),
      emphasis,
      start: Math.round(cursor),
      end: Math.round(cursor + len),
    };
    cursor += len;
    return word;
  });
};

export const getBeatDuration = (key: BeatKey): number => {
  const words = getWords(key);
  return words[words.length - 1].end + TAIL;
};

export const getVariantDuration = (variant: Variant): number =>
  VARIANTS[variant].reduce((sum, k) => sum + getBeatDuration(k), 0);

// Start frame of every beat in a variant.
export const getBeatStarts = (variant: Variant): Record<string, number> => {
  let t = 0;
  const starts: Record<string, number> = {};
  for (const k of VARIANTS[variant]) {
    starts[k] = t;
    t += getBeatDuration(k);
  }
  return starts;
};

const normalize = (s: string) =>
  s.toLowerCase().replace(/[*.,:;!?¿¡]/g, "");

// Frame (beat-local) at which the narration says `fragment`.
export const cue = (key: BeatKey, fragment: string): number => {
  const words = getWords(key);
  const target = normalize(fragment).split(" ");
  for (let i = 0; i <= words.length - target.length; i++) {
    if (target.every((w, j) => normalize(words[i + j].text) === w)) {
      return words[i].start;
    }
  }
  throw new Error(`cue: "${fragment}" not found in ${key}`);
};
