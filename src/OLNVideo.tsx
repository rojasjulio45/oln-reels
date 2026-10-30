import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { COLORS, SCENE_ORDER, SceneKey, TRANSITION_FRAMES, getSceneDuration } from "./constants";
import { Antes } from "./scenes/Antes";
import { Camino } from "./scenes/Camino";
import { Cierre } from "./scenes/Cierre";
import { Desafios } from "./scenes/Desafios";
import { Equipo } from "./scenes/Equipo";
import { Grave } from "./scenes/Grave";
import { Ingreso } from "./scenes/Ingreso";
import { Intro } from "./scenes/Intro";
import { Ley } from "./scenes/Ley";
import { QueEs } from "./scenes/QueEs";

const SCENES: Record<SceneKey, React.FC> = {
  intro: Intro,
  antes: Antes,
  ley: Ley,
  queEs: QueEs,
  ingreso: Ingreso,
  equipo: Equipo,
  camino: Camino,
  grave: Grave,
  desafios: Desafios,
  cierre: Cierre,
};

export const OLNVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: COLORS.bg.dark }}>
    <TransitionSeries>
      {SCENE_ORDER.flatMap((key, i) => {
        const Scene = SCENES[key];
        const items = [
          <TransitionSeries.Sequence key={key} name={key} durationInFrames={getSceneDuration(key)}>
            <Scene />
          </TransitionSeries.Sequence>,
        ];
        if (i > 0) {
          items.unshift(
            <TransitionSeries.Transition
              key={`${key}-fade`}
              presentation={fade()}
              timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
            />,
          );
        }
        return items;
      })}
    </TransitionSeries>
  </AbsoluteFill>
);
