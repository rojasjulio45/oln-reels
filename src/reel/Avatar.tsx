import React from "react";
import { AbsoluteFill } from "remotion";
import { FontFaces, Grain } from "./Reel";
import { K, SERIF } from "./kit";

// Profile picture for "Datos y factos": a generic mark that works for any
// topic. Monogram in ink on paper, a copper ring and three rising bars (data)
// ending in a check (facts). Safe for the circular crop.
export const Avatar: React.FC = () => (
  <AbsoluteFill style={{ background: K.paper }}>
    <FontFaces />
    <div style={{ position: "absolute", left: 90, top: 90, width: 900, height: 900, borderRadius: "50%", boxShadow: `inset 0 0 0 16px ${K.accent}` }} />
    <div style={{ position: "absolute", left: 0, right: 0, top: 250, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 300, lineHeight: 1, color: K.ink, letterSpacing: "-6px" }}>DyF</div>
    <svg width={1080} height={1080} style={{ position: "absolute", inset: 0 }}>
      {[0, 1, 2].map((i) => (
        <rect key={i} x={410 + i * 62} y={800 - 40 - i * 40} width={40} height={40 + i * 40} rx={6} fill={i === 2 ? K.accent : K.ink} />
      ))}
      <path d="M612 690 L642 720 L700 652" fill="none" stroke={K.accent} strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <Grain />
  </AbsoluteFill>
);
