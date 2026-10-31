// Every part of the bench, built for one projection and one model state,
// grouped by assembly and listed in painter's order (back to front, bottom
// to top). Static and moving parts are rebuilt together: Remotion renders
// offline and the camera moves, so there is nothing to cache.
//
// Version 3, "grabado industrial": a riveted iron stand instead of a desk
// plate, bigger bottles with lettered labels, brass bands and flanges. The
// hand-drawn look (hatched shading, wobbling lines, warm paper) is applied
// by the CSS and the SVG filter in Bench.tsx, not here.
import {
  cylinder,
  depthOf,
  insetPlan,
  iso,
  knurl,
  lineOnTop,
  onTop,
  pathOf,
  planOutline,
  radialTicks,
  ring,
  sideArc,
  sideMatrix,
  slabOf,
  topMatrix,
  towardViewer,
  translateAlong,
  type Flat,
  type LineTone,
  type Plan,
  type Point3,
  type Projection,
  type SolidPaths,
  type Tone,
} from "../../iso/iso-kit";
import { ASSEMBLIES, Assembly, BenchState, Bottle, EXPLODE } from "./model";
import * as V from "./view";

export type Item =
  | { kind: "solid"; paths: SolidPaths; tone?: Tone; crease?: Tone | "none"; lit?: boolean; cls?: string; flat?: boolean; style?: Record<string, string | number> }
  | { kind: "line"; d: string; tone?: LineTone; free?: boolean | "start" | "end"; cls?: string; width?: number; opacity?: number }
  | { kind: "dots"; points: Flat[]; size?: number; tone?: Tone }
  | { kind: "halo"; d: string; blur?: number; opacity?: number }
  | { kind: "fill"; d: string; fill: string; opacity: number }
  | { kind: "text"; transform: string; text: string; size?: number; tone?: Tone; anchor?: "start" | "middle" | "end"; cls?: string };

export interface Group {
  name: string;
  assembly: Assembly;
  transform?: string;
  items: Item[];
}

const RAD = Math.PI / 180;

const solid = (paths: SolidPaths, tone: Tone = "mid", extra: Partial<Extract<Item, { kind: "solid" }>> = {}): Item => ({ kind: "solid", paths, tone, ...extra });
const line = (d: string, tone: LineTone = "lo", extra: Partial<Extract<Item, { kind: "line" }>> = {}): Item => ({ kind: "line", d, tone, ...extra });
const dots = (points: Flat[], size = 0.5, tone: Tone = "mid"): Item => ({ kind: "dots", points, size, tone });

const byDepth = (P: Projection) => (points: [number, number][]) => [...points].sort((a, b) => depthOf([a[0], a[1], 0], P) - depthOf([b[0], b[1], 0], P));

// Points on a cylinder's surface, by angle (degrees) and height.
const onSurface = (cx: number, cy: number, r: number, deg: number, z: number): Point3 => [cx + r * Math.cos(deg * RAD), cy + r * Math.sin(deg * RAD), z];

// Angle on the floor that faces the viewer.
const facingDeg = (P: Projection) => {
  const [vx, vy] = towardViewer(P);
  return Math.atan2(vy, vx) / RAD;
};

// Text on the side of a cylinder: a tangent plane at the point that faces the
// viewer, local x along the surface (left to right on screen), local y down.
function facingMatrix(cx: number, cy: number, r: number, z: number, P: Projection) {
  const [vx, vy] = towardViewer(P);
  const ox = cx + r * vx;
  const oy = cy + r * vy;
  const o = iso([ox, oy, z], P);
  const u = iso([ox + vy, oy - vx, z], P);
  const d = iso([ox, oy, z - 1], P);
  const f = (n: number) => Math.round(n * 1000) / 1000;
  return `matrix(${f(u[0] - o[0])} ${f(u[1] - o[1])} ${f(d[0] - o[0])} ${f(d[1] - o[1])} ${f(o[0])} ${f(o[1])})`;
}

// Rivets along a line on top of something.
function rivetRow(P: Projection, from: Point3, to: Point3, step: number): Flat[] {
  const out: Flat[] = [];
  const len = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const n = Math.max(1, Math.floor(len / step));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    out.push(iso([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2]], P));
  }
  return out;
}

// The drinks are the one place with colour: each bottle's liquid shows
// through thin glass, and the label names it in lettering.
export const TINT: Record<Bottle, { color: string; alpha: number }> = {
  beer: { color: "#d9960f", alpha: 0.62 },
  wine: { color: "#7a1530", alpha: 0.72 },
  whisky: { color: "#8a4a12", alpha: 0.68 },
};
export const NAME: Record<Bottle, string> = { beer: "CERVEZA", wine: "VINO", whisky: "BOURBON" };
const BRASS = { "--tint": "#b98b3a", "--tint-a": 0.5 };

const tinted = (paths: SolidPaths, kind: Bottle, extraAlpha = 1): Item => ({
  kind: "solid",
  paths,
  tone: "mid",
  crease: "none",
  cls: "bench-tint",
  style: { "--tint": TINT[kind].color, "--tint-a": TINT[kind].alpha * extraAlpha },
});
const brass = (paths: SolidPaths): Item => ({ kind: "solid", paths, tone: "mid", crease: "none", cls: "bench-tint bench-brass", style: BRASS });
const glass = (paths: SolidPaths, lit = false): Item => ({ kind: "solid", paths, tone: "mid", crease: "none", cls: "bench-bottle", lit });

interface BottleSpec {
  neckR: number;
  neckTop: number;
  shoulder: Array<[number, number, number]>; // [r, z0, z1]
  bodyR: number;
  bodyZ: number;
  bodyTop: number;
  labelZ: [number, number];
  clampZ: number;
}
const SPECS: Record<Exclude<Bottle, "whisky">, BottleSpec> = {
  beer: { neckR: 3.1, neckTop: 134, shoulder: [[5.5, 134, 138], [7.3, 138, 141]], bodyR: 8.1, bodyZ: 141, bodyTop: 173, labelZ: [149, 156], clampZ: 166 },
  wine: { neckR: 3.4, neckTop: 129, shoulder: [[5.7, 129, 133], [8.1, 133, 137]], bodyR: 9.1, bodyZ: 137, bodyTop: 173, labelZ: [146, 154], clampZ: 166 },
};
const BOURBON = { neckR: 3.9, neckTop: 121, w: 19.5, bodyZ: 126, bodyTop: 163, labelZ: [137, 145] as [number, number], clampZ: 151 };

export const clampOuter = (kind: Bottle) => (kind === "whisky" ? BOURBON.w / 2 + 1.6 : SPECS[kind].bodyR + 1.5);
export const clampZOf = (kind: Bottle) => (kind === "whisky" ? BOURBON.clampZ : SPECS[kind].clampZ);

function bottleParts(P: Projection, kind: Bottle, bx: number, lit: boolean): Item[] {
  const by = V.BOTTLE_Y;
  const top = V.MANIFOLD_TOP;
  const items: Item[] = [];
  if (kind !== "whisky") {
    const s = SPECS[kind];
    // Liquid, then glass, then the paper label with its lettering, the base and the clamp.
    items.push(tinted(cylinder(bx, by, s.neckR - 0.8, top, s.neckTop - top, P, 14), kind));
    items.push(tinted(cylinder(bx, by, s.bodyR - 0.9, s.bodyZ + 0.5, s.bodyTop - s.bodyZ - 1.5, P, 36), kind));
    items.push(glass(cylinder(bx, by, s.neckR, top, s.neckTop - top, P, 22)));
    for (const [r, z0, z1] of s.shoulder) items.push(glass(cylinder(bx, by, r, z0, z1 - z0, P, 28)));
    items.push(glass(cylinder(bx, by, s.bodyR, s.bodyZ, s.bodyTop - s.bodyZ, P, 40), lit));
    items.push(solid(cylinder(bx, by, s.bodyR + 0.25, s.labelZ[0], s.labelZ[1] - s.labelZ[0], P, 40), "hi", { crease: "none" }));
    items.push(line(sideArc(bx, by, s.bodyR + 0.3, s.labelZ[0] + 1.1, P, 24) + sideArc(bx, by, s.bodyR + 0.3, s.labelZ[1] - 1.1, P, 24), "faint"));
    items.push({ kind: "text", transform: facingMatrix(bx, by, s.bodyR + 0.35, (s.labelZ[0] + s.labelZ[1]) / 2 - 1.2, P), text: NAME[kind], size: 2.9, tone: "hi", anchor: "middle", cls: "bench-label" });
    items.push(solid(cylinder(bx, by, s.bodyR + 0.3, s.bodyTop, 1.8, P, 40), "mid"));
    const cr = clampOuter(kind);
    items.push(solid(cylinder(bx, by, cr, s.clampZ, 3.5, P, 40), "mid"));
    items.push(line(knurl(bx, by, cr, s.clampZ, s.clampZ + 3.5, 48, P, 0.6), "faint"));
    items.push(dots([iso([bx + cr * Math.cos(facingDeg(P) * RAD), by + cr * Math.sin(facingDeg(P) * RAD), s.clampZ + 1.75], P)], 0.55));
  } else {
    const b = BOURBON;
    const plan: Plan = { x: bx - b.w / 2, y: by - b.w / 2, w: b.w, d: b.w, r: 3.2 };
    items.push(tinted(cylinder(bx, by, b.neckR - 0.9, top, b.neckTop - top, P, 14), kind));
    items.push(tinted(slabOf(insetPlan(plan, 1.5), b.bodyZ + 0.5, b.bodyTop - b.bodyZ - 2, P, 4), kind));
    items.push(glass(cylinder(bx, by, b.neckR, top, b.neckTop - top, P, 22)));
    items.push(glass(slabOf({ x: bx - 7.2, y: by - 7.2, w: 14.4, d: 14.4, r: 4.5 }, b.neckTop, b.bodyZ - b.neckTop, P, 5)));
    items.push(glass(slabOf(plan, b.bodyZ, b.bodyTop - b.bodyZ, P, 5, 0.8), lit));
    const label = insetPlan(plan, -0.3);
    items.push(solid(slabOf(label, b.labelZ[0], b.labelZ[1] - b.labelZ[0], P, 5), "hi", { crease: "none" }));
    items.push({ kind: "text", transform: sideMatrix([bx, label.y + label.d], (b.labelZ[0] + b.labelZ[1]) / 2 - 1.2, P, "left"), text: NAME[kind], size: 2.9, tone: "hi", anchor: "middle", cls: "bench-label" });
    items.push(line(planOutline(insetPlan(plan, 2.6), b.bodyTop, P, 5), "faint"));
    items.push(solid(slabOf(insetPlan(plan, -0.4), b.bodyTop, 1.8, P, 5), "mid"));
    const c = clampOuter(kind);
    items.push(solid(slabOf({ x: bx - c, y: by - c, w: 2 * c, d: 2 * c, r: 4 }, b.clampZ, 3.5, P, 5, 0.4), "mid"));
    items.push(dots([iso([bx + c, by + c - 4, b.clampZ + 1.75], P), iso([bx + c - 4, by + c, b.clampZ + 1.75], P)], 0.55));
  }
  return items;
}

function clampArm(P: Projection, bx: number, kind: Bottle): Item[] {
  const outer = clampOuter(kind);
  const z = clampZOf(kind);
  const from = V.BAR.y + V.BAR.d - 4;
  const arm: Plan = { x: bx - 2.6, y: from, w: 5.2, d: V.BOTTLE_Y - outer - from + 0.3, r: 1 };
  return [solid(slabOf(arm, z - 0.5, 4.5, P, 3, 0.4), "mid"), dots([iso([bx, from + 2.2, z + 4], P), iso([bx, arm.y + arm.d - 2.2, z + 4], P)], 0.5)];
}

// An I-beam along x or y: two flanges and a web.
function beam(P: Projection, plan: Plan, along: "x" | "y"): Item[] {
  const web = along === "x" ? { ...plan, y: plan.y + 3.5, d: plan.d - 7 } : { ...plan, x: plan.x + 3.5, w: plan.w - 7 };
  return [
    solid(slabOf(plan, 0, 2.2, P, 3, 0.3), "mid"),
    solid(slabOf(web, 2.2, V.BEAM_H - 4.4, P, 3), "mid", { crease: "none" }),
    solid(slabOf(plan, V.BEAM_H - 2.2, 2.2, P, 3, 0.5), "mid"),
  ];
}

export function buildBench(P: Projection, s: BenchState): Group[] {
  const at = (p: Point3) => V.at(P, p);
  const sorted = byDepth(P);
  const face = facingDeg(P);
  const groups: Group[] = [];
  const share = (a: Assembly) => s.explode[ASSEMBLIES.indexOf(a)] ?? 0;
  const moveOf = (a: Assembly) => {
    const k = share(a);
    if (k <= 0.0005) return undefined;
    const [mx, my, mz] = EXPLODE[a].move;
    return translateAlong(P, [mx * k, my * k, mz * k]);
  };
  const put = (name: string, assembly: Assembly, items: Item[]) => groups.push({ name, assembly, transform: moveOf(assembly), items });

  // ---------- stand: feet, two beams along x, two cross beams, rivets, platform, nameplate ----------
  const base: Item[] = [];
  const back: Plan = { x: V.BEAM_X0, y: -V.BEAM_Y - V.BEAM_D / 2, w: V.BEAM_X1 - V.BEAM_X0, d: V.BEAM_D, r: 0.8 };
  const front: Plan = { ...back, y: V.BEAM_Y - V.BEAM_D / 2 };
  const left: Plan = { x: V.BEAM_X0, y: -V.BEAM_Y + V.BEAM_D / 2, w: V.BEAM_D, d: V.BEAM_Y * 2 - V.BEAM_D, r: 0.8 };
  const right: Plan = { ...left, x: V.BEAM_X1 - V.BEAM_D };
  for (const plan of [back, left, right, front]) base.push({ kind: "halo", d: slabOf(plan, -V.FOOT_H, 3, P, 3).fill });
  base.push({ kind: "halo", d: slabOf(V.PLATFORM, -V.FOOT_H, 3, P, 3).fill });
  const feet: [number, number][] = [
    [V.BEAM_X0 + 10, -V.BEAM_Y],
    [V.BEAM_X1 - 10, -V.BEAM_Y],
    [V.BEAM_X0 + 10, V.BEAM_Y],
    [V.BEAM_X1 - 10, V.BEAM_Y],
  ];
  for (const [x, y] of sorted(feet)) {
    base.push(solid(cylinder(x, y, 8.5, -V.FOOT_H, 1.6, P, 28), "lo"));
    base.push(solid(cylinder(x, y, 6.5, -V.FOOT_H + 1.6, V.FOOT_H - 1.6, P, 28), "mid"));
  }
  base.push(...beam(P, back, "x"));
  base.push(...beam(P, left, "y"));
  base.push(...beam(P, right, "y"));
  base.push(...beam(P, front, "x"));
  const rivets: Flat[] = [];
  for (const y of [-V.BEAM_Y - 3.8, -V.BEAM_Y + 3.8, V.BEAM_Y - 3.8, V.BEAM_Y + 3.8]) rivets.push(...rivetRow(P, [V.BEAM_X0 + 6, y, V.BEAM_TOP], [V.BEAM_X1 - 6, y, V.BEAM_TOP], 10));
  for (const x of [V.BEAM_X0 + 2.4, V.BEAM_X0 + V.BEAM_D - 2.4, V.BEAM_X1 - V.BEAM_D + 2.4, V.BEAM_X1 - 2.4]) rivets.push(...rivetRow(P, [x, -V.BEAM_Y + V.BEAM_D / 2 + 6, V.BEAM_TOP], [x, V.BEAM_Y - V.BEAM_D / 2 - 6, V.BEAM_TOP], 10));
  base.push(dots(rivets, 0.62, "mid"));
  // Platform under the tank, cup and valve, with a groove and corner bolts.
  base.push(solid(slabOf(V.PLATFORM, V.PLATFORM_Z, V.PLATFORM_H, P, 3, 0.6), "mid"));
  base.push(line(planOutline(insetPlan(V.PLATFORM, 4), V.PLATFORM_TOP, P, 3), "faint"));
  base.push(dots([
    at([V.PLATFORM.x + 4, V.PLATFORM.y + 4, V.PLATFORM_TOP]),
    at([V.PLATFORM.x + V.PLATFORM.w - 4, V.PLATFORM.y + 4, V.PLATFORM_TOP]),
    at([V.PLATFORM.x + 4, V.PLATFORM.y + V.PLATFORM.d - 4, V.PLATFORM_TOP]),
    at([V.PLATFORM.x + V.PLATFORM.w - 4, V.PLATFORM.y + V.PLATFORM.d - 4, V.PLATFORM_TOP]),
  ], 0.7));
  // Brass nameplate standing on the front beam, lettered on its front face.
  base.push(brass(slabOf(V.NAMEPLATE, V.NAMEPLATE_Z, V.NAMEPLATE_H, P, 3, 0.4)));
  const plateFaceY = V.NAMEPLATE.y + V.NAMEPLATE.d;
  base.push({ kind: "text", transform: sideMatrix([V.NAMEPLATE.x + V.NAMEPLATE.w / 2, plateFaceY], V.NAMEPLATE_Z + V.NAMEPLATE_H - 3.4, P, "left"), text: "BANCO DE ENSAYO · ETANOL TOTAL", size: 3.1, tone: "hi", anchor: "middle", cls: "bench-label" });
  base.push(dots([
    at([V.NAMEPLATE.x + 3, plateFaceY, V.NAMEPLATE_Z + 2.4]),
    at([V.NAMEPLATE.x + V.NAMEPLATE.w - 3, plateFaceY, V.NAMEPLATE_Z + 2.4]),
    at([V.NAMEPLATE.x + 3, plateFaceY, V.NAMEPLATE_Z + V.NAMEPLATE_H - 2.4]),
    at([V.NAMEPLATE.x + V.NAMEPLATE.w - 3, plateFaceY, V.NAMEPLATE_Z + V.NAMEPLATE_H - 2.4]),
  ], 0.55));
  // Tank pedestal with a brass band.
  base.push(solid(cylinder(V.TANK[0], V.TANK[1], V.PEDESTAL_R, V.PEDESTAL_Z, V.PEDESTAL_H, P, 56, 0.8), "lo"));
  base.push(brass(cylinder(V.TANK[0], V.TANK[1], V.PEDESTAL_R + 0.4, V.PEDESTAL_Z + V.PEDESTAL_H - 3, 2.4, P, 56)));
  put("base", "base", base);

  // ---------- sediment tray in a riveted housing on the front beam ----------
  const drawer: Item[] = [];
  const out = s.drawerOut * 28;
  drawer.push(solid(slabOf(V.HOUSING, V.HOUSING_Z, V.HOUSING_H, P, 3, 0.6), "mid"));
  drawer.push(dots(rivetRow(P, [V.HOUSING.x + 2.5, V.HOUSING.y + 2.5, V.HOUSING_Z + V.HOUSING_H], [V.HOUSING.x + V.HOUSING.w - 2.5, V.HOUSING.y + 2.5, V.HOUSING_Z + V.HOUSING_H], 8), 0.55));
  drawer.push(dots(rivetRow(P, [V.HOUSING.x + 2.5, V.HOUSING.y + V.HOUSING.d - 2.5, V.HOUSING_Z + V.HOUSING_H], [V.HOUSING.x + V.HOUSING.w - 2.5, V.HOUSING.y + V.HOUSING.d - 2.5, V.HOUSING_Z + V.HOUSING_H], 8), 0.55));
  put("housing", "base", drawer);
  const tray: Item[] = [];
  if (out > 0.3) {
    const box: Plan = { x: V.DRAWER_X, y: V.DRAWER_FRONT_Y, w: V.DRAWER_W, d: out, r: 1 };
    tray.push(solid(slabOf(box, V.HOUSING_Z + 2, V.HOUSING_H - 4, P, 3, 0.4), "mid"));
    const pad = insetPlan(box, 1.8);
    if (pad.d > 1) tray.push({ kind: "fill", d: planOutline(pad, V.HOUSING_Z + V.HOUSING_H - 2, P, 3), fill: "var(--bench-sediment)", opacity: 0.12 + 0.8 * s.congeners });
    tray.push(line(planOutline(pad, V.HOUSING_Z + V.HOUSING_H - 2, P, 3), "faint"));
  }
  const frontPlate: Plan = { x: V.DRAWER_X - 1, y: V.DRAWER_FRONT_Y + out, w: V.DRAWER_W + 2, d: 2.6, r: 1 };
  tray.push(solid(slabOf(frontPlate, V.HOUSING_Z + 1, V.HOUSING_H - 2, P, 3, 0.5), "mid", { lit: s.lit === "drawer" }));
  tray.push(solid(slabOf({ x: V.DRAWER_X + V.DRAWER_W / 2 - 7, y: V.DRAWER_FRONT_Y + out + 2.6, w: 14, d: 2, r: 1 }, V.HOUSING_Z + 4.5, 2.6, P, 3), "mid", { crease: "none" }));
  tray.push(dots([at([V.DRAWER_X + 3, V.DRAWER_FRONT_Y + out + 2.6, V.HOUSING_Z + 6]), at([V.DRAWER_X + V.DRAWER_W - 3, V.DRAWER_FRONT_Y + out + 2.6, V.HOUSING_Z + 6])], 0.5));
  put("drawer", "drawer", tray);

  // ---------- rack: posts (lower), manifold, posts (upper), bar ----------
  const rackLower: Item[] = [];
  for (const [x, y] of sorted(V.POSTS)) {
    rackLower.push(solid(cylinder(x, y, V.POST_R + 2, V.BEAM_TOP, 3, P, 28), "mid"));
    rackLower.push(solid(cylinder(x, y, V.POST_R, V.BEAM_TOP + 3, V.MANIFOLD_Z - V.BEAM_TOP - 3, P, 28), "mid", { crease: "none" }));
    rackLower.push(line(sideArc(x, y, V.POST_R, 46, P, 14) + sideArc(x, y, V.POST_R, 76, P, 14), "faint"));
  }
  put("rack-lower", "base", rackLower);

  const manifold: Item[] = [];
  manifold.push(solid(slabOf(V.MANIFOLD, V.MANIFOLD_Z, V.MANIFOLD_H, P, 6, 1.2), "mid"));
  manifold.push(line(planOutline(insetPlan(V.MANIFOLD, 3.2), V.MANIFOLD_TOP, P, 6), "faint"));
  manifold.push(dots(rivetRow(P, [V.MANIFOLD.x + 4, V.MANIFOLD.y + 3.2, V.MANIFOLD_TOP], [V.MANIFOLD.x + V.MANIFOLD.w - 4, V.MANIFOLD.y + 3.2, V.MANIFOLD_TOP], 9), 0.6));
  manifold.push(dots(rivetRow(P, [V.MANIFOLD.x + 4, V.MANIFOLD.y + V.MANIFOLD.d - 3.2, V.MANIFOLD_TOP], [V.MANIFOLD.x + V.MANIFOLD.w - 4, V.MANIFOLD.y + V.MANIFOLD.d - 3.2, V.MANIFOLD_TOP], 9), 0.6));
  const kinds: Bottle[] = ["beer", "wine", "whisky"];
  V.BOTTLE_XS.forEach((bx, i) => {
    const kind = kinds[i];
    const open = s.pouring === kind ? s.pourFlow : 0;
    manifold.push(line(ring(bx, V.BOTTLE_Y, V.NECK_R + 1.6, V.MANIFOLD_TOP, P, 24), "lo"));
    const kx = bx - 11;
    manifold.push(brass(cylinder(kx, V.BOTTLE_Y, 2.9, V.MANIFOLD_TOP, 3.8, P, 22)));
    manifold.push(line(knurl(kx, V.BOTTLE_Y, 2.9, V.MANIFOLD_TOP, V.MANIFOLD_TOP + 3.8, 20, P), "lo"));
    const a = (-90 + 80 * open) * RAD;
    manifold.push(line(lineOnTop([kx, V.BOTTLE_Y], [kx + 2.4 * Math.cos(a), V.BOTTLE_Y + 2.4 * Math.sin(a)], V.MANIFOLD_TOP + 3.8, P), open > 0.05 ? "lit" : "hi"));
    const plate: Plan = { x: bx - 9.5, y: -24.4, w: 19, d: 6, r: 1 };
    manifold.push(brass(slabOf(plate, V.MANIFOLD_TOP, 0.9, P, 3)));
    manifold.push({ kind: "text", transform: topMatrix([bx, -20.3], V.MANIFOLD_TOP + 0.9, P, "x"), text: NAME[kind], size: 2.8, tone: "hi", anchor: "middle", cls: "bench-label" });
  });
  // Spout, first leg: along x behind the tank, to the first elbow, with a flange at the manifold.
  const spoutY = V.BOTTLE_Y;
  const legStart = V.MANIFOLD.x + V.MANIFOLD.w;
  manifold.push(solid(slabOf({ x: legStart, y: spoutY - V.PIPE_R, w: V.SPOUT_X - legStart, d: V.PIPE_R * 2, r: V.PIPE_R - 0.2 }, V.SPOUT_Z - V.PIPE_R, V.PIPE_R * 2, P, 3), "mid", { crease: "none" }));
  manifold.push(solid(slabOf({ x: legStart - 0.6, y: spoutY - 4, w: 2.6, d: 8, r: 1.2 }, V.SPOUT_Z - 4, 8, P, 3, 0.3), "mid"));
  manifold.push(solid(slabOf({ x: V.SPOUT_X - 3.6, y: spoutY - 3.6, w: 7.2, d: 7.2, r: 1.6 }, V.SPOUT_Z - 3.6, 7.2, P, 3, 0.4), "mid"));
  put("manifold", "manifold", manifold);

  const rackUpper: Item[] = [];
  for (const [x, y] of sorted(V.POSTS)) {
    rackUpper.push(solid(cylinder(x, y, V.POST_R, V.MANIFOLD_TOP, V.POST_TOP - V.MANIFOLD_TOP, P, 28), "mid", { crease: "none" }));
    rackUpper.push(line(sideArc(x, y, V.POST_R, 140, P, 14) + sideArc(x, y, V.POST_R, 160, P, 14), "faint"));
  }
  put("rack-upper", "base", rackUpper);

  const bottleOrder = V.BOTTLE_XS.map((bx, i) => ({ bx, i })).sort((a, b) => depthOf([a.bx, V.BOTTLE_Y, 0], P) - depthOf([b.bx, V.BOTTLE_Y, 0], P));
  const bottles: Item[] = [];
  for (const { bx, i } of bottleOrder) bottles.push(...bottleParts(P, kinds[i], bx, s.lit === kinds[i]));
  put("bottles", "bottles", bottles);

  const bar: Item[] = [];
  for (const { bx, i } of bottleOrder) bar.push(...clampArm(P, bx, kinds[i]));
  bar.push(solid(slabOf(V.BAR, V.BAR_Z, V.BAR_H, P, 4, 0.8), "mid"));
  bar.push(dots(V.POSTS.map(([x, y]) => at([x, y, V.BAR_Z + V.BAR_H])), 0.65));
  bar.push(dots(rivetRow(P, [V.BAR.x + 6, V.BAR.y + V.BAR.d / 2, V.BAR_Z + V.BAR_H], [V.BAR.x + V.BAR.w - 6, V.BAR.y + V.BAR.d / 2, V.BAR_Z + V.BAR_H], 12), 0.5));
  put("bar", "rack", bar);

  // ---------- gauge post on the back beam ----------
  const gantry: Item[] = [];
  gantry.push(solid(cylinder(V.GANTRY[0], V.GANTRY[1], V.GANTRY_R + 2.2, V.BEAM_TOP, 3, P, 28), "mid"));
  gantry.push(solid(cylinder(V.GANTRY[0], V.GANTRY[1], V.GANTRY_R, V.BEAM_TOP + 3, V.ARM_Z - V.BEAM_TOP - 3, P, 28), "mid", { crease: "none" }));
  gantry.push(line(sideArc(V.GANTRY[0], V.GANTRY[1], V.GANTRY_R, 60, P, 14) + sideArc(V.GANTRY[0], V.GANTRY[1], V.GANTRY_R, 100, P, 14), "faint"));
  put("gantry", "base", gantry);

  // ---------- tank: liquid, stream, float and rod, glass, brass bands, scale ----------
  const [tx, ty] = V.TANK;
  const level = V.levelZ(s.drinks);
  const tank: Item[] = [];
  const MIX = { kind: "solid" as const, tone: "mid" as const, crease: "none" as const, cls: "bench-tint", style: { "--tint": "#d9a441", "--tint-a": 0.36 } };
  if (level > V.TANK_Z + 0.2) tank.push({ ...MIX, paths: cylinder(tx, ty, V.TANK_R - 1, V.TANK_Z, level - V.TANK_Z, P, 48) });
  if (s.bubbles > 0.02 && level > V.TANK_Z + 6) {
    const pts: Flat[] = [];
    for (let i = 0; i < 16; i++) {
      const a = (i * 137.5) % 360;
      const r = (V.TANK_R - 4) * (0.3 + ((i * 53) % 70) / 100);
      const zz = V.TANK_Z + 2 + ((s.frame * (0.5 + (i % 3) * 0.2) + i * 9) % (level - V.TANK_Z - 3));
      if (Math.cos((a - face) * RAD) > -0.2) pts.push(at([tx + r * Math.cos(a * RAD), ty + r * Math.sin(a * RAD), zz]));
    }
    tank.push({ kind: "dots", points: pts, size: 0.6 * s.bubbles + 0.2, tone: "mid" });
  }
  if (s.pouring && s.pourFlow > 0.03) {
    const r = 0.6 + 0.8 * s.pourFlow;
    const stream = tinted(cylinder(V.SPOUT_X, ty, r, level, V.NOZZLE_Z - level, P, 12), s.pouring, 1.4);
    if (stream.kind === "solid") stream.cls = "bench-tint bench-stream";
    tank.push(stream);
  }
  const floatTop = level + V.FLOAT_H;
  tank.push(solid(cylinder(tx, ty, V.FLOAT_R, level - 0.6, V.FLOAT_H, P, 32, 0.4), "hi", { lit: s.lit === "float" }));
  tank.push(line(ring(tx, ty, V.FLOAT_R - 2.6, floatTop - 0.6, P, 32), "faint"));
  tank.push(solid(cylinder(tx, ty, V.ROD_R, floatTop - 0.6, V.DIAL_Z - floatTop + 0.6, P, 12), "hi", { crease: "none", lit: s.lit === "float" || s.lit === "needle" }));
  tank.push(solid(cylinder(tx, ty, V.TANK_R, V.TANK_Z, V.TANK_TOP - V.TANK_Z, P, 56), "mid", { cls: "bench-glass", crease: "none" }));
  tank.push(line(ring(tx, ty, V.TANK_R, V.TANK_TOP, P, 56), "hi"));
  tank.push(line(ring(tx, ty, V.TANK_R - 1.2, V.TANK_TOP, P, 56), "faint"));
  // Brass bands that hold the glass.
  tank.push(brass(cylinder(tx, ty, V.TANK_R + 0.7, V.TANK_Z + 4, 2.6, P, 56)));
  tank.push(brass(cylinder(tx, ty, V.TANK_R + 0.7, V.TANK_TOP - 7, 2.6, P, 56)));
  tank.push(dots([at(onSurface(tx, ty, V.TANK_R + 0.75, face + 22, V.TANK_Z + 5.3)), at(onSurface(tx, ty, V.TANK_R + 0.75, face - 22, V.TANK_Z + 5.3)), at(onSurface(tx, ty, V.TANK_R + 0.75, face + 22, V.TANK_TOP - 5.7)), at(onSurface(tx, ty, V.TANK_R + 0.75, face - 22, V.TANK_TOP - 5.7))], 0.55));
  // Engraved scale on the wall facing the viewer: a meridian with ticks, one major per drink.
  const scaleDeg = face - 18;
  const z0 = V.TANK_Z + 7.5;
  const z1 = V.levelZ(V.CAPACITY);
  tank.push(line(pathOf([at(onSurface(tx, ty, V.TANK_R + 0.05, scaleDeg, z0)), at(onSurface(tx, ty, V.TANK_R + 0.05, scaleDeg, z1 + 1))]), "lo"));
  const minor: string[] = [];
  const major: string[] = [];
  for (let d = 1; d <= V.CAPACITY * 2; d++) {
    const z = V.levelZ(d / 2);
    if (z < z0) continue;
    const big = d % 2 === 0;
    const span = big ? 9 : 5;
    (big ? major : minor).push(pathOf([at(onSurface(tx, ty, V.TANK_R + 0.05, scaleDeg, z)), at(onSurface(tx, ty, V.TANK_R + 0.05, scaleDeg + span, z))]));
  }
  tank.push(line(minor.join(""), "lo"), line(major.join(""), "mid"));
  put("tank", "tank", tank);

  // ---------- spout, second leg over the tank, and the nozzle ----------
  const spout: Item[] = [];
  spout.push(solid(slabOf({ x: V.SPOUT_X - V.PIPE_R, y: spoutY, w: V.PIPE_R * 2, d: ty - spoutY, r: V.PIPE_R - 0.2 }, V.SPOUT_Z - V.PIPE_R, V.PIPE_R * 2, P, 3), "mid", { crease: "none" }));
  spout.push(solid(slabOf({ x: V.SPOUT_X - 3.6, y: ty - 3.6, w: 7.2, d: 7.2, r: 1.6 }, V.SPOUT_Z - 3.6, 7.2, P, 3, 0.4), "mid"));
  spout.push(solid(cylinder(V.SPOUT_X, ty, V.PIPE_R, V.NOZZLE_Z + 2.8, V.SPOUT_Z - 3.6 - V.NOZZLE_Z - 2.8, P, 16), "mid", { crease: "none" }));
  spout.push(brass(cylinder(V.SPOUT_X, ty, V.PIPE_R + 1.1, V.NOZZLE_Z, 2.8, P, 16)));
  put("spout", "manifold", spout);

  // ---------- drain valve, nozzle, drops and cup ----------
  const [vx, vy] = V.VALVE;
  const valve: Item[] = [];
  const pipeFrom = tx + V.TANK_R - 1;
  valve.push(solid(slabOf({ x: pipeFrom, y: vy - V.PIPE_R, w: vx - pipeFrom, d: V.PIPE_R * 2, r: V.PIPE_R - 0.2 }, V.DRAIN_Z - V.PIPE_R, V.PIPE_R * 2, P, 3), "mid", { crease: "none" }));
  valve.push(brass(slabOf({ x: pipeFrom + 0.6, y: vy - 4, w: 2.6, d: 8, r: 1.4 }, V.DRAIN_Z - 4, 8, P, 3, 0.4)));
  valve.push(brass(slabOf({ x: vx - V.VALVE_R - 3.2, y: vy - 4, w: 2.6, d: 8, r: 1.4 }, V.DRAIN_Z - 4, 8, P, 3, 0.4)));
  valve.push(solid(cylinder(vx, vy, V.VALVE_R, V.PLATFORM_TOP + 1, V.DRAIN_Z + 8 - V.PLATFORM_TOP - 1, P, 28), "mid", { lit: s.lit === "valve" }));
  valve.push(line(sideArc(vx, vy, V.VALVE_R, V.DRAIN_Z - 2, P, 14), "faint"));
  valve.push(solid(cylinder(vx, vy, 1.8, V.DRAIN_Z + 8, 2.5, P, 12), "mid", { crease: "none" }));
  const wheelZ = V.DRAIN_Z + 10.5;
  valve.push(brass(cylinder(vx, vy, 7, wheelZ, 2.6, P, 36)));
  valve.push(line(knurl(vx, vy, 7, wheelZ, wheelZ + 2.6, 30, P), "lo"));
  const wa = (-60 + 150 * s.valveOpen) * RAD;
  valve.push(line(lineOnTop([vx, vy], [vx + 5.4 * Math.cos(wa), vy + 5.4 * Math.sin(wa)], wheelZ + 2.6, P), s.lit === "valve" ? "lit" : "hi"));
  valve.push(line(ring(vx, vy, 1.5, wheelZ + 2.6, P, 12), "mid"));
  valve.push(solid(slabOf({ x: vx + V.VALVE_R - 0.5, y: vy - V.PIPE_R, w: V.NOZZLE_X - vx - V.VALVE_R + 0.5, d: V.PIPE_R * 2, r: V.PIPE_R - 0.2 }, V.DRAIN_Z - V.PIPE_R, V.PIPE_R * 2, P, 3), "mid", { crease: "none" }));
  valve.push(solid(cylinder(V.NOZZLE_X, vy, V.PIPE_R, V.PLATFORM_TOP + 10, V.DRAIN_Z - V.PIPE_R - V.PLATFORM_TOP - 10 + 0.2, P, 16), "mid", { crease: "none" }));
  valve.push(brass(cylinder(V.NOZZLE_X, vy, V.PIPE_R + 0.9, V.PLATFORM_TOP + 10, 1.8, P, 16)));
  const [cx, cy] = V.CUP;
  const cupLevel = 0.6 + Math.min(V.CUP_H - 1.5, s.drained * 2.4);
  valve.push({ ...MIX, paths: cylinder(cx, cy, V.CUP_R - 0.9, V.PLATFORM_TOP + 0.4, cupLevel, P, 36) });
  if (s.valveOpen > 0.05) {
    const pts: Flat[] = [];
    const top = V.PLATFORM_TOP + 10 - 0.4;
    const fall = top - (V.PLATFORM_TOP + cupLevel);
    for (let i = 0; i < 3; i++) {
      const phase = (s.frame * 0.09 + i / 3) % 1;
      pts.push(at([V.NOZZLE_X, vy, top - phase * phase * fall]));
    }
    valve.push({ kind: "dots", points: pts, size: 0.8, tone: "hi" });
  }
  valve.push(solid(cylinder(cx, cy, V.CUP_R, V.PLATFORM_TOP, V.CUP_H, P, 40), "mid", { cls: "bench-glass", crease: "none" }));
  valve.push(line(ring(cx, cy, V.CUP_R, V.PLATFORM_TOP + V.CUP_H, P, 40), "hi"));
  valve.push(line(sideArc(cx, cy, V.CUP_R, V.PLATFORM_TOP + 1.2, P, 24), "faint"));
  put("valve", "valve", valve);

  // ---------- gauge: arm, gusset, bushing, dial with a brass bezel, needle ----------
  const gauge: Item[] = [];
  const [gx, gy] = V.GANTRY;
  gauge.push(solid(cylinder(gx, gy, V.GANTRY_R + 2.4, V.ARM_Z - 2.2, 2.2, P, 28), "mid"));
  gauge.push(solid(slabOf({ x: gx - 3.8, y: gy - 3.4, w: 7.6, d: ty - gy + 3.4, r: 1.6 }, V.ARM_Z, V.ARM_H, P, 4, 0.6), "mid"));
  gauge.push(solid(slabOf({ x: gx - 2.4, y: gy + 4, w: 4.8, d: 16, r: 1 }, V.ARM_Z - 7, 7, P, 3, 0.4), "mid"));
  gauge.push(dots(rivetRow(P, [gx, gy + 8, V.ARM_Z + V.ARM_H], [gx, ty - 20, V.ARM_Z + V.ARM_H], 10), 0.5));
  gauge.push(solid(cylinder(tx, ty, 3.4, V.ARM_Z - 4.5, 4.5, P, 22), "mid"));
  gauge.push(brass(cylinder(tx, ty, V.DIAL_R + 0.5, V.DIAL_Z, 2.6, P, 64)));
  gauge.push(solid(cylinder(tx, ty, V.DIAL_R, V.DIAL_Z + 2.6, V.DIAL_H - 2.6, P, 64, 0.8), "hi", { crease: "lo" }));
  gauge.push(line(knurl(tx, ty, V.DIAL_R, V.DIAL_TOP - 3, V.DIAL_TOP, 72, P, 0.3), "faint"));
  gauge.push(line(sideArc(tx, ty, V.DIAL_R, V.DIAL_TOP - 3, P, 40), "faint"));
  gauge.push(line(ring(tx, ty, V.DIAL_R - 2.2, V.DIAL_TOP, P, 64), "lo"));
  const from = -V.DIAL_SWEEP / 2;
  const dialTicks = radialTicks(tx, ty, V.DIAL_R - 3, V.CAPACITY * 5, 5, V.DIAL_TOP, [1.3, 2.8], P, from * RAD, V.DIAL_SWEEP * RAD);
  gauge.push(line(dialTicks.minor, "lo"), line(dialTicks.major, "mid"));
  gauge.push({ kind: "text", transform: topMatrix([tx, ty + 7.2], V.DIAL_TOP, P, "x"), text: "TRAGOS", size: 2.3, tone: "lo", anchor: "middle", cls: "bench-label" });
  gauge.push(solid(slabOf({ x: tx + V.DIAL_R - 0.8, y: ty - 2.4, w: 4.8, d: 4.8, r: 1.2 }, V.DIAL_Z + 2, 4.8, P, 3), "mid"));
  gauge.push(brass(slabOf({ x: tx + V.DIAL_R + 3.8, y: ty - 3.2, w: 2.6, d: 6.4, r: 1.2 }, V.DIAL_Z + 1.2, 6.4, P, 3)));
  const angle = (from + (V.DIAL_SWEEP * Math.min(V.CAPACITY, s.drinks)) / V.CAPACITY) * RAD;
  const ux = Math.sin(angle);
  const uy = -Math.cos(angle);
  const tip: [number, number] = [tx + ux * (V.DIAL_R - 3.8), ty + uy * (V.DIAL_R - 3.8)];
  const tail: [number, number] = [tx - ux * 3.4, ty - uy * 3.4];
  gauge.push(line(lineOnTop(tail, tip, V.DIAL_TOP + 0.2, P), s.lit === "needle" ? "lit" : "hi", { width: 1.3, free: "start" }));
  gauge.push(line(ring(tx, ty, 1.6, V.DIAL_TOP + 0.2, P, 14), "mid"));
  put("gauge", "gauge", gauge);

  return groups;
}

export { onTop };
