/**
 * Voice Generation Module
 *
 * Generates voiceover audio from reel scripts.
 * Primary: ElevenLabs API (high quality)
 * Fallback: Edge TTS via edge-tts npm (free, good quality)
 *
 * Output: public/audio/{slug}-{reelId}.mp3
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync, execFileSync } from "child_process";

function shortHash(text: string): string {
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 8);
}

// ─────────────────────────────────────────────
// Text Cleaning — makes TTS sound natural, not robotic
// ─────────────────────────────────────────────

/**
 * Strip visual-only characters and normalize punctuation so the TTS engine
 * doesn't read "dash", "hashtag", "emoji", or awkwardly pause at bullet chars.
 *
 * Rules:
 *  - Remove all emoji (they get pronounced in some engines)
 *  - Remove markdown (**, __, `, ~~, #, >, *-bullets)
 *  - Remove hashtags and @mentions (they get spelled out letter-by-letter)
 *  - Em-dash / en-dash → ", " (natural pause, not a literal "dash")
 *  - Ellipsis variants → ", " (prevents "dot dot dot")
 *  - Bullets / arrows → ". " (clean sentence boundary)
 *  - Slash "/" between words → " or "
 *  - "vs." / "vs" → "versus"
 *  - "&" → "and"
 *  - "%" → "percent"
 *  - "$N" → "N dollars"
 *  - Multiple spaces → single
 *  - Multiple periods → single period + space
 *  - Trim trailing punctuation that creates awkward silence at end of segment
 */
export function cleanTextForTTS(input: string): string {
  if (!input) return "";

  let text = input;

  // 1. Remove all emoji & pictographic symbols
  // Covers: emoticons, symbols & pictographs, transport/map, flags, misc symbols
  text = text.replace(
    /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F1FF}]|[\u{1F200}-\u{1F2FF}]|[\u{1FA00}-\u{1FAFF}]|[\u{2700}-\u{27BF}]|[\u{FE00}-\u{FE0F}]|[\u{1F680}-\u{1F6FF}]/gu,
    ""
  );

  // 2. Remove markdown formatting
  text = text.replace(/\*\*(.*?)\*\*/g, "$1"); // **bold**
  text = text.replace(/__(.*?)__/g, "$1");      // __bold__
  text = text.replace(/\*(.*?)\*/g, "$1");      // *italic*
  text = text.replace(/_(.*?)_/g, "$1");        // _italic_
  text = text.replace(/`([^`]+)`/g, "$1");      // `code`
  text = text.replace(/~~(.*?)~~/g, "$1");      // ~~strike~~
  text = text.replace(/^>\s*/gm, "");           // > quote
  text = text.replace(/^#{1,6}\s*/gm, "");      // # heading

  // 3. Remove hashtags and @mentions (these get spelled out letter by letter)
  text = text.replace(/#[A-Za-z0-9_]+/g, "");
  text = text.replace(/@([A-Za-z0-9_.]+)/g, "$1"); // keep the name, drop the @

  // 4. Replace em-dash / en-dash with comma + space (natural pause)
  text = text.replace(/\s*[—–]\s*/g, ", ");

  // 5. Replace ellipsis with comma
  text = text.replace(/\u2026/g, ", ");
  text = text.replace(/\.{3,}/g, ", ");

  // 6. Bullets and arrows → sentence break
  text = text.replace(/[•·‣▪▫►▸▶→⇒➜➔➤]/g, ". ");

  // 7. Expand common abbreviations that TTS mispronounces
  text = text.replace(/\bvs\.?\b/gi, "versus");
  text = text.replace(/\be\.g\.\b/gi, "for example");
  text = text.replace(/\bi\.e\.\b/gi, "that is");
  text = text.replace(/\betc\.\b/gi, "and so on");
  text = text.replace(/\bAI\b/g, "A.I."); // forces "ay eye" not "eye"
  text = text.replace(/\bUI\b/g, "U.I.");
  text = text.replace(/\bURL\b/g, "U.R.L.");

  // 8. Symbols → words
  text = text.replace(/&/g, " and ");
  text = text.replace(/%/g, " percent");
  text = text.replace(/\$(\d+(?:\.\d+)?)/g, "$1 dollars");
  text = text.replace(/\s\/\s/g, " or ");       // "A / B" → "A or B"
  text = text.replace(/(\w)\/(\w)/g, "$1 or $2"); // "A/B" → "A or B"

  // 9. Slashes, brackets, stray symbols
  text = text.replace(/[\[\]{}<>|\\]/g, " ");
  text = text.replace(/["'`]/g, "");

  // 10. Collapse whitespace, fix spacing around punctuation
  text = text.replace(/\s*,\s*/g, ", ");
  text = text.replace(/\s*\.\s*/g, ". ");
  text = text.replace(/\s*\?\s*/g, "? ");
  text = text.replace(/\s*!\s*/g, "! ");
  text = text.replace(/\.{2,}/g, ".");
  text = text.replace(/,{2,}/g, ",");
  text = text.replace(/\s+/g, " ");

  // 11. Trim leading/trailing punctuation that creates dead air
  text = text.replace(/^[\s,.;:!?—–-]+/, "");
  text = text.replace(/[\s,;:—–-]+$/, "");

  // 12. Ensure the sentence ends with a proper full stop (clean silence at clip end)
  text = text.trim();
  if (text && !/[.?!]$/.test(text)) {
    text += ".";
  }

  return text;
}

const AUDIO_DIR = path.join(process.cwd(), "public/audio");
const SEGMENT_DIR = path.join(AUDIO_DIR, "segments");

// ─────────────────────────────────────────────
// Bundled ffmpeg/ffprobe (Remotion ships them)
// ─────────────────────────────────────────────

function findRemotionBinary(name: "ffmpeg" | "ffprobe"): string {
  const exe = process.platform === "win32" ? `${name}.exe` : name;
  const candidates = [
    path.join(process.cwd(), "node_modules/@remotion/compositor-win32-x64-msvc", exe),
    path.join(process.cwd(), "node_modules/@remotion/compositor-linux-x64-gnu", exe),
    path.join(process.cwd(), "node_modules/@remotion/compositor-linux-x64-musl", exe),
    path.join(process.cwd(), "node_modules/@remotion/compositor-darwin-x64", exe),
    path.join(process.cwd(), "node_modules/@remotion/compositor-darwin-arm64", exe),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  // Fallback: hope it's on PATH
  return name;
}

const FFMPEG = findRemotionBinary("ffmpeg");
const FFPROBE = findRemotionBinary("ffprobe");

/**
 * Measure exact audio duration in seconds using ffprobe.
 * Accurate to ~1ms — much better than word-count estimation.
 */
function probeDuration(audioPath: string): number {
  try {
    const output = execFileSync(
      FFPROBE,
      [
        "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        audioPath,
      ],
      { encoding: "utf-8", timeout: 10000 }
    );
    const seconds = parseFloat(output.trim());
    if (!isFinite(seconds) || seconds <= 0) {
      throw new Error(`Invalid duration: ${output}`);
    }
    return seconds;
  } catch (err) {
    console.warn(`   ⚠️ ffprobe failed: ${(err as Error).message?.slice(0, 100)}`);
    // Fall back to word-count estimation
    return 3;
  }
}

// ─────────────────────────────────────────────
// ElevenLabs API
// ─────────────────────────────────────────────

const ELEVENLABS_VOICES: Record<string, string> = {
  male_energetic: "pNInz6obpgDQGcFmaJgB", // Adam
  female_warm: "EXAVITQu4vr4xnSDxMaL",     // Bella
  male_deep: "VR6AewLTigWG4xSOukaG",        // Arnold
  female_young: "21m00Tcm4TlvDq8ikWAM",     // Rachel
};

async function generateWithElevenLabs(
  text: string,
  outputPath: string,
  voiceStyle: string = "male_energetic"
): Promise<boolean> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return false;

  const voiceId = ELEVENLABS_VOICES[voiceStyle] || ELEVENLABS_VOICES.male_energetic;

  try {
    console.log(`   🎙️ ElevenLabs: Generating voice (${voiceStyle})...`);

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          // eleven_multilingual_v2 is the most human-sounding model.
          // turbo_v2_5 is faster but noticeably more robotic.
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            // Lower stability = more emotional variation = less robotic.
            // 0.35–0.45 is the sweet spot for social-media energy.
            stability: 0.4,
            // Higher similarity_boost keeps the voice consistent across segments.
            similarity_boost: 0.85,
            // Higher style = more expressive delivery (up to 1.0).
            // 0.55 hits natural enthusiasm without over-acting.
            style: 0.55,
            use_speaker_boost: true,
          },
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.warn(`   ⚠️ ElevenLabs failed (${res.status}): ${err.slice(0, 100)}`);
      return false;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 1000) {
      console.warn(`   ⚠️ ElevenLabs returned tiny file (${buffer.length} bytes)`);
      return false;
    }

    fs.writeFileSync(outputPath, buffer);
    console.log(`   ✅ ElevenLabs voice: ${(buffer.length / 1024).toFixed(0)}KB`);
    return true;
  } catch (err) {
    console.warn(`   ⚠️ ElevenLabs error: ${(err as Error).message}`);
    return false;
  }
}

// ─────────────────────────────────────────────
// Edge TTS Fallback (Free, via CLI)
// ─────────────────────────────────────────────

async function generateWithEdgeTTS(
  text: string,
  outputPath: string
): Promise<boolean> {
  try {
    console.log(`   🎙️ Edge TTS: Generating voice (fallback)...`);

    // Use edge-tts via child process (pip install edge-tts)
    const { execSync } = await import("child_process");

    // Clean text for shell
    const cleanText = text
      .replace(/"/g, '\\"')
      .replace(/'/g, "\\'")
      .replace(/\n/g, " ")
      .slice(0, 2000);

    const voice = "en-US-GuyNeural"; // Energetic male voice

    // Try finding edge-tts in common locations
    const edgeTtsBin = (() => {
      const { execSync: es } = require("child_process");
      for (const cmd of ["edge-tts", "python -m edge_tts", "python3 -m edge_tts"]) {
        try {
          es(`${cmd} --version`, { stdio: "pipe", timeout: 5000 });
          return cmd;
        } catch {}
      }
      // Check common Windows Python Scripts paths
      const home = process.env.HOME || process.env.USERPROFILE || "";
      const winPaths = [
        `${home}/AppData/Local/Python/pythoncore-3.14-64/Scripts/edge-tts`,
        `${home}/AppData/Local/Programs/Python/Python312/Scripts/edge-tts`,
        `${home}/AppData/Local/Programs/Python/Python311/Scripts/edge-tts`,
      ];
      for (const p of winPaths) {
        try {
          es(`"${p}" --version`, { stdio: "pipe", timeout: 5000 });
          return `"${p}"`;
        } catch {}
      }
      return "edge-tts";
    })();

    execSync(
      `${edgeTtsBin} --voice "${voice}" --text "${cleanText}" --write-media "${outputPath}" --rate="+10%"`,
      { timeout: 60000, stdio: "pipe" }
    );

    if (fs.existsSync(outputPath)) {
      const stat = fs.statSync(outputPath);
      if (stat.size > 1000) {
        console.log(`   ✅ Edge TTS voice: ${(stat.size / 1024).toFixed(0)}KB`);
        return true;
      }
    }

    return false;
  } catch (err) {
    console.warn(`   ⚠️ Edge TTS failed: ${(err as Error).message?.slice(0, 100)}`);
    return false;
  }
}

// ─────────────────────────────────────────────
// OpenAI TTS Fallback
// ─────────────────────────────────────────────

async function generateWithOpenAI(
  text: string,
  outputPath: string
): Promise<boolean> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return false;

  try {
    console.log(`   🎙️ OpenAI TTS: Generating voice...`);

    // Try gpt-4o-mini-tts first (newer, much more natural, supports `instructions`).
    // Falls back to tts-1-hd on any error (older accounts / regional availability).
    const tryModel = async (model: string, includeInstructions: boolean) => {
      return await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          input: text.slice(0, 4096),
          // "nova" sounds warmer and more natural than "onyx" for social content.
          voice: "nova",
          response_format: "mp3",
          speed: 1.0, // natural pace; 1.05 sounded rushed
          ...(includeInstructions && {
            instructions:
              "Speak in an upbeat, friendly, energetic tone like a creator " +
              "talking to a friend. Use natural pauses and conversational rhythm. " +
              "Do NOT read any punctuation, emojis, or hashtags literally. " +
              "Emphasize key ideas with subtle vocal energy.",
          }),
        }),
        signal: AbortSignal.timeout(60000),
      });
    };

    let res = await tryModel("gpt-4o-mini-tts", true);
    if (!res.ok) {
      const firstErr = await res.text();
      console.warn(`   ⚠️ gpt-4o-mini-tts unavailable (${res.status}), falling back to tts-1-hd`);
      console.warn(`      ${firstErr.slice(0, 120)}`);
      res = await tryModel("tts-1-hd", false);
    }

    if (!res.ok) {
      const err = await res.text();
      console.warn(`   ⚠️ OpenAI TTS failed (${res.status}): ${err.slice(0, 100)}`);
      return false;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    fs.writeFileSync(outputPath, buffer);
    console.log(`   ✅ OpenAI TTS voice: ${(buffer.length / 1024).toFixed(0)}KB`);
    return true;
  } catch (err) {
    console.warn(`   ⚠️ OpenAI TTS error: ${(err as Error).message}`);
    return false;
  }
}

// ─────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────

export interface VoiceResult {
  success: boolean;
  path: string;
  provider: string;
  durationEstimate: number; // seconds
}

/**
 * Generate voice audio for a reel script.
 * Tries: ElevenLabs → OpenAI TTS → Edge TTS
 */
export async function generateVoice(
  rawText: string,
  slug: string,
  reelId: number,
  voiceStyle: string = "male_energetic"
): Promise<VoiceResult> {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  // Clean before TTS so the fallback path also gets natural pronunciation.
  const text = cleanTextForTTS(rawText);
  const filename = `${slug}-reel${reelId}.mp3`;
  const outputPath = path.join(AUDIO_DIR, filename);

  // Skip if already exists
  if (fs.existsSync(outputPath)) {
    const stat = fs.statSync(outputPath);
    if (stat.size > 1000) {
      console.log(`   ♻️ Voice already exists: ${filename} (${(stat.size / 1024).toFixed(0)}KB)`);
      return {
        success: true,
        path: outputPath,
        provider: "cached",
        durationEstimate: estimateDuration(text),
      };
    }
  }

  // Try ElevenLabs first
  if (await generateWithElevenLabs(text, outputPath, voiceStyle)) {
    return { success: true, path: outputPath, provider: "elevenlabs", durationEstimate: estimateDuration(text) };
  }

  // Try OpenAI TTS
  if (await generateWithOpenAI(text, outputPath)) {
    return { success: true, path: outputPath, provider: "openai", durationEstimate: estimateDuration(text) };
  }

  // Try Edge TTS
  if (await generateWithEdgeTTS(text, outputPath)) {
    return { success: true, path: outputPath, provider: "edge-tts", durationEstimate: estimateDuration(text) };
  }

  console.error(`   ❌ All voice providers failed for ${filename}`);
  return { success: false, path: "", provider: "none", durationEstimate: 0 };
}

function estimateDuration(text: string): number {
  // Average speaking rate: ~150 words per minute
  const words = text.split(/\s+/).length;
  return Math.round((words / 150) * 60);
}

// ─────────────────────────────────────────────
// Per-Segment Voice Generation (FRAME-PERFECT SYNC)
// ─────────────────────────────────────────────

export interface VoiceSegment {
  text: string;
  individualPath: string; // path to this segment's MP3
  duration: number;       // measured by ffprobe (seconds)
  startSec: number;       // offset inside the concatenated final track
  endSec: number;
}

export interface SegmentVoiceResult {
  success: boolean;
  finalPath: string;       // concatenated MP3 the renderer will play
  segments: VoiceSegment[];
  totalDuration: number;
  provider: string;
}

/**
 * Generate ONE TTS clip per segment, measure each clip's exact duration,
 * concatenate with breath-silence between segments, and return per-segment
 * timings so the video timeline can match the audio frame-for-frame.
 *
 * This is the fix for the "text drifts out of sync with voice" problem.
 *
 * @param segmentTexts  Ordered list: [hook, scene1.text, scene2.text, ..., cta]
 * @param slug          Article slug (for filenames)
 * @param reelId        Reel ID (for filenames)
 * @param voiceStyle    ElevenLabs voice preset
 * @param silenceMs     Breath silence between segments (default 220ms)
 */
export async function generateVoicePerSegment(
  segmentTexts: string[],
  slug: string,
  reelId: number,
  voiceStyle: string = "male_energetic",
  silenceMs: number = 220
): Promise<SegmentVoiceResult> {
  if (!fs.existsSync(SEGMENT_DIR)) fs.mkdirSync(SEGMENT_DIR, { recursive: true });
  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

  const baseName = `${slug}-reel${reelId}`;
  const finalPath = path.join(AUDIO_DIR, `${baseName}.mp3`);

  // ─── Step 1: Generate each segment as its own MP3 ───
  const segments: VoiceSegment[] = [];
  let provider = "none";

  console.log(`   🎙️ Generating ${segmentTexts.length} voice segments for sync...`);

  for (let i = 0; i < segmentTexts.length; i++) {
    // Clean the text BEFORE sending to TTS so emojis, hashtags, em-dashes,
    // and markdown don't get pronounced literally.
    const raw = segmentTexts[i] || "";
    const text = cleanTextForTTS(raw);
    if (!text) continue;
    if (raw !== text) {
      console.log(`   ✂️  Cleaned segment ${i}: "${raw.slice(0, 40)}..." → "${text.slice(0, 40)}..."`);
    }

    // Hash the CLEANED text into the filename so a script edit busts the cache
    // automatically — only segments whose text actually changed get re-generated.
    const segPath = path.join(SEGMENT_DIR, `${baseName}-seg${i}-${shortHash(text + voiceStyle)}.mp3`);

    // Skip if already cached and valid
    let generated = false;
    if (fs.existsSync(segPath) && fs.statSync(segPath).size > 1000) {
      console.log(`   ♻️ Segment ${i} cached`);
      generated = true;
      if (provider === "none") provider = "cached";
    } else {
      // Try providers in order: ElevenLabs → OpenAI → Edge
      if (await generateWithElevenLabs(text, segPath, voiceStyle)) {
        generated = true;
        provider = "elevenlabs";
      } else if (await generateWithOpenAI(text, segPath)) {
        generated = true;
        provider = "openai";
      } else if (await generateWithEdgeTTS(text, segPath)) {
        generated = true;
        provider = "edge-tts";
      }
    }

    if (!generated) {
      console.warn(`   ⚠️ Segment ${i} failed to generate — skipping`);
      continue;
    }

    const duration = probeDuration(segPath);
    segments.push({
      text,
      individualPath: segPath,
      duration,
      startSec: 0, // filled in after concat
      endSec: 0,
    });
    console.log(`   ✓ Segment ${i}: ${duration.toFixed(2)}s — "${text.slice(0, 50)}..."`);
  }

  if (segments.length === 0) {
    return {
      success: false,
      finalPath: "",
      segments: [],
      totalDuration: 0,
      provider: "none",
    };
  }

  // ─── Step 2: Build a silence clip for breathing room ───
  const silenceSec = Math.max(0, silenceMs / 1000);
  const silencePath = path.join(SEGMENT_DIR, `_silence-${silenceMs}ms.mp3`);
  if (silenceSec > 0 && !fs.existsSync(silencePath)) {
    try {
      execFileSync(
        FFMPEG,
        [
          "-y",
          "-f", "lavfi",
          "-i", `anullsrc=r=44100:cl=stereo`,
          "-t", String(silenceSec),
          "-c:a", "libmp3lame",
          "-b:a", "192k",
          silencePath,
        ],
        { stdio: "pipe", timeout: 15000 }
      );
    } catch (err) {
      console.warn(`   ⚠️ Could not create silence clip: ${(err as Error).message?.slice(0, 100)}`);
    }
  }

  // ─── Step 3: Concatenate segments with silence between them ───
  const useSilence = silenceSec > 0 && fs.existsSync(silencePath);
  const concatList = path.join(SEGMENT_DIR, `${baseName}-concat.txt`);
  const lines: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    // ffconcat requires forward slashes and shell-escaped paths
    const escaped = segments[i].individualPath.replace(/\\/g, "/").replace(/'/g, "'\\''");
    lines.push(`file '${escaped}'`);
    if (useSilence && i < segments.length - 1) {
      const sil = silencePath.replace(/\\/g, "/").replace(/'/g, "'\\''");
      lines.push(`file '${sil}'`);
    }
  }
  fs.writeFileSync(concatList, lines.join("\n"));

  try {
    execFileSync(
      FFMPEG,
      [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concatList,
        // Re-encode to guarantee a clean, gap-free result regardless of source bitrates
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        "-ar", "44100",
        "-ac", "2",
        finalPath,
      ],
      { stdio: "pipe", timeout: 60000 }
    );
  } catch (err) {
    console.error(`   ❌ ffmpeg concat failed: ${(err as Error).message?.slice(0, 200)}`);
    return {
      success: false,
      finalPath: "",
      segments,
      totalDuration: segments.reduce((s, x) => s + x.duration, 0),
      provider,
    };
  } finally {
    try { fs.unlinkSync(concatList); } catch {}
  }

  if (!fs.existsSync(finalPath) || fs.statSync(finalPath).size < 1000) {
    return {
      success: false,
      finalPath: "",
      segments,
      totalDuration: 0,
      provider,
    };
  }

  // ─── Step 4: Compute exact start/end timings inside the concatenated track ───
  let cursor = 0;
  for (let i = 0; i < segments.length; i++) {
    segments[i].startSec = cursor;
    segments[i].endSec = cursor + segments[i].duration;
    cursor += segments[i].duration;
    if (useSilence && i < segments.length - 1) {
      cursor += silenceSec;
    }
  }

  const totalDuration = probeDuration(finalPath);
  console.log(
    `   ✅ Voice synced: ${segments.length} segments, ${totalDuration.toFixed(2)}s total (${provider})`
  );

  return {
    success: true,
    finalPath,
    segments,
    totalDuration,
    provider,
  };
}

// ─────────────────────────────────────────────
// CLI Entry Point
// ─────────────────────────────────────────────

async function main() {
  console.log("🎙️ Voice Generation Pipeline\n");

  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx scripts/generate-voice.ts <slug> [reelId]");
    process.exit(1);
  }

  const reelId = process.argv[3] ? parseInt(process.argv[3]) : undefined;

  // Load reel data
  const reelFile = path.join(process.cwd(), "data/reels", `${slug}.json`);
  if (!fs.existsSync(reelFile)) {
    console.error(`❌ Reel file not found: ${reelFile}`);
    process.exit(1);
  }

  const reelData = JSON.parse(fs.readFileSync(reelFile, "utf-8"));
  const reels = reelId
    ? reelData.reels.filter((r: any) => r.id === reelId)
    : reelData.reels;

  console.log(`📄 Article: ${reelData.title}`);
  console.log(`🎬 Generating voice for ${reels.length} reels\n`);

  for (const reel of reels) {
    console.log(`\n--- Reel #${reel.id}: ${reel.format} ---`);
    const fullText = `${reel.hook}. ${reel.script}`;
    const result = await generateVoice(fullText, slug, reel.id);
    console.log(`   Provider: ${result.provider}, Duration: ~${result.durationEstimate}s`);
  }

  console.log("\n✅ Voice generation complete!");
}

// Run if called directly
if (process.argv[1]?.includes("generate-voice")) {
  main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
}
