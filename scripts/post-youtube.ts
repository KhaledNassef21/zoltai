/**
 * YouTube Shorts Publishing Pipeline
 *
 * Uploads generated reel videos (9:16 MP4) directly to the user's own
 * YouTube channel as YouTube Shorts, using the official YouTube Data API v3
 * with OAuth2 refresh-token flow (no interactive login needed in CI).
 *
 * Required env vars (set as GitHub secrets):
 *   YOUTUBE_CLIENT_ID        — OAuth2 client ID
 *   YOUTUBE_CLIENT_SECRET    — OAuth2 client secret
 *   YOUTUBE_REFRESH_TOKEN    — long-lived refresh token (generated once)
 *   YOUTUBE_CHANNEL_ID       — optional; for sanity check
 *
 * To obtain a refresh token:
 *   1. Create OAuth2 credentials at console.cloud.google.com (Desktop app type)
 *   2. Enable "YouTube Data API v3" in the same project
 *   3. Run scripts/youtube-auth.ts locally once to open a browser, login,
 *      and print the refresh token — then paste into GitHub Secrets.
 *
 * Usage:
 *   npx tsx scripts/post-youtube.ts                  # Latest video
 *   npx tsx scripts/post-youtube.ts <slug>           # Specific article
 *   npx tsx scripts/post-youtube.ts <slug> <reelId>  # Specific reel
 */

import fs from "fs";
import path from "path";
import { google } from "googleapis";
import type { youtube_v3 } from "googleapis";

const VIDEOS_DIR = path.join(process.cwd(), "public/videos");
const SITE_URL = "https://zoltai.org";
const POSTED_LOG = path.join(process.cwd(), "data/posted-youtube.json");

// ─────────────────────────────────────────────
// Authenticated YouTube client
// ─────────────────────────────────────────────

function getYouTubeClient(): youtube_v3.Youtube {
  const clientId = process.env.YOUTUBE_CLIENT_ID;
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN"
    );
  }

  // OAuth2 client — googleapis will auto-refresh the access token as needed.
  // The redirect_uri is only used for initial code exchange; for refresh-token
  // flow it's not sent to Google, but we keep it matching the desktop client
  // config (http://localhost) to avoid surprises.
  const oauth2 = new google.auth.OAuth2(
    clientId,
    clientSecret,
    "http://localhost"
  );
  oauth2.setCredentials({ refresh_token: refreshToken });

  return google.youtube({ version: "v3", auth: oauth2 });
}

// ─────────────────────────────────────────────
// Caption / description helpers
// ─────────────────────────────────────────────

/**
 * YouTube Shorts algorithm: title <= 100 chars, #Shorts somewhere.
 * We lead with the hook (punchy) and put the site link + hashtags in description.
 */
function buildTitle(hook: string | undefined, fallback: string): string {
  const raw = (hook || fallback).replace(/[\r\n]+/g, " ").trim();
  // Keep room for " #Shorts"
  const limit = 88;
  const clipped = raw.length > limit ? `${raw.slice(0, limit - 1).trim()}…` : raw;
  return `${clipped} #Shorts`;
}

function buildDescription(
  hook: string | undefined,
  caption: string | undefined,
  slug: string,
  tags: string[]
): string {
  const lines: string[] = [];
  if (hook) lines.push(hook.trim());
  if (caption) lines.push("", caption.trim());
  lines.push("", `👉 Full guide: ${SITE_URL}/blog/${slug}`);
  lines.push("", "Follow for daily AI tips:");
  lines.push(`• Instagram: https://instagram.com/zoltai.ai`);
  lines.push(`• Web:       ${SITE_URL}`);
  lines.push("", tags.map((t) => `#${t}`).join(" "));
  return lines.join("\n").slice(0, 4900); // YouTube limit ~5000
}

// ─────────────────────────────────────────────
// Duplicate tracking
// ─────────────────────────────────────────────

function loadPosted(): string[] {
  try {
    if (fs.existsSync(POSTED_LOG)) {
      return JSON.parse(fs.readFileSync(POSTED_LOG, "utf-8"));
    }
  } catch {}
  return [];
}

function savePosted(key: string) {
  const posted = loadPosted();
  if (!posted.includes(key)) {
    posted.push(key);
    const dir = path.dirname(POSTED_LOG);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(POSTED_LOG, JSON.stringify(posted, null, 2));
  }
}

// ─────────────────────────────────────────────
// Upload
// ─────────────────────────────────────────────

async function uploadShort(
  youtube: youtube_v3.Youtube,
  videoPath: string,
  title: string,
  description: string,
  tags: string[]
): Promise<string | null> {
  const sizeMB = (fs.statSync(videoPath).size / 1024 / 1024).toFixed(1);
  console.log(`   📦 Video size: ${sizeMB}MB`);
  console.log(`   📤 Uploading to YouTube Shorts...`);

  try {
    const res = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          // Max 500 tags, 30 chars each. Keep it short.
          tags: tags.slice(0, 15).map((t) => t.slice(0, 30)),
          categoryId: "28", // Science & Technology
          defaultLanguage: "en",
        },
        status: {
          privacyStatus: "public",
          madeForKids: false,
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(videoPath),
      },
    });

    const videoId = res.data.id;
    if (videoId) {
      console.log(`   ✅ YouTube Short uploaded: https://youtu.be/${videoId}`);
      return videoId;
    }
    console.error(`   ❌ No videoId in response`);
    return null;
  } catch (err) {
    const e = err as { message?: string; errors?: Array<{ message?: string }> };
    const msg = e.errors?.[0]?.message || e.message || String(err);
    console.error(`   ❌ Upload failed: ${msg}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log("📺 YouTube Shorts Publishing Pipeline\n");

  const slug = process.argv[2];
  const specificReelId = process.argv[3] ? parseInt(process.argv[3]) : undefined;

  // Find video metadata
  let metaFile: string;
  if (slug) {
    metaFile = path.join(VIDEOS_DIR, `${slug}-meta.json`);
  } else {
    if (!fs.existsSync(VIDEOS_DIR)) {
      console.error(`❌ No videos dir: ${VIDEOS_DIR}`);
      process.exit(1);
    }
    const metas = fs
      .readdirSync(VIDEOS_DIR)
      .filter((f) => f.endsWith("-meta.json"))
      .map((f) => ({
        name: f,
        mtime: fs.statSync(path.join(VIDEOS_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (metas.length === 0) {
      console.error("❌ No video metadata found. Run generate-video.ts first.");
      process.exit(1);
    }
    metaFile = path.join(VIDEOS_DIR, metas[0].name);
  }

  if (!fs.existsSync(metaFile)) {
    console.error(`❌ Meta file not found: ${metaFile}`);
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(metaFile, "utf-8"));
  const posted = loadPosted();
  const youtube = getYouTubeClient();

  console.log(`📄 Article: ${meta.title}`);
  console.log(`🎬 Videos: ${meta.videos.length}\n`);

  // Load reel data for captions/hooks
  const reelFile = path.join(process.cwd(), "data/reels", `${meta.slug}.json`);
  const reelData = fs.existsSync(reelFile)
    ? JSON.parse(fs.readFileSync(reelFile, "utf-8"))
    : null;

  const tags: string[] = Array.isArray(meta.tags) && meta.tags.length
    ? meta.tags
    : ["AI", "AITools", "Productivity", "Shorts", "Zoltai"];

  let publishedCount = 0;

  for (const video of meta.videos) {
    if (!video.videoFile) continue;
    if (specificReelId && video.reelId !== specificReelId) continue;

    const postKey = `${meta.slug}-reel${video.reelId}`;
    if (posted.includes(postKey)) {
      console.log(`⏭️  Already posted: ${postKey}`);
      continue;
    }

    const videoPath = path.join(VIDEOS_DIR, video.videoFile);
    if (!fs.existsSync(videoPath)) {
      console.warn(`⚠️  Video file missing: ${video.videoFile}`);
      continue;
    }

    const reel = reelData?.reels?.find(
      (r: { id: number }) => r.id === video.reelId
    );
    const title = buildTitle(reel?.hook, meta.title);
    const description = buildDescription(
      reel?.hook,
      reel?.caption,
      meta.slug,
      tags
    );

    console.log(`\n${"─".repeat(40)}`);
    console.log(`📹 Uploading: ${video.videoFile}`);
    console.log(`   Title: ${title}`);

    const videoId = await uploadShort(
      youtube,
      videoPath,
      title,
      description,
      tags
    );

    if (videoId) {
      savePosted(postKey);
      publishedCount++;
    } else {
      // Stop on first failure to avoid exhausting the daily quota
      console.warn(`⚠️  Stopping after failure to protect quota`);
      break;
    }
  }

  console.log(`\n${"═".repeat(40)}`);
  console.log(`📊 Published ${publishedCount} YouTube Shorts`);
  console.log("✅ Done!");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
