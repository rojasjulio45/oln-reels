// Product camera: a list of shots, each a focus point in the world, a zoom,
// an azimuth and an elevation, with calm moves between them and a slow
// drift inside each shot so no frame is ever still. Shots are placed on the
// narration's cues, so the view goes to the thing being named.
import { Easing, interpolate } from "remotion";
import { iso, type Point3, type Projection } from "../../iso/iso-kit";
import { REEL_H, REEL_W } from "../script";
import { VIEW_W, projectionAt } from "./view";

export interface Shot {
  at: number; // absolute frame
  focus: Point3;
  zoom: number; // 1 = the whole bench across the frame
  azimuth: number;
  elevation: number;
  move?: number; // frames of the transition into this shot
  drift?: { zoom?: number; azimuth?: number; elevation?: number }; // added over the shot's length
  anchor?: number; // where the focus sits vertically in the frame (0 top .. 1 bottom)
  callout?: { text: string; point: Point3; side?: "left" | "right" };
}

export interface Camera {
  azimuth: number;
  elevation: number;
  focus: Point3;
  zoom: number;
  anchor: number;
  shot: Shot;
  settled: number; // 0..1 how far into the shot's move we are
}

const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// The shot's own state at a frame: its base plus a slow drift.
function stateOfShot(shots: Shot[], i: number, frame: number) {
  const s = shots[i];
  const next = shots[i + 1];
  const length = next ? next.at - s.at : 600;
  const u = Math.max(0, Math.min(1, (frame - s.at) / Math.max(1, length)));
  return {
    azimuth: s.azimuth + (s.drift?.azimuth ?? 0) * u,
    elevation: s.elevation + (s.drift?.elevation ?? 0) * u,
    zoom: s.zoom * (1 + (s.drift?.zoom ?? 0.04) * u),
    focus: s.focus,
    anchor: s.anchor ?? 0.56,
  };
}

export function cameraAt(shots: Shot[], frame: number): Camera {
  let i = 0;
  for (let k = 0; k < shots.length; k++) if (shots[k].at <= frame) i = k;
  const to = stateOfShot(shots, i, frame);
  const shot = shots[i];
  if (i === 0) return { ...to, shot, settled: 1 };
  const move = shot.move ?? 24;
  const p = interpolate(frame, [shot.at, shot.at + move], [0, 1], { ...clamp, easing: EASE });
  const from = stateOfShot(shots, i - 1, shot.at);
  return {
    azimuth: lerp(from.azimuth, to.azimuth, p),
    elevation: lerp(from.elevation, to.elevation, p),
    // Zoom moves in log space so a push-in feels even.
    zoom: Math.exp(lerp(Math.log(from.zoom), Math.log(to.zoom), p)),
    focus: [lerp(from.focus[0], to.focus[0], p), lerp(from.focus[1], to.focus[1], p), lerp(from.focus[2], to.focus[2], p)],
    anchor: lerp(from.anchor, to.anchor, p),
    shot,
    settled: p,
  };
}

export interface Framing {
  P: Projection;
  viewBox: [number, number, number, number];
}

// The projection and the SVG viewBox that put the camera's focus at its
// anchor, for a canvas of REEL_W × REEL_H.
export function framingOf(cam: Camera): Framing {
  const P = projectionAt(cam.azimuth, cam.elevation);
  const [fx, fy] = iso(cam.focus, P);
  const w = VIEW_W / cam.zoom;
  const h = (w * REEL_H) / REEL_W;
  return { P, viewBox: [fx - w / 2, fy - h * cam.anchor, w, h] };
}

// A world point in canvas pixels, for callouts drawn in HTML over the SVG.
export function toCanvas(point: Point3, framing: Framing): [number, number] {
  const [sx, sy] = iso(point, framing.P);
  const [x0, y0, w, h] = framing.viewBox;
  return [((sx - x0) / w) * REEL_W, ((sy - y0) / h) * REEL_H];
}
