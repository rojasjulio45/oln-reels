import audioManifest from "./audio-manifest.json";

// Vertical reel for LinkedIn and Instagram (9:16): does mixing drinks, or
// going up or down in strength, give a worse hangover? Two hooks and two
// closings share the same body. *Asterisks* mark the key word of a phrase;
// they are stripped before text-to-speech.
export const REEL_FPS = 30;
export const REEL_W = 1080;
export const REEL_H = 1920;

export const NARRATION = {
  // LinkedIn: number first, a statement, never a question.
  hookLinkedIn: "*Noventa* personas bebieron cerveza y vino en los dos órdenes posibles. La resaca fue la *misma*.",
  // Instagram: the viewer's own question, answered before 1.5 s.
  hookInstagram: "¿*Cerveza* y después *vino* te da más resaca? Un ensayo clínico dice que *no*.",
  ensayo: "Un ensayo clínico de 2019 lo probó con *noventa* personas: cerveza y luego vino, o al *revés*. La resaca fue la *misma*.",
  realidad: "Lo que importa es *cuánto* etanol entra, y cuánto alcanza a *salir*.",
  higado: "Tu hígado *procesa* cerca de *un trago* por hora. Si entra más rápido, el nivel *sube*.",
  congeneres: "Lo que sí influye: los *congéneres*. Las bebidas *oscuras*, como el whisky, suelen dejar peor resaca que el vodka.",
  velocidad: "También la *velocidad*, el estómago *vacío*, las *burbujas* y dormir *poco*.",
  porque: "Y el mito parece cierto porque al *mezclar* se pierde la *cuenta*, y los tragos dulces disimulan el alcohol.",
  chile: "En Chile, según SENDA, casi la *mitad* de quienes bebieron el último mes se emborrachó al menos una vez.",
  ctaLinkedIn: "El *orden* no importa. La *cantidad*, sí. ¿Qué mito te enseñaron a ti? Te leo en *comentarios*.",
  ctaInstagram: "El *orden* no importa. La *cantidad* y el cómo, sí. *Guárdalo* para la próxima vez que alguien diga: no mezcles.",
} as const;

export type BeatKey = keyof typeof NARRATION;

export const AUTHOR = "Julio Rojas";

// Footnote line per beat (small grey, like a keynote's legal line).
export const SOURCES: Record<BeatKey, string> = {
  hookLinkedIn: "¹ Köchling et al., American Journal of Clinical Nutrition, 2019; 109(2): 345–352",
  hookInstagram: "¹ Köchling et al., American Journal of Clinical Nutrition, 2019; 109(2): 345–352",
  ensayo: "¹ Köchling et al., Am J Clin Nutr 2019 · 90 personas, ensayo cruzado, cerveza lager y vino blanco",
  realidad: "¹ Köchling et al., 2019 · ² Mackus et al., J Clin Med 2020: la concentración de etanol predice la resaca",
  higado: "³ NIAAA, Alcohol Metabolism · Jones, Forensic Sci Int 2010 · promedio; varía según la persona",
  congeneres: "⁴ Rohsenow et al., Alcohol Clin Exp Res 2010 (bourbon vs vodka, 95 personas) · Rohsenow & Howland, 2010 · evidencia limitada",
  velocidad: "⁵ Jones & Jönsson, J Forensic Sci 1994 · Roberts & Robinson, J Forensic Leg Med 2007 · van Schrojenstein Lantman et al., Nat Sci Sleep 2017",
  porque: "⁶ NIAAA, Hangovers · Marczinski & Stamates, Alcohol Clin Exp Res 2013 · Köchling et al., 2019",
  chile: "⁷ SENDA, Décimo Sexto Estudio Nacional de Drogas en Población General, 2024 (publicado en 2025)",
  ctaLinkedIn: "Fuentes: Am J Clin Nutr 2019 · Alcohol Clin Exp Res 2010 y 2013 · J Clin Med 2020 · Nat Sci Sleep 2017 · NIAAA · SENDA",
  ctaInstagram: "Fuentes: Am J Clin Nutr 2019 · Alcohol Clin Exp Res 2010 y 2013 · J Clin Med 2020 · Nat Sci Sleep 2017 · NIAAA · SENDA",
};

export const VARIANTS = {
  linkedin: ["hookLinkedIn", "ensayo", "realidad", "higado", "congeneres", "velocidad", "porque", "chile", "ctaLinkedIn"],
  instagram: ["hookInstagram", "ensayo", "realidad", "higado", "congeneres", "velocidad", "porque", "chile", "ctaInstagram"],
} satisfies Record<string, BeatKey[]>;
export type Variant = keyof typeof VARIANTS;

// Pacing. The first word lands at LEAD frames (< 0.5 s); each beat breathes
// for TAIL frames after its last word.
export const LEAD = 6;
export const TAIL = 10;
const CHARS_PER_SECOND = 16;

export type Word = { text: string; emphasis: boolean; start: number; end: number };

type ManifestEntry = { file: string; durationInSeconds: number };
const manifest = audioManifest as Partial<Record<BeatKey, ManifestEntry>>;
export const getBeatAudio = (key: BeatKey) => manifest[key];
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
  const speech = audio ? audio.durationInSeconds * REEL_FPS : (total / CHARS_PER_SECOND) * REEL_FPS;
  let cursor = LEAD;
  let open = false;
  return tokens.map((t, i) => {
    const starts = t.startsWith("*") || t.startsWith("¿*") || t.startsWith("¡*");
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

// Captions are short phrases, 2 to 5 words, one at a time.
export type Phrase = { words: Word[]; start: number; end: number };
export const getPhrases = (key: BeatKey): Phrase[] => {
  const words = getWords(key);
  const phrases: Phrase[] = [];
  let run: Word[] = [];
  const flush = () => {
    if (run.length) phrases.push({ words: run, start: run[0].start, end: run[run.length - 1].end });
    run = [];
  };
  words.forEach((w, i) => {
    run.push(w);
    const punct = /[.,:;!?…]$/.test(w.text);
    const next = words[i + 1];
    // Break at punctuation, or at 4 words unless only one word would be left over.
    if (punct || run.length >= 4 && !(next && i + 2 === words.length)) flush();
    if (run.length >= 5) flush();
  });
  flush();
  return phrases;
};

export const getBeatDuration = (key: BeatKey): number => {
  const words = getWords(key);
  return words[words.length - 1].end + TAIL;
};

export const getVariantDuration = (variant: Variant): number => VARIANTS[variant].reduce((sum, k) => sum + getBeatDuration(k), 0);

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

const normalize = (s: string) => s.toLowerCase().replace(/[*.,:;!?¿¡…]/g, "");

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
