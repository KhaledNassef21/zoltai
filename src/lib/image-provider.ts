// src/lib/image-provider.ts
/**
 * Context-Aware Image Provider
 *
 * Uses Pollinations.ai (free, no API key) with intelligent prompts
 * generated from article content. Falls back to mock if needed.
 *
 * OLD: Random picsum.photos stock images (DEPRECATED)
 * NEW: AI-generated images matched to article content
 */

import { generateImageWithPollinations } from "./pollinations-image";
import { generateMockImage } from "./mock-image";

export type ImageProvider = "pollinations" | "mock";

function getProvider(): ImageProvider {
  const env = process.env.IMAGE_PROVIDER?.toLowerCase();
  if (env === "mock") return "mock";
  return "pollinations"; // Default to Pollinations (free AI generation)
}

/**
 * Generate a single image from an explicit prompt
 * Used by the new context-aware system
 */
export async function generateImageFromPrompt(prompt: string): Promise<string> {
  const provider = getProvider();

  if (provider === "pollinations") {
    try {
      console.log(`🎨 [Pollinations] Generating context-aware image...`);
      const url = await generateImageWithPollinations(prompt);
      if (url) {
        console.log(`✅ Context-aware image generated`);
        return url;
      }
    } catch (err) {
      console.warn(`⚠️ Pollinations failed:`, (err as Error).message);
    }
  }

  // Fallback to mock
  console.log(`🎨 [Mock] Falling back to placeholder image`);
  return generateMockImage(prompt.slice(0, 40));
}

/**
 * Generate image using title + description (legacy interface)
 * Now builds a basic prompt internally
 */
export async function generateImage(
  title: string,
  description: string
): Promise<string> {
  const prompt = `Modern tech workspace, laptop screen showing AI tools dashboard related to: ${title}. ${description}. Clean SaaS interface, dark theme, purple accents, photorealistic, 16:9, professional, no text`;
  return generateImageFromPrompt(prompt);
}

/**
 * Generate Instagram-optimized image from prompt
 * Square 1:1 format
 */
export async function generateInstagramImage(prompt: string): Promise<string> {
  const provider = getProvider();

  if (provider === "pollinations") {
    try {
      // Pollinations with square dimensions
      const encodedPrompt = encodeURIComponent(prompt);
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;
      console.log(`✅ [Pollinations] Instagram image URL generated`);
      return url;
    } catch (err) {
      console.warn(`⚠️ Pollinations failed for Instagram:`, (err as Error).message);
    }
  }

  return generateMockImage(prompt.slice(0, 30));
}
