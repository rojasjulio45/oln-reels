import React from "react";
import { useCurrentFrame } from "remotion";
import { BeatShell } from "../BeatShell";
import { R, Slam, Sticker, enter, float } from "../kit";
import { cue } from "../script";

// Three dots "typing…" inside a speech bubble.
const Typing: React.FC<{ x: number; y: number }> = ({ x, y }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: x - 90, top: y - 20, display: "flex", gap: 30 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: R.ink,
            transform: `translateY(${Math.min(0, Math.sin((frame - i * 5) / 4) * 16)}px)`,
          }}
        />
      ))}
    </div>
  );
};

export const CtaLinkedIn: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("ctaLinkedIn", s);
  const tComentarios = c("comentarios");
  return (
    <BeatShell beat="ctaLinkedIn" bg={R.yellow}>
      <Sticker name="round-pushpin" x={200} y={430} size={170} at={2} rot={-12} />
      <Slam text={"¿Y EN TU\nCOMUNA?"} x={560} y={460} size={130} at={c("tu comuna")} color={R.ink} stroke={false} />
      <Sticker name="speech-balloon" x={540} y={860} size={420} at={6} bob={6} />
      {frame >= 12 ? <Typing x={540} y={830} /> : null}
      <Sticker name="backhand-index-pointing-down" x={540} y={1150 + float(frame, 14, 14)} size={170} at={tComentarios} bob={0} />
    </BeatShell>
  );
};

export const CtaInstagram: React.FC = () => {
  const frame = useCurrentFrame();
  const c = (s: string) => cue("ctaInstagram", s);
  const tShare = c("compártelo");
  const fly = enter(frame, tShare, 120);
  return (
    <BeatShell beat="ctaInstagram" bg={R.yellow}>
      <Sticker name="bookmark" x={540} y={560} size={340} at={1} rot={-6} />
      <Slam text="GUÁRDALO" x={540} y={830} size={150} at={2} color={R.ink} stroke={false} />
      <Sticker
        name="envelope-with-arrow"
        x={110 + fly * 70}
        y={1160 - fly * 100}
        size={180}
        at={tShare}
        rot={-10 + fly * 20}
        bob={0}
        sfx="whoosh"
      />
      <Slam text="COMPÁRTELO" x={600} y={1060} size={92} at={tShare + 4} color={R.white} bg={R.ink} rot={-3} sfx={null} />
      <Sticker name="people-hugging" x={880} y={1200} size={150} at={c("niños")} />
    </BeatShell>
  );
};
