// Pure model of the bench: what is poured, drained, lit and taken apart at
// every frame of a variant. Every number the reel shows comes from here.
import type { Point3 } from "../../iso/iso-kit";
import { BeatKey, REEL_FPS, VARIANTS, Variant, cue, getBeatDuration, getBeatStarts } from "../script";
import type { Shot } from "./camera";
import * as V from "./view";
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
  shots: Shot[]; // the camera, on the narration's cues
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
void STAGGER;

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
  // Frame 0 is already a beer pouring in close-up; the wine follows on its word.
  pours.push({ start: -14, duration: sec(1.5), bottle: "beer", amount: 1 });
  pours.push({ start: c(hook, "vino"), duration: sec(1.2), bottle: "wine", amount: 1 });
  lit.push({ from: starts[hook] + sec(0.9), to: end(hook), part: "needle" });

  // Ensayo: the reverse order, same reading.
  pours.push({ start: c("ensayo", "cerveza"), duration: sec(1.0), bottle: "beer", amount: 0.5 });
  pours.push({ start: c("ensayo", "vino"), duration: sec(1.0), bottle: "wine", amount: 0.5 });
  pours.push({ start: c("ensayo", "revés"), duration: sec(0.9), bottle: "wine", amount: 0.5 });
  pours.push({ start: c("ensayo", "revés") + sec(1.0), duration: sec(0.9), bottle: "beer", amount: 0.5 });
  lit.push({ from: c("ensayo", "misma"), to: end("ensayo"), part: "needle" });

  // Realidad: black for the first phrase, then the tank with the valve cracked open at "salir".
  dark.push([starts.realidad, c("realidad", "salir") - 10]);
  valve.push([c("realidad", "salir") - 6, end("realidad")]);

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

  // Por qué: the myth on black, then mixing, one after another, and the needle climbs.
  const mix = c("porque", "mezclar");
  dark.push([starts.porque, mix - 4]);
  pours.push({ start: mix, duration: sec(0.7), bottle: "wine", amount: 0.7 });
  pours.push({ start: mix + sec(0.6), duration: sec(0.7), bottle: "whisky", amount: 0.7 });
  pours.push({ start: mix + sec(1.2), duration: sec(0.7), bottle: "beer", amount: 0.6 });
  lit.push({ from: mix, to: end("porque"), part: "needle" });

  // Chile: the valve drips while the number lands.
  valve.push([starts.chile + sec(0.6), end("chile")]);
  lit.push({ from: starts.chile, to: end("chile"), part: "valve" });

  // Cierre: a slow exploded view.
  const cta = keys[keys.length - 1];
  const shots = shotsOf(variant, starts, c, end);
  return {
    pours,
    valve,
    assembleUntil: sec(1.6),
    apartFrom: starts[cta] + sec(0.3),
    lit,
    dark,
    shots,
    total,
  };
}

// ---------- camera ----------
// Points of interest, in world units.
const BEER: Point3 = [V.BOTTLE_XS[0], V.BOTTLE_Y, 156];
const WINE: Point3 = [V.BOTTLE_XS[1], V.BOTTLE_Y, 154];
const BOURBON: Point3 = [V.BOTTLE_XS[2], V.BOTTLE_Y, 144];
const RACK: Point3 = [-70, V.BOTTLE_Y, 140];
const DIAL: Point3 = [V.TANK[0], V.TANK[1], V.DIAL_TOP - 3];
const TANK: Point3 = [V.TANK[0], V.TANK[1], V.TANK_Z + 24];
const TANK_HIGH: Point3 = [V.TANK[0], V.TANK[1], V.TANK_TOP - 8];
const NOZZLE: Point3 = [V.SPOUT_X, V.TANK[1], V.TANK_TOP - 4];
const VALVE: Point3 = [V.VALVE[0] + 4, V.VALVE[1], V.DRAIN_Z + 2];
const CUP: Point3 = [V.CUP[0] - 3, V.CUP[1], V.PLATFORM_TOP + 6];
const DRAWER: Point3 = [V.DRAWER_X + V.DRAWER_W / 2, V.DRAWER_FRONT_Y + 20, V.HOUSING_Z + 6];
const BASE_LOW: Point3 = [V.TANK[0], V.TANK[1], V.TANK_Z + 6];
const WIDE: Point3 = [-10, 0, 82];
const WIDE_HIGH: Point3 = [-10, 0, 98];

const WIDE_Z = 0.98;
const MEDIUM = 2.0; // the tank and its gauge
const RACK_Z = 2.3; // the three bottles
const CLOSE = 4.8; // one bottle
const TIGHT = 4.2; // the dial face

type Cue = (k: BeatKey, word: string) => number;

function shotsOf(variant: Variant, starts: Record<string, number>, c: Cue, end: (k: BeatKey) => number): Shot[] {
  const shots: Shot[] = [];
  const add = (shot: Shot) => shots.push(shot);
  const hook = VARIANTS[variant][0];
  const cta = VARIANTS[variant][VARIANTS[variant].length - 1];
  void end;

  // Hook: frame 0 is the beer pouring in close-up, then the wine, the rack and the dial.
  add({ at: 0, focus: BEER, zoom: CLOSE, azimuth: 36, elevation: 26, drift: { zoom: 0.08, azimuth: 5 }, callout: { text: "Cerveza", point: BEER, side: "right" } });
  if (hook === "hookInstagram") {
    add({ at: c(hook, "vino") - 2, focus: WINE, zoom: CLOSE, azimuth: 44, elevation: 26, move: 18, callout: { text: "Vino", point: WINE, side: "right" } });
    add({ at: c(hook, "resaca") + 2, focus: TANK_HIGH, zoom: MEDIUM, azimuth: 52, elevation: 32, move: 24 });
    add({ at: c(hook, "ensayo") - 4, focus: WIDE, zoom: 1.05, azimuth: 60, elevation: 30, move: 26, drift: { azimuth: 6 } });
    add({ at: c(hook, "no") - 6, focus: DIAL, zoom: TIGHT, azimuth: 56, elevation: 44, move: 20, callout: { text: "Etanol total", point: DIAL, side: "right" } });
  } else {
    add({ at: c(hook, "vino") - 2, focus: WINE, zoom: CLOSE, azimuth: 44, elevation: 26, move: 18, callout: { text: "Vino", point: WINE, side: "right" } });
    add({ at: c(hook, "órdenes") - 2, focus: RACK, zoom: RACK_Z, azimuth: 30, elevation: 24, move: 22, drift: { azimuth: 24 } });
    add({ at: c(hook, "misma") - 8, focus: DIAL, zoom: TIGHT, azimuth: 56, elevation: 44, move: 22, callout: { text: "Etanol total", point: DIAL, side: "right" } });
  }

  // Ensayo: the two drinks, the reverse order as an orbit, the same reading.
  add({ at: starts.ensayo, focus: WIDE, zoom: 1.0, azimuth: 58, elevation: 30, move: 26, drift: { azimuth: -6 } });
  add({ at: c("ensayo", "noventa") - 4, focus: RACK, zoom: RACK_Z, azimuth: 40, elevation: 24, move: 22, callout: { text: "Cerveza · vino · bourbon", point: [-72, V.BOTTLE_Y, 150], side: "right" } });
  add({ at: c("ensayo", "cerveza") - 3, focus: BEER, zoom: CLOSE, azimuth: 34, elevation: 26, move: 18, callout: { text: "Cerveza", point: BEER, side: "right" } });
  add({ at: c("ensayo", "vino") - 2, focus: WINE, zoom: CLOSE, azimuth: 46, elevation: 26, move: 18, callout: { text: "Vino", point: WINE, side: "right" } });
  add({ at: c("ensayo", "revés") - 4, focus: RACK, zoom: RACK_Z, azimuth: 44, elevation: 28, move: 22, drift: { azimuth: 30, zoom: 0.02 } });
  add({ at: c("ensayo", "misma") - 8, focus: DIAL, zoom: TIGHT, azimuth: 60, elevation: 46, move: 22, callout: { text: "Etanol total", point: DIAL, side: "right" } });

  // Realidad: the tank, the liquid and the valve, revealed from black.
  add({ at: starts.realidad, focus: TANK, zoom: MEDIUM, azimuth: 68, elevation: 26, move: 20, drift: { azimuth: 6, zoom: 0.08 } });
  add({ at: c("realidad", "salir") - 10, focus: [66, 10, 24], zoom: 3.2, azimuth: 66, elevation: 28, move: 26, callout: { text: "Lo que sale", point: VALVE, side: "right" } });

  // Hígado: the valve opens and drips; the level answers.
  add({ at: starts.higado, focus: [60, 10, 30], zoom: 2.4, azimuth: 60, elevation: 28, move: 22 });
  add({ at: c("higado", "procesa") - 4, focus: VALVE, zoom: 4.8, azimuth: 64, elevation: 30, move: 22, drift: { azimuth: 5 }, callout: { text: "Hígado: ≈ 1 trago/hora", point: VALVE, side: "right" } });
  add({ at: c("higado", "hora") + 2, focus: CUP, zoom: 5.2, azimuth: 70, elevation: 34, move: 20, drift: { zoom: 0.06 } });
  add({ at: c("higado", "sube") - 10, focus: TANK_HIGH, zoom: MEDIUM, azimuth: 50, elevation: 24, move: 24, drift: { elevation: 6 } });

  // Congéneres: the three bottles, then the bourbon, then the sediment tray.
  add({ at: starts.congeneres, focus: RACK, zoom: RACK_Z, azimuth: 40, elevation: 26, move: 24, drift: { azimuth: -6 } });
  add({ at: c("congeneres", "oscuras") - 6, focus: BOURBON, zoom: CLOSE, azimuth: 28, elevation: 24, move: 20, callout: { text: "Bourbon", point: BOURBON, side: "right" } });
  add({ at: c("congeneres", "suelen") - 4, focus: DRAWER, zoom: 3.2, azimuth: 14, elevation: 32, move: 26, drift: { zoom: 0.05 }, callout: { text: "Congéneres", point: [V.DRAWER_X + V.DRAWER_W / 2, V.DRAWER_FRONT_Y + 16, -2], side: "right" } });

  // Velocidad: the stream, the base, the bubbles from above, then wide.
  add({ at: starts.velocidad, focus: NOZZLE, zoom: 4.0, azimuth: 56, elevation: 30, move: 24 });
  add({ at: c("velocidad", "vacío") - 4, focus: BASE_LOW, zoom: 3.0, azimuth: 44, elevation: 18, move: 20 });
  add({ at: c("velocidad", "burbujas") - 4, focus: TANK, zoom: 3.6, azimuth: 82, elevation: 36, move: 22, callout: { text: "Burbujas", point: [V.TANK[0], V.TANK[1], 52], side: "right" } });
  add({ at: c("velocidad", "poco") - 4, focus: WIDE_HIGH, zoom: WIDE_Z, azimuth: 40, elevation: 32, move: 26 });

  // Por qué: black, then an orbit across the drinks as they mix, then the needle.
  const mix = c("porque", "mezclar");
  add({ at: starts.porque, focus: RACK, zoom: RACK_Z, azimuth: 18, elevation: 26, move: 20, drift: { azimuth: 52 } });
  add({ at: c("porque", "cuenta") - 6, focus: DIAL, zoom: TIGHT, azimuth: 62, elevation: 48, move: 20, callout: { text: "Etanol total", point: DIAL, side: "right" } });
  add({ at: c("porque", "dulces") - 4, focus: TANK, zoom: MEDIUM, azimuth: 72, elevation: 28, move: 24, drift: { azimuth: -8 } });
  void mix;

  // Chile: a slow wide orbit, then the gauge.
  add({ at: starts.chile, focus: WIDE, zoom: 1.0, azimuth: 70, elevation: 32, move: 26, drift: { azimuth: -28 } });
  add({ at: c("chile", "emborrachó") - 6, focus: TANK_HIGH, zoom: 1.8, azimuth: 44, elevation: 36, move: 24 });

  // Cierre: pull out and orbit while the bench comes apart.
  add({ at: starts[cta], focus: WIDE_HIGH, zoom: 1.02, azimuth: 46, elevation: 30, move: 26, drift: { zoom: -0.12, azimuth: 26, elevation: 8 } });
  return shots;
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
    // Assembled from the first frame; it comes apart only in the closing beat.
    return settled((frame - program.apartFrom) / REEL_FPS - order * STAGGER * 2.2);
  });

  const lit = program.lit.find((l) => frame >= l.from && frame <= l.to)?.part ?? "none";
  const drawerOut = lit === "drawer" ? smooth((frame - (program.lit.find((l) => l.part === "drawer")?.from ?? 0)) / (REEL_FPS * 0.9)) : 0;

  // Camera: a slow drift of azimuth over the whole reel.
  const azimuth = 46 + 8 * (0.5 - 0.5 * Math.cos((2 * Math.PI * frame) / program.total));

  return { frame, drinks, pouring, pourFlow, valveOpen, drained, congeners, drawerOut, lit, explode, azimuth, bubbles };
}

export const readingOf = (drinks: number) => (Math.round(drinks * 10) / 10).toFixed(1).replace(".", ",");
