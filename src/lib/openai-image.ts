// src/lib/openai-image.ts
import { generateImage } from "./image-provider";

/**
 * Generate cover image using the provider adapter (Puter/OpenAI with fallback)
 */
export async function generateCoverImage(
  title: string,
  description: string
): Promise<string> {
  return generateImage(title, description);
}

/**
 * Generate Instagram carousel slides using the provider adapter
 */
export async function generateInstagramSlides(
  title: string,
  keyPoints: string[]
): Promise<string[]> {
  const urls: string[] = [];

  // Slide 1: Title slide
  try {
    const titleUrl = await generateImage(
      `${title} - Instagram carousel title slide`,
      "Bold, eye-catching social media title slide. Dark background with purple gradient accents, modern typography feel. Clean and minimal."
    );
    urls.push(titleUrl || "");
  } catch (err) {
    console.warn("⚠️ Title slide generation failed:", (err as Error).message);
    urls.push("");
  }

  // Content slides (max 3 to save API calls)
  for (const point of keyPoints.slice(0, 3)) {
    try {
      const slideUrl = await generateImage(
        `Instagram slide: ${point}`,
        "Clean Instagram carousel content slide visual. Dark background, purple/cyan accents, tech/AI themed, abstract and modern. No text. Square format."
      );
      urls.push(slideUrl || "");
    } catch (err) {
      console.warn("⚠️ Slide generation failed:", (err as Error).message);
      urls.push("");
    }
  }

  return urls;
}
