import React from "react";
import { AbsoluteFill, Html5Audio, Series, interpolate, staticFile, useCurrentFrame } from "remotion";
import { R } from "./kit";
import { BeatKey, HAS_VOICE, VARIANTS, Variant, getBeatDuration, getVariantDuration } from "./script";
import { CtaInstagram, CtaLinkedIn } from "./beats/Ctas";
import { HookInstagram, HookLinkedIn } from "./beats/Hooks";
import { Grave, Ley, Mision, Proceso, Puertas, Reto } from "./beats/Body";

const BEATS: Record<BeatKey, React.FC> = {
  hookLinkedIn: HookLinkedIn,
  hookInstagram: HookInstagram,
  ley: Ley,
  mision: Mision,
  puertas: Puertas,
  proceso: Proceso,
  grave: Grave,
  reto: Reto,
  ctaLinkedIn: CtaLinkedIn,
  ctaInstagram: CtaInstagram,
};

// Thin bar at the top that fills over the whole reel (keeps people watching).
const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, top: 0, height: 14, width: `${(frame / total) * 100}%`, background: R.yellow }} />
  );
};

export const Reel: React.FC<{ variant: Variant }> = ({ variant }) => {
  const total = getVariantDuration(variant);
  return (
    <AbsoluteFill style={{ background: R.navy }}>
      <Series>
        {VARIANTS[variant].map((key) => {
          const Beat = BEATS[key];
          return (
            <Series.Sequence key={key} name={key} durationInFrames={getBeatDuration(key)}>
              <Beat />
            </Series.Sequence>
          );
        })}
      </Series>
      <ProgressBar total={total} />
      <Html5Audio
        src={staticFile(`reel/bgm-${variant}.wav`)}
        volume={(f) => interpolate(f, [0, total - 20, total], [1, 1, 0]) * (HAS_VOICE ? 0.14 : 0.4)}
      />
    </AbsoluteFill>
  );
};
