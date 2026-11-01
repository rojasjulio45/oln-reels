import React from "react";
import { AbsoluteFill } from "remotion";
import "../iso/iso.css";
import "./bench/bench.css";
import { Bench } from "./bench/Bench";
import { framingOf, type Camera } from "./bench/camera";
import { programOf, stateAt } from "./bench/model";
import { FontFaces, Grain } from "./Reel";
import { K, OLD, SERIF } from "./kit";
import { REEL_H, REEL_W, Variant } from "./script";

// Cover frame for the grid and the TikTok/Reels thumbnail: the beer pouring
// in close-up, the question in the middle band, clear of the top 12 % and
// the bottom 20 % that the apps cover with their own UI, and inside the
// centred 3:4 crop Instagram shows on the profile grid.
export const Cover: React.FC<{ variant: Variant; title?: string; kicker?: string }> = ({ variant, title, kicker }) => {
  const program = programOf(variant);
  const state = stateAt(program, 24);
  const cam: Camera = { azimuth: 36, elevation: 26, focus: [-108, -30, 150], zoom: 3.2, anchor: 0.78, shot: program.shots[0], settled: 1 };
  const framing = framingOf(cam);
  const words = title ?? (variant === "linkedin" ? "90 personas.\nMisma resaca." : "¿Mezclar da\nmás resaca?");
  const small = kicker ?? (variant === "linkedin" ? "Cerveza y vino, en los dos órdenes" : "Un ensayo clínico responde");
  return (
    <AbsoluteFill className="iso" data-theme="light" style={{ background: K.paper }}>
      <FontFaces />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 72% 52% at 50% 60%, #fdfbf6 0%, ${K.paper} 72%)` }} />
      <AbsoluteFill>
        <Bench state={state} P={framing.P} viewBox={framing.viewBox} width={REEL_W} height={REEL_H} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(to bottom, ${K.paper} 0%, ${K.paper} 30%, rgba(247,244,238,0) 50%, rgba(247,244,238,0) 78%, ${K.paper} 92%)` }} />
      <div style={{ position: "absolute", left: 90, right: 90, top: 560, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 136, lineHeight: 1.02, letterSpacing: "-2px", color: K.ink, whiteSpace: "pre-line" }}>{words}</div>
      <div style={{ position: "absolute", left: 120, right: 120, top: 920, textAlign: "center", fontFamily: OLD, fontStyle: "italic", fontSize: 50, color: K.accent }}>{small}</div>
      <Grain />
    </AbsoluteFill>
  );
};
