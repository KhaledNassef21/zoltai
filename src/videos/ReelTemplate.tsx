import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  Audio,
  staticFile,
} from "remotion";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Scene {
  text: string;
  duration: number;
  highlight?: string;
  imageUrl?: string;
}

export interface ReelProps {
  hook: string;
  scenes: Scene[];
  cta: string;
  audioFile?: string;
  backgroundMusic?: string;
  images: string[];
  brandColor?: string;
}

// ─────────────────────────────────────────────
// Animated Text Component
// ─────────────────────────────────────────────

const AnimatedText: React.FC<{
  text: string;
  highlight?: string;
  enterFrame: number;
  durationFrames: number;
}> = ({ text, highlight, enterFrame, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - enterFrame;

  // Word-by-word animation
  const words = text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "8px",
        padding: "0 40px",
        maxWidth: "900px",
      }}
    >
      {words.map((word, i) => {
        const wordDelay = i * 2; // 2 frames between each word
        const wordProgress = interpolate(
          localFrame - wordDelay,
          [0, 8],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const isHighlight =
          highlight && word.toLowerCase().includes(highlight.toLowerCase());

        const translateY = interpolate(wordProgress, [0, 1], [20, 0]);
        const opacity = interpolate(wordProgress, [0, 1], [0, 1]);

        return (
          <span
            key={`${i}-${word}`}
            style={{
              display: "inline-block",
              fontSize: 52,
              fontWeight: 800,
              color: isHighlight ? "#a855f7" : "#ffffff",
              textShadow: "0 4px 20px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9)",
              transform: `translateY(${translateY}px)`,
              opacity,
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// Background Image with Ken Burns
// ─────────────────────────────────────────────

const KenBurnsBackground: React.FC<{
  src: string;
  enterFrame: number;
  durationFrames: number;
  direction: "in" | "out";
}> = ({ src, enterFrame, durationFrames, direction }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - enterFrame;
  const progress = interpolate(localFrame, [0, durationFrames], [0, 1], {
    extrapolateRight: "clamp",
  });

  const scale = direction === "in"
    ? interpolate(progress, [0, 1], [1, 1.15])
    : interpolate(progress, [0, 1], [1.15, 1]);

  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: "brightness(0.5)",
        }}
      />
      {/* Gradient overlay for text readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.7) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────
// Scene Component
// ─────────────────────────────────────────────

const SceneView: React.FC<{
  scene: Scene;
  imageUrl: string;
  sceneIndex: number;
  enterFrame: number;
  durationFrames: number;
}> = ({ scene, imageUrl, sceneIndex, enterFrame, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - enterFrame;

  // Quick fade in only — no fade out (persistent background prevents black)
  const opacity = interpolate(localFrame, [0, fps * 0.2], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <KenBurnsBackground
        src={imageUrl}
        enterFrame={enterFrame}
        durationFrames={durationFrames}
        direction={sceneIndex % 2 === 0 ? "in" : "out"}
      />

      {/* Centered text */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <AnimatedText
          text={scene.text}
          highlight={scene.highlight}
          enterFrame={enterFrame}
          durationFrames={durationFrames}
        />
      </AbsoluteFill>

      {/* Progress bar at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 40,
          right: 40,
          height: 3,
          backgroundColor: "rgba(255,255,255,0.2)",
          borderRadius: 2,
        }}
      >
        <div
          style={{
            height: "100%",
            backgroundColor: "#a855f7",
            borderRadius: 2,
            width: `${(localFrame / durationFrames) * 100}%`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────
// Hook Scene (First 3 seconds)
// ─────────────────────────────────────────────

const HookScene: React.FC<{
  text: string;
  imageUrl: string;
  durationFrames: number;
}> = ({ text, imageUrl, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const opacity = interpolate(frame, [0, fps * 0.2], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <KenBurnsBackground
        src={imageUrl}
        enterFrame={0}
        durationFrames={durationFrames}
        direction="in"
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          opacity,
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            textAlign: "center",
            padding: "0 30px",
            maxWidth: "950px",
          }}
        >
          <div
            style={{
              fontSize: 62,
              fontWeight: 900,
              color: "#ffffff",
              textShadow:
                "0 4px 30px rgba(0,0,0,0.9), 0 2px 6px rgba(0,0,0,1)",
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
            }}
          >
            {text}
          </div>
        </div>
      </AbsoluteFill>

      {/* Zoltai watermark */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.1em",
          }}
        >
          @zoltai.ai
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────
// CTA Scene (Last 3 seconds)
// ─────────────────────────────────────────────

const CTAScene: React.FC<{
  text: string;
  imageUrl: string;
  durationFrames: number;
}> = ({ text, imageUrl, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bounce = spring({
    frame,
    fps,
    config: { damping: 8, stiffness: 80, mass: 0.8 },
  });

  return (
    <AbsoluteFill>
      <KenBurnsBackground
        src={imageUrl}
        enterFrame={0}
        durationFrames={durationFrames}
        direction="out"
      />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          background: "rgba(0,0,0,0.5)",
        }}
      >
        <div style={{ textAlign: "center", transform: `scale(${bounce})` }}>
          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: "#a855f7",
              textShadow: "0 4px 20px rgba(168,85,247,0.5)",
              marginBottom: 20,
            }}
          >
            {text}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              color: "#ffffff",
              opacity: 0.8,
            }}
          >
            @zoltai.ai
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────
// Main Reel Composition
// ─────────────────────────────────────────────

export const ReelTemplate: React.FC<ReelProps> = ({
  hook,
  scenes,
  cta,
  audioFile,
  backgroundMusic,
  images,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate frame positions
  const hookDuration = fps * 3; // 3 seconds for hook
  const ctaDuration = fps * 3; // 3 seconds for CTA

  let currentFrame = 0;
  const sequences: { start: number; duration: number; scene: Scene; imageIdx: number }[] = [];

  // Hook
  currentFrame = hookDuration;

  // Scenes
  for (let i = 0; i < scenes.length; i++) {
    const durationFrames = scenes[i].duration * fps;
    sequences.push({
      start: currentFrame,
      duration: durationFrames,
      scene: scenes[i],
      imageIdx: i % images.length,
    });
    currentFrame += durationFrames;
  }

  // Determine which background image to show based on current frame
  const getCurrentBgImage = (): string => {
    if (frame < hookDuration) return images[0] || "";
    for (let i = sequences.length - 1; i >= 0; i--) {
      if (frame >= sequences[i].start) {
        return images[sequences[i].imageIdx] || images[0] || "";
      }
    }
    return images[images.length - 1] || images[0] || "";
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", fontFamily: "Inter, sans-serif" }}>
      {/* Persistent background — always visible, never black */}
      <AbsoluteFill>
        <Img
          src={getCurrentBgImage()}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "brightness(0.4)",
          }}
        />
      </AbsoluteFill>

      {/* Voice audio */}
      {audioFile && (
        <Audio src={staticFile(audioFile)} volume={1} />
      )}

      {/* Background music */}
      {backgroundMusic && (
        <Audio src={staticFile(backgroundMusic)} volume={0.12} loop />
      )}

      {/* Hook Scene */}
      <Sequence from={0} durationInFrames={hookDuration}>
        <HookScene
          text={hook}
          imageUrl={images[0] || ""}
          durationFrames={hookDuration}
        />
      </Sequence>

      {/* Content Scenes */}
      {sequences.map((seq, i) => (
        <Sequence key={i} from={seq.start} durationInFrames={seq.duration}>
          <SceneView
            scene={seq.scene}
            imageUrl={images[seq.imageIdx] || images[0] || ""}
            sceneIndex={i}
            enterFrame={seq.start}
            durationFrames={seq.duration}
          />
        </Sequence>
      ))}

      {/* CTA Scene */}
      <Sequence from={currentFrame} durationInFrames={ctaDuration}>
        <CTAScene
          text={cta}
          imageUrl={images[images.length - 1] || images[0] || ""}
          durationFrames={ctaDuration}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
