import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, cue } from "../constants";
import { bob, fade, pop } from "../components/anim";
import { Adult, Clipboard, Folder, Heart, Label, Network } from "../components/Illustrations";
import { SceneShell } from "../components/SceneShell";

export const Equipo: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("equipo", s);
  const members = [
    { t: c("Una coordinación"), x: 330, shirt: COLORS.accent.orange, long: false, icon: <Clipboard x={0} y={0} />, label: "Coordinación" },
    { t: c("Gestión comunitaria"), x: 750, shirt: COLORS.accent.teal, long: true, icon: <Network x={0} y={0} />, label: "Gestión\ncomunitaria" },
    { t: c("Gestores de casos"), x: 1170, shirt: COLORS.accent.blue, long: false, icon: <Folder x={0} y={0} />, label: "Gestión\nde casos" },
    { t: c("terapia familiar"), x: 1590, shirt: COLORS.accent.pink, long: true, icon: <Heart x={0} y={14} s={1.1} />, label: "Terapia\nfamiliar" },
  ];

  return (
    <SceneShell sceneKey="equipo">
      <Label x={960} y={90} text="El equipo de la OLN" size={50} color={COLORS.accent.teal} opacity={fade(frame, 0, 20)} />
      <ellipse cx={960} cy={812} rx={860} ry={40} fill={COLORS.bg.light} opacity={0.8} />
      {members.map((m, i) => {
        const s = pop(frame, m.t);
        return (
          <g key={m.label}>
            <Adult x={m.x} y={800 - (1 - s) * 40} s={1.0} shirt={m.shirt} long={m.long} opacity={s} />
            <g transform={`translate(${m.x} ${400 + bob(frame, 6, 80, i)}) scale(${s})`}>
              <circle cx={0} cy={0} r={74} fill={COLORS.bg.dark} stroke={m.shirt} strokeWidth={6} />
              {m.icon}
            </g>
            <Label x={m.x} y={230} text={m.label} size={36} color={m.shirt} s={pop(frame, m.t + 6)} />
          </g>
        );
      })}
    </SceneShell>
  );
};
