// src/lib/pollinations-image.ts
/**
 * Pollinations.ai Image Generation
 * 100% Free - No API Key Required!
 * https://pollinations.ai
 */

export async function generateImageWithPollinations(
  prompt: string
): Promise<string> {
  // Pollinations بيرجع الصورة مباشرة كـ URL
  const encodedPrompt = encodeURIComponent(prompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 10000)}`;
  
  console.log('✅ [Pollinations] Image URL generated:', imageUrl);
  return imageUrl;
}
