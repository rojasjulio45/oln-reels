import React from "react";
import { AbsoluteFill } from "remotion";
import "../iso/iso.css";
import "./bench/bench.css";
import { Bench } from "./bench/Bench";
import { framingOf, type Camera } from "./bench/camera";
import { programOf, stateAt } from "./bench/model";
import { FontFaces, Grain } from "./Reel";
import { K, SERIF } from "./kit";

// Profile picture for "Datos y factos": the three bottles in close-up inside
// a copper ring, the monogram below. Safe for the circular crop.
export const Avatar: React.FC = () => {
  const program = programOf("instagram");
  const state = stateAt(program, 24);
  const cam: Camera = { azimuth: 38, elevation: 24, focus: [-70, -30, 150], zoom: 2.1, anchor: 0.5, shot: program.shots[0], settled: 1 };
  const framing = framingOf(cam);
  return (
    <AbsoluteFill className="iso" data-theme="light" style={{ background: K.paper }}>
      <FontFaces />
      <div style={{ position: "absolute", left: 90, top: 60, width: 900, height: 900, borderRadius: "50%", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: -90, top: -470 }}>
          <Bench state={state} P={framing.P} viewBox={framing.viewBox} width={1080} height={1920} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 90, top: 60, width: 900, height: 900, borderRadius: "50%", boxShadow: `inset 0 0 0 14px ${K.accent}` }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: 690, textAlign: "center", fontFamily: SERIF, fontWeight: 600, fontSize: 150, color: K.ink, letterSpacing: "-2px" }}>
        <span style={{ background: K.paper, padding: "0 28px", borderRadius: 20 }}>DyF</span>
      </div>
      <Grain />
    </AbsoluteFill>
  );
};
