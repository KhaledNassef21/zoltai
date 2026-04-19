import React from "react";
import { Composition } from "remotion";
import { ReelTemplate } from "./ReelTemplate";
import type { ReelProps } from "./ReelTemplate";

// Default props for preview — exercises every layout/background variation
const defaultProps: ReelProps = {
  hook: "This AI tool changed everything",
  scenes: [
    {
      text: "Most people waste hours on tasks AI can do in seconds.",
      duration: 4,
      highlight: "AI",
      background: "image_kenburns",
      motion: "zoom_in",
      layout: "bottom_stack",
      textStyle: "kinetic",
    },
    {
      text: "Here are the tools you need to know about right now.",
      duration: 4,
      highlight: "tools",
      background: "image_pan",
      motion: "pan_left",
      layout: "top_bold",
      textStyle: "slide_up",
    },
    {
      text: "ChatGPT for writing. Canva AI for design. Zapier for automation.",
      duration: 5,
      highlight: "ChatGPT",
      background: "abstract_blur",
      motion: "zoom_out",
      layout: "center_explosion",
      textStyle: "pop",
    },
    {
      text: "Start with one tool. Master it. Then add more.",
      duration: 4,
      highlight: "Master",
      background: "image_shake",
      motion: "shake",
      layout: "side_left",
      textStyle: "type",
    },
  ],
  cta: "Follow @zoltai.ai for more AI tips",
  whooshFile: "audio/sfx/whoosh.mp3", // optional — falls back if missing
  images: [
    "https://picsum.photos/seed/zoltai1/1080/1920",
    "https://picsum.photos/seed/zoltai2/1080/1920",
    "https://picsum.photos/seed/zoltai3/1080/1920",
    "https://picsum.photos/seed/zoltai4/1080/1920",
  ],
};

function calculateDurationInFrames(props: ReelProps, fps: number): number {
  // Use measured TTS durations when present (sync mode), else 3s defaults
  const hookSeconds = props.hookDuration ?? 3;
  const ctaSeconds = props.ctaDuration ?? 3;
  const scenesSeconds = props.scenes.reduce((sum, s) => sum + s.duration, 0);
  const total = hookSeconds + scenesSeconds + ctaSeconds;
  // Add 0.3s tail so the audio's last word isn't clipped
  return Math.max(Math.ceil((total + 0.3) * fps), 15 * fps);
}

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition<ReelProps>
        id="Reel"
        component={ReelTemplate}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: calculateDurationInFrames(props, 30),
          };
        }}
      />
    </>
  );
};
