import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { PersistentBackground } from "./components/PersistentBackground";
import { Scene1Hook } from "./scenes/Scene1Hook";
import { Scene2Logo } from "./scenes/Scene2Logo";
import { Scene3Demo } from "./scenes/Scene3Demo";
import { Scene4Stats } from "./scenes/Scene4Stats";
import { Scene5CTA } from "./scenes/Scene5CTA";

/**
 * Total = 110 + 90 + 130 + 140 + 110 = 580
 * Transitions overlap: 4 transitions × 10 frames = -40
 * Final: 540 frames @ 30fps = 18s
 */
export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <PersistentBackground />
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={110}>
          <Scene1Hook />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence durationInFrames={90}>
          <Scene2Logo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-left" })}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence durationInFrames={130}>
          <Scene3Demo />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence durationInFrames={140}>
          <Scene4Stats />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-right" })}
          timing={linearTiming({ durationInFrames: 10 })}
        />
        <TransitionSeries.Sequence durationInFrames={110}>
          <Scene5CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
