import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, cue } from "../constants";
import { fade, pop, progress } from "../components/anim";
import { Bell, Family, Gavel, Label } from "../components/Illustrations";
import { SceneShell } from "../components/SceneShell";

const DOOR_W = 280;
const DOOR_H = 400;
const DOOR_BASE = 780;

const Door: React.FC<{ x: number; open: number; color: string; children: React.ReactNode }> = ({
  x,
  open,
  color,
  children,
}) => (
  <g transform={`translate(${x - DOOR_W / 2} ${DOOR_BASE - DOOR_H})`}>
    <rect x={-18} y={-18} width={DOOR_W + 36} height={DOOR_H + 18} rx={20} fill={COLORS.building.shade} />
    <rect x={0} y={0} width={DOOR_W} height={DOOR_H} rx={10} fill="#fff3d6" opacity={0.15 + 0.85 * open} />
    <g transform={`translate(${DOOR_W / 2} ${DOOR_H - 40})`} opacity={open}>
      {children}
    </g>
    {/* The door panel swings open: it narrows towards its hinge on the left */}
    <g transform={`scale(${1 - 0.85 * open} 1)`}>
      <rect x={0} y={0} width={DOOR_W} height={DOOR_H} rx={10} fill={color} />
      <rect x={DOOR_W * 0.55} y={0} width={DOOR_W * 0.45} height={DOOR_H} rx={10} fill="rgba(0,0,0,0.12)" />
      <circle cx={DOOR_W - 36} cy={DOOR_H / 2} r={14} fill={COLORS.accent.yellow} />
    </g>
  </g>
);

export const Ingreso: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("ingreso", s);
  const tTres = c("tres puertas");
  const doors = [
    { t: c("La primera"), x: 420, color: COLORS.accent.pink, label: "Demanda espontánea", icon: <Family x={0} y={0} s={1.5} /> },
    { t: c("La segunda"), x: 960, color: COLORS.accent.blue, label: "Denuncia o alerta", icon: <Bell x={0} y={-130} s={1.6} /> },
    { t: c("La tercera"), x: 1500, color: COLORS.accent.purple, label: "Derivación de tribunal", icon: <Gavel x={0} y={-140} s={1.5} /> },
  ];

  return (
    <SceneShell sceneKey="ingreso">
      <Label x={960} y={110} text="¿Cómo llega un caso a la OLN?" size={50} opacity={fade(frame, 0, 20)} />
      {doors.map((d, i) => (
        <g key={d.label} opacity={fade(frame, 5 + i * 6, 15)} transform={`translate(0 ${-12 * pop(frame, tTres + i * 6) * (1 - pop(frame, tTres + i * 6 + 10))})`}>
          <Door x={d.x} open={progress(frame, d.t, 25)} color={d.color}>
            {d.icon}
          </Door>
          <Label x={d.x} y={290} text={d.label} size={36} color={d.color} s={pop(frame, d.t + 10)} />
        </g>
      ))}
    </SceneShell>
  );
};
