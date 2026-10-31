import { AbsoluteFill, Composition, Still } from "remotion";
import { FPS, HEIGHT, WIDTH, getTotalDuration } from "./constants";
import { OLNVideo } from "./OLNVideo";
import { Reel } from "./reel/Reel";
import { Bench } from "./reel/bench/Bench";
import { programOf, stateAt } from "./reel/bench/model";
import { REEL_FPS, REEL_H, REEL_W, getVariantDuration } from "./reel/script";
import "./iso/iso.css";
import "./reel/bench/bench.css";

// The bench alone, at rest, for the Anatomy-style close-up checks.
const BenchStill: React.FC<{ frame: number; width: number; azimuth?: number }> = ({ frame, width, azimuth }) => {
  const program = programOf("linkedin");
  const state = stateAt(program, frame);
  if (azimuth !== undefined) state.azimuth = azimuth;
  state.explode = state.explode.map(() => 0);
  return (
    <AbsoluteFill className="iso" data-theme="light" style={{ background: "#fbfbfd", justifyContent: "center", alignItems: "center" }}>
      <Bench state={state} width={width} />
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
      <Still id="BenchStill" component={BenchStill} defaultProps={{ frame: 400, width: 1000 }} width={REEL_W} height={REEL_H} />
      <Still id="BenchZoom" component={BenchStill} defaultProps={{ frame: 400, width: 4000 }} width={4000} height={4300} />
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
