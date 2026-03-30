// scripts/post-instagram.ts
import { generateMockImage } from '../src/lib/mock-image';

async function main() {
  console.log('📸 Creating Instagram carousel for:', topic);
  
  const imageUrls: string[] = [];
  
  // ✅ توليد صور Mock سريعة ومستقرة
  for (let i = 0; i < keyPoints.length; i++) {
    const imageUrl = await generateMockImage(keyPoints[i], i + 1);
    imageUrls.push(imageUrl);
    console.log(`✅ Generated slide ${i + 1}/${keyPoints.length}`);
  }
  
  // ... باقي الكود
}
