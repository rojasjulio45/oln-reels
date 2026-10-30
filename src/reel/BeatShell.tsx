import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { AUTHOR, BeatKey, LEAD, SOURCES, getBeatAudio } from "./script";
import { BeatBg, Captions, DISPLAY, R, Sfx, enter } from "./kit";

// Author credit and a small, low-contrast source line for the beat's facts.
const Footer: React.FC<{ beat: BeatKey; dark: boolean }> = ({ beat, dark }) => (
  <div
    style={{
      position: "absolute",
      left: 60,
      right: 60,
      top: 1490,
      textAlign: "center",
      fontFamily: DISPLAY,
      color: dark ? "rgba(16,20,51,0.75)" : "rgba(255,255,255,0.8)",
      lineHeight: 1.35,
    }}
  >
    <div style={{ fontSize: 32, fontWeight: 800 }}>por {AUTHOR}</div>
    <div style={{ fontSize: 28, fontWeight: 500, opacity: 0.7 }}>{SOURCES[beat]}</div>
  </div>
);

// Every beat: animated background, a punch-in cut with a white flash and a
// whoosh, the illustration, word-by-word captions, credits and (once
// generated) voice.
export const BeatShell: React.FC<{
  beat: BeatKey;
  bg: string;
  children: React.ReactNode;
  captionsY?: number;
  // false for the opening beat: frame 0 must already show the hook, never a flash.
  cut?: boolean;
}> = ({ beat, bg, children, captionsY, cut = true }) => {
  const frame = useCurrentFrame();
  const punch = cut ? 1 + 0.12 * (1 - enter(frame, 0, 300)) : 1;
  const flash = cut ? interpolate(frame, [0, 3], [0.7, 0], { extrapolateRight: "clamp" }) : 0;
  const audio = getBeatAudio(beat);
  return (
    <AbsoluteFill>
      <BeatBg color={bg} />
      <AbsoluteFill style={{ transform: `scale(${punch})` }}>{children}</AbsoluteFill>
      <Captions beat={beat} y={captionsY} />
      <Footer beat={beat} dark={bg === R.yellow} />
      <AbsoluteFill style={{ background: "white", opacity: flash }} />
      {cut ? <Sfx name="whoosh" at={0} volume={0.35} /> : null}
      {audio ? (
        <Sequence from={LEAD} name="voz" layout="none">
          <Html5Audio src={staticFile(audio.file)} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
