import React from "react";
import { AbsoluteFill, Html5Audio, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import "../iso/iso.css";
import "./bench/bench.css";
import { Bench } from "./bench/Bench";
import { programOf, readingOf, stateAt } from "./bench/model";
import { BEATS } from "./beats/Beats";
import { DISPLAY, K, ease } from "./kit";
import { BeatKey, HAS_VOICE, VARIANTS, Variant, getBeatDuration, getVariantDuration } from "./script";

// Where the bench sits and how big it is on the 1080 × 1920 canvas.
export const STAGE = { x: 100, y: 500, width: 880 };

const Stage: React.FC<{ variant: Variant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const program = React.useMemo(() => programOf(variant), [variant]);
  const state = stateAt(program, frame);
  // Product-camera push-in: slow, continuous, reset under the black interlude.
  const [darkFrom, darkTo] = program.dark[0] ?? [Infinity, Infinity];
  const push = frame < darkFrom ? interpolate(frame, [0, darkFrom], [1, 1.06]) : interpolate(frame, [darkTo, program.total], [1, 1.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const dark = program.dark.reduce((o, [a, b]) => Math.max(o, ease(frame, a - 12, 12) * (1 - ease(frame, b - 12, 12))), 0);
  return (
    <AbsoluteFill className="iso" data-theme="light">
      {/* a barely-there radial gradient behind the object */}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 70% 50% at 50% 52%, #ffffff 0%, ${K.paper} 70%)` }} />
      <div style={{ position: "absolute", left: STAGE.x, top: STAGE.y, width: STAGE.width, transform: `scale(${push})`, transformOrigin: "50% 55%" }}>
        <Bench state={state} width={STAGE.width} />
      </div>
      {/* live readout from the same model that moves the parts */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 1380,
          textAlign: "center",
          fontFamily: DISPLAY,
          fontSize: 30,
          fontWeight: 400,
          color: K.grey,
          letterSpacing: "0.2px",
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
  const total = getVariantDuration(variant);
  return (
    <AbsoluteFill style={{ background: K.paper }}>
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
      <Html5Audio src={staticFile(`reel/bgm-${variant}.wav`)} volume={(f) => interpolate(f, [0, 30, total - 30, total], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) * (HAS_VOICE ? 0.16 : 0.45)} />
    </AbsoluteFill>
  );
};
