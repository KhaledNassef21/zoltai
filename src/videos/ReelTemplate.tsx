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
// Types (mirror src/lib/reel-optimizer.ts)
// ─────────────────────────────────────────────

type BackgroundType =
  | "image_kenburns"
  | "image_pan"
  | "image_shake"
  | "gradient_motion"
  | "abstract_blur";

type MotionType =
  | "zoom_in"
  | "zoom_out"
  | "pan_left"
  | "pan_right"
  | "shake"
  | "still";

type TextLayout =
  | "bottom_stack"
  | "top_bold"
  | "side_left"
  | "center_explosion"
  | "corner_tag";

type TextStyle =
  | "fade"
  | "slide_up"
  | "slide_left"
  | "pop"
  | "type"
  | "kinetic";

interface Scene {
  text: string;
  duration: number;
  highlight?: string;
  background?: BackgroundType;
  motion?: MotionType;
  layout?: TextLayout;
  textStyle?: TextStyle;
  imageUrl?: string;
}

export interface ReelProps {
  hook: string;
  scenes: Scene[];
  cta: string;
  audioFile?: string;
  backgroundMusic?: string;
  whooshFile?: string; // optional sfx — falls back gracefully if missing
  images: string[];
  brandColor?: string;
  // Sync-mode: measured TTS durations override the 3-second defaults
  hookDuration?: number; // seconds — measured from TTS, falls back to 3
  ctaDuration?: number;  // seconds — measured from TTS, falls back to 3
}

// ─────────────────────────────────────────────
// Defaults & cycling helpers
// ─────────────────────────────────────────────

const BG_CYCLE: BackgroundType[] = [
  "image_kenburns",
  "image_pan",
  "abstract_blur",
  "image_shake",
  "gradient_motion",
];
const LAYOUT_CYCLE: TextLayout[] = [
  "bottom_stack",
  "top_bold",
  "center_explosion",
  "side_left",
  "corner_tag",
];
const STYLE_CYCLE: TextStyle[] = [
  "kinetic",
  "slide_up",
  "pop",
  "type",
  "slide_left",
  "fade",
];
const MOTION_CYCLE: MotionType[] = [
  "zoom_in",
  "pan_left",
  "zoom_out",
  "pan_right",
  "shake",
];

const BRAND = "#a855f7";

function pick<T>(value: T | undefined, fallback: T): T {
  return value === undefined ? fallback : value;
}

// ─────────────────────────────────────────────
// Backgrounds
// ─────────────────────────────────────────────

const ImageBackground: React.FC<{
  src: string;
  motion: MotionType;
  progress: number;
  blur?: boolean;
  brightness?: number;
}> = ({ src, motion, progress, blur = false, brightness = 0.5 }) => {
  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let rotate = 0;

  switch (motion) {
    case "zoom_in":
      scale = interpolate(progress, [0, 1], [1.0, 1.18]);
      break;
    case "zoom_out":
      scale = interpolate(progress, [0, 1], [1.18, 1.0]);
      break;
    case "pan_left":
      scale = 1.18;
      translateX = interpolate(progress, [0, 1], [40, -40]);
      break;
    case "pan_right":
      scale = 1.18;
      translateX = interpolate(progress, [0, 1], [-40, 40]);
      break;
    case "shake": {
      // Subtle handheld feel using sine-based offset on progress
      const t = progress * 6;
      translateX = Math.sin(t * 2.1) * 6;
      translateY = Math.cos(t * 1.7) * 5;
      rotate = Math.sin(t * 1.3) * 0.4;
      scale = 1.08;
      break;
    }
    default:
      scale = 1.05;
  }

  return (
    <AbsoluteFill>
      <Img
        src={src}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `translate(${translateX}px, ${translateY}px) scale(${scale}) rotate(${rotate}deg)`,
          filter: `brightness(${brightness})${blur ? " blur(28px) saturate(1.4)" : ""}`,
        }}
      />
      {/* Subtle bottom-to-top gradient for legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.05) 38%, rgba(0,0,0,0.45) 78%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const GradientMotionBackground: React.FC<{ progress: number }> = ({ progress }) => {
  const hue = interpolate(progress, [0, 1], [260, 320]);
  const shift = interpolate(progress, [0, 1], [0, 100]);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 100% at ${shift}% 30%, hsl(${hue}, 70%, 22%) 0%, hsl(${
          hue + 30
        }, 60%, 8%) 60%, #050505 100%)`,
      }}
    />
  );
};

const SceneBackground: React.FC<{
  type: BackgroundType;
  motion: MotionType;
  src: string;
  progress: number;
}> = ({ type, motion, src, progress }) => {
  if (!src && (type === "image_kenburns" || type === "image_pan" || type === "image_shake" || type === "abstract_blur")) {
    return <GradientMotionBackground progress={progress} />;
  }
  switch (type) {
    case "image_kenburns":
      return <ImageBackground src={src} motion={motion} progress={progress} brightness={0.5} />;
    case "image_pan":
      return (
        <ImageBackground
          src={src}
          motion={motion === "pan_left" || motion === "pan_right" ? motion : "pan_left"}
          progress={progress}
          brightness={0.5}
        />
      );
    case "image_shake":
      return <ImageBackground src={src} motion="shake" progress={progress} brightness={0.55} />;
    case "abstract_blur":
      return <ImageBackground src={src} motion={motion} progress={progress} blur brightness={0.7} />;
    case "gradient_motion":
    default:
      return <GradientMotionBackground progress={progress} />;
  }
};

// ─────────────────────────────────────────────
// Text style helpers
// ─────────────────────────────────────────────

interface AnimatedTextProps {
  text: string;
  highlight?: string;
  startFrame: number;
  durationFrames: number;
  fontSize: number;
  align?: "left" | "center" | "right";
  color?: string;
  weight?: number;
  textShadow?: string;
  letterSpacing?: string;
  lineHeight?: number;
  maxWidth?: number | string;
}

function isHighlightWord(word: string, highlight?: string): boolean {
  if (!highlight) return false;
  const w = word.toLowerCase().replace(/[.,!?;:"']/g, "");
  return highlight
    .toLowerCase()
    .split(/\s+/)
    .some((h) => h && w.includes(h));
}

const KineticText: React.FC<AnimatedTextProps> = ({
  text,
  highlight,
  startFrame,
  fontSize,
  color = "#fff",
  weight = 800,
  textShadow,
  align = "center",
  letterSpacing = "-0.02em",
  lineHeight = 1.3,
  maxWidth = "92%",
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  const words = text.split(/\s+/).filter(Boolean);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
        gap: "6px 12px",
        maxWidth,
        margin: align === "center" ? "0 auto" : undefined,
      }}
    >
      {words.map((w, i) => {
        const delay = i * 2;
        const p = interpolate(local - delay, [0, 8], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const hi = isHighlightWord(w, highlight);
        return (
          <span
            key={`${i}-${w}`}
            style={{
              display: "inline-block",
              fontSize,
              fontWeight: weight,
              color: hi ? BRAND : color,
              opacity: p,
              transform: `translateY(${interpolate(p, [0, 1], [14, 0])}px)`,
              letterSpacing,
              lineHeight,
              textShadow: textShadow || "0 2px 14px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,1)",
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

const TypewriterText: React.FC<AnimatedTextProps> = ({
  text,
  highlight,
  startFrame,
  fontSize,
  color = "#fff",
  weight = 800,
  align = "center",
  letterSpacing = "-0.01em",
  lineHeight = 1.3,
  maxWidth = "90%",
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  // ~60ms per char at 30fps ≈ 1.8 frames/char
  const charsToShow = Math.max(0, Math.floor(local / 1.8));
  const visible = text.slice(0, charsToShow);
  const showCaret = (Math.floor(local / 8) % 2) === 0;

  return (
    <div
      style={{
        fontSize,
        fontWeight: weight,
        color,
        textAlign: align,
        letterSpacing,
        lineHeight,
        maxWidth,
        margin: align === "center" ? "0 auto" : undefined,
        textShadow: "0 2px 14px rgba(0,0,0,0.95)",
      }}
    >
      {highlight && visible.toLowerCase().includes(highlight.toLowerCase()) ? (
        <HighlightInline text={visible} highlight={highlight} />
      ) : (
        visible
      )}
      <span style={{ opacity: showCaret ? 1 : 0, color: BRAND }}>▍</span>
    </div>
  );
};

const HighlightInline: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  const idx = text.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx < 0) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + highlight.length);
  const after = text.slice(idx + highlight.length);
  return (
    <>
      {before}
      <span style={{ color: BRAND }}>{match}</span>
      {after}
    </>
  );
};

const SimpleAnimatedText: React.FC<AnimatedTextProps & { style: TextStyle }> = ({
  text,
  highlight,
  startFrame,
  fontSize,
  color = "#fff",
  weight = 800,
  align = "center",
  letterSpacing = "-0.02em",
  lineHeight = 1.3,
  maxWidth = "92%",
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - startFrame;

  const fadeIn = interpolate(local, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const slideUpY = interpolate(local, [0, 12], [40, 0], { extrapolateRight: "clamp" });
  const slideLeftX = interpolate(local, [0, 12], [60, 0], { extrapolateRight: "clamp" });
  const popScale = spring({
    frame: local,
    fps,
    config: { damping: 9, stiffness: 140, mass: 0.7 },
  });

  let transform = "";
  let opacity = 1;
  switch (style) {
    case "fade":
      opacity = fadeIn;
      break;
    case "slide_up":
      transform = `translateY(${slideUpY}px)`;
      opacity = fadeIn;
      break;
    case "slide_left":
      transform = `translateX(${slideLeftX}px)`;
      opacity = fadeIn;
      break;
    case "pop":
      transform = `scale(${popScale})`;
      opacity = fadeIn;
      break;
    default:
      opacity = fadeIn;
  }

  return (
    <div
      style={{
        fontSize,
        fontWeight: weight,
        color,
        textAlign: align,
        letterSpacing,
        lineHeight,
        maxWidth,
        margin: align === "center" ? "0 auto" : undefined,
        opacity,
        transform,
        textShadow: "0 2px 14px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,1)",
      }}
    >
      {highlight ? <HighlightInline text={text} highlight={highlight} /> : text}
    </div>
  );
};

const RenderText: React.FC<AnimatedTextProps & { style: TextStyle }> = (props) => {
  if (props.style === "kinetic") return <KineticText {...props} />;
  if (props.style === "type") return <TypewriterText {...props} />;
  return <SimpleAnimatedText {...props} />;
};

// ─────────────────────────────────────────────
// Layout containers
// ─────────────────────────────────────────────

interface LayoutProps {
  text: string;
  highlight?: string;
  startFrame: number;
  durationFrames: number;
  style: TextStyle;
}

const BottomStackLayout: React.FC<LayoutProps> = (p) => (
  <div style={{ position: "absolute", left: 40, right: 40, bottom: 200 }}>
    <RenderText
      {...p}
      fontSize={48}
      align="center"
      weight={800}
      maxWidth="100%"
    />
  </div>
);

const TopBoldLayout: React.FC<LayoutProps> = (p) => (
  <div style={{ position: "absolute", left: 50, right: 50, top: 140 }}>
    <RenderText
      {...p}
      fontSize={64}
      align="center"
      weight={900}
      letterSpacing="-0.03em"
      lineHeight={1.15}
      maxWidth="100%"
    />
  </div>
);

const SideLeftLayout: React.FC<LayoutProps> = (p) => (
  <div
    style={{
      position: "absolute",
      left: 50,
      top: 0,
      bottom: 0,
      width: 380,
      display: "flex",
      alignItems: "center",
    }}
  >
    <RenderText
      {...p}
      fontSize={52}
      align="left"
      weight={900}
      letterSpacing="-0.02em"
      lineHeight={1.2}
      maxWidth="100%"
    />
  </div>
);

const CenterExplosionLayout: React.FC<LayoutProps> = (p) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 50px" }}>
    <RenderText
      {...p}
      fontSize={78}
      align="center"
      weight={900}
      letterSpacing="-0.04em"
      lineHeight={1.1}
      maxWidth="100%"
      style={p.style === "fade" || p.style === "slide_up" ? "pop" : p.style}
    />
  </AbsoluteFill>
);

const CornerTagLayout: React.FC<LayoutProps> = (p) => (
  <>
    {/* Big readable bottom line so the viewer still reads the script */}
    <div style={{ position: "absolute", left: 40, right: 40, bottom: 220 }}>
      <RenderText
        {...p}
        fontSize={42}
        align="center"
        weight={700}
        maxWidth="100%"
      />
    </div>
    {/* Accent corner tag */}
    <div
      style={{
        position: "absolute",
        top: 130,
        right: 40,
        padding: "10px 18px",
        background: "rgba(168,85,247,0.18)",
        border: "2px solid rgba(168,85,247,0.7)",
        borderRadius: 12,
        backdropFilter: "blur(6px)",
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: "#fff",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {p.highlight || "ZOLTAI"}
      </span>
    </div>
  </>
);

const SceneTextLayout: React.FC<LayoutProps & { layout: TextLayout }> = ({ layout, ...rest }) => {
  switch (layout) {
    case "top_bold":
      return <TopBoldLayout {...rest} />;
    case "side_left":
      return <SideLeftLayout {...rest} />;
    case "center_explosion":
      return <CenterExplosionLayout {...rest} />;
    case "corner_tag":
      return <CornerTagLayout {...rest} />;
    case "bottom_stack":
    default:
      return <BottomStackLayout {...rest} />;
  }
};

// ─────────────────────────────────────────────
// Global overlays — grain, vignette, progress, watermark
// ─────────────────────────────────────────────

const Vignette: React.FC = () => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      pointerEvents: "none",
      background:
        "radial-gradient(120% 80% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
    }}
  />
);

// Animated grain via SVG noise — cheap, scales fine
const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const offset = (frame % 6) * 7;
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        opacity: 0.08,
        mixBlendMode: "overlay",
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        backgroundSize: "200px 200px",
        transform: `translate(${offset}px, ${-offset}px)`,
      }}
    />
  );
};

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
          backgroundColor: BRAND,
          borderRadius: 2,
          width: `${progress}%`,
        }}
      />
    </div>
  );
};

const Watermark: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 50,
      left: 0,
      right: 0,
      textAlign: "center",
      pointerEvents: "none",
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
// Main Reel — single continuous timeline composition
// ─────────────────────────────────────────────

interface TimelineSegment {
  start: number;
  end: number;
  text: string;
  highlight?: string;
  imageIdx: number;
  type: "hook" | "scene" | "cta";
  background: BackgroundType;
  motion: MotionType;
  layout: TextLayout;
  textStyle: TextStyle;
}

export const ReelTemplate: React.FC<ReelProps> = ({
  hook,
  scenes,
  cta,
  audioFile,
  backgroundMusic,
  whooshFile,
  images,
  hookDuration: hookDurationSec,
  ctaDuration: ctaDurationSec,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Use measured TTS durations when provided (sync mode), else fall back to 3s
  const hookDuration = Math.max(1, Math.round((hookDurationSec ?? 3) * fps));
  const ctaDuration = Math.max(1, Math.round((ctaDurationSec ?? 3) * fps));

  // ─── Build timeline ───
  const timeline: TimelineSegment[] = [];

  timeline.push({
    start: 0,
    end: hookDuration,
    text: hook,
    imageIdx: 0,
    type: "hook",
    background: "image_kenburns",
    motion: "zoom_in",
    layout: "center_explosion",
    textStyle: "pop",
  });

  let cursor = hookDuration;
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const dur = Math.max(2, s.duration) * fps;
    timeline.push({
      start: cursor,
      end: cursor + dur,
      text: s.text,
      highlight: s.highlight,
      imageIdx: (i + 1) % Math.max(images.length, 1),
      type: "scene",
      background: pick(s.background, BG_CYCLE[i % BG_CYCLE.length]),
      motion: pick(s.motion, MOTION_CYCLE[i % MOTION_CYCLE.length]),
      layout: pick(s.layout, LAYOUT_CYCLE[i % LAYOUT_CYCLE.length]),
      textStyle: pick(s.textStyle, STYLE_CYCLE[i % STYLE_CYCLE.length]),
    });
    cursor += dur;
  }

  timeline.push({
    start: cursor,
    end: cursor + ctaDuration,
    text: cta,
    imageIdx: Math.max(0, images.length - 1),
    type: "cta",
    background: "gradient_motion",
    motion: "still",
    layout: "center_explosion",
    textStyle: "pop",
  });

  // ─── Current segment ───
  const currentSegment =
    timeline.find((seg) => frame >= seg.start && frame < seg.end) ||
    timeline[timeline.length - 1];

  const segmentProgress = interpolate(
    frame,
    [currentSegment.start, currentSegment.end],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const currentImage = images[currentSegment.imageIdx] || images[0] || "";

  // CTA bounce
  const ctaScale =
    currentSegment.type === "cta"
      ? spring({
          frame: frame - currentSegment.start,
          fps,
          config: { damping: 8, stiffness: 80, mass: 0.8 },
        })
      : 1;

  // Whoosh transitions: play once at the start of each new segment
  const transitionFrames = timeline.slice(1).map((seg) => seg.start);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", fontFamily: "Inter, Arial, sans-serif" }}>
      {/* ─── Background ─── */}
      <SceneBackground
        type={currentSegment.background}
        motion={currentSegment.motion}
        src={currentImage}
        progress={segmentProgress}
      />

      {/* ─── Voiceover ─── */}
      {audioFile && <Audio src={staticFile(audioFile)} volume={1} />}
      {backgroundMusic && <Audio src={staticFile(backgroundMusic)} volume={0.12} loop />}

      {/* ─── Whoosh SFX on transitions (optional, silently skipped if file missing) ─── */}
      {whooshFile &&
        transitionFrames.map((f, i) => (
          <WhooshTrigger key={`whoosh-${i}`} startFrame={f} src={whooshFile} fps={fps} />
        ))}

      {/* ─── Watermark ─── */}
      <Watermark />

      {/* ─── Hook (big centered with pop) ─── */}
      {currentSegment.type === "hook" && (
        <CenterExplosionLayout
          text={hook}
          startFrame={currentSegment.start}
          durationFrames={currentSegment.end - currentSegment.start}
          style="pop"
        />
      )}

      {/* ─── Scene text (layout dispatched per-scene) ─── */}
      {currentSegment.type === "scene" && (
        <SceneTextLayout
          layout={currentSegment.layout}
          style={currentSegment.textStyle}
          text={currentSegment.text}
          highlight={currentSegment.highlight}
          startFrame={currentSegment.start}
          durationFrames={currentSegment.end - currentSegment.start}
        />
      )}

      {/* ─── CTA ─── */}
      {currentSegment.type === "cta" && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            background: "rgba(0,0,0,0.35)",
          }}
        >
          <div style={{ textAlign: "center", transform: `scale(${ctaScale})`, padding: "0 40px" }}>
            <div
              style={{
                fontSize: 50,
                fontWeight: 900,
                color: BRAND,
                textShadow: "0 4px 20px rgba(168,85,247,0.5)",
                marginBottom: 24,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}
            >
              {cta}
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", opacity: 0.85 }}>
              @zoltai.ai
            </div>
          </div>
        </AbsoluteFill>
      )}

      {/* ─── Global overlays ─── */}
      <Vignette />
      <Grain />
      <ProgressBar />
    </AbsoluteFill>
  );
};

// Plays a one-shot whoosh starting at startFrame.
// staticFile() throws if the asset isn't bundled, so we wrap it.
const WhooshTrigger: React.FC<{ startFrame: number; src: string; fps: number }> = ({
  startFrame,
  src,
  fps,
}) => {
  const frame = useCurrentFrame();
  const window = fps; // play during a 1s window
  if (frame < startFrame - 2 || frame > startFrame + window) return null;
  let resolved: string | null = null;
  try {
    resolved = staticFile(src);
  } catch {
    return null;
  }
  if (!resolved) return null;
  return <Audio src={resolved} volume={0.6} startFrom={0} />;
};
