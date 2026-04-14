import React from "react";
import { Composition } from "remotion";
import { ReelTemplate } from "./ReelTemplate";
import type { ReelProps } from "./ReelTemplate";

// Default props for preview
const defaultProps: ReelProps = {
  hook: "This AI tool changed everything",
  scenes: [
    { text: "Most people waste hours on tasks AI can do in seconds.", duration: 4, highlight: "AI" },
    { text: "Here are the tools you need to know about right now.", duration: 4, highlight: "tools" },
    { text: "ChatGPT for writing. Canva AI for design. Zapier for automation.", duration: 5, highlight: "ChatGPT" },
    { text: "Start with one tool. Master it. Then add more.", duration: 4, highlight: "Master" },
  ],
  cta: "Follow @zoltai.ai for more AI tips",
  images: [
    "https://picsum.photos/seed/zoltai1/1080/1920",
    "https://picsum.photos/seed/zoltai2/1080/1920",
    "https://picsum.photos/seed/zoltai3/1080/1920",
    "https://picsum.photos/seed/zoltai4/1080/1920",
  ],
};

const totalDuration = 3 + defaultProps.scenes.reduce((s, sc) => s + sc.duration, 0) + 3;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<ReelProps>
        id="Reel"
        component={ReelTemplate}
        durationInFrames={totalDuration * 30}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
      />
    </>
  );
};
