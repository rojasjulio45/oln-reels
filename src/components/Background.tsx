import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { COLORS, HEIGHT, WIDTH } from "../constants";

const STARS = new Array(70).fill(0).map((_, i) => ({
  x: random(`x${i}`) * WIDTH,
  y: random(`y${i}`) * HEIGHT * 0.75,
  r: 1 + random(`r${i}`) * 2.2,
  phase: random(`p${i}`) * Math.PI * 2,
}));

// Night sky with twinkling stars and a soft glow; `tint` shifts the mood
// (e.g. red for the "grave" scene).
export const Background: React.FC<{ tint?: string; tintOpacity?: number }> = ({
  tint,
  tintOpacity = 0,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 35%, ${COLORS.bg.light} 0%, ${COLORS.bg.mid} 45%, ${COLORS.bg.dark} 100%)`,
      }}
    >
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill={COLORS.star}
            opacity={0.25 + 0.45 * (0.5 + 0.5 * Math.sin(frame / 25 + s.phase))}
          />
        ))}
      </svg>
      {tint ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at 50% 50%, transparent 30%, ${tint} 100%)`,
            opacity: tintOpacity,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};

// Rolling ground hill at the bottom of the frame.
export const Ground: React.FC<{ y?: number; color?: string }> = ({
  y = 820,
  color = "#1f2b6e",
}) => (
  <path
    d={`M0 ${y} Q ${WIDTH * 0.25} ${y - 40} ${WIDTH * 0.5} ${y} T ${WIDTH} ${y} V ${HEIGHT} H 0 Z`}
    fill={color}
  />
);
