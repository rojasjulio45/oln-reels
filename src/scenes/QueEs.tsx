import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, cue } from "../constants";
import { fade, pop, progress } from "../components/anim";
import { Clinic, House, Kid, Label, Megaphone, OLNBuilding, School, Shield, Umbrella } from "../components/Illustrations";
import { SceneShell } from "../components/SceneShell";

const HUB = { x: 960, y: 520 };
// Points the net reaches: each is drawn at its center.
const NODES = [
  { x: 270, y: 470 },
  { x: 330, y: 760 },
  { x: 1650, y: 470 },
  { x: 1600, y: 760 },
  { x: 960, y: 790 },
];

export const QueEs: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("queEs", s);
  const tRed = c("red de seguridad");
  const tPromover = c("promover");
  const tPrevenir = c("prevenir");
  const tProteger = c("protegerlos");
  const web = progress(frame, tRed, 45);
  const cross = progress(frame, tRed + 30, 45);

  return (
    <SceneShell sceneKey="queEs">
      {/* Net: spokes from the hub and the rim between neighbours */}
      {NODES.map((n, i) => (
        <line
          key={`s${i}`}
          x1={HUB.x}
          y1={HUB.y}
          x2={n.x}
          y2={n.y}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - web}
          stroke={COLORS.accent.yellow}
          strokeWidth={5}
          strokeLinecap="round"
          opacity={0.8}
        />
      ))}
      {[[0, 1], [1, 4], [4, 3], [3, 2]].map(([a, b], i) => (
        <line
          key={`r${i}`}
          x1={NODES[a].x}
          y1={NODES[a].y}
          x2={NODES[b].x}
          y2={NODES[b].y}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - cross}
          stroke={COLORS.accent.yellow}
          strokeWidth={3}
          opacity={0.5}
        />
      ))}
      <House x={270} y={540} s={0.65 * pop(frame, 8)} color={COLORS.accent.blue} />
      <Clinic x={330} y={830} s={0.6 * pop(frame, 12)} />
      <School x={1650} y={560} s={0.45 * pop(frame, 16)} />
      <House x={1600} y={830} s={0.65 * pop(frame, 20)} color={COLORS.accent.green} />
      <Kid x={960} y={855} s={0.5 * pop(frame, 24)} />
      <OLNBuilding x={HUB.x} y={680} s={0.85 * pop(frame, 0)} glow={fade(frame, tRed, 30)} />

      {[
        { t: tPromover, x: 560, icon: <Megaphone x={0} y={0} />, text: "Promover", color: COLORS.accent.orange },
        { t: tPrevenir, x: 960, icon: <Umbrella x={0} y={0} />, text: "Prevenir", color: COLORS.accent.blue },
        { t: tProteger, x: 1360, icon: <Shield x={0} y={0} s={0.9} />, text: "Proteger", color: COLORS.accent.teal },
      ].map((b) => {
        const s = pop(frame, b.t);
        return (
          <g key={b.text} transform={`translate(${b.x} 140) scale(${s})`}>
            <circle cx={0} cy={0} r={78} fill={COLORS.bg.dark} stroke={b.color} strokeWidth={6} />
            {b.icon}
            <Label x={0} y={120} text={b.text} size={38} color={b.color} />
          </g>
        );
      })}
    </SceneShell>
  );
};
