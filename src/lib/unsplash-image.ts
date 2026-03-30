// src/lib/unsplash-image.ts
/**
 * Unsplash Source Image
 * Free, stable, no API key required for basic usage
 * https://unsplash.com
 */

export async function generateImageWithUnsplash(
  prompt: string
): Promise<string> {
  // Unsplash Source بيرجع صورة عشوائية بناءً على الكلمات المفتاحية
  const keywords = prompt
    .split(' ')
    .filter(word => word.length > 3)
    .slice(0, 5)
    .join(',');
  
  const imageUrl = `https://source.unsplash.com/1024x1024/?${keywords},tech,dark`;
  
  console.log('✅ [Unsplash] Image URL generated:', imageUrl);
  return imageUrl;
}
