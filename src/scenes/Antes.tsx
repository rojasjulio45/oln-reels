import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, FONT, cue } from "../constants";
import { bob, clamp, fade, pop } from "../components/anim";
import { Clock, Label } from "../components/Illustrations";
import { SceneShell } from "../components/SceneShell";

const PIECES = [
  { x: 520, y: 380, dx: -120, dy: -60, rot: -20, color: COLORS.accent.teal, label: "OPD" },
  { x: 760, y: 360, dx: 40, dy: -110, rot: 15, color: COLORS.accent.pink, label: "" },
  { x: 560, y: 600, dx: -150, dy: 90, rot: 25, color: COLORS.accent.yellow, label: "" },
  { x: 800, y: 600, dx: 90, dy: 100, rot: -30, color: COLORS.accent.blue, label: "" },
  { x: 660, y: 480, dx: 0, dy: 10, rot: 40, color: COLORS.accent.purple, label: "" },
];

const Piece: React.FC<{ color: string; label: string; grey: number }> = ({ color, label, grey }) => (
  <g style={{ filter: `grayscale(${grey})` }}>
    <rect x={-80} y={-80} width={160} height={160} rx={24} fill={color} />
    <circle cx={80} cy={0} r={30} fill={color} />
    <circle cx={0} cy={-80} r={30} fill={color} />
    <circle cx={-80} cy={0} r={26} fill={COLORS.bg.mid} />
    <rect x={-80} y={0} width={160} height={80} rx={24} fill="rgba(0,0,0,0.12)" />
    {label ? (
      <text x={0} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={52} fill="white">
        {label}
      </text>
    ) : null}
  </g>
);

export const Antes: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("antes", s);
  const tFrag = c("fragmentado");
  const tOpd = c("las OPD");
  const tTarde = c("llegaban tarde");
  const spread = interpolate(frame, [tFrag, tFrag + 90], [0, 1], clamp);
  const grey = fade(frame, tTarde, 30);
  // The clock ticks faster once cases "arrive late".
  const angle = frame * 3 + Math.max(0, frame - tTarde) * 12;

  return (
    <SceneShell sceneKey="antes">
      <Label x={660} y={130} text="Un sistema fragmentado" size={48} opacity={fade(frame, tFrag)} />
      {PIECES.map((p, i) => {
        const s = pop(frame, 5 + i * 4);
        const x = p.x + p.dx * spread + bob(frame, 4, 80, i);
        const y = p.y + p.dy * spread + bob(frame, 6, 100, i * 2);
        const highlight = p.label ? 1 + 0.15 * pop(frame, tOpd) : 1;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${p.rot * spread}) scale(${s * highlight})`}>
            <Piece color={p.color} label={p.label} grey={grey} />
          </g>
        );
      })}
      <Clock x={1440} y={420} s={1.5 * pop(frame, 10)} angle={angle} />
      <Label
        x={1440}
        y={680}
        text="Demasiado tarde"
        size={46}
        color={COLORS.accent.red}
        s={pop(frame, tTarde + 10)}
      />
    </SceneShell>
  );
};
