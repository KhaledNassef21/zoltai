// src/lib/pollinations-image.ts
/**
 * Pollinations.ai Image Generation
 * 100% Free - No API Key Required!
 * https://pollinations.ai
 *
 * Now supports context-aware prompts for relevant images.
 */

export interface PollinationsOptions {
  width?: number;
  height?: number;
  nologo?: boolean;
  seed?: number;
}

/**
 * Generate image with Pollinations AI from a detailed prompt
 */
export async function generateImageWithPollinations(
  prompt: string,
  options: PollinationsOptions = {}
): Promise<string> {
  const {
    width = 1792,
    height = 1024,
    nologo = true,
    seed = Math.floor(Math.random() * 10000),
  } = options;

  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=${nologo}&seed=${seed}`;

  console.log("✅ [Pollinations] Image URL generated");
  return imageUrl;
}

/**
 * Generate a square Instagram image (1080x1080)
 */
export async function generateInstagramImageWithPollinations(
  prompt: string
): Promise<string> {
  return generateImageWithPollinations(prompt, {
    width: 1080,
    height: 1080,
  });
}

/**
 * Generate a blog cover image (16:9 - 1792x1024)
 */
export async function generateCoverImageWithPollinations(
  prompt: string
): Promise<string> {
  return generateImageWithPollinations(prompt, {
    width: 1792,
    height: 1024,
  });
}
