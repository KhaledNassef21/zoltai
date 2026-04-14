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

const AUDIO_DIR = path.join(process.cwd(), "public/audio");

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
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.3,
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

    execSync(
      `edge-tts --voice "${voice}" --text "${cleanText}" --write-media "${outputPath}" --rate="+10%"`,
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

    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1-hd",
        input: text.slice(0, 4096),
        voice: "onyx", // Deep, confident male voice
        response_format: "mp3",
        speed: 1.05,
      }),
      signal: AbortSignal.timeout(60000),
    });

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
  text: string,
  slug: string,
  reelId: number,
  voiceStyle: string = "male_energetic"
): Promise<VoiceResult> {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

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
