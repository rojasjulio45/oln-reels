import React from "react";
import {
  AbsoluteFill,
  Easing,
  Html5Audio,
  Sequence,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import icons from "./assets/icons.json";
import { BeatKey, HAS_VOICE, REEL_FPS, Word, getWords } from "./script";

export const R = {
  navy: "#0b1b4d",
  ink: "#101433",
  yellow: "#ffd23f",
  coral: "#ff5c5c",
  teal: "#0fae95",
  violet: "#5b3df5",
  orange: "#ff7a45",
  sky: "#2f7cf6",
  red: "#d62839",
  white: "#ffffff",
};
export const DISPLAY = "'Inter Display', Inter, sans-serif";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------- motion helpers ----------

export const enter = (frame: number, at: number, stiffness = 180) =>
  spring({ frame: frame - at, fps: REEL_FPS, config: { damping: 14, stiffness, mass: 0.7 } });

export const tween = (frame: number, at: number, duration: number) =>
  interpolate(frame, [at, at + duration], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

export const float = (frame: number, amp = 10, period = 70, phase = 0) =>
  Math.sin((frame / period) * Math.PI * 2 + phase) * amp;

// Decaying camera shake that starts at `at`.
export const shake = (frame: number, at: number, amp = 18, duration = 12) => {
  const t = frame - at;
  if (t < 0 || t > duration) return { x: 0, y: 0 };
  const k = amp * (1 - t / duration);
  return { x: (random(`sx${at}-${t}`) - 0.5) * 2 * k, y: (random(`sy${at}-${t}`) - 0.5) * 2 * k };
};

// ---------- audio ----------

export type SfxName = "whoosh" | "pop" | "ding" | "thud" | "alarm" | "click";

export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 0.5 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={40} layout="none" name={`sfx:${name}`}>
    <Html5Audio src={staticFile(`reel/sfx/${name}.wav`)} volume={volume * (HAS_VOICE ? 0.55 : 1)} />
  </Sequence>
);

// ---------- visual building blocks ----------

type IconName = keyof typeof icons;

// Fluent emoji as a die-cut sticker: white outline, soft shadow, springy pop.
export const Sticker: React.FC<{
  name: IconName;
  x: number;
  y: number;
  size: number;
  at?: number;
  rot?: number;
  bob?: number;
  sfx?: SfxName | null;
  style?: React.CSSProperties;
}> = ({ name, x, y, size, at = 0, rot = 0, bob = 8, sfx = "pop", style }) => {
  const frame = useCurrentFrame();
  const s = enter(frame, at);
  if (frame < at) return null;
  const icon = icons[name];
  const o = Math.max(3, size / 45);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2 + float(frame, bob, 70, x / 97),
          width: size,
          height: size,
          transform: `scale(${s}) rotate(${rot + (1 - s) * -25}deg)`,
          filter: `drop-shadow(${o}px 0 0 #fff) drop-shadow(-${o}px 0 0 #fff) drop-shadow(0 ${o}px 0 #fff) drop-shadow(0 -${o}px 0 #fff) drop-shadow(0 ${size / 14}px ${size / 10}px rgba(0,0,0,0.35))`,
          ...style,
        }}
      >
        <svg viewBox={`0 0 ${icon.w} ${icon.h}`} width={size} height={size} dangerouslySetInnerHTML={{ __html: icon.body }} />
      </div>
      {sfx ? <Sfx name={sfx} at={at} volume={0.3} /> : null}
    </>
  );
};

// Big headline that slams in from 2.4x scale.
export const Slam: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  at?: number;
  color?: string;
  bg?: string;
  rot?: number;
  sfx?: SfxName | null;
  stroke?: boolean;
}> = ({ text, x, y, size, at = 0, color = R.white, bg, rot = 0, sfx = "thud", stroke = true }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps: REEL_FPS, config: { damping: 16, stiffness: 260, mass: 0.6 } });
  const scale = interpolate(s, [0, 1], [2.4, 1]);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
          opacity: Math.min(1, s * 3),
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: -size * 0.02,
          color,
          whiteSpace: "pre",
          textAlign: "center",
          padding: bg ? `${size * 0.18}px ${size * 0.35}px` : 0,
          borderRadius: bg ? size * 0.25 : 0,
          background: bg,
          WebkitTextStroke: stroke && !bg ? `${Math.max(4, size / 18)}px ${R.ink}` : undefined,
          paintOrder: "stroke fill",
          boxShadow: bg ? `0 ${size / 10}px 0 rgba(0,0,0,0.25)` : undefined,
        }}
      >
        {text}
      </div>
      {sfx ? <Sfx name={sfx} at={at} volume={0.4} /> : null}
    </>
  );
};

// Number that races from `from` to `to` and locks with a punch.
export const Counter: React.FC<{
  to: number;
  from?: number;
  x: number;
  y: number;
  size: number;
  at: number;
  duration: number;
  color?: string;
  suffix?: string;
}> = ({ to, from = 0, x, y, size, at, duration, color = R.yellow, suffix = "" }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + duration], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const value = Math.round(from + (to - from) * p);
  const lock = enter(frame, at + duration, 400);
  const punch = frame >= at + duration ? 1 + 0.25 * (1 - lock) : 1;
  const sh = shake(frame, at + duration, 22);
  if (frame < at) return null;
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x + sh.x,
          top: y + sh.y,
          transform: `translate(-50%, -50%) scale(${punch})`,
          fontFamily: DISPLAY,
          fontWeight: 900,
          fontSize: size,
          lineHeight: 1,
          letterSpacing: -size * 0.04,
          color,
          WebkitTextStroke: `${size / 22}px ${R.ink}`,
          paintOrder: "stroke fill",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
        {suffix}
      </div>
      <Burst x={x} y={y} at={at + duration} radius={size * 0.9} />
      <Sfx name="ding" at={at + duration} volume={0.45} />
    </>
  );
};

// Radial speed lines that shoot out when something lands.
export const Burst: React.FC<{ x: number; y: number; at: number; radius?: number; color?: string }> = ({
  x,
  y,
  at,
  radius = 300,
  color = R.yellow,
}) => {
  const frame = useCurrentFrame();
  const t = (frame - at) / 14;
  if (t < 0 || t > 1) return null;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1920}>
      {new Array(12).fill(0).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 + 0.2;
        const r0 = radius * (0.5 + 0.6 * t);
        const r1 = radius * (0.65 + 0.9 * t);
        return (
          <line
            key={i}
            x1={x + Math.cos(a) * r0}
            y1={y + Math.sin(a) * r0}
            x2={x + Math.cos(a) * r1}
            y2={y + Math.sin(a) * r1}
            stroke={color}
            strokeWidth={14 * (1 - t)}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

// Chip label: rounded pill with bold text.
export const Chip: React.FC<{
  text: string;
  x: number;
  y: number;
  at: number;
  size?: number;
  color?: string;
  bg?: string;
}> = ({ text, x, y, at, size = 52, color = R.ink, bg = R.white }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const s = enter(frame, at, 260);
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s})`,
        background: bg,
        color,
        fontFamily: DISPLAY,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.1,
        padding: `${size * 0.3}px ${size * 0.55}px`,
        borderRadius: size,
        whiteSpace: "pre",
        textAlign: "center",
        boxShadow: `0 ${size / 8}px 0 rgba(0,0,0,0.25)`,
      }}
    >
      {text}
    </div>
  );
};

// Animated background: base color, drifting soft blobs and a dot grid.
export const BeatBg: React.FC<{ color: string; accent?: string }> = ({ color, accent = "rgba(255,255,255,0.12)" }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: color, overflow: "hidden" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            borderRadius: "50%",
            background: accent,
            left: -300 + i * 500 + float(frame, 60, 120, i * 2),
            top: [-200, 700, 1400][i] + float(frame, 80, 150, i),
            filter: "blur(40px)",
          }}
        />
      ))}
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.18) 3px, transparent 3px)",
          backgroundSize: "54px 54px",
          backgroundPosition: `0 ${-frame * 1.5}px`,
        }}
      />
    </AbsoluteFill>
  );
};

// Arrow drawn from a to b.
export const Arrow: React.FC<{ from: [number, number]; to: [number, number]; at: number; color?: string; bend?: number }> = ({
  from,
  to,
  at,
  color = R.white,
  bend = -120,
}) => {
  const frame = useCurrentFrame();
  const p = tween(frame, at, 12);
  if (p <= 0) return null;
  const mx = (from[0] + to[0]) / 2;
  const my = (from[1] + to[1]) / 2 + bend;
  const angle = (Math.atan2(to[1] - my, to[0] - mx) * 180) / Math.PI;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0 }} width={1080} height={1920}>
      <path
        d={`M ${from[0]} ${from[1]} Q ${mx} ${my} ${to[0]} ${to[1]}`}
        fill="none"
        stroke={color}
        strokeWidth={16}
        strokeLinecap="round"
        strokeDasharray="1"
        pathLength={1}
        strokeDashoffset={1 - p}
      />
      {p > 0.95 ? (
        <path d="M0 0 L -44 -28 L -44 28 Z" fill={color} transform={`translate(${to[0]} ${to[1]}) rotate(${angle})`} />
      ) : null}
    </svg>
  );
};

// ---------- captions ----------

// Groups words into short pages (max 3 words, breaking after punctuation).
const toPages = (words: Word[]) => {
  const pages: Word[][] = [];
  let page: Word[] = [];
  for (const w of words) {
    page.push(w);
    if (page.length === 3 || /[.,:;!?]$/.test(w.text)) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length) pages.push(page);
  return pages;
};

// TikTok-style captions: one short page at a time, the spoken word pops,
// emphasized words stay yellow.
export const Captions: React.FC<{ beat: BeatKey; y?: number }> = ({ beat, y = 1370 }) => {
  const frame = useCurrentFrame();
  const pages = toPages(getWords(beat));
  const page = [...pages].reverse().find((p) => frame >= p[0].start);
  if (!page) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 60,
        right: 60,
        top: y,
        transform: "translateY(-50%)",
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "0 36px",
        fontFamily: DISPLAY,
        fontWeight: 900,
        fontSize: 84,
        lineHeight: 1.15,
        textTransform: "uppercase",
      }}
    >
      {page.map((w, i) => {
        if (frame < w.start) return <span key={i} style={{ opacity: 0 }}>{w.text}</span>;
        const speaking = frame < w.end;
        const s = enter(frame, w.start, 400);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transform: `scale(${(0.7 + 0.3 * s) * (speaking ? 1.08 : 1)})`,
              color: w.emphasis ? R.yellow : R.white,
              WebkitTextStroke: `14px ${R.ink}`,
              paintOrder: "stroke fill",
            }}
          >
            {w.text}
          </span>
        );
      })}
    </div>
  );
};
