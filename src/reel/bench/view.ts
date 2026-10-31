// World layout of the test bench, in units of about 1 px of the real thing.
// x and y lie on the base plate, z goes up. The viewer stands at +x, +y.
import { boxCorners, fitProjection, iso, type Plan, type Point3, type Projection } from "../../iso/iso-kit";

export const VIEW_W = 600;
export const VIEW_H = 640;
export const AZIMUTH = 50;
export const ELEVATION = 30;

// Base
export const PLATE: Plan = { x: -134, y: -64, w: 258, d: 134, r: 8 };
export const PLATE_H = 12;
export const FOOT_H = 5;
export const RULER: Plan = { x: -120, y: 56, w: 128, d: 6, r: 1 };
export const LABEL: Plan = { x: 76, y: 48, w: 44, d: 13, r: 2 };

// Dispenser rack (behind, left): two posts, a top bar, three inverted bottles.
export const POSTS: [number, number][] = [
  [-108, -44],
  [-38, -44],
];
export const POST_R = 3.5;
export const POST_TOP = 150;
export const BAR: Plan = { x: -118, y: -48, w: 90, d: 8, r: 2 };
export const BAR_Z = 150;
export const BAR_H = 7;
export const BOTTLE_Y = -24;
export const BOTTLE_XS = [-102, -72, -42];
export const BAND_Z = 128;
export const MANIFOLD: Plan = { x: -116, y: -50, w: 86, d: 34, r: 3 };
export const MANIFOLD_Z = 86;
export const MANIFOLD_H = 14;
export const MANIFOLD_TOP = MANIFOLD_Z + MANIFOLD_H;
export const NECK_R = 2.8;

// Spout from the manifold to the tank mouth.
export const PIPE_R = 2.2;
export const SPOUT_Z = 93;
export const SPOUT_X = 26;
export const NOZZLE_Z = 80;

// Tank
export const TANK: [number, number] = [40, 10];
export const TANK_R = 22;
export const TANK_Z = 8;
export const TANK_TOP = 76;
export const PEDESTAL_R = 26;
export const FLOAT_R = 10;
export const FLOAT_H = 3;
export const ROD_R = 1.2;

// Gauge
export const GANTRY: [number, number] = [40, -24];
export const GANTRY_R = 4;
export const ARM_Z = 114;
export const ARM_H = 6;
export const DIAL_Z = 120;
export const DIAL_H = 10;
export const DIAL_TOP = DIAL_Z + DIAL_H;
export const DIAL_R = 15;
export const DIAL_SWEEP = 300; // degrees for 0..CAPACITY

// Drain valve and cup
export const DRAIN_Z = 18;
export const VALVE: [number, number] = [80, 10];
export const VALVE_R = 5;
export const NOZZLE_X = 92;
export const CUP: [number, number] = [101, 10];
export const CUP_R = 9;
export const CUP_H = 8;

// Sediment drawer in the base, under the tank.
export const DRAWER_X = 20;
export const DRAWER_W = 40;
export const DRAWER_FRONT_Y = PLATE.y + PLATE.d;

// Model scale: standard drinks held by the tank.
export const CAPACITY = 8;
export const UNIT_H = (TANK_TOP - 6 - TANK_Z) / CAPACITY; // tank height per standard drink

export const levelZ = (drinks: number) => TANK_Z + Math.max(0, Math.min(CAPACITY, drinks)) * UNIT_H;

const FIT_POINTS: Point3[] = [
  ...boxCorners(PLATE, -PLATE_H - FOOT_H, 0),
  ...boxCorners(BAR, BAR_Z, BAR_Z + BAR_H),
  [TANK[0] + DIAL_R, TANK[1] + DIAL_R, DIAL_TOP],
  [TANK[0] - DIAL_R, TANK[1] - DIAL_R, DIAL_TOP],
  [CUP[0] + CUP_R, CUP[1] + CUP_R, 0],
  [DRAWER_X + DRAWER_W, DRAWER_FRONT_Y + 44, 0],
];

// One fit at the base azimuth, so a drifting camera never rescales the figure.
const BASE_P = fitProjection(FIT_POINTS, VIEW_W, VIEW_H, { pad: 40, azimuth: AZIMUTH, elevation: ELEVATION });

export const projectionAt = (azimuth: number, elevation = ELEVATION): Projection => ({ ...BASE_P, azimuth, elevation });

export const at = (P: Projection, point: Point3) => iso(point, P);
