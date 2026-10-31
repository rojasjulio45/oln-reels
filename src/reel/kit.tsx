import React from "react";
import { Easing, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { BeatKey, HAS_VOICE, getPhrases } from "./script";

// Keynote palette: paper, ink, a quiet grey and one blue accent.
export const K = {
  paper: "#fbfbfd",
  ink: "#1d1d1f",
  grey: "#86868b",
  accent: "#0071e3",
  black: "#000000",
  white: "#ffffff",
};
export const DISPLAY = "'Inter Display', Inter, sans-serif";
export const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// 0..1 over `duration` frames from `at`, with the keynote curve.
export const ease = (frame: number, at: number, duration = 24) => interpolate(frame, [at, at + duration], [0, 1], { ...clamp, easing: EASE });

// Fade plus a 12 px rise in, fade out.
export const reveal = (frame: number, at: number, until = Infinity, inDur = 22, outDur = 14) => {
  const i = ease(frame, at, inDur);
  const o = until === Infinity ? 0 : ease(frame, until - outDur, outDur);
  return { opacity: i * (1 - o), y: (1 - i) * 12 - o * 6 };
};

// ---------- audio ----------

export type SfxName = "click" | "drip" | "chime" | "tick";

export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 0.3 }) => (
  <Sequence from={Math.max(0, Math.round(at))} durationInFrames={40} layout="none" name={`sfx:${name}`}>
    <Html5Audio src={staticFile(`reel/sfx/${name}.wav`)} volume={volume * (HAS_VOICE ? 0.6 : 1)} />
  </Sequence>
);

// ---------- typography ----------

export interface Line {
  text: string;
  at: number; // beat-local frame
  until?: number;
  accent?: string; // word (or fragment) drawn in the accent colour
  size?: number;
  weight?: number;
  color?: string;
}

const Rich: React.FC<{ text: string; accent?: string; color: string }> = ({ text, accent, color }) => {
  if (!accent || !text.includes(accent)) return <>{text}</>;
  const [a, b] = text.split(accent);
  return (
    <>
      {a}
      <span style={{ color: K.accent }}>{accent}</span>
      {b}
    </>
  );
  void color;
};

// Big, thin keynote headline. Lines appear one under another (or replace
// each other when `until` is set), each with a fade and a short rise.
export const Headline: React.FC<{ lines: Line[]; y?: number; align?: "center" | "left"; color?: string; size?: number }> = ({
  lines,
  y = 300,
  align = "center",
  color = K.ink,
  size = 132,
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        right: 96,
        top: y,
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: align === "center" ? "center" : "flex-start",
        textAlign: align,
        gap: 10,
        fontFamily: DISPLAY,
      }}
    >
      {lines.map((l, i) => {
        const r = reveal(frame, l.at, l.until);
        if (r.opacity <= 0.001) return null;
        return (
          <div
            key={i}
            style={{
              opacity: r.opacity,
              transform: `translateY(${r.y}px)`,
              fontSize: l.size ?? size,
              fontWeight: l.weight ?? 500,
              letterSpacing: `${-(l.size ?? size) * 0.03}px`,
              lineHeight: 1.04,
              color: l.color ?? color,
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "pre-line",
            }}
          >
            <Rich text={l.text} accent={l.accent} color={l.color ?? color} />
          </div>
        );
      })}
    </div>
  );
};

// A grey secondary line under a headline.
export const Sub: React.FC<{ text: string; at: number; until?: number; y: number; color?: string; size?: number }> = ({ text, at, until, y, color = K.grey, size = 44 }) => {
  const frame = useCurrentFrame();
  const r = reveal(frame, at, until);
  if (r.opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        top: y,
        textAlign: "center",
        fontFamily: DISPLAY,
        fontSize: size,
        fontWeight: 400,
        letterSpacing: `${-size * 0.01}px`,
        lineHeight: 1.25,
        color,
        opacity: r.opacity,
        transform: `translateY(${r.y}px)`,
      }}
    >
      {text}
    </div>
  );
};

// ---------- captions ----------

// Phrases of 2 to 5 words, one at a time, in sync with the voice. The key
// word is heavier and in the accent colour. No outline, no uppercase.
export const Captions: React.FC<{ beat: BeatKey; y?: number; dark?: boolean | number }> = ({ beat, y = 1500, dark: darkProp = false }) => {
  const frame = useCurrentFrame();
  const dark = typeof darkProp === "number" ? frame < darkProp : darkProp;
  const phrases = getPhrases(beat);
  const index = [...phrases].reverse().findIndex((p) => frame >= p.start - 4);
  if (index < 0) return null;
  const phrase = phrases[phrases.length - 1 - index];
  const next = phrases[phrases.length - index];
  const inP = ease(frame, phrase.start - 4, 9);
  const outAt = next ? next.start - 4 : phrase.end + 12;
  const out = ease(frame, outAt - 5, 5);
  const opacity = inP * (1 - out);
  if (opacity <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 96,
        right: 96,
        top: y,
        transform: `translateY(${(1 - inP) * 10}px)`,
        opacity,
        textAlign: "center",
        fontFamily: DISPLAY,
        fontSize: 60,
        fontWeight: 500,
        letterSpacing: "-0.6px",
        lineHeight: 1.2,
        color: dark ? K.white : K.ink,
      }}
    >
      {phrase.words.map((w, i) => (
        <span key={i} style={{ fontWeight: w.emphasis ? 600 : 500, color: w.emphasis ? K.accent : undefined }}>
          {w.text}
          {i < phrase.words.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

// Footnote line: the source for this beat's facts, and the author.
export const Footnote: React.FC<{ text: string; author?: string; dark?: boolean | number; y?: number }> = ({ text, author, dark: darkProp = false, y = 1748 }) => {
  const frame = useCurrentFrame();
  const dark = typeof darkProp === "number" ? frame < darkProp : darkProp;
  return (
  <div
    style={{
      position: "absolute",
      left: 96,
      right: 96,
      top: y,
      textAlign: "center",
      fontFamily: DISPLAY,
      color: dark ? "rgba(255,255,255,0.55)" : K.grey,
      fontSize: 26,
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: "0px",
    }}
  >
    <div>{text}</div>
    {author ? <div style={{ opacity: 0.8 }}>{author}</div> : null}
  </div>
  );
};
