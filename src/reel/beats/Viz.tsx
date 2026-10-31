import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { K, OLD, ease } from "../kit";

// Small hand-drawn data figures that sit between the headline and the
// bench. Every number comes from the sources in script.ts. They share the
// paper's wobble filter and use the one copper accent.

const W = 880;
const H = 200;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Frame: React.FC<{ at: number; until?: number; children: React.ReactNode; id: string; top?: number }> = ({ at, until, children, id, top = 430 }) => {
  const frame = useCurrentFrame();
  const inP = ease(frame, at, 18);
  const out = until === undefined ? 0 : ease(frame, until - 12, 12);
  const opacity = inP * (1 - out);
  if (opacity <= 0.001) return null;
  const seed = Math.floor(frame / 4) % 50;
  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      style={{ position: "absolute", left: 100, top, opacity, transform: `translateY(${(1 - inP) * 10}px)`, overflow: "visible" }}
    >
      <defs>
        <filter id={`wobble-${id}`} x="-4%" y="-8%" width="108%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed={seed} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#wobble-${id})`}>{children}</g>
    </svg>
  );
};

const label = (x: number, y: number, text: string, anchor: "start" | "middle" | "end" = "middle", size = 26, fill = K.grey, italic = true) => (
  <text x={x} y={y} textAnchor={anchor} fontFamily={OLD} fontStyle={italic ? "italic" : "normal"} fontSize={size} fill={fill}>
    {text}
  </text>
);

// 90 people in three groups of 30 (beer then wine, wine then beer, one drink
// only), then three equal hangover bars. Köchling et al., 2019.
export const People90: React.FC<{ at: number; barsAt: number; until?: number }> = ({ at, barsAt, until }) => {
  const frame = useCurrentFrame();
  const groups = ["cerveza → vino", "vino → cerveza", "una sola bebida"];
  return (
    <Frame at={at} until={until} id="p90">
      {groups.map((g, gi) => {
        const x0 = 20 + gi * 296;
        return (
          <g key={g}>
            {Array.from({ length: 30 }, (_, i) => {
              const col = i % 10;
              const row = Math.floor(i / 10);
              const t = ease(frame, at + 4 + (gi * 30 + i) * 0.5, 10);
              if (t <= 0) return null;
              return <circle key={i} cx={x0 + 12 + col * 26} cy={22 + row * 26} r={7 * t} fill="none" stroke={K.ink} strokeWidth={1.8} />;
            })}
            {label(x0 + 128, 118, g)}
            {(() => {
              const b = ease(frame, barsAt + gi * 4, 16);
              if (b <= 0) return null;
              const h = 44 * b;
              return (
                <g>
                  <rect x={x0 + 100} y={190 - h} width={56} height={h} fill={K.accent} opacity={0.85} rx={3} />
                  <line x1={x0 + 20} y1={190} x2={x0 + 236} y2={190} stroke={K.ink} strokeWidth={1.5} />
                  {label(x0 + 128, 182 - h, "resaca", "middle", 20, K.ink)}
                  {gi < 2 ? label(x0 + 268, 170, "=", "middle", 34, K.ink, false) : null}
                </g>
              );
            })()}
          </g>
        );
      })}
    </Frame>
  );
};

// A rule of hours; one small glass empties per hour. NIAAA; Jones 2010.
export const Hours: React.FC<{ at: number; until?: number }> = ({ at, until }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [at + 10, at + 130], [0, 5], clamp);
  return (
    <Frame at={at} until={until} id="hours">
      <line x1={60} y1={150} x2={820} y2={150} stroke={K.ink} strokeWidth={1.8} />
      {Array.from({ length: 6 }, (_, h) => {
        const x = 60 + h * 152;
        return (
          <g key={h}>
            <line x1={x} y1={142} x2={x} y2={158} stroke={K.ink} strokeWidth={1.8} />
            {label(x, 186, `${h} h`, "middle", 22)}
          </g>
        );
      })}
      {Array.from({ length: 5 }, (_, i) => {
        const x = 60 + 76 + i * 152;
        const full = Math.max(0, Math.min(1, progress - i)); // this hour's glass draining
        const fill = 1 - full;
        return (
          <g key={i}>
            <path d={`M${x - 22} 40 L${x - 16} 120 L${x + 16} 120 L${x + 22} 40 Z`} fill="none" stroke={K.ink} strokeWidth={1.8} strokeLinejoin="round" />
            {fill > 0.01 ? <path d={`M${x - 22 + 6 * (1 - fill)} ${120 - 80 * fill} L${x - 16} 120 L${x + 16} 120 L${x + 22 - 6 * (1 - fill)} ${120 - 80 * fill} Z`} fill={K.accent} opacity={0.8} /> : null}
          </g>
        );
      })}
      <g>
        <circle cx={60 + progress * 152} cy={150} r={7} fill={K.accent} />
      </g>
    </Frame>
  );
};

// Two bars: congeners in vodka and in bourbon, about 37 to 1. Rohsenow et al., 2010.
export const Congeners: React.FC<{ at: number; until?: number }> = ({ at, until }) => {
  const frame = useCurrentFrame();
  const grow = ease(frame, at + 6, 40);
  const baseY = 170;
  return (
    <Frame at={at} until={until} id="cong">
      <line x1={120} y1={baseY} x2={760} y2={baseY} stroke={K.ink} strokeWidth={1.8} />
      <rect x={250} y={baseY - 4 * grow} width={90} height={4 * grow} fill={K.ink} opacity={0.7} />
      {label(295, baseY - 14 - 4 * grow, "vodka · 1×", "middle", 24, K.ink)}
      <rect x={540} y={baseY - 148 * grow} width={90} height={148 * grow} fill={K.accent} opacity={0.88} rx={3} />
      {label(585, baseY - 12 - 148 * grow, `bourbon · ${Math.round(37 * grow)}×`, "middle", 24, K.ink)}
      {label(440, 196, "congéneres por volumen, misma alcoholemia", "middle", 20)}
    </Frame>
  );
};

// Four glyphs, one per cue: speed, an empty stomach, bubbles, little sleep.
export const Factors: React.FC<{ at: number; cues: [number, number, number, number]; until?: number }> = ({ at, cues, until }) => {
  const frame = useCurrentFrame();
  const names = ["velocidad", "estómago vacío", "burbujas", "poco sueño"];
  const glyph = (i: number, x: number, t: number) => {
    const s = `scale(${0.6 + 0.4 * t})`;
    const common = { fill: "none", stroke: K.ink, strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
    switch (i) {
      case 0: // stopwatch
        return (
          <g transform={`translate(${x} 70) ${s}`}>
            <circle r={34} {...common} />
            <line x1={0} y1={-42} x2={0} y2={-34} {...common} />
            <line x1={-8} y1={-46} x2={8} y2={-46} {...common} />
            <path d={`M0 0 L${18 * Math.cos(-1.1 + t * 2.4)} ${18 * Math.sin(-1.1 + t * 2.4)}`} stroke={K.accent} strokeWidth={3} strokeLinecap="round" />
          </g>
        );
      case 1: // empty plate with fork and knife
        return (
          <g transform={`translate(${x} 70) ${s}`}>
            <ellipse rx={40} ry={16} {...common} />
            <ellipse rx={26} ry={9} {...common} strokeOpacity={0.5} />
            <path d="M-58 -30 L-58 30 M-64 -30 L-64 -10 M-52 -30 L-52 -10" {...common} />
            <path d="M58 -30 L58 30 M58 -30 C70 -20 70 0 58 6" {...common} />
          </g>
        );
      case 2: // bubbles in a glass
        return (
          <g transform={`translate(${x} 70) ${s}`}>
            <path d="M-26 -36 L-20 40 L20 40 L26 -36" {...common} />
            {[
              [-8, 20, 4],
              [6, 4, 6],
              [-4, -14, 5],
              [10, -26, 3],
            ].map(([bx, by, r], k) => (
              <circle key={k} cx={bx} cy={by - ((frame * 1.3 + k * 17) % 50)} r={r} {...common} stroke={K.accent} />
            ))}
          </g>
        );
      default: // moon and a short line of sleep
        return (
          <g transform={`translate(${x} 70) ${s}`}>
            <path d="M14 -34 A36 36 0 1 0 34 20 A28 28 0 0 1 14 -34 Z" {...common} />
            <path d="M-50 36 L-26 36 M-20 36 L-6 36" {...common} strokeOpacity={0.6} />
          </g>
        );
    }
  };
  return (
    <Frame at={at} until={until} id="factors">
      {names.map((n, i) => {
        const t = ease(frame, cues[i] - 4, 14);
        if (t <= 0) return null;
        const x = 130 + i * 206;
        return (
          <g key={n} opacity={t}>
            {glyph(i, x, t)}
            {label(x, 160, n, "middle", 24, K.ink)}
          </g>
        );
      })}
    </Frame>
  );
};

// Tally marks that pile up fast, then a question mark: you lose count.
export const Tally: React.FC<{ at: number; questionAt: number; until?: number }> = ({ at, questionAt, until }) => {
  const frame = useCurrentFrame();
  const groups = 7;
  const q = ease(frame, questionAt, 14);
  return (
    <Frame at={at} until={until} id="tally">
      {Array.from({ length: groups }, (_, g) => {
        const x0 = 70 + g * 104;
        return (
          <g key={g}>
            {Array.from({ length: 5 }, (_, i) => {
              const t = ease(frame, at + (g * 5 + i) * 2.2, 5);
              if (t <= 0) return null;
              if (i < 4) return <line key={i} x1={x0 + i * 16} y1={60} x2={x0 + i * 16 + 2} y2={120 * t + 60 - 60 * (1 - t)} stroke={K.ink} strokeWidth={3} strokeLinecap="round" />;
              return <line key={i} x1={x0 - 6} y1={118} x2={x0 - 6 + 62 * t} y2={118 - 56 * t} stroke={K.accent} strokeWidth={3.4} strokeLinecap="round" />;
            })}
          </g>
        );
      })}
      {q > 0 ? (
        <text x={W - 40} y={126} textAnchor="end" fontFamily={OLD} fontSize={120 * (0.7 + 0.3 * q)} fill={K.accent} opacity={q}>
          ?
        </text>
      ) : null}
      {label(70, 176, "tragos esta noche", "start", 22)}
    </Frame>
  );
};

// One hundred people, 47 of them in copper. SENDA, 2024.
export const Hundred: React.FC<{ at: number; until?: number; filled?: number; top?: number }> = ({ at, until, filled = 47, top }) => {
  const frame = useCurrentFrame();
  const lit = Math.round(interpolate(frame, [at + 8, at + 50], [0, filled], clamp));
  return (
    <Frame at={at} until={until} id="hundred" top={top}>
      {Array.from({ length: 100 }, (_, i) => {
        const col = i % 20;
        const row = Math.floor(i / 20);
        const on = i < lit;
        return <circle key={i} cx={78 + col * 38} cy={30 + row * 34} r={on ? 11 : 9} fill={on ? K.accent : "none"} stroke={on ? K.accent : K.ink} strokeWidth={1.8} opacity={on ? 0.9 : 0.8} />;
      })}
    </Frame>
  );
};
