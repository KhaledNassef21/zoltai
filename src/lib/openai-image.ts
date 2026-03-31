// src/lib/openai-image.ts
/**
 * Image generation wrapper - now uses context-aware provider
 * Kept for backward compatibility
 */

import { generateImageFromPrompt, generateImage } from "./image-provider";

/**
 * Generate cover image using the provider adapter
 */
export async function generateCoverImage(
  title: string,
  description: string
): Promise<string> {
  return generateImage(title, description);
}

/**
 * Generate Instagram carousel slides using context-aware prompts
 */
export async function generateInstagramSlides(
  title: string,
  keyPoints: string[]
): Promise<string[]> {
  const urls: string[] = [];

  // Slide 1: Title slide
  try {
    const titleUrl = await generateImageFromPrompt(
      `Bold modern graphic design, title card: "${title.slice(0, 50)}". Dark background (#0a0a0a), purple (#7c3aed) and cyan accents, high contrast, clean typography, Instagram-optimized, square 1:1`
    );
    urls.push(titleUrl || "");
  } catch (err) {
    console.warn("⚠️ Title slide generation failed:", (err as Error).message);
    urls.push("");
  }

  // Content slides
  for (const point of keyPoints.slice(0, 3)) {
    try {
      const slideUrl = await generateImageFromPrompt(
        `Clean Instagram slide about: ${point}. Dark background, purple/cyan accents, AI/tech themed, modern SaaS interface mockup, square 1:1, professional`
      );
      urls.push(slideUrl || "");
    } catch (err) {
      console.warn("⚠️ Slide generation failed:", (err as Error).message);
      urls.push("");
    }
  }

  return urls;
}
