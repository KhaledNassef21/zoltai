/**
 * Video Generation Pipeline
 *
 * Full pipeline: Scripts → Optimize → Voice → Video → Output
 *
 * Steps:
 * 1. Load reel scripts for an article
 * 2. Score & pick top 3 scripts
 * 3. Generate voiceover (ElevenLabs / OpenAI TTS / Edge TTS)
 * 4. Resolve background images (DALL-E / CDN / Pollinations)
 * 5. Render video with Remotion
 * 6. Output: public/videos/{slug}-reel{id}.mp4
 *
 * Usage:
 *   npx tsx scripts/generate-video.ts                    # Latest article
 *   npx tsx scripts/generate-video.ts <slug>             # Specific article
 *   npx tsx scripts/generate-video.ts <slug> <reelId>    # Specific reel
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Load .env.local for local development
function loadEnv() {
  const envFile = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envFile)) {
    const lines = fs.readFileSync(envFile, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}
loadEnv();

import { pickTopReels, type OptimizedReel } from "../src/lib/reel-optimizer";
import { generateVoice } from "./generate-voice";

const REELS_DIR = path.join(process.cwd(), "data/reels");
const VIDEOS_DIR = path.join(process.cwd(), "public/videos");
const IMAGES_DIR = path.join(process.cwd(), "public/images/instagram");
const SITE_URL = "https://zoltai.org";

// ─────────────────────────────────────────────
// Image Resolution
// ─────────────────────────────────────────────

async function resolveImages(slug: string, count: number = 4): Promise<string[]> {
  const urls: string[] = [];

  // Try local Instagram slides first
  const instaDir = path.join(IMAGES_DIR, slug);
  if (fs.existsSync(instaDir)) {
    for (let i = 1; i <= 4; i++) {
      for (const ext of ["jpg", "png"]) {
        const file = path.join(instaDir, `slide-${i}.${ext}`);
        if (fs.existsSync(file)) {
          const stat = fs.statSync(file);
          if (stat.size > 5000) {
            urls.push(`${SITE_URL}/images/instagram/${slug}/slide-${i}.${ext}`);
          }
        }
      }
    }
  }

  // Try blog cover image
  for (const ext of ["jpg", "png", "jpeg"]) {
    const coverFile = path.join(process.cwd(), "public/images/blog", `${slug}.${ext}`);
    if (fs.existsSync(coverFile)) {
      urls.push(`${SITE_URL}/images/blog/${slug}.${ext}`);
      break;
    }
  }

  // Fallback: generate placeholder images using Pollinations
  while (urls.length < count) {
    const seed = Math.floor(Math.random() * 99999);
    const prompt = encodeURIComponent("futuristic AI technology abstract background dark");
    urls.push(
      `https://image.pollinations.ai/prompt/${prompt}?width=1080&height=1920&seed=${seed}&nologo=true`
    );
  }

  console.log(`   🖼️ Resolved ${urls.length} images for video`);
  return urls.slice(0, count);
}

// ─────────────────────────────────────────────
// Remotion Render
// ─────────────────────────────────────────────

interface RenderInput {
  reel: OptimizedReel;
  slug: string;
  audioPath: string;
  images: string[];
  audioDuration: number;
}

function renderVideo(input: RenderInput): string | null {
  const { reel, slug, audioPath, images, audioDuration } = input;
  const outputFile = path.join(VIDEOS_DIR, `${slug}-reel${reel.id}.mp4`);

  // Skip if already rendered
  if (fs.existsSync(outputFile)) {
    const stat = fs.statSync(outputFile);
    if (stat.size > 100000) {
      console.log(`   ♻️ Video already exists: ${path.basename(outputFile)} (${(stat.size / 1024 / 1024).toFixed(1)}MB)`);
      return outputFile;
    }
  }

  // Calculate total duration from audio + padding
  const totalDuration = Math.max(
    audioDuration + 4, // audio + 2s intro + 2s outro
    reel.totalDuration,
    15 // minimum 15 seconds
  );

  const fps = 30;
  const totalFrames = Math.round(totalDuration * fps);

  // Build input props
  const props = JSON.stringify({
    hook: reel.hook,
    scenes: reel.scenes,
    cta: reel.cta,
    audioFile: audioPath ? `audio/${path.basename(audioPath)}` : undefined,
    images,
  });

  // Write props to temp file (avoids shell escaping issues)
  const propsFile = path.join(process.cwd(), ".tmp-reel-props.json");
  fs.writeFileSync(propsFile, props);

  try {
    console.log(`   🎬 Rendering video (${totalFrames} frames, ${totalDuration.toFixed(0)}s)...`);

    const cmd = [
      "npx remotion render",
      `src/videos/index.ts`,
      "Reel",
      `"${outputFile}"`,
      `--props="${propsFile}"`,
      `--width=1080`,
      `--height=1920`,
      `--fps=${fps}`,
      `--codec=h264`,
      `--crf=18`,
      `--pixel-format=yuv420p`,
      `--log=error`,
      `--concurrency=50%`,
    ].join(" ");

    execSync(cmd, {
      timeout: 300000, // 5 minutes max
      stdio: "inherit",
      cwd: process.cwd(),
    });

    if (fs.existsSync(outputFile)) {
      const stat = fs.statSync(outputFile);
      console.log(`   ✅ Video rendered: ${(stat.size / 1024 / 1024).toFixed(1)}MB`);
      return outputFile;
    }

    console.warn(`   ⚠️ Video file not created`);
    return null;
  } catch (err) {
    console.error(`   ❌ Render failed: ${(err as Error).message?.slice(0, 200)}`);
    return null;
  } finally {
    // Cleanup temp file
    try { fs.unlinkSync(propsFile); } catch {}
  }
}

// ─────────────────────────────────────────────
// Find Latest Article with Reels
// ─────────────────────────────────────────────

function findLatestReelSlug(): string | null {
  if (!fs.existsSync(REELS_DIR)) return null;

  const files = fs.readdirSync(REELS_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) return null;

  // Sort by modification time (newest first)
  const sorted = files
    .map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(REELS_DIR, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  return sorted[0].name.replace(".json", "");
}

// ─────────────────────────────────────────────
// Main Pipeline
// ─────────────────────────────────────────────

async function main() {
  console.log("🎬 Video Generation Pipeline\n");
  console.log("Providers:");
  console.log(`   ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? "✅" : "Not set"}`);
  console.log(`   OpenAI TTS: ${process.env.OPENAI_API_KEY ? "✅" : "Not set"}`);
  console.log("");

  // Ensure output directory
  if (!fs.existsSync(VIDEOS_DIR)) {
    fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  }

  // Determine target
  let slug = process.argv[2];
  const specificReelId = process.argv[3] ? parseInt(process.argv[3]) : undefined;

  if (!slug) {
    slug = findLatestReelSlug() || "";
    if (!slug) {
      console.error("❌ No reel scripts found. Run generate-reels.ts first.");
      process.exit(1);
    }
    console.log(`📄 Auto-selected latest: ${slug}\n`);
  }

  // Load reel data
  const reelFile = path.join(REELS_DIR, `${slug}.json`);
  if (!fs.existsSync(reelFile)) {
    console.error(`❌ Reel file not found: ${reelFile}`);
    process.exit(1);
  }

  const reelData = JSON.parse(fs.readFileSync(reelFile, "utf-8"));
  console.log(`📄 Article: ${reelData.title}`);
  console.log(`🎬 Total reels: ${reelData.reels.length}\n`);

  // Step 1: Score and pick top reels
  let reelsToProcess: OptimizedReel[];

  if (specificReelId) {
    const raw = reelData.reels.find((r: any) => r.id === specificReelId);
    if (!raw) {
      console.error(`❌ Reel #${specificReelId} not found`);
      process.exit(1);
    }
    const { optimizeReel } = await import("../src/lib/reel-optimizer");
    reelsToProcess = [optimizeReel(raw)];
  } else {
    reelsToProcess = pickTopReels(reelData.reels, 3);
  }

  // Step 2: Resolve images
  console.log("\n🖼️ Resolving images...");
  const images = await resolveImages(slug);

  // Step 3: Process each reel
  const results: { reelId: number; video: string | null; audio: string | null }[] = [];

  for (const reel of reelsToProcess) {
    console.log(`\n${"═".repeat(50)}`);
    console.log(`🎬 Reel #${reel.id}: ${reel.format}`);
    console.log(`   Hook: "${reel.hook.slice(0, 60)}..."`);
    console.log(`   Scenes: ${reel.scenes.length}, Duration: ~${reel.totalDuration}s`);
    console.log(`   Score: ${reel.score}pts`);

    // Generate voice
    console.log(`\n   🎙️ Generating voice...`);
    const fullScript = `${reel.hook}. ${reel.scenes.map((s) => s.text).join(". ")}`;
    const voiceResult = await generateVoice(fullScript, slug, reel.id);

    if (!voiceResult.success) {
      console.warn(`   ⚠️ Skipping video — no voice generated`);
      results.push({ reelId: reel.id, video: null, audio: null });
      continue;
    }

    // Render video
    console.log(`\n   🎬 Rendering video...`);
    const videoPath = renderVideo({
      reel,
      slug,
      audioPath: voiceResult.path,
      images,
      audioDuration: voiceResult.durationEstimate,
    });

    results.push({
      reelId: reel.id,
      video: videoPath,
      audio: voiceResult.path,
    });
  }

  // Summary
  console.log(`\n${"═".repeat(50)}`);
  console.log("📊 Pipeline Summary:\n");

  const successful = results.filter((r) => r.video);
  const failed = results.filter((r) => !r.video);

  for (const r of results) {
    const status = r.video ? "✅" : "❌";
    const size = r.video && fs.existsSync(r.video)
      ? `${(fs.statSync(r.video).size / 1024 / 1024).toFixed(1)}MB`
      : "N/A";
    console.log(`   ${status} Reel #${r.reelId}: ${r.video ? path.basename(r.video) : "FAILED"} (${size})`);
  }

  console.log(`\n   Total: ${successful.length} videos, ${failed.length} failed`);

  // Save results metadata
  const metaFile = path.join(VIDEOS_DIR, `${slug}-meta.json`);
  fs.writeFileSync(
    metaFile,
    JSON.stringify(
      {
        slug,
        title: reelData.title,
        generatedAt: new Date().toISOString(),
        videos: results.map((r) => ({
          reelId: r.reelId,
          videoFile: r.video ? path.basename(r.video) : null,
          audioFile: r.audio ? path.basename(r.audio) : null,
        })),
      },
      null,
      2
    )
  );

  if (successful.length === 0) {
    console.error("\n❌ No videos were generated. Check logs above.");
    process.exit(1);
  }

  console.log("\n✅ Video pipeline complete!");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
