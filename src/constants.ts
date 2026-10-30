import audioManifest from "./audio-manifest.json";

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

// Frames of silence before and after each scene's narration.
export const SCENE_PAD = 15;
// Overlap of the fade between two scenes.
export const TRANSITION_FRAMES = 15;
// Speaking rate used to estimate timing until real audio exists.
const CHARS_PER_SECOND = 14.5;

export const FONT = "Inter, 'DejaVu Sans', sans-serif";

// Kurzgesagt-style palette: deep night background, saturated flat accents.
export const COLORS = {
  bg: { dark: "#0e1433", mid: "#18215a", light: "#25307a" },
  star: "#c9d6ff",
  text: "#ffffff",
  muted: "#aab4e0",
  accent: {
    orange: "#ff9f43",
    yellow: "#ffd23f",
    teal: "#2ed6c4",
    pink: "#ff5c8a",
    blue: "#4fa3ff",
    purple: "#a07cff",
    green: "#5fd068",
    red: "#ff4d4d",
  },
  skin: "#ffcc99",
  skinDark: "#c98a5b",
  hair: "#3a2a4a",
  building: { wall: "#f4f1ff", roof: "#ff5c8a", window: "#ffd23f", shade: "#d9d4f5" },
};

export const NARRATION = {
  intro:
    "Imagina una niña de nueve años. En la escuela, su profesora nota que llega cansada, que ya no juega en el recreo y que lleva días sin almorzar. Algo pasa en su casa. La pregunta es: ¿a quién se llama?",
  antes:
    "Durante décadas, en Chile la respuesta fue un sistema fragmentado. Había programas sueltos, como las Oficinas de Protección de Derechos, las OPD, y muchos casos llegaban tarde, cuando el daño ya estaba hecho.",
  ley: "En marzo de 2022 se publicó la Ley 21.430, de Garantías y Protección Integral de los Derechos de la Niñez y Adolescencia. Su idea central es simple: proteger antes de que sea tarde. Y para eso creó una pieza clave en cada comuna: las Oficinas Locales de la Niñez, las OLN.",
  queEs:
    "Piensa en la OLN como el nudo central de una red de seguridad tejida en tu comuna. Su trabajo tiene tres partes: promover los derechos de niños, niñas y adolescentes, prevenir que se vulneren y, cuando ocurre, protegerlos.",
  ingreso:
    "¿Cómo llega un caso a la OLN? Por tres puertas. La primera: demanda espontánea; la familia, o el propio niño, se acerca a pedir ayuda. La segunda: una denuncia o alerta, por ejemplo desde la escuela o el consultorio. La tercera: una derivación desde un tribunal de familia.",
  equipo:
    "Adentro espera un equipo. Una coordinación que organiza la oficina. Gestión comunitaria, que trabaja con barrios, escuelas y organizaciones. Gestores de casos, que acompañan a cada familia. Y profesionales de terapia familiar.",
  camino:
    "Con nuestra niña, el camino sería así. Primero, una evaluación para entender qué está pasando. Luego, junto a la familia, se arma un Plan de Atención Familiar. El gestor de casos conecta a la familia con la red: salud, educación, apoyo social. Si hace falta, hay sesiones de terapia familiar. Y al final, seguimiento, hasta que la familia egresa.",
  grave:
    "Pero si la vulneración es grave, la OLN no actúa sola. Deriva al Servicio Nacional de Protección Especializada, o pide a un tribunal de familia medidas de protección. La red local es la primera línea, no la única.",
  desafios:
    "El sistema todavía se está armando. La ley dio cinco años para instalar las OLN en todo el país, de forma gradual. Y hay desafíos reales: en algunas comunas, cada gestor carga con cientos de casos, y parte del personal trabaja a honorarios.",
  cierre:
    "Aun así, el cambio de fondo es enorme: pasar de reaccionar cuando el daño ya está hecho, a una red que llega antes. Si conoces a un niño, niña o adolescente que necesita ayuda, busca la Oficina Local de la Niñez de tu comuna. Esa es la puerta.",
} as const;

export type SceneKey = keyof typeof NARRATION;
export const SCENE_ORDER = Object.keys(NARRATION) as SceneKey[];

export type Segment = { text: string; startFrame: number; endFrame: number };

// Splits narration into subtitle-sized chunks: sentences, and long sentences
// again at their commas, colons or semicolons.
const MAX_CHARS = 80;
export const splitNarration = (text: string): string[] => {
  // A period followed by a digit ("Ley 21.430") does not end a sentence.
  const sentences = text.match(/(?:[^.?!]|\.(?=\d))+[.?!]*/g) ?? [text];
  const chunks: string[] = [];
  for (const raw of sentences) {
    const sentence = raw.trim();
    if (sentence.length <= MAX_CHARS) {
      chunks.push(sentence);
      continue;
    }
    let current = "";
    for (const part of sentence.split(/(?<=[,:;])\s+/)) {
      if (current && (current + " " + part).length > MAX_CHARS) {
        chunks.push(current);
        current = part;
      } else {
        current = current ? current + " " + part : part;
      }
    }
    // Don't leave a short tail like "apoyo social." on its own.
    if (current.length < 20 && chunks.length > 0) {
      chunks[chunks.length - 1] += " " + current;
    } else if (current) {
      chunks.push(current);
    }
  }
  return chunks.filter((c) => c.length > 0);
};

type ManifestEntry = { file: string; durationInSeconds: number };
const manifest = audioManifest as Partial<Record<SceneKey, ManifestEntry>>;

export const getAudio = (key: SceneKey): ManifestEntry | undefined =>
  manifest[key];

// Subtitle segments in scene-local frames. Without audio, timing is estimated
// from text length; with audio (see scripts/generate-tts.mjs), the same
// proportions are stretched to the real narration length.
export const getSegments = (key: SceneKey): Segment[] => {
  const chunks = splitNarration(NARRATION[key]);
  const totalChars = chunks.reduce((sum, c) => sum + c.length, 0);
  const audio = getAudio(key);
  const speechFrames = audio
    ? Math.round(audio.durationInSeconds * FPS)
    : Math.round((totalChars / CHARS_PER_SECOND) * FPS);
  let cursor = SCENE_PAD;
  return chunks.map((text) => {
    const len = Math.round((text.length / totalChars) * speechFrames);
    const seg = { text, startFrame: cursor, endFrame: cursor + len };
    cursor += len;
    return seg;
  });
};

export const getSceneDuration = (key: SceneKey): number => {
  const segs = getSegments(key);
  return segs[segs.length - 1].endFrame + SCENE_PAD + TRANSITION_FRAMES;
};

export const getTotalDuration = (): number =>
  SCENE_ORDER.reduce((sum, k) => sum + getSceneDuration(k), 0) -
  TRANSITION_FRAMES * (SCENE_ORDER.length - 1);

// Start frame of the subtitle segment that contains `fragment`, so visuals
// appear when the narration says the matching words.
export const cue = (key: SceneKey, fragment: string): number => {
  const segs = getSegments(key);
  const seg = segs.find((s) => s.text.includes(fragment));
  if (!seg) throw new Error(`cue: "${fragment}" not found in ${key}`);
  // Within a segment, place the cue proportionally to where the words occur.
  const offset = seg.text.indexOf(fragment) / seg.text.length;
  return Math.round(seg.startFrame + offset * (seg.endFrame - seg.startFrame));
};
