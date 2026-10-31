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
        <FaceText transform={item.transform} size={item.size} tone={item.tone} anchor={item.anchor}>
          {item.text}
        </FaceText>
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

// The whole bench as one SVG for one model state, seen through one camera:
// `P` is the projection (azimuth and elevation) and `viewBox` the framing.
export const Bench: React.FC<{ state: BenchState; P: Projection; viewBox: [number, number, number, number]; width: number; height: number }> = ({ state, P, viewBox, width, height }) => {
  const groups = buildBench(P, state);
  return (
    <svg className="iso-svg bench" viewBox={viewBox.join(" ")} width={width} height={height} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Banco de ensayo">
      {groups.map((g) => (
        <GroupView key={g.name} group={g} />
      ))}
    </svg>
  );
};
