import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, cue } from "../constants";
import { clamp, pop, progress } from "../components/anim";
import { Clipboard, Flag, Heart, Kid, Label, Magnifier, Network } from "../components/Illustrations";
import { SceneShell } from "../components/SceneShell";

const STONES = [
  { x: 230, y: 650 },
  { x: 590, y: 580 },
  { x: 960, y: 650 },
  { x: 1330, y: 580 },
  { x: 1690, y: 650 },
];
const PATH = `M 40 690 C 130 690 150 650 230 650 S 480 580 590 580 S 860 650 960 650 S 1220 580 1330 580 S 1590 650 1690 650 S 1840 640 1900 620`;

export const Camino: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("camino", s);
  const steps = [
    { t: c("una evaluación"), color: COLORS.accent.blue, icon: <Magnifier x={0} y={0} />, label: "Evaluación" },
    { t: c("Plan de Atención"), color: COLORS.accent.orange, icon: <Clipboard x={0} y={0} />, label: "Plan de Atención\nFamiliar" },
    { t: c("conecta a la familia"), color: COLORS.accent.teal, icon: <Network x={0} y={0} />, label: "Red: salud,\neducación, apoyo" },
    { t: c("terapia familiar"), color: COLORS.accent.pink, icon: <Heart x={0} y={14} s={1.1} />, label: "Terapia\nfamiliar" },
    { t: c("seguimiento"), color: COLORS.accent.green, icon: <Flag x={0} y={0} />, label: "Seguimiento\ny egreso" },
  ];

  // The kid walks from stone to stone as each step is narrated.
  const times = steps.map((s) => s.t);
  const keyframes = times.flatMap((t) => [t - 20, t]);
  const start = { x: -80, y: 690 };
  const kidX = interpolate(
    frame,
    keyframes,
    STONES.flatMap((s, i) => [(STONES[i - 1] ?? start).x, s.x]),
    clamp,
  );
  const kidY = interpolate(
    frame,
    keyframes,
    STONES.flatMap((s, i) => [(STONES[i - 1] ?? start).y, s.y]),
    clamp,
  );
  const walking = times.some((t) => frame > t - 20 && frame < t);
  const hop = walking ? Math.abs(Math.sin(frame / 3)) * 14 : 0;

  return (
    <SceneShell sceneKey="camino">
      <path
        d={PATH}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - progress(frame, 0, 60)}
        stroke={COLORS.bg.light}
        strokeWidth={46}
        fill="none"
        strokeLinecap="round"
      />
      {STONES.map((st, i) => {
        const s = pop(frame, steps[i].t - 15);
        const on = pop(frame, steps[i].t);
        return (
          <g key={i}>
            <ellipse cx={st.x} cy={st.y + 12} rx={110 * s} ry={34 * s} fill="rgba(0,0,0,0.25)" />
            <ellipse cx={st.x} cy={st.y} rx={110 * s} ry={34 * s} fill={steps[i].color} />
            <g transform={`translate(${st.x} ${st.y - 300}) scale(${on})`}>
              <circle cx={0} cy={0} r={70} fill={COLORS.bg.dark} stroke={steps[i].color} strokeWidth={6} />
              {steps[i].icon}
            </g>
            <Label x={st.x} y={st.y - 455} text={steps[i].label} size={32} color={steps[i].color} s={on} />
          </g>
        );
      })}
      <Kid
        x={kidX}
        y={kidY - hop}
        s={0.85}
        mood={frame >= steps[4].t ? "happy" : "sad"}
      />
    </SceneShell>
  );
};
