// src/lib/openai-image.ts
/**
 * OpenAI DALL-E 3 Image Generation + Pollinations Fallback
 *
 * Priority: DALL-E 3 (high quality) → Pollinations (free fallback)
 *
 * DALL-E 3 advantages:
 * - Much higher quality, no AI artifacts
 * - Better text understanding
 * - Consistent style
 *
 * Pricing: DALL-E 3 Standard 1024x1024 = $0.04/image
 *          DALL-E 3 Standard 1792x1024 = $0.08/image
 */

import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

export interface ImageResult {
  url: string;
  provider: "openai" | "pollinations";
}

/**
 * Generate image with DALL-E 3
 */
async function generateWithDallE(
  prompt: string,
  size: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024"
): Promise<string | null> {
  const client = getOpenAI();
  if (!client) return null;

  try {
    console.log(`   🎨 [DALL-E 3] Generating (${size})...`);
    const response = await client.images.generate({
      model: "dall-e-3",
      prompt: prompt.slice(0, 4000),
      n: 1,
      size,
      quality: "standard",
      style: "vivid",
    });

    const url = response.data?.[0]?.url;
    if (!url) {
      console.warn("   ⚠️ [DALL-E 3] No URL in response");
      return null;
    }

    console.log(`   ✅ [DALL-E 3] Generated successfully`);
    return url;
  } catch (err) {
    const error = err as Error & { status?: number; code?: string };
    console.warn(`   ⚠️ [DALL-E 3] Failed: ${error.message}`);
    if (error.status === 429) {
      console.warn("   ⚠️ Rate limited / quota exceeded — using Pollinations");
    }
    return null;
  }
}

/**
 * Generate image with Pollinations.ai (free fallback, always random seed)
 */
function generateWithPollinations(
  prompt: string,
  width: number = 1024,
  height: number = 1024
): string {
  const seed = Math.floor(Math.random() * 999999);
  const shortPrompt = prompt.slice(0, 150);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(shortPrompt)}?width=${width}&height=${height}&nologo=true&seed=${seed}`;
  console.log(`   🎨 [Pollinations] seed=${seed}, prompt="${shortPrompt.slice(0, 60)}..."`);
  return url;
}

/**
 * Generate a blog cover image (16:9)
 * Tries DALL-E 3 first, falls back to Pollinations
 */
export async function generateCoverImage(
  prompt: string
): Promise<ImageResult> {
  const dalleUrl = await generateWithDallE(prompt, "1792x1024");
  if (dalleUrl) return { url: dalleUrl, provider: "openai" };
  return { url: generateWithPollinations(prompt, 1792, 1024), provider: "pollinations" };
}

/**
 * Generate an Instagram slide (1:1 square)
 * Tries DALL-E 3 first, falls back to Pollinations
 */
export async function generateInstagramSlide(
  prompt: string
): Promise<ImageResult> {
  const dalleUrl = await generateWithDallE(prompt, "1024x1024");
  if (dalleUrl) return { url: dalleUrl, provider: "openai" };
  return { url: generateWithPollinations(prompt, 1080, 1080), provider: "pollinations" };
}

/**
 * Download image from URL to Buffer
 */
export async function downloadImageToBuffer(
  url: string,
  timeoutMs: number = 90000
): Promise<Buffer> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 5000) {
    throw new Error(`Image too small (${buffer.length} bytes)`);
  }
  return buffer;
}

/**
 * Check if OpenAI DALL-E is available
 */
export function isDallEAvailable(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
