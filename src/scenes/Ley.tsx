import React from "react";
import { random, useCurrentFrame } from "remotion";
import { COLORS, FONT, cue } from "../constants";
import { bob, fade, pop, progress } from "../components/anim";
import { Label, Shield } from "../components/Illustrations";
import { SceneShell } from "../components/SceneShell";

// Stylized Chile: a long, narrow strip with a wiggly coast.
const MAP_X = 1420;
const MAP_TOP = 190;
const MAP_BOTTOM = 840;
const STEPS = 40;
const coast = new Array(STEPS + 1).fill(0).map((_, i) => {
  const t = i / STEPS;
  const y = MAP_TOP + t * (MAP_BOTTOM - MAP_TOP);
  const left = MAP_X - 20 * Math.sin(t * 3) + (random(`c${i}`) - 0.5) * 14 - t * 40;
  const width = 105 - 35 * Math.abs(t - 0.4) - (t > 0.85 ? (t - 0.85) * 300 : 0);
  return { y, left, right: left + Math.max(width, 26) };
});
const CHILE_PATH =
  coast.map((p, i) => `${i === 0 ? "M" : "L"}${p.left.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
  " " +
  [...coast].reverse().map((p) => `L${p.right.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") +
  " Z";
const DOTS = new Array(22).fill(0).map((_, i) => {
  const p = coast[1 + Math.floor((i / 22) * (STEPS - 2))];
  return { x: (p.left + p.right) / 2 + (random(`d${i}`) - 0.5) * 16, y: p.y };
});

export const Ley: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("ley", s);
  const tSimple = c("proteger antes");
  const tComuna = c("en cada comuna");
  const tOln = c("Oficinas Locales");
  const unfold = progress(frame, 5, 25);

  return (
    <SceneShell sceneKey="ley">
      {/* The law document */}
      <g transform={`translate(640 ${470 + bob(frame, 5)}) scale(1 ${unfold})`}>
        <rect x={-260} y={-300} width={520} height={600} rx={22} fill="white" />
        <rect x={-260} y={-300} width={520} height={120} rx={22} fill={COLORS.accent.blue} />
        <text x={0} y={-226} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={64} fill="white">
          LEY 21.430
        </text>
        <text x={0} y={-130} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={29} fill="#3b4a9a">
          Garantías y Protección Integral
        </text>
        <text x={0} y={-88} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={29} fill="#3b4a9a">
          de la Niñez y Adolescencia
        </text>
        {[-30, 10, 50, 90, 130].map((ly, i) => (
          <rect key={ly} x={-170} y={ly} width={i % 2 ? 280 : 340} height={14} rx={7} fill="#d9dcf2" />
        ))}
        <text x={-170} y={250} fontFamily={FONT} fontWeight={800} fontSize={40} fill={COLORS.accent.pink}>
          Marzo 2022
        </text>
        <circle cx={150} cy={230} r={48} fill={COLORS.accent.pink} opacity={0.85} />
        <circle cx={150} cy={230} r={34} fill="none" stroke="white" strokeWidth={5} />
      </g>
      <Shield x={1090} y={380} s={1.4 * pop(frame, tSimple)} />
      <Label x={1090} y={520} text="Proteger antes" size={40} color={COLORS.accent.teal} s={pop(frame, tSimple + 8)} />

      {/* Chile with one light per comuna */}
      <g opacity={fade(frame, tComuna - 10, 20)}>
        <path d={CHILE_PATH} fill={COLORS.bg.light} stroke={COLORS.muted} strokeWidth={3} strokeLinejoin="round" />
        {DOTS.map((d, i) => {
          const on = pop(frame, tComuna + i * 3);
          return (
            <g key={i}>
              <circle cx={d.x} cy={d.y} r={18 * on} fill={COLORS.accent.yellow} opacity={0.3} />
              <circle cx={d.x} cy={d.y} r={8 * on} fill={COLORS.accent.yellow} />
            </g>
          );
        })}
      </g>
      <Label
        x={1180}
        y={110}
        text="OLN · Oficinas Locales de la Niñez"
        size={44}
        color={COLORS.accent.teal}
        s={pop(frame, tOln)}
      />
    </SceneShell>
  );
};
