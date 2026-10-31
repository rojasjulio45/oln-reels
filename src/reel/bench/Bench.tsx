import React from "react";
import { Dots, Line, Solid } from "../../iso/draw";
import { buildBench, type Group, type Item } from "./geometry";
import { BenchState } from "./model";
import { VIEW_H, VIEW_W, projectionAt } from "./view";

const ItemView: React.FC<{ item: Item }> = ({ item }) => {
  switch (item.kind) {
    case "solid":
      return <Solid paths={item.paths} tone={item.tone} crease={item.crease} lit={item.lit} flat={item.flat} className={item.cls} />;
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
  }
};

const GroupView: React.FC<{ group: Group }> = ({ group }) => (
  <g data-assembly={group.assembly} data-part={group.name} transform={group.transform}>
    {group.items.map((item, i) => (
      <ItemView key={i} item={item} />
    ))}
  </g>
);

// The whole bench as one SVG, drawn for one model state. `width` sets the
// rendered size; the viewBox stays constant so the camera drift never rescales.
export const Bench: React.FC<{ state: BenchState; width: number }> = ({ state, width }) => {
  const P = projectionAt(state.azimuth);
  const groups = buildBench(P, state);
  return (
    <svg className="iso-svg bench" viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width={width} height={(width * VIEW_H) / VIEW_W} role="img" aria-label="Banco de ensayo">
      {groups.map((g) => (
        <GroupView key={g.name} group={g} />
      ))}
    </svg>
  );
};
