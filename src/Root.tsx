import { Composition } from "remotion";
import { FPS, HEIGHT, WIDTH, getTotalDuration } from "./constants";
import { OLNVideo } from "./OLNVideo";
import { Reel } from "./reel/Reel";
import { REEL_FPS, REEL_H, REEL_W, getVariantDuration } from "./reel/script";

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
