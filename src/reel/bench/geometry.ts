// Every part of the bench, built for one projection and one model state,
// grouped by assembly and listed in painter's order (back to front, bottom
// to top). Static and moving parts are rebuilt together: Remotion renders
// offline and the camera drifts, so there is nothing to cache.
import {
  cylinder,
  depthOf,
  insetPlan,
  knurl,
  lineOnTop,
  onTop,
  pathOf,
  planOutline,
  radialTicks,
  ring,
  segment,
  sideArc,
  slabOf,
  topTicks,
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
  | { kind: "fill"; d: string; fill: string; opacity: number };

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

function bottleParts(P: Projection, kind: Bottle, bx: number, lit: boolean): Item[] {
  const by = V.BOTTLE_Y;
  const items: Item[] = [];
  const neckTop = kind === "beer" ? 112 : 111;
  const bodyZ = 116;
  const bodyTop = kind === "beer" ? 146 : kind === "wine" ? 146.5 : 140;
  const bodyR = kind === "beer" ? 6.5 : 7.5;
  const dark = kind === "whisky" ? "bench-dark" : undefined;
  // Inverted bottle: neck at the bottom, base at the top.
  items.push(solid(cylinder(bx, by, V.NECK_R, V.MANIFOLD_TOP, neckTop - V.MANIFOLD_TOP, P, 20), "mid", { crease: "none", cls: dark }));
  items.push(solid(cylinder(bx, by, 5.4, neckTop, bodyZ - neckTop, P, 24), "mid", { cls: dark }));
  if (kind === "whisky") {
    const plan: Plan = { x: bx - 7.5, y: by - 7.5, w: 15, d: 15, r: 3 };
    items.push(solid(slabOf(plan, bodyZ, bodyTop - bodyZ, P, 5, 0.8), "hi", { cls: dark, lit }));
    items.push(solid(slabOf(insetPlan(plan, -0.4), bodyTop, 1.6, P, 5), "mid", { cls: dark }));
    items.push(line(planOutline(insetPlan(plan, 2.4), bodyTop + 1.6, P, 5), "faint"));
  } else {
    items.push(solid(cylinder(bx, by, bodyR, bodyZ, bodyTop - bodyZ, P, 36), "hi", { lit }));
    // Label band: two seams round the visible half.
    items.push(line(sideArc(bx, by, bodyR, bodyZ + 9, P, 20) + sideArc(bx, by, bodyR, bodyZ + 21, P, 20), "faint"));
    items.push(solid(cylinder(bx, by, bodyR + 0.4, bodyTop, 1.6, P, 36), "mid"));
    items.push(line(ring(bx, by, bodyR - 2.2, bodyTop + 1.6, P, 36), "faint"));
  }
  // Hose clamp holding the body, and its arm back to the bar.
  const clampR = (kind === "whisky" ? 8.2 : bodyR) + 1.3;
  items.push(solid(cylinder(bx, by, clampR, V.BAND_Z, 3, P, 36), "mid"));
  items.push(line(knurl(bx, by, clampR, V.BAND_Z, V.BAND_Z + 3, 44, P, 0.5), "faint"));
  return items;
}

function clampArm(P: Projection, bx: number, kind: Bottle): Item[] {
  const clampR = (kind === "whisky" ? 8.2 : kind === "beer" ? 6.5 : 7.5) + 1.3;
  const arm: Plan = { x: bx - 2.5, y: V.BAR.y + V.BAR.d - 4, w: 5, d: V.BOTTLE_Y - clampR - (V.BAR.y + V.BAR.d - 4) + 0.3, r: 1 };
  return [solid(slabOf(arm, V.BAND_Z - 0.5, 4, P, 3, 0.4), "mid"), dots([V.at(P, [bx, arm.y + 2, V.BAND_Z + 3.5])], 0.45)];
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

  // ---------- base ----------
  const base: Item[] = [];
  base.push({ kind: "halo", d: slabOf(V.PLATE, -V.PLATE_H - V.FOOT_H, V.PLATE_H, P).fill });
  const feet: [number, number][] = [
    [V.PLATE.x + 20, V.PLATE.y + 18],
    [V.PLATE.x + V.PLATE.w - 20, V.PLATE.y + 18],
    [V.PLATE.x + 20, V.PLATE.y + V.PLATE.d - 18],
    [V.PLATE.x + V.PLATE.w - 20, V.PLATE.y + V.PLATE.d - 18],
  ];
  for (const [x, y] of sorted(feet)) {
    base.push(solid(cylinder(x, y, 7, -V.PLATE_H - V.FOOT_H, 1.6, P, 28), "lo"));
    base.push(solid(cylinder(x, y, 5.4, -V.PLATE_H - V.FOOT_H + 1.6, V.FOOT_H - 1.6, P, 28), "mid"));
  }
  base.push(solid(slabOf(V.PLATE, -V.PLATE_H, V.PLATE_H, P, 8, 1.6), "mid"));
  base.push(line(planOutline(insetPlan(V.PLATE, 5), 0, P), "lo"));
  const screws: [number, number][] = [
    [V.PLATE.x + 10, V.PLATE.y + 10],
    [V.PLATE.x + V.PLATE.w - 10, V.PLATE.y + 10],
    [V.PLATE.x + 10, V.PLATE.y + V.PLATE.d - 10],
    [V.PLATE.x + V.PLATE.w - 10, V.PLATE.y + V.PLATE.d - 10],
  ];
  base.push(line(screws.map(([x, y]) => ring(x, y, 2.2, 0, P, 16)).join(""), "lo"));
  base.push(dots(screws.map(([x, y]) => at([x, y, 0])), 0.5));
  // Ruler strip along the front edge.
  base.push(solid(slabOf(V.RULER, 0, 0.6, P, 3), "lo", { crease: "none" }));
  const ticks = topTicks(V.RULER.x + 4, V.RULER.x + V.RULER.w - 4, 4, 5, V.RULER.y + 0.6, 0.6, [1.8, 3.4], P);
  base.push(line(ticks.minor, "lo"), line(ticks.major, "mid"));
  base.push(dots([at([V.RULER.x + 2, V.RULER.y + 3, 0.6]), at([V.RULER.x + V.RULER.w - 2, V.RULER.y + 3, 0.6])], 0.45));
  // Label plate with three rule lines standing for text.
  base.push(solid(slabOf(V.LABEL, 0, 0.8, P, 4), "lo", { crease: "none" }));
  base.push(line(planOutline(insetPlan(V.LABEL, 1.6), 0.8, P), "faint"));
  base.push(
    line(
      [0, 1, 2].map((row) => onTop([[V.LABEL.x + 6, V.LABEL.y + 3.6 + row * 2.6], [V.LABEL.x + (row === 1 ? 24 : 34), V.LABEL.y + 3.6 + row * 2.6]], 0.8, P)).join(""),
      "lo",
      { free: true },
    ),
  );
  base.push(dots([at([V.LABEL.x + 3, V.LABEL.y + V.LABEL.d / 2, 0.8]), at([V.LABEL.x + V.LABEL.w - 3, V.LABEL.y + V.LABEL.d / 2, 0.8])], 0.45));
  // Tank pedestal and the gantry post and rack post stubs belong to the base.
  base.push(solid(cylinder(V.TANK[0], V.TANK[1], V.PEDESTAL_R, 0, V.TANK_Z, P, 56, 0.8), "lo"));
  base.push(line(ring(V.TANK[0], V.TANK[1], V.PEDESTAL_R - 2.4, V.TANK_Z, P, 56), "faint"));
  put("base", "base", base);

  // ---------- sediment drawer ----------
  const drawer: Item[] = [];
  const out = s.drawerOut * 30;
  if (out > 0.3) {
    const box: Plan = { x: V.DRAWER_X + 2, y: V.DRAWER_FRONT_Y, w: V.DRAWER_W - 4, d: out, r: 1 };
    drawer.push(solid(slabOf(box, -10, 8, P, 3, 0.4), "mid"));
    const pad = insetPlan(box, 1.8);
    if (pad.d > 1) drawer.push({ kind: "fill", d: planOutline(pad, -2, P, 3), fill: "var(--bench-sediment)", opacity: 0.12 + 0.78 * s.congeners });
    drawer.push(line(planOutline(pad, -2, P, 3), "faint"));
  }
  const front: Plan = { x: V.DRAWER_X, y: V.DRAWER_FRONT_Y + out, w: V.DRAWER_W, d: 2.5, r: 1 };
  drawer.push(solid(slabOf(front, -11, 10, P, 3, 0.5), "mid", { lit: s.lit === "drawer" }));
  drawer.push(solid(slabOf({ x: V.DRAWER_X + 13, y: V.DRAWER_FRONT_Y + out + 2.5, w: 14, d: 1.8, r: 0.9 }, -7, 2.2, P, 3), "mid", { crease: "none" }));
  drawer.push(dots([at([V.DRAWER_X + 4, V.DRAWER_FRONT_Y + out + 2.5, -3]), at([V.DRAWER_X + V.DRAWER_W - 4, V.DRAWER_FRONT_Y + out + 2.5, -3])], 0.45));
  put("drawer", "drawer", drawer);

  // ---------- rack: posts (lower), manifold, posts (upper), bar ----------
  const rackLower: Item[] = [];
  for (const [x, y] of sorted(V.POSTS)) {
    rackLower.push(solid(cylinder(x, y, V.POST_R + 1.6, 0, 3, P, 24), "mid"));
    rackLower.push(solid(cylinder(x, y, V.POST_R, 3, V.MANIFOLD_Z - 3, P, 24), "mid", { crease: "none" }));
    rackLower.push(line(sideArc(x, y, V.POST_R, 40, P, 12), "faint"));
  }
  put("rack-lower", "base", rackLower);

  const manifold: Item[] = [];
  manifold.push(solid(slabOf(V.MANIFOLD, V.MANIFOLD_Z, V.MANIFOLD_H, P, 6, 1), "mid"));
  manifold.push(line(planOutline(insetPlan(V.MANIFOLD, 3), V.MANIFOLD_TOP, P, 6), "faint"));
  manifold.push(dots([
    at([V.MANIFOLD.x + 4, V.MANIFOLD.y + 4, V.MANIFOLD_TOP]),
    at([V.MANIFOLD.x + V.MANIFOLD.w - 4, V.MANIFOLD.y + 4, V.MANIFOLD_TOP]),
    at([V.MANIFOLD.x + 4, V.MANIFOLD.y + V.MANIFOLD.d - 4, V.MANIFOLD_TOP]),
    at([V.MANIFOLD.x + V.MANIFOLD.w - 4, V.MANIFOLD.y + V.MANIFOLD.d - 4, V.MANIFOLD_TOP]),
  ], 0.5));
  const kinds: Bottle[] = ["beer", "wine", "whisky"];
  V.BOTTLE_XS.forEach((bx, i) => {
    const kind = kinds[i];
    const open = s.pouring === kind ? s.pourFlow : 0;
    // Port ring under each neck and a knurled valve knob beside it.
    manifold.push(line(ring(bx, V.BOTTLE_Y, V.NECK_R + 1.2, V.MANIFOLD_TOP, P, 20), "lo"));
    const kx = bx - 9;
    manifold.push(solid(cylinder(kx, V.BOTTLE_Y, 2.6, V.MANIFOLD_TOP, 3.4, P, 20), "mid", { lit: s.lit === kind || open > 0.05 }));
    manifold.push(line(knurl(kx, V.BOTTLE_Y, 2.6, V.MANIFOLD_TOP, V.MANIFOLD_TOP + 3.4, 18, P), "lo"));
    const a = (-90 + 80 * open) * RAD;
    manifold.push(line(lineOnTop([kx, V.BOTTLE_Y], [kx + 2.2 * Math.cos(a), V.BOTTLE_Y + 2.2 * Math.sin(a)], V.MANIFOLD_TOP + 3.4, P), open > 0.05 ? "lit" : "hi"));
  });
  // Spout, first leg: along x behind the tank, to the first elbow.
  const spoutY = V.BOTTLE_Y;
  const legStart = V.MANIFOLD.x + V.MANIFOLD.w;
  manifold.push(solid(slabOf({ x: legStart, y: spoutY - V.PIPE_R, w: V.SPOUT_X - legStart, d: V.PIPE_R * 2, r: V.PIPE_R - 0.2 }, V.SPOUT_Z - V.PIPE_R, V.PIPE_R * 2, P, 3), "mid", { crease: "none" }));
  manifold.push(solid(slabOf({ x: legStart - 0.5, y: spoutY - 3.2, w: 2.4, d: 6.4, r: 1 }, V.SPOUT_Z - 3.2, 6.4, P, 3, 0.3), "mid"));
  manifold.push(solid(slabOf({ x: V.SPOUT_X - 3.2, y: spoutY - 3.2, w: 6.4, d: 6.4, r: 1.4 }, V.SPOUT_Z - 3.2, 6.4, P, 3, 0.4), "mid"));
  put("manifold", "manifold", manifold);

  const rackUpper: Item[] = [];
  for (const [x, y] of sorted(V.POSTS)) {
    rackUpper.push(solid(cylinder(x, y, V.POST_R, V.MANIFOLD_TOP, V.POST_TOP - V.MANIFOLD_TOP, P, 24), "mid", { crease: "none" }));
    rackUpper.push(line(sideArc(x, y, V.POST_R, 120, P, 12), "faint"));
  }
  put("rack-upper", "base", rackUpper);

  // Bottles, far to near, with their clamp arms.
  const bottleOrder = V.BOTTLE_XS.map((bx, i) => ({ bx, i })).sort((a, b) => depthOf([a.bx, V.BOTTLE_Y, 0], P) - depthOf([b.bx, V.BOTTLE_Y, 0], P));
  const bottles: Item[] = [];
  for (const { bx, i } of bottleOrder) bottles.push(...bottleParts(P, kinds[i], bx, s.lit === kinds[i]));
  put("bottles", "bottles", bottles);

  const bar: Item[] = [];
  for (const { bx, i } of bottleOrder) bar.push(...clampArm(P, bx, kinds[i]));
  bar.push(solid(slabOf(V.BAR, V.BAR_Z, V.BAR_H, P, 4, 0.8), "mid"));
  bar.push(dots(V.POSTS.map(([x, y]) => at([x, y, V.BAR_Z + V.BAR_H])), 0.55));
  bar.push(line(onTop([[V.BAR.x + 6, V.BAR.y + V.BAR.d / 2], [V.BAR.x + V.BAR.w - 6, V.BAR.y + V.BAR.d / 2]], V.BAR_Z + V.BAR_H, P), "faint"));
  put("bar", "rack", bar);

  // ---------- gantry post (behind the tank) ----------
  const gantry: Item[] = [];
  gantry.push(solid(cylinder(V.GANTRY[0], V.GANTRY[1], V.GANTRY_R + 1.8, 0, 3, P, 28), "mid"));
  gantry.push(solid(cylinder(V.GANTRY[0], V.GANTRY[1], V.GANTRY_R, 3, V.ARM_Z - 3, P, 28), "mid", { crease: "none" }));
  gantry.push(line(sideArc(V.GANTRY[0], V.GANTRY[1], V.GANTRY_R, 60, P, 14) + sideArc(V.GANTRY[0], V.GANTRY[1], V.GANTRY_R, 100, P, 14), "faint"));
  put("gantry", "base", gantry);

  // ---------- tank: liquid, stream, float and rod, glass, scale ----------
  const [tx, ty] = V.TANK;
  const level = V.levelZ(s.drinks);
  const tank: Item[] = [];
  if (level > V.TANK_Z + 0.2) tank.push(solid(cylinder(tx, ty, V.TANK_R - 1, V.TANK_Z, level - V.TANK_Z, P, 48), "mid", { cls: "bench-liquid", crease: "none" }));
  // Fizz: small bubbles rising in the liquid.
  if (s.bubbles > 0.02 && level > V.TANK_Z + 6) {
    const pts: Flat[] = [];
    for (let i = 0; i < 14; i++) {
      const a = (i * 137.5) % 360;
      const r = (V.TANK_R - 4) * (0.3 + ((i * 53) % 70) / 100);
      const zz = V.TANK_Z + 2 + (((s.frame * (0.5 + (i % 3) * 0.2) + i * 9) % (level - V.TANK_Z - 3)) + 0);
      if (Math.cos((a - face) * RAD) > -0.2) pts.push(at([tx + r * Math.cos(a * RAD), ty + r * Math.sin(a * RAD), zz]));
    }
    tank.push({ kind: "dots", points: pts, size: 0.55 * s.bubbles + 0.15, tone: "mid" });
  }
  // Stream from the nozzle to the surface while pouring.
  if (s.pouring && s.pourFlow > 0.03) {
    const r = 0.5 + 0.7 * s.pourFlow;
    tank.push(solid(cylinder(V.SPOUT_X, ty, r, level, V.NOZZLE_Z - level, P, 12), "mid", { cls: "bench-liquid bench-stream", crease: "none" }));
  }
  // Float and plunger rod (the rod rises into the gauge; it rides the gauge assembly).
  const floatTop = level + V.FLOAT_H;
  tank.push(solid(cylinder(tx, ty, V.FLOAT_R, level - 0.6, V.FLOAT_H, P, 32, 0.4), "hi", { lit: s.lit === "float" }));
  tank.push(line(ring(tx, ty, V.FLOAT_R - 2.4, floatTop - 0.6, P, 32), "faint"));
  tank.push(solid(cylinder(tx, ty, V.ROD_R, floatTop - 0.6, V.DIAL_Z - floatTop + 0.6, P, 12), "hi", { crease: "none", lit: s.lit === "float" || s.lit === "needle" }));
  // Glass wall, open at the top.
  const glass = cylinder(tx, ty, V.TANK_R, V.TANK_Z, V.TANK_TOP - V.TANK_Z, P, 56);
  tank.push(solid(glass, "mid", { cls: "bench-glass", crease: "none" }));
  tank.push(line(ring(tx, ty, V.TANK_R, V.TANK_TOP, P, 56), "hi"));
  tank.push(line(ring(tx, ty, V.TANK_R - 1.2, V.TANK_TOP, P, 56), "faint"));
  // Open mouth: a rolled lip drawn as the visible half of a slightly wider band.
  tank.push(line(sideArc(tx, ty, V.TANK_R + 0.9, V.TANK_TOP - 2.4, P, 40), "lo"));
  // Engraved scale on the wall facing the viewer: a meridian with ticks, one major per drink.
  const scaleDeg = face - 18;
  const z0 = V.TANK_Z + 2;
  const z1 = V.levelZ(V.CAPACITY);
  tank.push(line(pathOf([at(onSurface(tx, ty, V.TANK_R + 0.05, scaleDeg, z0)), at(onSurface(tx, ty, V.TANK_R + 0.05, scaleDeg, z1 + 1))]), "lo"));
  const minor: string[] = [];
  const major: string[] = [];
  for (let d = 0; d <= V.CAPACITY * 2; d++) {
    const z = V.levelZ(d / 2);
    const big = d % 2 === 0;
    const span = big ? 9 : 5;
    (big ? major : minor).push(pathOf([at(onSurface(tx, ty, V.TANK_R + 0.05, scaleDeg, z)), at(onSurface(tx, ty, V.TANK_R + 0.05, scaleDeg + span, z))]));
  }
  tank.push(line(minor.join(""), "lo"), line(major.join(""), "mid"));
  tank.push(line(sideArc(tx, ty, V.TANK_R, V.TANK_Z + 1.2, P, 40), "faint"));
  put("tank", "tank", tank);

  // ---------- spout, second leg over the tank, and the nozzle ----------
  const spout: Item[] = [];
  spout.push(solid(slabOf({ x: V.SPOUT_X - V.PIPE_R, y: spoutY, w: V.PIPE_R * 2, d: ty - spoutY, r: V.PIPE_R - 0.2 }, V.SPOUT_Z - V.PIPE_R, V.PIPE_R * 2, P, 3), "mid", { crease: "none" }));
  spout.push(solid(slabOf({ x: V.SPOUT_X - 3.2, y: ty - 3.2, w: 6.4, d: 6.4, r: 1.4 }, V.SPOUT_Z - 3.2, 6.4, P, 3, 0.4), "mid"));
  spout.push(solid(cylinder(V.SPOUT_X, ty, V.PIPE_R, V.NOZZLE_Z + 2.5, V.SPOUT_Z - 3.2 - V.NOZZLE_Z - 2.5, P, 16), "mid", { crease: "none" }));
  spout.push(solid(cylinder(V.SPOUT_X, ty, V.PIPE_R + 0.9, V.NOZZLE_Z, 2.5, P, 16), "mid"));
  put("spout", "manifold", spout);

  // ---------- drain valve, nozzle, drops and cup ----------
  const [vx, vy] = V.VALVE;
  const valve: Item[] = [];
  const pipeFrom = tx + V.TANK_R - 1;
  valve.push(solid(slabOf({ x: pipeFrom, y: vy - V.PIPE_R, w: vx - pipeFrom, d: V.PIPE_R * 2, r: V.PIPE_R - 0.2 }, V.DRAIN_Z - V.PIPE_R, V.PIPE_R * 2, P, 3), "mid", { crease: "none" }));
  // Union flange where the drain leaves the tank wall.
  valve.push(solid(slabOf({ x: pipeFrom + 0.4, y: vy - 3.6, w: 2.6, d: 7.2, r: 1.2 }, V.DRAIN_Z - 3.6, 7.2, P, 3, 0.4), "mid"));
  valve.push(solid(cylinder(vx, vy, V.VALVE_R, 9, V.DRAIN_Z + 6 - 9, P, 28), "mid", { lit: s.lit === "valve" }));
  valve.push(line(sideArc(vx, vy, V.VALVE_R, 13, P, 14), "faint"));
  valve.push(solid(cylinder(vx, vy, 1.6, V.DRAIN_Z + 6, 2.5, P, 12), "mid", { crease: "none" }));
  const wheelZ = V.DRAIN_Z + 8.5;
  valve.push(solid(cylinder(vx, vy, 6.5, wheelZ, 2.4, P, 36), "hi", { lit: s.lit === "valve" }));
  valve.push(line(knurl(vx, vy, 6.5, wheelZ, wheelZ + 2.4, 30, P), "lo"));
  const wa = (-60 + 150 * s.valveOpen) * RAD;
  valve.push(line(lineOnTop([vx, vy], [vx + 5 * Math.cos(wa), vy + 5 * Math.sin(wa)], wheelZ + 2.4, P), s.lit === "valve" ? "lit" : "hi"));
  valve.push(line(ring(vx, vy, 1.4, wheelZ + 2.4, P, 12), "mid"));
  valve.push(solid(slabOf({ x: vx + V.VALVE_R - 0.5, y: vy - V.PIPE_R, w: V.NOZZLE_X - vx - V.VALVE_R + 0.5, d: V.PIPE_R * 2, r: V.PIPE_R - 0.2 }, V.DRAIN_Z - V.PIPE_R, V.PIPE_R * 2, P, 3), "mid", { crease: "none" }));
  valve.push(solid(cylinder(V.NOZZLE_X, vy, V.PIPE_R, 12, V.DRAIN_Z - V.PIPE_R - 12 + 0.2, P, 16), "mid", { crease: "none" }));
  valve.push(solid(cylinder(V.NOZZLE_X, vy, V.PIPE_R + 0.8, 12, 1.6, P, 16), "mid"));
  // Cup with what has drained so far; drops in flight.
  const [cx, cy] = V.CUP;
  const cupLevel = 0.6 + Math.min(V.CUP_H - 1.5, s.drained * 2.2);
  valve.push(solid(cylinder(cx, cy, V.CUP_R - 0.9, 0.4, cupLevel, P, 36), "mid", { cls: "bench-liquid", crease: "none" }));
  if (s.valveOpen > 0.05) {
    const pts: Flat[] = [];
    const fall = 12 - 1.2 - cupLevel;
    for (let i = 0; i < 3; i++) {
      const phase = ((s.frame * 0.09 + i / 3) % 1);
      pts.push(at([V.NOZZLE_X, vy, 11.6 - phase * phase * fall]));
    }
    valve.push({ kind: "dots", points: pts, size: 0.75, tone: "hi" });
  }
  valve.push(solid(cylinder(cx, cy, V.CUP_R, 0, V.CUP_H, P, 40), "mid", { cls: "bench-glass", crease: "none" }));
  valve.push(line(ring(cx, cy, V.CUP_R, V.CUP_H, P, 40), "hi"));
  valve.push(line(sideArc(cx, cy, V.CUP_R, 1.2, P, 24), "faint"));
  put("valve", "valve", valve);

  // ---------- gauge: arm, bushing, dial, needle ----------
  const gauge: Item[] = [];
  const [gx, gy] = V.GANTRY;
  gauge.push(solid(cylinder(gx, gy, V.GANTRY_R + 2.2, V.ARM_Z - 2, 2, P, 28), "mid"));
  gauge.push(solid(slabOf({ x: gx - 3.5, y: gy - 3, w: 7, d: ty - gy + 3, r: 1.5 }, V.ARM_Z, V.ARM_H, P, 4, 0.6), "mid"));
  gauge.push(dots([at([gx, gy + 6, V.ARM_Z + V.ARM_H]), at([gx, ty - 20, V.ARM_Z + V.ARM_H])], 0.45));
  gauge.push(solid(cylinder(tx, ty, 3.2, V.ARM_Z - 4, 4, P, 20), "mid"));
  gauge.push(solid(cylinder(tx, ty, V.DIAL_R, V.DIAL_Z, V.DIAL_H, P, 64, 0.8), "hi", { crease: "lo" }));
  gauge.push(line(knurl(tx, ty, V.DIAL_R, V.DIAL_TOP - 3, V.DIAL_TOP, 72, P, 0.3), "faint"));
  gauge.push(line(sideArc(tx, ty, V.DIAL_R, V.DIAL_TOP - 3, P, 40), "faint"));
  gauge.push(line(ring(tx, ty, V.DIAL_R - 2, V.DIAL_TOP, P, 64), "lo"));
  const from = -V.DIAL_SWEEP / 2;
  const dialTicks = radialTicks(tx, ty, V.DIAL_R - 2.8, V.CAPACITY * 5, 5, V.DIAL_TOP, [1.2, 2.6], P, from * RAD, V.DIAL_SWEEP * RAD);
  gauge.push(line(dialTicks.minor, "lo"), line(dialTicks.major, "mid"));
  // Crown on the +x side and a small lug toward the arm.
  gauge.push(solid(slabOf({ x: tx + V.DIAL_R - 0.8, y: ty - 2.2, w: 4.4, d: 4.4, r: 1.1 }, V.DIAL_Z + 2, 4.4, P, 3), "mid"));
  gauge.push(solid(slabOf({ x: tx + V.DIAL_R + 3.4, y: ty - 3, w: 2.4, d: 6, r: 1.1 }, V.DIAL_Z + 1.2, 6, P, 3), "mid"));
  // Needle from the model's reading.
  const angle = (from + (V.DIAL_SWEEP * Math.min(V.CAPACITY, s.drinks)) / V.CAPACITY) * RAD;
  const ux = Math.sin(angle);
  const uy = -Math.cos(angle);
  const tip: [number, number] = [tx + ux * (V.DIAL_R - 3.6), ty + uy * (V.DIAL_R - 3.6)];
  const tail: [number, number] = [tx - ux * 3.2, ty - uy * 3.2];
  gauge.push(line(lineOnTop(tail, tip, V.DIAL_TOP + 0.2, P), s.lit === "needle" ? "lit" : "hi", { width: 1.1, free: "start" }));
  gauge.push(line(ring(tx, ty, 1.5, V.DIAL_TOP + 0.2, P, 14), "mid"));
  put("gauge", "gauge", gauge);

  return groups;
}

export const segmentOf = segment;
