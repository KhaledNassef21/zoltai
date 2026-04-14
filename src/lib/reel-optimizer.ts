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

export interface OptimizedScene {
  text: string;
  duration: number;
  highlight?: string; // keyword to highlight/animate
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
// Main Optimizer
// ─────────────────────────────────────────────

export function optimizeReel(reel: RawReel): OptimizedReel {
  const hook = sanitizeText(reel.hook);
  const scenes = splitIntoScenes(reel.script, reel.onScreenText);
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
