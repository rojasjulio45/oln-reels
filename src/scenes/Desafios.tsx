import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT, cue } from "../constants";
import { clamp, fade, pop, progress } from "../components/anim";
import { Contract, Folder, Label } from "../components/Illustrations";
import { SceneShell } from "../components/SceneShell";

const YEARS = [2022, 2023, 2024, 2025, 2026, 2027];
const BAR = { x: 360, y: 250, w: 1200 };
const FOLDER_COLORS = [COLORS.accent.yellow, COLORS.accent.orange, COLORS.accent.pink, COLORS.accent.blue];

export const Desafios: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("desafios", s);
  const tPlazo = c("cinco años");
  const tCasos = c("cientos de casos");
  const tHonorarios = c("parte del personal");
  const fill = progress(frame, tPlazo, 60);
  const folders = Math.floor(interpolate(frame, [tCasos, tCasos + 60], [0, 12], clamp));
  const count = Math.round(interpolate(frame, [tCasos, tCasos + 60], [0, 300], clamp));

  return (
    <SceneShell sceneKey="desafios">
      <Label x={960} y={110} text="Instalación gradual: 5 años" size={46} opacity={fade(frame, tPlazo - 10)} />
      <g opacity={fade(frame, 0, 20)}>
        <rect x={BAR.x} y={BAR.y - 22} width={BAR.w} height={44} rx={22} fill={COLORS.bg.dark} />
        <rect x={BAR.x} y={BAR.y - 22} width={Math.max(44, BAR.w * fill)} height={44} rx={22} fill={COLORS.accent.teal} />
        {YEARS.map((y, i) => {
          const x = BAR.x + (i / (YEARS.length - 1)) * BAR.w;
          return (
            <g key={y}>
              <circle cx={x} cy={BAR.y} r={14} fill={fill >= i / (YEARS.length - 1) ? "white" : COLORS.muted} />
              <text x={x} y={BAR.y + 70} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={34} fill={COLORS.text}>
                {y}
              </text>
            </g>
          );
        })}
      </g>

      {/* Case load: a desk buried under folders */}
      <g opacity={fade(frame, tCasos - 15)}>
        <rect x={380} y={760} width={520} height={30} rx={10} fill={COLORS.accent.orange} />
        <rect x={420} y={790} width={22} height={60} rx={6} fill={COLORS.accent.orange} />
        <rect x={838} y={790} width={22} height={60} rx={6} fill={COLORS.accent.orange} />
        {new Array(folders).fill(0).map((_, i) => (
          <Folder
            key={i}
            x={520 + (i % 2) * 16 + ((i * 37) % 13)}
            y={720 - i * 30}
            s={0.9}
            color={FOLDER_COLORS[i % FOLDER_COLORS.length]}
          />
        ))}
        <text x={790} y={520} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={120} fill={COLORS.accent.yellow}>
          {count}
        </text>
        <text x={790} y={575} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={32} fill={COLORS.text}>
          casos por gestor
        </text>
        <text x={790} y={615} textAnchor="middle" fontFamily={FONT} fontWeight={500} fontSize={26} fill={COLORS.muted}>
          (ej.: Los Ángeles, 2026)
        </text>
      </g>

      <Contract x={1400} y={560} s={1.5 * pop(frame, tHonorarios)} />
      <Label x={1400} y={760} text="Personal a honorarios" size={36} color={COLORS.accent.purple} s={pop(frame, tHonorarios + 8)} />
    </SceneShell>
  );
};
