import { Easing, interpolate, spring } from "remotion";
import { FPS } from "../constants";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
} as const;

// 0 → 1 springy entrance that starts at `start`.
export const pop = (frame: number, start: number) =>
  spring({ frame: frame - start, fps: FPS, config: { damping: 12, mass: 0.6 } });

// 0 → 1 linear-ish fade over `duration` frames.
export const fade = (frame: number, start: number, duration = 15) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.out(Easing.cubic),
  });

// 0 → 1 progress for drawing lines and filling bars.
export const progress = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    ...clamp,
    easing: Easing.inOut(Easing.cubic),
  });

// Gentle idle bobbing so nothing on screen is ever fully static.
export const bob = (frame: number, amplitude = 6, period = 90, phase = 0) =>
  Math.sin((frame / period) * Math.PI * 2 + phase) * amplitude;

export { clamp };
