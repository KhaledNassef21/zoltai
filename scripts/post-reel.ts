/**
 * Reel Publishing Pipeline
 *
 * Publishes generated video reels to Instagram Reels + Facebook Reels.
 * Uses the Instagram Graph API video upload flow.
 *
 * Usage:
 *   npx tsx scripts/post-reel.ts                  # Latest video
 *   npx tsx scripts/post-reel.ts <slug>           # Specific article
 *   npx tsx scripts/post-reel.ts <slug> <reelId>  # Specific reel
 */

import fs from "fs";
import path from "path";
import { uploadImageBuffer } from "../src/lib/image-host";

const VIDEOS_DIR = path.join(process.cwd(), "public/videos");
const SITE_URL = "https://zoltai.org";
const POSTED_LOG = path.join(process.cwd(), "data/posted-reels.json");

// ─────────────────────────────────────────────
// Upload Video to CDN (for Instagram API)
// ─────────────────────────────────────────────

async function uploadVideoToHost(videoPath: string, name: string): Promise<string | null> {
  console.log(`   📤 Uploading video to host...`);

  // Read video file
  const buffer = fs.readFileSync(videoPath);
  const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
  console.log(`   📦 Video size: ${sizeMB}MB`);

  // Try catbox.moe (supports video files)
  try {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append(
      "fileToUpload",
      new Blob([new Uint8Array(buffer)], { type: "video/mp4" }),
      `${name}.mp4`
    );

    const res = await fetch("https://catbox.moe/user/api.php", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(120000), // 2 min for video
    });

    if (res.ok) {
      const url = (await res.text()).trim();
      if (url.startsWith("https://")) {
        console.log(`   ✅ Uploaded to catbox: ${url}`);
        return url;
      }
    }
  } catch (err) {
    console.warn(`   ⚠️ Catbox failed: ${(err as Error).message?.slice(0, 80)}`);
  }

  // Try litterbox (24h temporary)
  try {
    const formData = new FormData();
    formData.append("reqtype", "fileupload");
    formData.append("time", "24h");
    formData.append(
      "fileToUpload",
      new Blob([new Uint8Array(buffer)], { type: "video/mp4" }),
      `${name}.mp4`
    );

    const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(120000),
    });

    if (res.ok) {
      const url = (await res.text()).trim();
      if (url.startsWith("https://")) {
        console.log(`   ✅ Uploaded to litterbox (24h): ${url}`);
        return url;
      }
    }
  } catch (err) {
    console.warn(`   ⚠️ Litterbox failed: ${(err as Error).message?.slice(0, 80)}`);
  }

  console.error(`   ❌ Failed to upload video to any host`);
  return null;
}

// ─────────────────────────────────────────────
// Instagram Reels API
// ─────────────────────────────────────────────

async function publishToInstagramReels(
  videoUrl: string,
  caption: string
): Promise<string | null> {
  const userId = process.env.INSTAGRAM_USER_ID!;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN!;

  if (!userId || !token) {
    console.error("   ❌ Instagram credentials missing");
    return null;
  }

  try {
    // Step 1: Create media container for REELS
    console.log(`   📤 Creating Instagram Reels container...`);
    const containerRes = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          media_type: "REELS",
          video_url: videoUrl,
          caption,
          share_to_feed: true,
          access_token: token,
        }),
      }
    );

    const containerData = await containerRes.json();

    if (!containerRes.ok || containerData.error) {
      console.error(`   ❌ Container failed: ${containerData.error?.message || "Unknown"}`);
      return null;
    }

    const containerId = containerData.id;
    console.log(`   ✅ Container ID: ${containerId}`);

    // Step 2: Wait for video processing
    console.log(`   ⏳ Waiting for Instagram to process video...`);
    for (let attempt = 1; attempt <= 20; attempt++) {
      await new Promise((r) => setTimeout(r, 10000)); // 10s between checks

      const statusRes = await fetch(
        `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${token}`
      );
      const statusData = await statusRes.json();

      console.log(`   Attempt ${attempt}/20: ${statusData.status_code || "checking..."}`);

      if (statusData.status_code === "FINISHED") {
        break;
      }

      if (statusData.status_code === "ERROR") {
        console.error(`   ❌ Instagram processing error`);
        return null;
      }
    }

    // Step 3: Publish
    console.log(`   📢 Publishing reel...`);
    const pubRes = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: token,
        }),
      }
    );

    const pubData = await pubRes.json();

    if (pubRes.ok && !pubData.error) {
      console.log(`   ✅ Instagram Reel published! ID: ${pubData.id}`);
      return pubData.id;
    }

    console.error(`   ❌ Publish failed: ${pubData.error?.message || "Unknown"}`);
    return null;
  } catch (err) {
    console.error(`   ❌ Instagram error: ${(err as Error).message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// Facebook Reels API
// ─────────────────────────────────────────────

async function publishToFacebookReels(
  videoUrl: string,
  caption: string
): Promise<string | null> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !pageToken) {
    console.log("   ⏭️ Facebook not configured — skipping");
    return null;
  }

  try {
    console.log(`   📤 Uploading to Facebook Reels...`);

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/video_reels`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upload_phase: "start",
          access_token: pageToken,
        }),
      }
    );

    const startData = await res.json();
    if (!res.ok || startData.error) {
      // Fallback: post as regular video
      console.log(`   ⚠️ Reels API not available, posting as video...`);
      const videoRes = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/videos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file_url: videoUrl,
            description: caption,
            access_token: pageToken,
          }),
        }
      );
      const videoData = await videoRes.json();
      if (videoRes.ok && !videoData.error) {
        console.log(`   ✅ Facebook video posted! ID: ${videoData.id}`);
        return videoData.id;
      }
      console.warn(`   ⚠️ Facebook video failed: ${videoData.error?.message || "Unknown"}`);
      return null;
    }

    // Upload the video file
    const videoId = startData.video_id;
    const uploadUrl = startData.upload_url;

    const videoBuffer = await fetch(videoUrl).then((r) => r.arrayBuffer());

    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `OAuth ${pageToken}`,
        file_url: videoUrl,
      },
      body: Buffer.from(videoBuffer),
    });

    // Finish upload
    const finishRes = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/video_reels`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upload_phase: "finish",
          video_id: videoId,
          title: caption.split("\n")[0].slice(0, 100),
          description: caption,
          access_token: pageToken,
        }),
      }
    );

    const finishData = await finishRes.json();
    if (finishRes.ok && !finishData.error) {
      console.log(`   ✅ Facebook Reel published! ID: ${finishData.id || videoId}`);
      return finishData.id || videoId;
    }

    console.warn(`   ⚠️ Facebook finish failed: ${finishData.error?.message || "Unknown"}`);
    return null;
  } catch (err) {
    console.error(`   ❌ Facebook error: ${(err as Error).message}`);
    return null;
  }
}

// ─────────────────────────────────────────────
// Duplicate Tracking
// ─────────────────────────────────────────────

function loadPostedReels(): string[] {
  try {
    if (fs.existsSync(POSTED_LOG)) {
      return JSON.parse(fs.readFileSync(POSTED_LOG, "utf-8"));
    }
  } catch {}
  return [];
}

function savePostedReel(key: string) {
  const posted = loadPostedReels();
  if (!posted.includes(key)) {
    posted.push(key);
    const dir = path.dirname(POSTED_LOG);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(POSTED_LOG, JSON.stringify(posted, null, 2));
  }
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log("📹 Reel Publishing Pipeline\n");

  const slug = process.argv[2];
  const specificReelId = process.argv[3] ? parseInt(process.argv[3]) : undefined;

  // Find video metadata
  let metaFile: string;
  if (slug) {
    metaFile = path.join(VIDEOS_DIR, `${slug}-meta.json`);
  } else {
    // Find latest meta file
    const metas = fs.readdirSync(VIDEOS_DIR)
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
  const posted = loadPostedReels();

  console.log(`📄 Article: ${meta.title}`);
  console.log(`🎬 Videos: ${meta.videos.length}\n`);

  // Load reel data for captions
  const reelFile = path.join(process.cwd(), "data/reels", `${meta.slug}.json`);
  const reelData = fs.existsSync(reelFile)
    ? JSON.parse(fs.readFileSync(reelFile, "utf-8"))
    : null;

  let publishedCount = 0;

  for (const video of meta.videos) {
    if (!video.videoFile) continue;
    if (specificReelId && video.reelId !== specificReelId) continue;

    const postKey = `${meta.slug}-reel${video.reelId}`;
    if (posted.includes(postKey)) {
      console.log(`⏭️ Already posted: ${postKey}`);
      continue;
    }

    const videoPath = path.join(VIDEOS_DIR, video.videoFile);
    if (!fs.existsSync(videoPath)) {
      console.warn(`⚠️ Video file missing: ${video.videoFile}`);
      continue;
    }

    console.log(`\n${"─".repeat(40)}`);
    console.log(`📹 Publishing: ${video.videoFile}`);

    // Get caption from reel data
    const reel = reelData?.reels?.find((r: any) => r.id === video.reelId);
    const caption = reel
      ? `${reel.hook}\n\n${reel.caption}\n\nFull guide: ${SITE_URL}/blog/${meta.slug}\n\nFollow @zoltai.ai for daily AI tips`
      : `AI Tips & Tools\n\nFull guide: ${SITE_URL}/blog/${meta.slug}\n\n#AI #AITools #Productivity #Zoltai`;

    // Upload video to CDN
    const videoUrl = await uploadVideoToHost(videoPath, postKey);
    if (!videoUrl) {
      console.error(`   ❌ Cannot upload video — skipping`);
      continue;
    }

    // Publish to Instagram Reels
    const igId = await publishToInstagramReels(videoUrl, caption);

    // Publish to Facebook Reels
    const fbId = await publishToFacebookReels(videoUrl, caption);

    if (igId || fbId) {
      savePostedReel(postKey);
      publishedCount++;
      console.log(`   ✅ Published: IG=${igId || "N/A"}, FB=${fbId || "N/A"}`);
    }
  }

  console.log(`\n${"═".repeat(40)}`);
  console.log(`📊 Published ${publishedCount} reels`);
  console.log("✅ Done!");
}

main().catch((err) => {
  console.error("❌ Fatal error:", err);
  process.exit(1);
});
