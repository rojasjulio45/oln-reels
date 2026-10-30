import React from "react";
import { COLORS, FONT } from "../constants";

// All illustrations are SVG groups drawn around (0,0) and placed with
// x/y/s. People and buildings are anchored at their feet/base; icons at
// their center. Flat shapes, rounded corners and a darker shade layer give
// the Kurzgesagt look.

type Place = { x: number; y: number; s?: number; opacity?: number };

const place = ({ x, y, s = 1 }: Place) => `translate(${x} ${y}) scale(${s})`;

export const Kid: React.FC<Place & { mood?: "sad" | "happy"; shirt?: string }> = ({
  mood = "happy",
  shirt = COLORS.accent.orange,
  opacity = 1,
  ...p
}) => (
  <g transform={place(p)} opacity={opacity}>
    {/* backpack */}
    <rect x={-46} y={-118} width={30} height={60} rx={10} fill={COLORS.accent.purple} />
    {/* legs */}
    <rect x={-22} y={-50} width={16} height={50} rx={8} fill="#3b4a9a" />
    <rect x={6} y={-50} width={16} height={50} rx={8} fill="#3b4a9a" />
    {/* body */}
    <rect x={-32} y={-130} width={64} height={90} rx={26} fill={shirt} />
    <rect x={-32} y={-80} width={64} height={40} rx={18} fill="rgba(0,0,0,0.12)" />
    {/* head */}
    <circle cx={0} cy={-170} r={44} fill={COLORS.skin} />
    {/* pigtails */}
    <circle cx={-46} cy={-186} r={16} fill={COLORS.hair} />
    <circle cx={46} cy={-186} r={16} fill={COLORS.hair} />
    <path d="M-44 -180 Q -40 -222 0 -218 Q 40 -222 44 -180 Q 20 -200 -44 -180 Z" fill={COLORS.hair} />
    {/* face */}
    <circle cx={-15} cy={-168} r={5} fill="#22223b" />
    <circle cx={15} cy={-168} r={5} fill="#22223b" />
    <circle cx={-26} cy={-152} r={6} fill="#ff9aa2" opacity={0.6} />
    <circle cx={26} cy={-152} r={6} fill="#ff9aa2" opacity={0.6} />
    {mood === "happy" ? (
      <path d="M-12 -148 Q 0 -136 12 -148" stroke="#22223b" strokeWidth={4} fill="none" strokeLinecap="round" />
    ) : (
      <path d="M-12 -140 Q 0 -150 12 -140" stroke="#22223b" strokeWidth={4} fill="none" strokeLinecap="round" />
    )}
  </g>
);

export const Adult: React.FC<Place & { shirt: string; hair?: string; long?: boolean }> = ({
  shirt,
  hair = COLORS.hair,
  long = false,
  opacity = 1,
  ...p
}) => (
  <g transform={place(p)} opacity={opacity}>
    <rect x={-26} y={-80} width={20} height={80} rx={10} fill="#2c3570" />
    <rect x={6} y={-80} width={20} height={80} rx={10} fill="#2c3570" />
    <rect x={-44} y={-200} width={88} height={135} rx={34} fill={shirt} />
    <rect x={-44} y={-130} width={88} height={65} rx={26} fill="rgba(0,0,0,0.12)" />
    {long ? <rect x={-42} y={-262} width={84} height={90} rx={36} fill={hair} /> : null}
    <circle cx={0} cy={-246} r={46} fill={COLORS.skin} />
    <path d="M-46 -250 Q -44 -298 0 -296 Q 44 -298 46 -250 Q 10 -272 -46 -250 Z" fill={hair} />
    <circle cx={-15} cy={-244} r={5} fill="#22223b" />
    <circle cx={15} cy={-244} r={5} fill="#22223b" />
    <path d="M-12 -222 Q 0 -212 12 -222" stroke="#22223b" strokeWidth={4} fill="none" strokeLinecap="round" />
  </g>
);

export const House: React.FC<Place & { color?: string }> = ({
  color = COLORS.accent.blue,
  opacity = 1,
  ...p
}) => (
  <g transform={place(p)} opacity={opacity}>
    <rect x={-80} y={-130} width={160} height={130} rx={10} fill={COLORS.building.wall} />
    <rect x={-80} y={-130} width={40} height={130} fill={COLORS.building.shade} />
    <path d="M-100 -122 L 0 -210 L 100 -122 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={12} />
    <rect x={-20} y={-70} width={40} height={70} rx={8} fill={color} />
    <rect x={30} y={-104} width={34} height={30} rx={6} fill={COLORS.building.window} />
  </g>
);

export const School: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <rect x={-190} y={-210} width={380} height={210} rx={12} fill={COLORS.building.wall} />
    <rect x={-190} y={-210} width={70} height={210} fill={COLORS.building.shade} />
    <rect x={-60} y={-300} width={120} height={100} rx={10} fill={COLORS.building.wall} />
    <path d="M-80 -296 L 0 -360 L 80 -296 Z" fill={COLORS.accent.pink} stroke={COLORS.accent.pink} strokeWidth={10} strokeLinejoin="round" />
    <circle cx={0} cy={-252} r={24} fill={COLORS.accent.yellow} />
    <rect x={-2} y={-264} width={4} height={14} fill="#22223b" />
    <rect x={-2} y={-254} width={12} height={4} fill="#22223b" />
    {[-140, -70, 70, 140].map((wx) => (
      <rect key={wx} x={wx - 24} y={-160} width={48} height={44} rx={8} fill={COLORS.building.window} />
    ))}
    <rect x={-34} y={-90} width={68} height={90} rx={10} fill={COLORS.accent.pink} />
    <text x={0} y={-180} textAnchor="middle" fontFamily={FONT} fontWeight={800} fontSize={30} fill="#3b4a9a">
      ESCUELA
    </text>
  </g>
);

export const Clinic: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <rect x={-110} y={-170} width={220} height={170} rx={12} fill={COLORS.building.wall} />
    <rect x={-110} y={-170} width={50} height={170} fill={COLORS.building.shade} />
    <rect x={-30} y={-150} width={60} height={60} rx={10} fill="white" stroke={COLORS.accent.red} strokeWidth={4} />
    <rect x={-8} y={-142} width={16} height={44} rx={4} fill={COLORS.accent.red} />
    <rect x={-22} y={-128} width={44} height={16} rx={4} fill={COLORS.accent.red} />
    <rect x={-26} y={-70} width={52} height={70} rx={8} fill={COLORS.accent.teal} />
  </g>
);

export const Court: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <path d="M-140 -200 L 0 -270 L 140 -200 Z" fill={COLORS.accent.purple} stroke={COLORS.accent.purple} strokeWidth={10} strokeLinejoin="round" />
    <rect x={-140} y={-200} width={280} height={24} rx={6} fill={COLORS.building.shade} />
    {[-105, -35, 35, 105].map((cx) => (
      <rect key={cx} x={cx - 16} y={-176} width={32} height={150} rx={8} fill={COLORS.building.wall} />
    ))}
    <rect x={-150} y={-26} width={300} height={26} rx={6} fill={COLORS.building.shade} />
  </g>
);

// The OLN office: the hub of the story, with a heart sign.
export const OLNBuilding: React.FC<Place & { glow?: number }> = ({
  glow = 0,
  opacity = 1,
  ...p
}) => (
  <g transform={place(p)} opacity={opacity}>
    <defs>
      <radialGradient id="olnGlow">
        <stop offset="0%" stopColor={COLORS.accent.yellow} stopOpacity={0.55} />
        <stop offset="100%" stopColor={COLORS.accent.yellow} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={0} cy={-150} r={300} fill="url(#olnGlow)" opacity={glow} />
    <rect x={-160} y={-250} width={320} height={250} rx={18} fill={COLORS.building.wall} />
    <rect x={-160} y={-250} width={70} height={250} rx={18} fill={COLORS.building.shade} />
    <rect x={-180} y={-280} width={360} height={46} rx={14} fill={COLORS.accent.teal} />
    <text x={0} y={-245} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="white">
      OLN
    </text>
    <Heart x={0} y={-160} s={0.9} />
    {[-100, 100].map((wx) => (
      <rect key={wx} x={wx - 28} y={-190} width={56} height={50} rx={8} fill={COLORS.building.window} />
    ))}
    <rect x={-36} y={-100} width={72} height={100} rx={12} fill={COLORS.accent.teal} />
    <circle cx={22} cy={-50} r={5} fill={COLORS.accent.yellow} />
  </g>
);

// ---------- Icons (centered on x/y) ----------

export const Heart: React.FC<Place & { color?: string }> = ({
  color = COLORS.accent.pink,
  opacity = 1,
  ...p
}) => (
  <g transform={place(p)} opacity={opacity}>
    <path
      d="M0 30 C -60 -10 -50 -60 -20 -60 C -8 -60 0 -50 0 -40 C 0 -50 8 -60 20 -60 C 50 -60 60 -10 0 30 Z"
      fill={color}
    />
  </g>
);

export const Shield: React.FC<Place & { color?: string }> = ({
  color = COLORS.accent.teal,
  opacity = 1,
  ...p
}) => (
  <g transform={place(p)} opacity={opacity}>
    <path d="M0 -70 L 60 -48 V 0 C 60 40 30 62 0 74 C -30 62 -60 40 -60 0 V -48 Z" fill={color} />
    <path d="M0 -70 L 60 -48 V 0 C 60 40 30 62 0 74 Z" fill="rgba(0,0,0,0.15)" />
    <path d="M-24 2 L -6 20 L 28 -18" stroke="white" strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export const Megaphone: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <path d="M-50 -20 L 30 -55 V 55 L -50 20 Z" fill={COLORS.accent.orange} strokeLinejoin="round" stroke={COLORS.accent.orange} strokeWidth={8} />
    <rect x={-66} y={-22} width={22} height={44} rx={8} fill={COLORS.accent.yellow} />
    <path d="M44 -30 Q 62 0 44 30" stroke="white" strokeWidth={6} fill="none" strokeLinecap="round" />
    <path d="M58 -46 Q 84 0 58 46" stroke="white" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.6} />
  </g>
);

export const Umbrella: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <path d="M-70 0 Q -70 -70 0 -70 Q 70 -70 70 0 Q 52 -14 35 0 Q 18 -14 0 0 Q -18 -14 -35 0 Q -52 -14 -70 0 Z" fill={COLORS.accent.blue} />
    <path d="M0 -70 Q 22 -40 35 0 Q 18 -14 0 0 Z" fill="rgba(0,0,0,0.15)" />
    <path d="M0 0 V 52 Q 0 66 -14 66" stroke="white" strokeWidth={7} fill="none" strokeLinecap="round" />
  </g>
);

export const Bell: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <path d="M-48 30 Q -40 20 -40 -10 Q -40 -56 0 -56 Q 40 -56 40 -10 Q 40 20 48 30 Z" fill={COLORS.accent.yellow} />
    <path d="M0 -56 Q 40 -56 40 -10 Q 40 20 48 30 H 0 Z" fill="rgba(0,0,0,0.12)" />
    <circle cx={0} cy={42} r={12} fill={COLORS.accent.orange} />
    <circle cx={0} cy={-62} r={8} fill={COLORS.accent.yellow} />
  </g>
);

export const Gavel: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <g transform="rotate(-35)">
      <rect x={-50} y={-30} width={100} height={44} rx={12} fill={COLORS.accent.purple} />
      <rect x={-8} y={10} width={16} height={80} rx={8} fill={COLORS.accent.orange} />
    </g>
    <rect x={-10} y={50} width={90} height={18} rx={6} fill={COLORS.accent.purple} opacity={0.7} />
  </g>
);

export const Family: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <Adult x={-60} y={0} s={0.45} shirt={COLORS.accent.blue} />
    <Adult x={60} y={0} s={0.45} shirt={COLORS.accent.green} long />
    <Kid x={0} y={0} s={0.45} />
  </g>
);

export const Clipboard: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <rect x={-46} y={-60} width={92} height={120} rx={12} fill={COLORS.accent.orange} />
    <rect x={-36} y={-46} width={72} height={98} rx={6} fill="white" />
    <rect x={-20} y={-68} width={40} height={20} rx={6} fill={COLORS.accent.purple} />
    {[-24, -2, 20].map((ly) => (
      <g key={ly}>
        <circle cx={-22} cy={ly} r={5} fill={COLORS.accent.teal} />
        <rect x={-12} y={ly - 4} width={38} height={8} rx={4} fill="#c4c9e8" />
      </g>
    ))}
  </g>
);

export const Folder: React.FC<Place & { color?: string }> = ({
  color = COLORS.accent.yellow,
  opacity = 1,
  ...p
}) => (
  <g transform={place(p)} opacity={opacity}>
    <path d="M-60 -36 H -16 L -4 -24 H 60 V 40 H -60 Z" fill={color} strokeLinejoin="round" stroke={color} strokeWidth={8} />
    <rect x={-60} y={-14} width={120} height={54} rx={6} fill="rgba(0,0,0,0.12)" />
  </g>
);

export const Magnifier: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <rect x={20} y={20} width={20} height={60} rx={10} fill={COLORS.accent.orange} transform="rotate(-45 30 50)" />
    <circle cx={-10} cy={-10} r={44} fill="rgba(79,163,255,0.35)" stroke={COLORS.accent.blue} strokeWidth={14} />
  </g>
);

export const Network: React.FC<Place> = ({ opacity = 1, ...p }) => {
  const nodes = [
    [0, -50, COLORS.accent.pink],
    [-50, 30, COLORS.accent.teal],
    [50, 30, COLORS.accent.yellow],
  ] as const;
  return (
    <g transform={place(p)} opacity={opacity}>
      <path d="M0 -50 L -50 30 L 50 30 Z" stroke="white" strokeWidth={6} fill="none" strokeLinejoin="round" />
      <circle cx={0} cy={0} r={18} fill={COLORS.accent.blue} />
      {nodes.map(([nx, ny, c], i) => (
        <circle key={i} cx={nx} cy={ny} r={22} fill={c} />
      ))}
    </g>
  );
};

export const Flag: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <rect x={-30} y={-70} width={10} height={140} rx={5} fill="white" />
    <path d="M-20 -66 H 50 L 34 -40 L 50 -14 H -20 Z" fill={COLORS.accent.green} />
    <path d="M-2 -42 L 10 -30 L 30 -54" stroke="white" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </g>
);

export const Contract: React.FC<Place> = ({ opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <rect x={-56} y={-74} width={112} height={148} rx={12} fill="white" />
    <rect x={-56} y={-74} width={30} height={148} rx={12} fill={COLORS.building.shade} />
    {[-46, -24, -2, 20].map((ly) => (
      <rect key={ly} x={-12} y={ly} width={54} height={9} rx={4} fill="#c4c9e8" />
    ))}
    <path d="M-10 50 Q 6 34 16 50 T 44 48" stroke={COLORS.accent.blue} strokeWidth={5} fill="none" strokeLinecap="round" />
  </g>
);

export const Clock: React.FC<Place & { angle: number }> = ({ angle, opacity = 1, ...p }) => (
  <g transform={place(p)} opacity={opacity}>
    <circle cx={0} cy={0} r={90} fill={COLORS.building.wall} />
    <circle cx={0} cy={0} r={90} fill="none" stroke={COLORS.accent.orange} strokeWidth={14} />
    {new Array(12).fill(0).map((_, i) => (
      <rect key={i} x={-3} y={-76} width={6} height={14} rx={3} fill="#9aa3d4" transform={`rotate(${i * 30})`} />
    ))}
    <rect x={-5} y={-44} width={10} height={50} rx={5} fill="#22223b" transform={`rotate(${angle / 12})`} />
    <rect x={-4} y={-68} width={8} height={74} rx={4} fill={COLORS.accent.pink} transform={`rotate(${angle})`} />
    <circle cx={0} cy={0} r={10} fill="#22223b" />
  </g>
);

// Label with a rounded pill behind it. Supports "\n" for two lines.
export const Label: React.FC<
  Place & { text: string; color?: string; size?: number; textColor?: string }
> = ({ text, color = "rgba(8,10,30,0.6)", size = 36, textColor = "white", opacity = 1, ...p }) => {
  const lines = text.split("\n");
  const width = Math.max(...lines.map((l) => l.length)) * size * 0.56 + size * 1.2;
  const height = lines.length * size * 1.25 + size * 0.6;
  return (
    <g transform={place(p)} opacity={opacity}>
      <rect x={-width / 2} y={-height / 2} width={width} height={height} rx={height / 2.5} fill={color} />
      <text textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={size} fill={textColor}>
        {lines.map((l, i) => (
          <tspan key={i} x={0} y={(i - (lines.length - 1) / 2) * size * 1.25 + size * 0.36}>
            {l}
          </tspan>
        ))}
      </text>
    </g>
  );
};
