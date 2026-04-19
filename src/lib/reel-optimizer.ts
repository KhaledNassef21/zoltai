/**
 * Reel Script Optimizer
 *
 * Takes raw reel scripts and optimizes them for viral short-form video.
 * Scores scripts, picks the best ones, and formats them for the video pipeline.
 *
 * Optimization rules:
 * - Strong hook in first 2 seconds (max 10 words)
 * - Short sentences (max 8 words per line)
 * - Pattern interrupts every 5-7 seconds
 * - Curiosity-driven phrasing
 * - No income claims, no "make money"
 */

// ─── Director-grade scene controls (new in v4) ─────────────────
// All optional — old JSON without these still works via fallbacks.

export type BackgroundType =
  | "image_kenburns" // zoom in/out on still image
  | "image_pan" // slow pan left or right
  | "image_shake" // subtle handheld camera shake
  | "gradient_motion" // animated cinematic gradient (no image)
  | "abstract_blur"; // heavily blurred image w/ color wash

export type MotionType =
  | "zoom_in"
  | "zoom_out"
  | "pan_left"
  | "pan_right"
  | "shake"
  | "still";

export type TextLayout =
  | "bottom_stack" // word-by-word stacked at bottom
  | "top_bold" // big bold top-aligned
  | "side_left" // vertical text on left third
  | "center_explosion" // huge centered, spring scale
  | "corner_tag"; // small accent text in corner

export type TextStyle =
  | "fade"
  | "slide_up"
  | "slide_left"
  | "pop"
  | "type" // typewriter effect
  | "kinetic"; // word-by-word reveal

export interface OptimizedScene {
  text: string;
  duration: number;
  highlight?: string; // keyword to highlight/animate
  // Director controls (optional — fall back to defaults)
  background?: BackgroundType;
  motion?: MotionType;
  layout?: TextLayout;
  textStyle?: TextStyle;
}

export interface OptimizedReel {
  id: number;
  format: string;
  hook: string;
  scenes: OptimizedScene[];
  cta: string;
  caption: string;
  hashtags: string[];
  musicVibe: string;
  totalDuration: number;
  score: number;
  // Director-level metadata (optional)
  editingNotes?: string;
  musicStyle?: string;
}

// AI may return scenes in this richer shape (preferred when present)
export interface DirectorRawScene {
  text: string;
  background?: string;
  motion?: string;
  text_style?: string;
  layout?: string;
  duration?: number;
  highlight?: string;
}

export interface RawReel {
  id: number;
  format: string;
  hook: string;
  script: string;
  onScreenText: string[];
  cta: string;
  caption: string;
  musicVibe: string;
  duration: string;
  // New director-level fields (optional)
  directorScenes?: DirectorRawScene[];
  editingNotes?: string;
  musicStyle?: string;
}

// ─────────────────────────────────────────────
// Scoring System
// ─────────────────────────────────────────────

const POWER_WORDS = [
  "secret", "discover", "stop", "watch", "this", "hack",
  "instantly", "powerful", "transform", "game-changer",
  "actually", "nobody", "everyone", "insane", "crazy",
  "free", "simple", "fastest", "easiest", "proven",
];

const BANNED_PHRASES = [
  "make money", "earn money", "passive income", "side hustle",
  "get rich", "financial freedom", "quit your job", "income",
  "$", "dollars", "profit", "revenue",
];

function scoreHook(hook: string): number {
  let score = 0;
  const words = hook.toLowerCase().split(/\s+/);

  // Short hooks score higher (under 10 words)
  if (words.length <= 7) score += 15;
  else if (words.length <= 10) score += 10;
  else if (words.length <= 15) score += 5;

  // Starts with power word or question
  if (hook.endsWith("?")) score += 10;
  if (hook.startsWith("Did you")) score += 8;
  if (hook.startsWith("Stop")) score += 12;
  if (hook.startsWith("This")) score += 8;
  if (/^\d/.test(hook)) score += 7; // Starts with number

  // Contains power words
  for (const pw of POWER_WORDS) {
    if (hook.toLowerCase().includes(pw)) score += 3;
  }

  // Penalty for banned phrases
  for (const bp of BANNED_PHRASES) {
    if (hook.toLowerCase().includes(bp)) score -= 20;
  }

  return score;
}

function scoreCuriosity(script: string): number {
  let score = 0;
  const lower = script.toLowerCase();

  if (lower.includes("but here's the thing")) score += 5;
  if (lower.includes("the crazy part")) score += 5;
  if (lower.includes("most people don't")) score += 5;
  if (lower.includes("nobody talks about")) score += 5;
  if (lower.includes("watch this")) score += 4;
  if (lower.includes("here's why")) score += 4;
  if (lower.includes("?")) score += 3;

  // Penalty for long scripts (over 200 words)
  const wordCount = script.split(/\s+/).length;
  if (wordCount > 200) score -= 10;
  if (wordCount < 80) score -= 5;
  if (wordCount >= 80 && wordCount <= 150) score += 10;

  return score;
}

function scoreClarity(script: string): number {
  let score = 0;
  const sentences = script.split(/[.!?]+/).filter(Boolean);

  // Average sentence length
  const avgWords = sentences.reduce(
    (sum, s) => sum + s.trim().split(/\s+/).length, 0
  ) / Math.max(sentences.length, 1);

  if (avgWords <= 8) score += 15;
  else if (avgWords <= 12) score += 10;
  else if (avgWords <= 15) score += 5;

  // Has clear structure (numbered steps, etc.)
  if (/step \d|first|second|third/i.test(script)) score += 5;

  // Penalty for banned content
  for (const bp of BANNED_PHRASES) {
    if (script.toLowerCase().includes(bp)) score -= 25;
  }

  return score;
}

function scoreFormat(format: string): number {
  const formatScores: Record<string, number> = {
    "Hook/Curiosity": 15,
    "Quick Tip": 14,
    "Step-by-Step": 13,
    "Tool Demo": 12,
    "Before/After": 11,
    "Myth Buster": 10,
    "Comparison": 9,
    "List/Ranking": 8,
    "Value Breakdown": 7,
    "Story": 6,
  };
  return formatScores[format] || 5;
}

export function scoreReel(reel: RawReel): number {
  return (
    scoreHook(reel.hook) +
    scoreCuriosity(reel.script) +
    scoreClarity(reel.script) +
    scoreFormat(reel.format)
  );
}

// ─────────────────────────────────────────────
// Script Optimization
// ─────────────────────────────────────────────

function sanitizeText(text: string): string {
  return text
    .replace(/make money/gi, "boost productivity")
    .replace(/earn money/gi, "save time")
    .replace(/passive income/gi, "workflow automation")
    .replace(/side hustle/gi, "AI skills")
    .replace(/get rich/gi, "level up")
    .replace(/\$\d+[\+\/k]*/gi, "")
    .trim();
}

function splitIntoScenes(script: string, onScreenText: string[]): OptimizedScene[] {
  const scenes: OptimizedScene[] = [];
  const sentences = script
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Group sentences into scenes (2-3 sentences each, ~3-7 seconds)
  let currentText = "";
  let sentenceCount = 0;

  for (const sentence of sentences) {
    const clean = sanitizeText(sentence);
    if (!clean) continue;

    currentText += (currentText ? " " : "") + clean;
    sentenceCount++;

    const wordCount = currentText.split(/\s+/).length;

    // Create a scene when we have enough words or sentences
    if (sentenceCount >= 2 || wordCount >= 15) {
      // Estimate duration: ~150 words per minute = 2.5 words per second
      const duration = Math.max(3, Math.min(7, Math.round(wordCount / 2.5)));

      // Find a highlight word from onScreenText
      const highlight = onScreenText.find((t) =>
        currentText.toLowerCase().includes(t.toLowerCase().split(" ")[0])
      );

      scenes.push({
        text: currentText,
        duration,
        highlight: highlight || extractKeyword(currentText),
      });

      currentText = "";
      sentenceCount = 0;
    }
  }

  // Don't forget remaining text
  if (currentText.trim()) {
    const wordCount = currentText.split(/\s+/).length;
    scenes.push({
      text: currentText.trim(),
      duration: Math.max(3, Math.min(7, Math.round(wordCount / 2.5))),
      highlight: extractKeyword(currentText),
    });
  }

  return scenes;
}

function extractKeyword(text: string): string {
  // Extract the most important word (nouns, tools, etc.)
  const toolNames = [
    "ChatGPT", "Claude", "Midjourney", "Jasper", "Canva", "Zapier",
    "Semrush", "Grammarly", "ElevenLabs", "Cursor", "Notion", "Runway",
    "Perplexity", "Writesonic", "Leonardo", "Copilot", "Bolt",
  ];

  for (const tool of toolNames) {
    if (text.toLowerCase().includes(tool.toLowerCase())) return tool;
  }

  // Fall back to longest capitalized word
  const words = text.split(/\s+/);
  const caps = words.filter((w) => /^[A-Z]/.test(w) && w.length > 3);
  return caps[0] || words[Math.floor(words.length / 2)] || "";
}

function extractHashtags(caption: string): string[] {
  const matches = caption.match(/#\w+/g) || [];
  return matches.map((h) => h.replace("#", "")).slice(0, 8);
}

// ─────────────────────────────────────────────
// Director scene mapping (new in v4)
// ─────────────────────────────────────────────

const VALID_BG: BackgroundType[] = [
  "image_kenburns",
  "image_pan",
  "image_shake",
  "gradient_motion",
  "abstract_blur",
];
const VALID_MOTION: MotionType[] = [
  "zoom_in",
  "zoom_out",
  "pan_left",
  "pan_right",
  "shake",
  "still",
];
const VALID_LAYOUT: TextLayout[] = [
  "bottom_stack",
  "top_bold",
  "side_left",
  "center_explosion",
  "corner_tag",
];
const VALID_STYLE: TextStyle[] = [
  "fade",
  "slide_up",
  "slide_left",
  "pop",
  "type",
  "kinetic",
];

function pickEnum<T extends string>(value: string | undefined, valid: T[], fallback: T): T {
  if (!value) return fallback;
  const normalized = value.toLowerCase().replace(/[\s-]+/g, "_");
  return (valid.find((v) => v === normalized) as T) || fallback;
}

/**
 * Map a director-provided rich scene to an OptimizedScene.
 * Cycles through layouts/backgrounds for variety when AI omits them.
 */
function mapDirectorScene(raw: DirectorRawScene, index: number): OptimizedScene {
  const text = sanitizeText(raw.text || "");
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const fallbackDuration = Math.max(3, Math.min(7, Math.round(wordCount / 2.5)));

  // Cycle defaults so consecutive scenes vary visually
  const defaultBg = VALID_BG[index % VALID_BG.length];
  const defaultLayout = VALID_LAYOUT[index % VALID_LAYOUT.length];
  const defaultStyle = VALID_STYLE[index % VALID_STYLE.length];
  const defaultMotion: MotionType =
    index % 4 === 0 ? "zoom_in" : index % 4 === 1 ? "zoom_out" : index % 4 === 2 ? "pan_left" : "pan_right";

  return {
    text,
    duration: typeof raw.duration === "number" && raw.duration > 0 ? raw.duration : fallbackDuration,
    highlight: raw.highlight || extractKeyword(text),
    background: pickEnum(raw.background, VALID_BG, defaultBg),
    motion: pickEnum(raw.motion, VALID_MOTION, defaultMotion),
    layout: pickEnum(raw.layout, VALID_LAYOUT, defaultLayout),
    textStyle: pickEnum(raw.text_style, VALID_STYLE, defaultStyle),
  };
}

/**
 * Apply director defaults to scenes built from the legacy splitter,
 * so even old JSON files render with cinematic variation.
 */
function applyDefaultsToScenes(scenes: OptimizedScene[]): OptimizedScene[] {
  return scenes.map((s, i) => ({
    ...s,
    background: s.background || VALID_BG[i % VALID_BG.length],
    motion:
      s.motion ||
      (i % 4 === 0 ? "zoom_in" : i % 4 === 1 ? "zoom_out" : i % 4 === 2 ? "pan_left" : "pan_right"),
    layout: s.layout || VALID_LAYOUT[i % VALID_LAYOUT.length],
    textStyle: s.textStyle || VALID_STYLE[i % VALID_STYLE.length],
  }));
}

// ─────────────────────────────────────────────
// Main Optimizer
// ─────────────────────────────────────────────

export function optimizeReel(reel: RawReel): OptimizedReel {
  const hook = sanitizeText(reel.hook);

  // Prefer director-provided rich scenes when present; fall back to splitter.
  let scenes: OptimizedScene[];
  if (Array.isArray(reel.directorScenes) && reel.directorScenes.length > 0) {
    scenes = reel.directorScenes
      .map((s, i) => mapDirectorScene(s, i))
      .filter((s) => s.text.length > 0);
  } else {
    scenes = applyDefaultsToScenes(splitIntoScenes(reel.script, reel.onScreenText));
  }

  const totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0) + 3; // +3 for CTA
  const hashtags = extractHashtags(reel.caption);
  const score = scoreReel(reel);

  return {
    id: reel.id,
    format: reel.format,
    hook,
    scenes,
    cta: sanitizeText(reel.cta),
    caption: sanitizeText(reel.caption),
    hashtags,
    musicVibe: reel.musicVibe,
    totalDuration,
    score,
    editingNotes: reel.editingNotes,
    musicStyle: reel.musicStyle,
  };
}

/**
 * Score and rank all reels, return top N
 */
export function pickTopReels(reels: RawReel[], count: number = 3): OptimizedReel[] {
  const optimized = reels.map(optimizeReel);
  optimized.sort((a, b) => b.score - a.score);

  console.log("\n📊 Reel Scores:");
  optimized.forEach((r, i) => {
    console.log(`   ${i + 1}. [${r.score}pts] ${r.format}: "${r.hook.slice(0, 50)}..."`);
  });

  const top = optimized.slice(0, count);
  console.log(`\n✅ Selected top ${count}: ${top.map((r) => `#${r.id}`).join(", ")}`);

  return top;
}
