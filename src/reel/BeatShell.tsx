import React from "react";
import { AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
import { AUTHOR, BeatKey, LEAD, SOURCES, getBeatAudio, getBeatDuration } from "./script";
import { Captions, Footnote, ease } from "./kit";

// The text layer of one beat: headline(s) from the children, phrase
// captions, the source footnote and this beat's voice. The bench itself is
// drawn once for the whole reel underneath (see Reel.tsx), so cuts are
// dissolves of the words while the object stays put.
export const BeatShell: React.FC<{
  beat: BeatKey;
  children?: React.ReactNode;
  dark?: boolean | number;
  captionsY?: number;
  fadeIn?: boolean;
}> = ({ beat, children, dark = false, captionsY, fadeIn = true }) => {
  const frame = useCurrentFrame();
  const total = getBeatDuration(beat);
  const audio = getBeatAudio(beat);
  const opacity = (fadeIn ? ease(frame, 0, 12) : 1) * (1 - ease(frame, total - 10, 10));
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity }}>
        {children}
        <Captions beat={beat} y={captionsY} dark={dark} />
        <Footnote text={SOURCES[beat]} author={AUTHOR} dark={dark} />
      </AbsoluteFill>
      {audio ? (
        <Sequence from={LEAD} name="voz" layout="none">
          <Html5Audio src={staticFile(audio.file)} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
