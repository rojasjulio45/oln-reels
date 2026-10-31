// Pure model of the bench: what is poured, drained, lit and taken apart at
// every frame of a variant. Every number the reel shows comes from here.
import { BeatKey, REEL_FPS, VARIANTS, Variant, cue, getBeatDuration, getBeatStarts } from "../script";
import { CAPACITY } from "./view";

export type Bottle = "beer" | "wine" | "whisky";
export type Lit = "none" | "beer" | "wine" | "whisky" | "valve" | "drawer" | "needle" | "float";

export interface Pour {
  start: number; // frame
  duration: number; // frames
  bottle: Bottle;
  amount: number; // standard drinks
}

export interface Program {
  pours: Pour[];
  valve: Array<[number, number]>; // frames the drain valve is open
  assembleUntil: number; // frames: exploded at 0, assembled by here
  apartFrom: number; // frames: starts coming apart here (last beat)
  lit: Array<{ from: number; to: number; part: Lit }>;
  dark: Array<[number, number]>; // black interludes
  total: number;
}

export interface BenchState {
  frame: number;
  drinks: number; // total standard drinks in the tank
  pouring: Bottle | null;
  pourFlow: number; // 0..1, how open the pouring valve is
  valveOpen: number; // 0..1
  drained: number; // drinks that went through the valve so far
  congeners: number; // 0..1 darkness of the sediment tray
  drawerOut: number; // 0..1
  lit: Lit;
  explode: number[]; // share 0..1 per assembly, in ASSEMBLY order
  azimuth: number;
  bubbles: number; // 0..1 fizz
}

export const DRAIN_PER_SECOND = 0.14; // drinks per second while open (the liver, compressed in time)

export const ASSEMBLIES = ["base", "drawer", "rack", "manifold", "bottles", "gauge", "tank", "valve"] as const;
export type Assembly = (typeof ASSEMBLIES)[number];

// World move of each assembly when apart, and its place in the stagger.
export const EXPLODE: Record<Assembly, { move: [number, number, number]; order: number }> = {
  base: { move: [0, 0, 0], order: 0 },
  rack: { move: [0, 0, 44], order: 0 },
  gauge: { move: [0, 0, 70], order: 1 },
  bottles: { move: [0, 0, 28], order: 2 },
  manifold: { move: [0, 0, 20], order: 3 },
  valve: { move: [34, 0, 0], order: 4 },
  tank: { move: [0, 0, 12], order: 5 },
  drawer: { move: [0, 42, 0], order: 6 },
};
const STAGGER = 0.09; // seconds between assemblies
const SETTLE = 0.42; // time constant of the critically damped spring

// Critically damped step response, 0 at t = 0 and 1 at rest.
const settled = (t: number) => {
  if (t <= 0) return 0;
  const w = t / SETTLE;
  return 1 - (1 + w) * Math.exp(-w);
};

const smooth = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
const ramp = (frame: number, start: number, duration: number) => smooth((frame - start) / duration);

const sec = (s: number) => Math.round(s * REEL_FPS);

export function programOf(variant: Variant): Program {
  const starts = getBeatStarts(variant);
  const keys = VARIANTS[variant];
  const total = keys.reduce((sum, k) => sum + getBeatDuration(k), 0);
  const end = (k: BeatKey) => starts[k] + getBeatDuration(k);
  const c = (k: BeatKey, word: string) => starts[k] + cue(k, word);
  const pours: Pour[] = [];
  const valve: Array<[number, number]> = [];
  const lit: Program["lit"] = [];
  const dark: Array<[number, number]> = [];

  const hook = keys[0];
  // Hook: the bench closes up from its exploded view, then the first pour.
  if (hook === "hookInstagram") {
    pours.push({ start: c(hook, "cerveza"), duration: sec(1.1), bottle: "beer", amount: 1 });
    pours.push({ start: c(hook, "vino"), duration: sec(1.1), bottle: "wine", amount: 1 });
  } else {
    pours.push({ start: starts[hook] + sec(1.0), duration: sec(1.1), bottle: "beer", amount: 1 });
    pours.push({ start: c(hook, "misma"), duration: sec(1.1), bottle: "wine", amount: 1 });
  }
  lit.push({ from: starts[hook] + sec(0.9), to: end(hook), part: "needle" });

  // Ensayo: the reverse order, same reading.
  pours.push({ start: c("ensayo", "cerveza"), duration: sec(1.0), bottle: "beer", amount: 0.5 });
  pours.push({ start: c("ensayo", "vino"), duration: sec(1.0), bottle: "wine", amount: 0.5 });
  pours.push({ start: c("ensayo", "revés"), duration: sec(0.9), bottle: "wine", amount: 0.5 });
  pours.push({ start: c("ensayo", "revés") + sec(1.0), duration: sec(0.9), bottle: "beer", amount: 0.5 });
  lit.push({ from: c("ensayo", "misma"), to: end("ensayo"), part: "needle" });

  // Realidad: black interlude.
  dark.push([starts.realidad, end("realidad")]);

  // Hígado: the drain valve opens and drips at the liver's pace.
  valve.push([c("higado", "procesa"), end("higado") + sec(0.4)]);
  lit.push({ from: starts.higado, to: end("higado"), part: "valve" });

  // Congéneres: a dark spirit, the sediment tray darkens and slides out.
  pours.push({ start: c("congeneres", "oscuras"), duration: sec(1.3), bottle: "whisky", amount: 1 });
  lit.push({ from: starts.congeneres, to: c("congeneres", "oscuras") - 1, part: "whisky" });
  lit.push({ from: c("congeneres", "oscuras"), to: end("congeneres"), part: "drawer" });

  // Velocidad: a fast pour with fizz.
  pours.push({ start: c("velocidad", "velocidad"), duration: sec(0.6), bottle: "beer", amount: 1 });
  lit.push({ from: starts.velocidad, to: end("velocidad"), part: "float" });

  // Por qué: mixing, one after another, and the needle climbs past the mark.
  const mix = c("porque", "mezclar");
  pours.push({ start: mix, duration: sec(0.7), bottle: "wine", amount: 0.7 });
  pours.push({ start: mix + sec(0.6), duration: sec(0.7), bottle: "whisky", amount: 0.7 });
  pours.push({ start: mix + sec(1.2), duration: sec(0.7), bottle: "beer", amount: 0.6 });
  lit.push({ from: mix, to: end("porque"), part: "needle" });

  // Chile: the valve drips while the number lands.
  valve.push([starts.chile + sec(0.6), end("chile")]);
  lit.push({ from: starts.chile, to: end("chile"), part: "valve" });

  // Cierre: a slow exploded view.
  const cta = keys[keys.length - 1];
  return {
    pours,
    valve,
    assembleUntil: sec(1.6),
    apartFrom: starts[cta] + sec(0.3),
    lit,
    dark,
    total,
  };
}

const CONGENERS: Record<Bottle, number> = { beer: 0.08, wine: 0.18, whisky: 0.55 };

export function stateAt(program: Program, frame: number): BenchState {
  let drinks = 0;
  let pouring: Bottle | null = null;
  let pourFlow = 0;
  let congeners = 0;
  let bubbles = 0;
  for (const pour of program.pours) {
    const p = ramp(frame, pour.start, pour.duration);
    drinks += pour.amount * p;
    if (p > 0 && p < 1) {
      pouring = pour.bottle;
      pourFlow = Math.sin(Math.PI * p);
      if (pour.duration <= REEL_FPS * 0.7) bubbles = Math.max(bubbles, Math.sin(Math.PI * p));
    }
    if (p >= 1 && frame - (pour.start + pour.duration) < REEL_FPS * 1.4) {
      bubbles = Math.max(bubbles, pour.duration <= REEL_FPS * 0.7 ? 1 - (frame - (pour.start + pour.duration)) / (REEL_FPS * 1.4) : 0);
    }
    congeners += pour.amount * p * CONGENERS[pour.bottle];
  }
  let drained = 0;
  let valveOpen = 0;
  for (const [from, to] of program.valve) {
    const open = Math.min(1, Math.max(0, (frame - from) / (REEL_FPS * 0.5))) * (1 - Math.min(1, Math.max(0, (frame - to) / (REEL_FPS * 0.5))));
    valveOpen = Math.max(valveOpen, open);
    const openFrames = Math.max(0, Math.min(frame, to) - from);
    drained += (openFrames / REEL_FPS) * DRAIN_PER_SECOND;
  }
  drinks = Math.max(0, Math.min(CAPACITY, drinks - drained));
  congeners = Math.min(1, congeners / 1.2);

  // Exploded view: closing at the start, opening at the end.
  const explode = ASSEMBLIES.map((name) => {
    const { order } = EXPLODE[name];
    if (name === "base") return 0;
    const t = frame / REEL_FPS;
    const closing = 1 - settled(t - order * STAGGER);
    const opening = settled((frame - program.apartFrom) / REEL_FPS - order * STAGGER * 2.2);
    return Math.max(closing, opening);
  });

  const lit = program.lit.find((l) => frame >= l.from && frame <= l.to)?.part ?? "none";
  const drawerOut = lit === "drawer" ? smooth((frame - (program.lit.find((l) => l.part === "drawer")?.from ?? 0)) / (REEL_FPS * 0.9)) : 0;

  // Camera: a slow drift of azimuth over the whole reel.
  const azimuth = 46 + 8 * (0.5 - 0.5 * Math.cos((2 * Math.PI * frame) / program.total));

  return { frame, drinks, pouring, pourFlow, valveOpen, drained, congeners, drawerOut, lit, explode, azimuth, bubbles };
}

export const readingOf = (drinks: number) => (Math.round(drinks * 10) / 10).toFixed(1).replace(".", ",");
