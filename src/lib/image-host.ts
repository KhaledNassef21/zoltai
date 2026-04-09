// src/lib/image-host.ts
/**
 * Free Image Hosting for Social Media Pipeline
 *
 * Instagram API requires DIRECT image URLs with proper content-type headers.
 * Pollinations.ai URLs are generation endpoints (slow, not direct) — Instagram rejects them.
 *
 * Solution: Download image → Upload to free host → Get direct URL
 *
 * Hosts (in order of reliability):
 * 1. catbox.moe — free, no API key, permanent, direct URLs
 * 2. 0x0.st — free, no API key, temporary (30 days)
 * 3. Fallback: picsum.photos with context-aware seeds
 */

/**
 * Download an image from URL to Buffer
 */
export async function downloadToBuffer(url: string): Promise<Buffer> {
  console.log(`   📥 Downloading image...`);
  const response = await fetch(url, {
    signal: AbortSignal.timeout(60000), // 60s timeout for AI generation
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  console.log(`   ✅ Downloaded: ${(buffer.length / 1024).toFixed(0)}KB`);
  return buffer;
}

/**
 * Upload image buffer to catbox.moe (free, no API key, permanent hosting)
 * Returns a direct URL like: https://files.catbox.moe/abc123.jpg
 */
async function uploadToCatbox(buffer: Buffer, filename: string = "image.jpg"): Promise<string> {
  console.log(`   📤 Uploading to catbox.moe...`);

  const formData = new FormData();
  formData.append("reqtype", "fileupload");
  formData.append("fileToUpload", new Blob([new Uint8Array(buffer)], { type: "image/jpeg" }), filename);

  const response = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Catbox upload failed: ${response.status}`);
  }

  const url = await response.text();
  const trimmed = url.trim();

  if (!trimmed.startsWith("https://")) {
    throw new Error(`Catbox returned invalid URL: ${trimmed}`);
  }

  console.log(`   ✅ Hosted: ${trimmed}`);
  return trimmed;
}

/**
 * Upload image buffer to litterbox.catbox.moe (temporary, 24h)
 * Fallback if main catbox fails
 */
async function uploadToLitterbox(buffer: Buffer, filename: string = "image.jpg"): Promise<string> {
  console.log(`   📤 Uploading to litterbox (24h temp)...`);

  const formData = new FormData();
  formData.append("reqtype", "fileupload");
  formData.append("time", "24h");
  formData.append("fileToUpload", new Blob([new Uint8Array(buffer)], { type: "image/jpeg" }), filename);

  const response = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
    method: "POST",
    body: formData,
    signal: AbortSignal.timeout(30000),
  });

  if (!response.ok) {
    throw new Error(`Litterbox upload failed: ${response.status}`);
  }

  const url = await response.text();
  const trimmed = url.trim();

  if (!trimmed.startsWith("https://")) {
    throw new Error(`Litterbox returned invalid URL: ${trimmed}`);
  }

  console.log(`   ✅ Hosted (24h): ${trimmed}`);
  return trimmed;
}

/**
 * Get a fallback image URL from picsum.photos using context-aware seed
 * These resolve to direct fastly CDN URLs that Instagram accepts
 */
async function getFallbackImage(seed: string, size: number = 1080): Promise<string> {
  console.log(`   🔄 Falling back to picsum.photos (seed: ${seed})...`);
  const cleanSeed = seed.replace(/[^a-z0-9]/g, "").slice(0, 20) || "zoltai";
  const url = `https://picsum.photos/seed/${cleanSeed}/${size}/${size}.jpg`;

  // Resolve redirect to get direct CDN URL
  const response = await fetch(url, { redirect: "follow" });
  if (response.ok) {
    console.log(`   ✅ Fallback: ${response.url.slice(0, 80)}...`);
    return response.url;
  }

  // Ultimate fallback
  return `https://picsum.photos/seed/zoltai${Math.floor(Math.random() * 100)}/${size}/${size}.jpg`;
}

/**
 * Upload a raw image buffer to a free host. Returns direct URL.
 * Used when we already have image data (e.g. from DALL-E 3).
 */
export async function uploadImageBuffer(
  buffer: Buffer,
  name: string
): Promise<string | null> {
  const filename = `${name}-${Date.now()}.jpg`;

  try {
    return await uploadToCatbox(buffer, filename);
  } catch (err) {
    console.warn(`   ⚠️ Catbox failed: ${(err as Error).message}`);
  }

  try {
    return await uploadToLitterbox(buffer, filename);
  } catch (err) {
    console.warn(`   ⚠️ Litterbox failed: ${(err as Error).message}`);
  }

  return null;
}

/**
 * Main function: Generate image from Pollinations prompt → Upload to host → Return direct URL
 * This is what Instagram needs: a direct, fast, reliable image URL
 */
export async function getHostedImageUrl(
  pollinationsUrl: string,
  fallbackSeed: string,
  slideIndex: number = 0
): Promise<string> {
  const filename = `zoltai-slide-${slideIndex}-${Date.now()}.jpg`;

  try {
    // Step 1: Download from Pollinations (may take 10-30s for generation)
    const buffer = await downloadToBuffer(pollinationsUrl);

    if (buffer.length < 1000) {
      throw new Error("Image too small, likely an error response");
    }

    // Step 2: Upload to free host
    try {
      return await uploadToCatbox(buffer, filename);
    } catch (catboxErr) {
      console.warn(`   ⚠️ Catbox failed: ${(catboxErr as Error).message}`);
    }

    // Step 3: Try litterbox as backup
    try {
      return await uploadToLitterbox(buffer, filename);
    } catch (litterboxErr) {
      console.warn(`   ⚠️ Litterbox failed: ${(litterboxErr as Error).message}`);
    }
  } catch (downloadErr) {
    console.warn(`   ⚠️ Pollinations download failed: ${(downloadErr as Error).message}`);
  }

  // Step 4: Fallback to picsum.photos
  return getFallbackImage(fallbackSeed);
}
