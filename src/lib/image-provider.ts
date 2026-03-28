/**
 * Image Provider Adapter
 *
 * Switchable image generation with fallback chain.
 * Supports: puter (free) | openai (paid)
 *
 * Priority: Uses IMAGE_PROVIDER env var, defaults to "puter".
 * Falls back to next provider if primary fails.
 */

import { generateCoverImage as openaiCoverImage } from "./openai-image";
import { generateImageWithPuter } from "./puter-image";

export type ImageProvider = "puter" | "openai";

function getProvider(): ImageProvider {
  const env = process.env.IMAGE_PROVIDER?.toLowerCase();
  if (env === "openai") return "openai";
  return "puter"; // Default to free option
}

async function generateWithPuter(
  title: string,
  description: string
): Promise<string> {
  const prompt = `Create a modern, clean blog cover image for an article titled "${title}". Description: ${description}. Style: Minimalist, tech-focused, dark theme with purple and cyan accent colors. No text in the image. Professional, suitable for a tech blog about AI.`;
  return generateImageWithPuter(prompt);
}

async function generateWithOpenAI(
  title: string,
  description: string
): Promise<string> {
  return openaiCoverImage(title, description);
}

const providers: Record<
  ImageProvider,
  (title: string, desc: string) => Promise<string>
> = {
  puter: generateWithPuter,
  openai: generateWithOpenAI,
};

const fallbackOrder: Record<ImageProvider, ImageProvider[]> = {
  puter: ["puter", "openai"],
  openai: ["openai", "puter"],
};

/**
 * Generate a cover image using the configured provider with automatic fallback.
 */
export async function generateImage(
  title: string,
  description: string
): Promise<string> {
  const primary = getProvider();
  const chain = fallbackOrder[primary];

  for (const provider of chain) {
    try {
      console.log(`🎨 Trying image provider: ${provider}`);
      const url = await providers[provider](title, description);
      if (url) {
        console.log(`✅ Image generated with: ${provider}`);
        return url;
      }
    } catch (err) {
      console.warn(
        `⚠️ ${provider} failed:`,
        (err as Error).message
      );
    }
  }

  console.warn("⚠️ All image providers failed. Continuing without image.");
  return "";
}
