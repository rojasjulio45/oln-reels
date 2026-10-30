import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONT, cue } from "../constants";
import { fade, pop, progress } from "../components/anim";
import { Court, Label, OLNBuilding, Shield } from "../components/Illustrations";
import { SceneShell } from "../components/SceneShell";

const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; p: number; color: string }> = ({
  x1,
  y1,
  x2,
  y2,
  p,
  color,
}) => {
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - p}
        stroke={color}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <g transform={`translate(${x2} ${y2}) rotate(${angle}) scale(${p > 0.95 ? 1 : 0})`}>
        <path d="M0 0 L -40 -26 L -40 26 Z" fill={color} />
      </g>
    </g>
  );
};

export const Grave: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("grave", s);
  const tGrave = c("es grave");
  const tServicio = c("Servicio Nacional");
  const tTribunal = c("tribunal de familia");
  const tLinea = c("primera línea");
  const pulse = fade(frame, tGrave, 20) * (0.55 + 0.25 * Math.sin(frame / 6));

  return (
    <SceneShell sceneKey="grave" tint="rgba(255, 50, 70, 0.85)" tintOpacity={pulse * (1 - fade(frame, tLinea, 30) * 0.7)}>
      <OLNBuilding x={500} y={800} s={0.95} glow={fade(frame, tLinea, 20)} />
      <g transform={`translate(500 300) scale(${pop(frame, tGrave)})`}>
        <path d="M0 -70 L 72 56 H -72 Z" fill={COLORS.accent.red} stroke={COLORS.accent.red} strokeWidth={18} strokeLinejoin="round" />
        <text x={0} y={42} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={96} fill="white">
          !
        </text>
      </g>
      <Label x={500} y={430} text="Primera línea" size={40} color={COLORS.accent.teal} s={pop(frame, tLinea)} />

      <Arrow x1={720} y1={520} x2={1150} y2={260} p={progress(frame, tServicio, 25)} color={COLORS.accent.teal} />
      <Shield x={1400} y={230} s={1.5 * pop(frame, tServicio + 15)} />
      <Label
        x={1400}
        y={410}
        text={"Servicio Nacional de\nProtección Especializada"}
        size={34}
        color={COLORS.accent.teal}
        s={pop(frame, tServicio + 20)}
      />

      <Arrow x1={720} y1={640} x2={1150} y2={680} p={progress(frame, tTribunal, 25)} color={COLORS.accent.purple} />
      <Court x={1400} y={800} s={0.85 * pop(frame, tTribunal + 15)} />
      <Label x={1400} y={520} text="Tribunal de Familia" size={36} color={COLORS.accent.purple} s={pop(frame, tTribunal + 20)} />
    </SceneShell>
  );
};
