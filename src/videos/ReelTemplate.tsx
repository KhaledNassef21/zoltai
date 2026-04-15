import React from "react";
import {
  AbsoluteFill,
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
// Subtitle (always visible, word-by-word)
// ─────────────────────────────────────────────

const Subtitle: React.FC<{
  text: string;
  highlight?: string;
  startFrame: number;
  durationFrames: number;
}> = ({ text, highlight, startFrame, durationFrames }) => {
  const frame = useCurrentFrame();
  const localFrame = frame - startFrame;

  if (localFrame < 0 || localFrame > durationFrames) return null;

  const words = text.split(" ");

  // Fade in the whole subtitle block
  const blockOpacity = interpolate(localFrame, [0, 6], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 200,
        left: 40,
        right: 40,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "6px 10px",
        opacity: blockOpacity,
      }}
    >
      {words.map((word, i) => {
        const wordDelay = i * 2;
        const wordProgress = interpolate(
          localFrame - wordDelay,
          [0, 8],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const isHighlight =
          highlight && word.toLowerCase().includes(highlight.toLowerCase());

        return (
          <span
            key={`${i}-${word}`}
            style={{
              display: "inline-block",
              fontSize: 48,
              fontWeight: 800,
              color: isHighlight ? "#a855f7" : "#ffffff",
              textShadow:
                "0 2px 12px rgba(0,0,0,0.95), 0 4px 24px rgba(0,0,0,0.8), 0 0 4px rgba(0,0,0,1)",
              opacity: wordProgress,
              transform: `translateY(${interpolate(wordProgress, [0, 1], [12, 0])}px)`,
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
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
// Ken Burns Background
// ─────────────────────────────────────────────

const KenBurnsImage: React.FC<{
  src: string;
  progress: number;
  direction: "in" | "out";
  opacity?: number;
}> = ({ src, progress, direction, opacity = 1 }) => {
  const scale =
    direction === "in"
      ? interpolate(progress, [0, 1], [1, 1.15])
      : interpolate(progress, [0, 1], [1.15, 1]);

  return (
    <AbsoluteFill style={{ opacity }}>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: "brightness(0.45)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 40%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.8) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = (frame / durationInFrames) * 100;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 40,
        right: 40,
        height: 3,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 2,
      }}
    >
      <div
        style={{
          height: "100%",
          backgroundColor: "#a855f7",
          borderRadius: 2,
          width: `${progress}%`,
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// Watermark
// ─────────────────────────────────────────────

const Watermark: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 50,
      left: 0,
      right: 0,
      textAlign: "center",
    }}
  >
    <span
      style={{
        fontSize: 18,
        fontWeight: 700,
        color: "rgba(255,255,255,0.6)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      @zoltai.ai
    </span>
  </div>
);

// ─────────────────────────────────────────────
// Main Reel Template — Single continuous composition
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

  // ─── Timeline ───
  const hookDuration = fps * 3;
  const ctaDuration = fps * 3;

  // Build scene timeline
  const timeline: {
    start: number;
    end: number;
    text: string;
    highlight?: string;
    imageIdx: number;
    type: "hook" | "scene" | "cta";
  }[] = [];

  // Hook
  timeline.push({
    start: 0,
    end: hookDuration,
    text: hook,
    imageIdx: 0,
    type: "hook",
  });

  // Scenes
  let cursor = hookDuration;
  for (let i = 0; i < scenes.length; i++) {
    const dur = scenes[i].duration * fps;
    timeline.push({
      start: cursor,
      end: cursor + dur,
      text: scenes[i].text,
      highlight: scenes[i].highlight,
      imageIdx: i % images.length,
      type: "scene",
    });
    cursor += dur;
  }

  // CTA
  timeline.push({
    start: cursor,
    end: cursor + ctaDuration,
    text: cta,
    imageIdx: (images.length - 1) % images.length,
    type: "cta",
  });

  // ─── Current segment ───
  const currentSegment = timeline.find(
    (seg) => frame >= seg.start && frame < seg.end
  ) || timeline[timeline.length - 1];

  const segmentProgress = interpolate(
    frame,
    [currentSegment.start, currentSegment.end],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const currentImage = images[currentSegment.imageIdx] || images[0] || "";
  const direction = currentSegment.imageIdx % 2 === 0 ? "in" : "out";

  // ─── Hook animation ───
  const hookScale =
    currentSegment.type === "hook"
      ? spring({ frame: frame - currentSegment.start, fps, config: { damping: 12, stiffness: 100 } })
      : 1;

  // ─── CTA animation ───
  const ctaBounce =
    currentSegment.type === "cta"
      ? spring({ frame: frame - currentSegment.start, fps, config: { damping: 8, stiffness: 80, mass: 0.8 } })
      : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: "Inter, Arial, sans-serif" }}>
      {/* ─── Background Image (always visible, Ken Burns) ─── */}
      <KenBurnsImage
        src={currentImage}
        progress={segmentProgress}
        direction={direction as "in" | "out"}
      />

      {/* ─── Audio ─── */}
      {audioFile && <Audio src={staticFile(audioFile)} volume={1} />}
      {backgroundMusic && <Audio src={staticFile(backgroundMusic)} volume={0.12} loop />}

      {/* ─── Watermark ─── */}
      <Watermark />

      {/* ─── Hook Text (centered, big) ─── */}
      {currentSegment.type === "hook" && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              transform: `scale(${hookScale})`,
              textAlign: "center",
              padding: "0 40px",
              maxWidth: "950px",
              opacity: interpolate(frame, [0, fps * 0.2], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            <div
              style={{
                fontSize: 60,
                fontWeight: 900,
                color: "#fff",
                textShadow: "0 4px 30px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,1)",
                lineHeight: 1.2,
                letterSpacing: "-0.03em",
              }}
            >
              {hook}
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── Scene Subtitles (bottom, always visible during scenes) ─── */}
      {currentSegment.type === "scene" && (
        <Subtitle
          text={currentSegment.text}
          highlight={currentSegment.highlight}
          startFrame={currentSegment.start}
          durationFrames={currentSegment.end - currentSegment.start}
        />
      )}

      {/* ─── CTA (centered, bounce) ─── */}
      {currentSegment.type === "cta" && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ textAlign: "center", transform: `scale(${ctaBounce})` }}>
            <div
              style={{
                fontSize: 46,
                fontWeight: 800,
                color: "#a855f7",
                textShadow: "0 4px 20px rgba(168,85,247,0.5)",
                marginBottom: 20,
                padding: "0 40px",
              }}
            >
              {cta}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "#fff",
                opacity: 0.8,
              }}
            >
              @zoltai.ai
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── Progress Bar ─── */}
      <ProgressBar />
    </AbsoluteFill>
  );
};
