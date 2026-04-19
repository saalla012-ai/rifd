import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// 18 seconds at 30fps = 540 frames
// Scene durations sum minus transition overlaps
export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={540}
      fps={30}
      width={1080}
      height={1350}
    />
  );
};
