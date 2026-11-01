import { AbsoluteFill, Composition, Still } from "remotion";
import { FPS, HEIGHT, WIDTH, getTotalDuration } from "./constants";
import { OLNVideo } from "./OLNVideo";
import { Reel } from "./reel/Reel";
import { Cover } from "./reel/Cover";
import { Avatar } from "./reel/Avatar";
import { Bench } from "./reel/bench/Bench";
import { programOf, stateAt } from "./reel/bench/model";
import { framingOf } from "./reel/bench/camera";
import { REEL_FPS, REEL_H, REEL_W, getVariantDuration } from "./reel/script";
import "./iso/iso.css";
import "./reel/bench/bench.css";

// The bench alone, at rest, for the Anatomy-style close-up checks.
const BenchStill: React.FC<{ frame: number; width: number; azimuth?: number; elevation?: number; zoom?: number }> = ({ frame, width, azimuth = 46, elevation = 30, zoom = 1 }) => {
  const program = programOf("linkedin");
  const state = stateAt(program, frame);
  state.explode = state.explode.map(() => 0);
  const cam = { azimuth, elevation, focus: [-10, 0, 82] as [number, number, number], zoom, anchor: 0.5, shot: program.shots[0], settled: 1 };
  const framing = framingOf(cam);
  const height = Math.round((width * REEL_H) / REEL_W);
  return (
    <AbsoluteFill className="iso" data-theme="light" style={{ background: "#fbfbfd", justifyContent: "center", alignItems: "center" }}>
      <Bench state={state} P={framing.P} viewBox={framing.viewBox} width={width} height={height} />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelLinkedIn"
        component={Reel}
        defaultProps={{ variant: "linkedin" as const }}
        durationInFrames={getVariantDuration("linkedin")}
        fps={REEL_FPS}
        width={REEL_W}
        height={REEL_H}
      />
      <Composition
        id="ReelInstagram"
        component={Reel}
        defaultProps={{ variant: "instagram" as const }}
        durationInFrames={getVariantDuration("instagram")}
        fps={REEL_FPS}
        width={REEL_W}
        height={REEL_H}
      />
      <Still id="CoverInstagram" component={Cover} defaultProps={{ variant: "instagram" as const }} width={REEL_W} height={REEL_H} />
      <Still id="CoverLinkedIn" component={Cover} defaultProps={{ variant: "linkedin" as const }} width={REEL_W} height={REEL_H} />
      <Still id="Avatar" component={Avatar} width={1080} height={1080} />
      <Still id="BenchStill" component={BenchStill} defaultProps={{ frame: 400, width: 1080 }} width={REEL_W} height={REEL_H} />
      <Still id="BenchZoom" component={BenchStill} defaultProps={{ frame: 400, width: 4000 }} width={4000} height={7112} />
      <Composition
        id="OLNChile"
        component={OLNVideo}
        durationInFrames={getTotalDuration()}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};
