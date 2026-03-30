// scripts/post-instagram.ts
import { generateArticle } from "../src/lib/claude";

// ✅ دالة Mock Image مدمجة (بدون ملف خارجي)
// ✅ دالة Mock Image - صور من مصدر يقبله Instagram
async function generateMockImage(topic: string, slideNumber?: number): Promise<string> {
  const slide = slideNumber ? `-${slideNumber}` : '';
  
  // ✅ استخدام صور حقيقية من GitHub CDN (مقبول من Instagram)
  // أو استخدم أي صور مجانية من Unsplash
  const imageUrls = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1080&h=1080&fit=crop',
    'https://images.unsplash.com/photo-1677442135137-4cd0e49a0e92?w=1080&h=1080&fit=crop',
  ];
  
  // اختار صورة بناءً على رقم السلايد
  const index = (slideNumber || 1) - 1;
  const imageUrl = imageUrls[index % imageUrls.length];
  
  console.log('🖼️ [Unsplash] Image URL generated:', imageUrl);
  return imageUrl;
}

async function main() {
  console.log("📸 Creating Instagram carousel...");

  // ✅ استخدام موضوع من آخر مقال أو موضوع تجريبي
  const topic = "AI Tools 2026";
  const keyPoints = [
    "Best AI Tools",
    "Productivity Hacks",
    "Automation Tips",
    "Future of AI"
  ];

  console.log(`📋 Key points: ${keyPoints.length}`);
  console.log("🎨 Generating slide images...");

  // ✅ توليد صور Mock
  const imageUrls: string[] = [];
  
  for (let i = 0; i < keyPoints.length; i++) {
    const imageUrl = await generateMockImage(keyPoints[i], i + 1);
    imageUrls.push(imageUrl);
    console.log(`✅ Generated slide ${i + 1}/${keyPoints.length}`);
  }

  // ✅ رفع الصور لـ Instagram
  const instagramUserId = process.env.INSTAGRAM_USER_ID;
  const instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!instagramUserId || !instagramAccessToken) {
    throw new Error("Instagram credentials not configured");
  }

  // إنشاء Media Container
  const containerIds: string[] = [];
  
  for (const imageUrl of imageUrls) {
    const containerResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramUserId}/media?image_url=${encodeURIComponent(imageUrl)}&media_type=IMAGE&access_token=${instagramAccessToken}`,
      { method: "POST" }
    );

    if (!containerResponse.ok) {
      throw new Error(`Failed to create media container: ${containerResponse.statusText}`);
    }

    const containerData = await containerResponse.json();
    containerIds.push(containerData.id);
  }

  // إنشاء Carousel
  const carouselResponse = await fetch(
    `https://graph.facebook.com/v18.0/${instagramUserId}/media?media_type=carousel&children=${containerIds.join(",")}&access_token=${instagramAccessToken}`,
    { method: "POST" }
  );

  if (!carouselResponse.ok) {
    throw new Error(`Failed to create carousel: ${carouselResponse.statusText}`);
  }

  const carouselData = await carouselResponse.json();
  const creationId = carouselData.id;

  // نشر البوست
  const publishResponse = await fetch(
    `https://graph.facebook.com/v18.0/${instagramUserId}/media_publish?creation_id=${creationId}&access_token=${instagramAccessToken}`,
    { method: "POST" }
  );

  if (!publishResponse.ok) {
    throw new Error(`Failed to publish: ${publishResponse.statusText}`);
  }

  const publishData = await publishResponse.json();
  console.log("✅ Instagram post published successfully!");
  console.log(" Post ID:", publishData.id);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
