import React from "react";
import { AbsoluteFill, Html5Audio, Series, continueRender, delayRender, interpolate, staticFile, useCurrentFrame } from "remotion";
import "../iso/iso.css";
import "./bench/bench.css";
import { Bench } from "./bench/Bench";
import { cameraAt, framingOf, toCanvas } from "./bench/camera";
import { programOf, readingOf, stateAt } from "./bench/model";
import { BEATS } from "./beats/Beats";
import { DISPLAY, K, OLD, ease } from "./kit";
import { BeatKey, HAS_VOICE, REEL_H, REEL_W, VARIANTS, Variant, getBeatDuration, getVariantDuration } from "./script";

const PAPER_0 = "rgba(247,244,238,0)";

// Self-hosted Google Fonts (OFL) from public/fonts, declared at runtime so the
// bundler leaves the paths alone.
const FACES: Array<[string, string, number, string]> = [
  ["Playfair Display", "italic", 400, "PlayfairDisplay-400-italic.woff2"],
  ["Playfair Display", "normal", 400, "PlayfairDisplay-400-normal.woff2"],
  ["Playfair Display", "normal", 600, "PlayfairDisplay-600-normal.woff2"],
  ["Old Standard TT", "italic", 400, "OldStandardTT-400-italic.woff2"],
  ["Old Standard TT", "normal", 400, "OldStandardTT-400-normal.woff2"],
  ["Old Standard TT", "normal", 700, "OldStandardTT-700-normal.woff2"],
];
export const FontFaces: React.FC = () => (
  <style>
    {FACES.map(([family, style, weight, file]) => `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:block;src:url('${staticFile(`fonts/${file}`)}') format('woff2');}`).join("\n")}
  </style>
);

// Wait for the self-hosted serifs before the first frame is captured.
const useFonts = () => {
  const [handle] = React.useState(() => delayRender("fonts"));
  React.useEffect(() => {
    const faces = ["600 100px 'Playfair Display'", "400 100px 'Playfair Display'", "italic 400 40px 'Old Standard TT'", "700 20px 'Old Standard TT'", "400 20px 'Old Standard TT'"];
    Promise.all(faces.map((f) => document.fonts.load(f)))
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
};

// Paper grain: static noise, multiplied over everything, barely there.
export const Grain: React.FC = () => (
  <svg width={REEL_W} height={REEL_H} style={{ position: "absolute", inset: 0, mixBlendMode: "multiply", opacity: 0.09, pointerEvents: "none" }}>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="7" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <rect width="100%" height="100%" filter="url(#grain)" />
  </svg>
);

// Keynote callout: a dot on the part, a hairline and a short word.
const Callout: React.FC<{ x: number; y: number; text: string; side: "left" | "right"; opacity: number }> = ({ x, y, text, side, opacity }) => {
  if (opacity <= 0.001 || y < 640 || y > 1250) return null;
  const run = 84;
  const width = text.length * 19 + 20;
  // Flip the side when the label would leave the frame.
  const fits = (s: "left" | "right") => (s === "right" ? x + run + 16 + width <= REEL_W - 72 : x - run - 16 - width >= 72);
  const other = side === "right" ? "left" : "right";
  if (!fits(side) && fits(other)) side = other;
  if (!fits(side)) {
    // Neither side fits: hang the word under the dot.
    return (
      <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
        <div style={{ position: "absolute", left: x - 6, top: y - 6, width: 12, height: 12, borderRadius: 6, background: K.ink }} />
        <div style={{ position: "absolute", left: x - 0.75, top: y, width: 1.5, height: 56, background: K.ink, opacity: 0.55 }} />
        <div style={{ position: "absolute", top: y + 66, left: Math.max(72, Math.min(REEL_W - 72 - width, x - width / 2)), fontFamily: DISPLAY, fontSize: 36, fontWeight: 500, letterSpacing: "-0.4px", color: K.ink, whiteSpace: "nowrap" }}>
          {text}
        </div>
      </div>
    );
  }
  const dir = side === "right" ? 1 : -1;
  const lx = x + dir * run;
  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: x - 6, top: y - 6, width: 12, height: 12, borderRadius: 6, background: K.ink }} />
      <div style={{ position: "absolute", left: Math.min(x, lx), top: y - 0.5, width: run, height: 1.5, background: K.ink, opacity: 0.55 }} />
      <div
        style={{
          position: "absolute",
          top: y - 24,
          left: side === "right" ? lx + 16 : undefined,
          right: side === "left" ? REEL_W - lx + 16 : undefined,
          fontFamily: DISPLAY,
          fontSize: 36,
          fontWeight: 500,
          letterSpacing: "-0.4px",
          color: K.ink,
          whiteSpace: "nowrap",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Stage: React.FC<{ variant: Variant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const program = React.useMemo(() => programOf(variant), [variant]);
  const state = stateAt(program, frame);
  const cam = cameraAt(program.shots, frame);
  const framing = framingOf(cam);
  const dark = program.dark.reduce((o, [a, b]) => Math.max(o, ease(frame, a - 12, 12) * (1 - ease(frame, b - 12, 12))), 0);

  const index = program.shots.indexOf(cam.shot);
  const next = program.shots[index + 1];
  const callout = cam.shot.callout;
  const calloutOpacity = callout ? ease(frame, cam.shot.at + (cam.shot.move ?? 24) - 4, 14) * (next ? 1 - ease(frame, next.at - 10, 10) : 1) : 0;
  const anchor = callout ? toCanvas(callout.point, framing) : [0, 0];

  return (
    <AbsoluteFill className="iso" data-theme="light">
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 72% 52% at 50% 54%, #fdfbf6 0%, ${K.paper} 72%)` }} />
      <AbsoluteFill>
        <Bench state={state} P={framing.P} viewBox={framing.viewBox} width={REEL_W} height={REEL_H} />
      </AbsoluteFill>
      {/* paper fades above and below the object, where the words live */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(to bottom, ${K.paper} 0%, ${K.paper} 22%, ${PAPER_0} 34%, ${PAPER_0} 64%, ${K.paper} 76%, ${K.paper} 100%)`,
          pointerEvents: "none",
        }}
      />
      {callout ? <Callout x={anchor[0]} y={anchor[1]} text={callout.text} side={callout.side ?? "right"} opacity={calloutOpacity} /> : null}
      {/* live readout from the same model that moves the parts */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1638,
          textAlign: "center",
          fontFamily: OLD,
          fontSize: 32,
          fontWeight: 400,
          color: K.grey,
          letterSpacing: "0.4px",
          fontVariantNumeric: "tabular-nums",
          opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        Etanol total · {readingOf(state.drinks)} tragos
      </div>
      <AbsoluteFill style={{ background: K.black, opacity: dark }} />
    </AbsoluteFill>
  );
};

export const Reel: React.FC<{ variant: Variant }> = ({ variant }) => {
  useFonts();
  const total = getVariantDuration(variant);
  return (
    <AbsoluteFill style={{ background: K.paper }}>
      <FontFaces />
      <Stage variant={variant} />
      <Series>
        {VARIANTS[variant].map((key: BeatKey) => {
          const Beat = BEATS[key];
          return (
            <Series.Sequence key={key} name={key} durationInFrames={getBeatDuration(key)}>
              <Beat />
            </Series.Sequence>
          );
        })}
      </Series>
      <Grain />
      <Html5Audio src={staticFile(`reel/bgm-${variant}.wav`)} volume={(f) => interpolate(f, [0, 30, total - 30, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (HAS_VOICE ? 0.16 : 0.45)} />
    </AbsoluteFill>
  );
};
