// src/lib/image-provider.ts
/**
 * Image Provider — DALL-E 3 Primary, Pollinations Fallback
 *
 * Priority:
 * 1. OpenAI DALL-E 3 (if OPENAI_API_KEY is set) — high quality
 * 2. Pollinations.ai (free, no key needed) — fallback
 * 3. Mock (placeholder) — last resort
 */

import { generateCoverImage, generateInstagramSlide, isDallEAvailable } from "./openai-image";
import { generateMockImage } from "./mock-image";

export type ImageProvider = "openai" | "pollinations" | "mock";

function getProvider(): ImageProvider {
  const env = process.env.IMAGE_PROVIDER?.toLowerCase();
  if (env === "mock") return "mock";
  if (isDallEAvailable()) return "openai";
  return "pollinations";
}

/**
 * Generate a single image from an explicit prompt.
 * Tries DALL-E 3 → Pollinations → Mock
 */
export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const provider = getProvider();

  if (provider === "openai" || provider === "pollinations") {
    try {
      console.log(`🎨 [${isDallEAvailable() ? "DALL-E 3" : "Pollinations"}] Generating image...`);
      const result = await generateInstagramSlide(prompt);
      if (result.url) {
        console.log(`✅ Image generated (${result.provider})`);
        return result.url;
      }
    } catch (err) {
      console.warn(`⚠️ Image generation failed:`, (err as Error).message);
    }
  }

  // Fallback to mock
  console.log(`🎨 [Mock] Falling back to placeholder image`);
  return generateMockImage(prompt.slice(0, 40));
}

/**
 * Generate image using title + description (legacy interface)
 */
export async function generateImage(
  title: string,
  description: string
): Promise<string> {
  const prompt = `Modern tech workspace, laptop screen showing AI tools dashboard related to: ${title}. ${description}. Clean SaaS interface, dark theme, purple accents, photorealistic, 16:9, professional, no text`;
  return generateImageFromPrompt(prompt);
}

/**
 * Generate Instagram-optimized image from prompt (1:1 square)
 */
export async function generateInstagramImage(prompt: string): Promise<string> {
  const provider = getProvider();

  if (provider === "openai" || provider === "pollinations") {
    try {
      const result = await generateInstagramSlide(prompt);
      if (result.url) return result.url;
    } catch (err) {
      console.warn(`⚠️ Instagram image failed:`, (err as Error).message);
    }
  }

  return generateMockImage(prompt.slice(0, 30));
}
