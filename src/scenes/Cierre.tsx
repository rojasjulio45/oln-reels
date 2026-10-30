import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONT, cue } from "../constants";
import { bob, fade, pop, progress } from "../components/anim";
import { Ground } from "../components/Background";
import { Clinic, House, Label, OLNBuilding, School } from "../components/Illustrations";
import { SceneShell } from "../components/SceneShell";

const HOUSES = [
  { x: 130, color: COLORS.accent.blue },
  { x: 330, color: COLORS.accent.green },
  { x: 1590, color: COLORS.accent.orange },
  { x: 1790, color: COLORS.accent.purple },
];
const ROOF = { x: 960, y: 560 };
// Where the net touches each building.
const ANCHORS = [
  { x: 130, y: 640 },
  { x: 330, y: 640 },
  { x: 590, y: 640 },
  { x: 1330, y: 590 },
  { x: 1590, y: 640 },
  { x: 1790, y: 640 },
];

export const Cierre: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("cierre", s);
  const tRed = c("una red");
  const tBusca = c("busca la Oficina");
  const tPuerta = c("Esa es la puerta");
  const net = progress(frame, tRed, 50);
  const glow = Math.max(fade(frame, tRed, 30) * 0.5, fade(frame, tBusca, 20));
  const door = pop(frame, tPuerta);

  return (
    <SceneShell sceneKey="cierre">
      <Ground y={830} />
      {ANCHORS.map((a, i) => (
        <path
          key={i}
          d={`M ${ROOF.x} ${ROOF.y} Q ${(ROOF.x + a.x) / 2} ${Math.min(ROOF.y, a.y) - 140} ${a.x} ${a.y}`}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - net}
          stroke={COLORS.accent.yellow}
          strokeWidth={4}
          fill="none"
          opacity={0.85}
        />
      ))}
      {ANCHORS.map((a, i) => (
        <circle key={`n${i}`} cx={a.x} cy={a.y} r={10 * net} fill={COLORS.accent.yellow} />
      ))}
      {HOUSES.map((h, i) => (
        <House key={h.x} x={h.x} y={835} s={0.75} color={h.color} opacity={fade(frame, i * 5)} />
      ))}
      <Clinic x={590} y={835} s={0.8} opacity={fade(frame, 8)} />
      <School x={1330} y={835} s={0.6} opacity={fade(frame, 12)} />
      <OLNBuilding x={960} y={835} s={1} glow={glow} />
      {/* The open door at the end: light spilling from the OLN entrance */}
      <g transform={`translate(960 ${835 - 50}) scale(${door})`}>
        <ellipse cx={0} cy={0} rx={90} ry={100} fill={COLORS.accent.yellow} opacity={0.3} />
        <rect x={-36} y={-50} width={72} height={100} rx={12} fill="#fff6c2" />
      </g>
      <Label
        x={960}
        y={170}
        text={"Oficina Local de la Niñez\nde tu comuna"}
        size={48}
        color={COLORS.accent.teal}
        s={pop(frame, tBusca)}
      />
      <g opacity={fade(frame, tPuerta + 20, 20)} transform={`translate(0 ${bob(frame, 4)})`}>
        <text x={960} y={340} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={36} fill={COLORS.muted}>
          Ley 21.430 · Sistema de Garantías de la Niñez
        </text>
      </g>
    </SceneShell>
  );
};
