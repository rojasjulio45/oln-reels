// World layout of the test bench, in units of about 1 px of the real thing.
// x and y lie on the floor, z goes up. The viewer stands at +x, +y.
// Version 3: an industrial stand (two riveted beams, a platform) instead of a
// desk plate, bigger bottles, brass bands and flanges.
import { boxCorners, fitProjection, iso, type Plan, type Point3, type Projection } from "../../iso/iso-kit";

export const VIEW_W = 600;
export const VIEW_H = 640;
export const AZIMUTH = 46;
export const ELEVATION = 30;

// Stand: two beams along x, two cross beams, a platform under the tank.
export const BEAM_X0 = -152;
export const BEAM_X1 = 152;
export const BEAM_Y = 52; // centre line of each beam at ±BEAM_Y
export const BEAM_D = 12; // beam depth (y)
export const BEAM_H = 12; // beam height (z), top at BEAM_TOP
export const BEAM_TOP = BEAM_H;
export const FOOT_H = 6;
export const PLATFORM: Plan = { x: 8, y: -BEAM_Y + BEAM_D / 2, w: 112, d: BEAM_Y * 2 - BEAM_D, r: 1.5 };
export const PLATFORM_Z = BEAM_TOP;
export const PLATFORM_H = 4;
export const PLATFORM_TOP = PLATFORM_Z + PLATFORM_H;
export const NAMEPLATE: Plan = { x: -126, y: BEAM_Y - 2, w: 76, d: 3, r: 0.8 };
export const NAMEPLATE_Z = BEAM_TOP;
export const NAMEPLATE_H = 11;

// Dispenser rack (behind, left): two posts on the back beam, a top bar, three inverted bottles.
export const POST_Y = -BEAM_Y;
export const POSTS: [number, number][] = [
  [-118, POST_Y],
  [-22, POST_Y],
];
export const POST_R = 4;
export const POST_TOP = 178;
export const BAR: Plan = { x: -128, y: POST_Y - 4, w: 118, d: 8, r: 2 };
export const BAR_Z = 178;
export const BAR_H = 7;
export const BOTTLE_Y = -30;
export const BOTTLE_XS = [-108, -70, -32];
export const MANIFOLD: Plan = { x: -126, y: -60, w: 112, d: 42, r: 3 };
export const MANIFOLD_Z = 96;
export const MANIFOLD_H = 16;
export const MANIFOLD_TOP = MANIFOLD_Z + MANIFOLD_H;
export const NECK_R = 3.1;

// Spout from the manifold to the tank mouth.
export const PIPE_R = 2.4;
export const SPOUT_Z = 104;
export const SPOUT_X = 26;

// Tank on a brass-banded pedestal on the platform.
export const TANK: [number, number] = [44, 4];
export const TANK_R = 24;
export const PEDESTAL_R = 29;
export const PEDESTAL_Z = PLATFORM_TOP;
export const PEDESTAL_H = 8;
export const TANK_Z = PEDESTAL_Z + PEDESTAL_H;
export const TANK_TOP = TANK_Z + 70;
export const NOZZLE_Z = TANK_TOP + 4;
export const FLOAT_R = 11;
export const FLOAT_H = 3;
export const ROD_R = 1.3;

// Gauge on a cantilever arm from a post on the back beam.
export const GANTRY: [number, number] = [TANK[0], POST_Y];
export const GANTRY_R = 4.5;
export const ARM_Z = 132;
export const ARM_H = 6;
export const DIAL_Z = 138;
export const DIAL_H = 10;
export const DIAL_TOP = DIAL_Z + DIAL_H;
export const DIAL_R = 16;
export const DIAL_SWEEP = 300; // degrees for 0..CAPACITY

// Drain valve and cup, on the platform.
export const DRAIN_Z = TANK_Z + 8;
export const VALVE: [number, number] = [86, 4];
export const VALVE_R = 5.5;
export const NOZZLE_X = 99;
export const CUP: [number, number] = [108, 4];
export const CUP_R = 9;
export const CUP_H = 9;

// Sediment tray: a riveted housing on the front beam, the tray slides out toward +y.
export const HOUSING: Plan = { x: 22, y: BEAM_Y - BEAM_D / 2, w: 44, d: 24, r: 1.5 };
export const HOUSING_Z = BEAM_TOP;
export const HOUSING_H = 12;
export const DRAWER_X = HOUSING.x + 2;
export const DRAWER_W = HOUSING.w - 4;
export const DRAWER_FRONT_Y = HOUSING.y + HOUSING.d;

// Model scale: standard drinks held by the tank.
export const CAPACITY = 8;
export const UNIT_H = (TANK_TOP - 6 - TANK_Z) / CAPACITY;

export const levelZ = (drinks: number) => TANK_Z + Math.max(0, Math.min(CAPACITY, drinks)) * UNIT_H;

const FIT_POINTS: Point3[] = [
  ...boxCorners({ x: BEAM_X0, y: -BEAM_Y - BEAM_D / 2, w: BEAM_X1 - BEAM_X0, d: BEAM_Y * 2 + BEAM_D, r: 0 }, -FOOT_H, BEAM_TOP),
  ...boxCorners(BAR, BAR_Z, BAR_Z + BAR_H),
  [TANK[0] + DIAL_R, TANK[1] + DIAL_R, DIAL_TOP],
  [TANK[0] - DIAL_R, TANK[1] - DIAL_R, DIAL_TOP],
  [CUP[0] + CUP_R, CUP[1] + CUP_R, 0],
  [DRAWER_X + DRAWER_W, DRAWER_FRONT_Y + 36, 0],
];

// One fit at the base azimuth, so a moving camera never rescales the figure.
const BASE_P = fitProjection(FIT_POINTS, VIEW_W, VIEW_H, { pad: 40, azimuth: AZIMUTH, elevation: ELEVATION });

export const projectionAt = (azimuth: number, elevation = ELEVATION): Projection => ({ ...BASE_P, azimuth, elevation });

export const at = (P: Projection, point: Point3) => iso(point, P);
