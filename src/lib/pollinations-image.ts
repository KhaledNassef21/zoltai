// src/lib/pollinations-image.ts
/**
 * Pollinations.ai Image Generation
 * 100% Free - No API Key Required!
 * https://pollinations.ai
 *
 * IMPORTANT: Short prompts (under 100 chars) produce MUCH better results.
 * Long prompts get truncated/ignored and produce generic images.
 */

export interface PollinationsOptions {
  width?: number;
  height?: number;
  nologo?: boolean;
  seed?: number;
}

/**
 * Generate image with Pollinations AI from a prompt
 * Uses explicit seed to guarantee different images per call
 */
export async function generateImageWithPollinations(
  prompt: string,
  options: PollinationsOptions = {}
): Promise<string> {
  const {
    width = 1792,
    height = 1024,
    nologo = true,
    seed = Math.floor(Math.random() * 100000),
  } = options;

  // Pollinations works best with SHORT prompts — truncate to ~150 chars
  const shortPrompt = prompt.slice(0, 150);
  const encodedPrompt = encodeURIComponent(shortPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=${nologo}&seed=${seed}`;

  console.log(`✅ [Pollinations] seed=${seed}, prompt="${shortPrompt.slice(0, 60)}..."`);
  return imageUrl;
}

/**
 * Generate a square Instagram image (1080x1080) with explicit seed
 */
export async function generateInstagramImageWithPollinations(
  prompt: string,
  seed?: number
): Promise<string> {
  return generateImageWithPollinations(prompt, {
    width: 1080,
    height: 1080,
    seed: seed ?? Math.floor(Math.random() * 100000),
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
