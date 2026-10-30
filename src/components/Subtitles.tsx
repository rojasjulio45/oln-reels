import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { FONT, Segment } from "../constants";
import { clamp } from "./anim";

// Shows the narration chunk being spoken, with a short fade in and out.
export const Subtitles: React.FC<{ segments: Segment[] }> = ({ segments }) => {
  const frame = useCurrentFrame();
  const seg = segments.find((s) => frame >= s.startFrame && frame < s.endFrame);
  if (!seg) return null;
  const edge = Math.min(6, Math.floor((seg.endFrame - seg.startFrame) / 3));
  const opacity = interpolate(
    frame,
    [seg.startFrame, seg.startFrame + edge, seg.endFrame - edge, seg.endFrame],
    [0, 1, 1, 0],
    clamp,
  );
  return (
    <AbsoluteFill
      style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 60 }}
    >
      <div
        style={{
          opacity,
          maxWidth: 1500,
          padding: "16px 36px",
          borderRadius: 24,
          background: "rgba(8, 10, 30, 0.72)",
          color: "white",
          fontFamily: FONT,
          fontSize: 44,
          fontWeight: 600,
          lineHeight: 1.3,
          textAlign: "center",
        }}
      >
        {seg.text}
      </div>
    </AbsoluteFill>
  );
};
