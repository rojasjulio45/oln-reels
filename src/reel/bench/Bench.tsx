import React from "react";
import type { Projection } from "../../iso/iso-kit";
import { Dots, FaceText, Line, Solid } from "../../iso/draw";
import { buildBench, type Group, type Item } from "./geometry";
import { BenchState } from "./model";

const ItemView: React.FC<{ item: Item }> = ({ item }) => {
  switch (item.kind) {
    case "solid": {
      const solid = <Solid paths={item.paths} tone={item.tone} crease={item.crease} lit={item.lit} flat={item.flat} className={item.cls} />;
      return item.style ? <g style={item.style as React.CSSProperties}>{solid}</g> : solid;
    }
    case "line":
      return (
        <g style={{ opacity: item.opacity }}>
          <Line d={item.d} tone={item.tone} free={item.free} className={item.cls} />
          {item.width ? <path className="iso-line" data-tone={item.tone} data-free="start" d={item.d} style={{ strokeWidth: item.width }} /> : null}
        </g>
      );
    case "dots":
      return <Dots points={item.points} size={item.size} tone={item.tone} />;
    case "halo":
      return <path className="iso-halo" d={item.d} />;
    case "fill":
      return <path d={item.d} fill={item.fill} opacity={item.opacity} stroke="none" />;
    case "text":
      return (
        <g className={item.cls}>
          <FaceText transform={item.transform} size={item.size} tone={item.tone} anchor={item.anchor}>
            {item.text}
          </FaceText>
        </g>
      );
  }
};

const GroupView: React.FC<{ group: Group }> = ({ group }) => (
  <g data-assembly={group.assembly} data-part={group.name} transform={group.transform}>
    {group.items.map((item, i) => (
      <ItemView key={i} item={item} />
    ))}
  </g>
);

// Hatch patterns for the four shade tones (dense to sparse), in world units
// so they zoom with the drawing, and the hand-drawn wobble: a displacement
// by low-frequency noise whose seed changes every few frames, so the lines
// "boil" the way hand-inked animation does.
const Defs: React.FC<{ seed: number }> = ({ seed }) => (
  <defs>
    {[
      [0, 1.5, 0.62],
      [1, 2.3, 0.5],
      [2, 3.4, 0.36],
      [3, 5.2, 0.2],
    ].map(([i, gap, alpha]) => (
      <pattern key={i} id={`hatch${i}`} patternUnits="userSpaceOnUse" width={gap} height={gap} patternTransform="rotate(-38)">
        <rect width={gap} height={gap} fill="var(--anatomy-shade-3)" />
        <line x1={0} y1={0} x2={0} y2={gap} stroke="var(--bench-ink)" strokeWidth={0.42} strokeOpacity={alpha} />
      </pattern>
    ))}
    <filter id="handmade" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="2" seed={seed} result="noise" />
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
);

// The whole bench as one SVG for one model state, seen through one camera:
// `P` is the projection (azimuth and elevation) and `viewBox` the framing.
export const Bench: React.FC<{ state: BenchState; P: Projection; viewBox: [number, number, number, number]; width: number; height: number; handmade?: boolean }> = ({
  state,
  P,
  viewBox,
  width,
  height,
  handmade = true,
}) => {
  const groups = buildBench(P, state);
  const seed = Math.floor(state.frame / 4) % 50;
  return (
    <svg className="iso-svg bench" viewBox={viewBox.join(" ")} width={width} height={height} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Banco de ensayo">
      <Defs seed={seed} />
      <g filter={handmade ? "url(#handmade)" : undefined}>
        {groups.map((g) => (
          <GroupView key={g.name} group={g} />
        ))}
      </g>
    </svg>
  );
};
