import React from "react";
import { useCurrentFrame } from "remotion";
import { COLORS, FONT, cue } from "../constants";
import { bob, fade, pop } from "../components/anim";
import { Ground } from "../components/Background";
import { House, Kid, School } from "../components/Illustrations";
import { SceneShell } from "../components/SceneShell";

const Bubble: React.FC<{ x: number; y: number; s: number; children: React.ReactNode }> = ({
  x,
  y,
  s,
  children,
}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle cx={0} cy={0} r={95} fill="white" />
    <circle cx={60} cy={110} r={18} fill="white" />
    <circle cx={85} cy={150} r={10} fill="white" />
    {children}
  </g>
);

export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("intro", s);
  const tCansada = c("llega cansada");
  const tJuega = c("ya no juega");
  const tAlmorzar = c("sin almorzar");
  const tCasa = c("Algo pasa");
  const tPregunta = c("¿a quién");
  // The three symptom bubbles leave when the house appears.
  const symptomsOut = 1 - fade(frame, tCasa - 5, 12);

  return (
    <SceneShell sceneKey="intro">
      <Ground y={800} />
      <School x={1420} y={810} s={1.1} opacity={fade(frame, 0, 20)} />
      <Kid x={700} y={805} s={1.7} mood="sad" />
      <g opacity={symptomsOut}>
        <Bubble x={420} y={330} s={pop(frame, tCansada)}>
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={70} fill={COLORS.accent.blue}>
            Zzz
          </text>
        </Bubble>
        <Bubble x={700} y={240 + bob(frame, 5)} s={pop(frame, tJuega)}>
          <circle cx={0} cy={0} r={44} fill={COLORS.accent.orange} />
          <path d="M-44 0 H 44 M 0 -44 V 44" stroke="#c9701f" strokeWidth={6} />
          <path d="M-60 -60 L 60 60" stroke={COLORS.accent.red} strokeWidth={14} strokeLinecap="round" />
        </Bubble>
        <Bubble x={980} y={330} s={pop(frame, tAlmorzar)}>
          <ellipse cx={0} cy={10} rx={64} ry={24} fill="#d9d4f5" />
          <ellipse cx={0} cy={6} rx={44} ry={14} fill="white" />
          <rect x={-90} y={-30} width={10} height={70} rx={5} fill="#9aa3d4" />
          <rect x={80} y={-30} width={10} height={70} rx={5} fill="#9aa3d4" />
        </Bubble>
      </g>
      <g transform={`translate(560 330) scale(${pop(frame, tCasa)})`}>
        <circle cx={0} cy={0} r={150} fill="white" opacity={0.95} />
        <House x={0} y={95} s={0.9} color={COLORS.accent.purple} />
        <g transform={`translate(${bob(frame, 8, 60)} -110)`}>
          <ellipse cx={0} cy={0} rx={80} ry={36} fill="#5a6280" />
          <circle cx={-34} cy={-18} r={30} fill="#5a6280" />
          <circle cx={22} cy={-26} r={38} fill="#5a6280" />
          <path d="M6 30 L -10 62 L 8 62 L -6 94" stroke={COLORS.accent.yellow} strokeWidth={8} fill="none" strokeLinejoin="round" />
        </g>
      </g>
      <g transform={`translate(1060 400) rotate(${bob(frame, 6, 50)}) scale(${pop(frame, tPregunta)})`}>
        <text x={0} y={100} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={300} fill={COLORS.accent.yellow}>
          ?
        </text>
      </g>
    </SceneShell>
  );
};
