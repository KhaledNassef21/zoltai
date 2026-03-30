// scripts/post-instagram.ts
import { generateArticle } from "../src/lib/claude";

// ✅ دالة Mock Image مدمجة (بدون ملف خارجي)
async function generateMockImage(topic: string, slideNumber?: number): Promise<string> {
  const encodedTopic = encodeURIComponent(topic.substring(0, 30));
  const slide = slideNumber ? `+${slideNumber}` : '';
  
  // ألوان متناسقة مع ثيم Zoltai (purple/cyan)
  const colors = ['7c3aed', '06b6d4', '8b5cf6', '14b8a6', '6366f1'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  const imageUrl = `https://via.placeholder.com/1080x1080/${color}/ffffff?text=${encodedTopic}${slide}`;
  
  console.log('🧪 [Mock] Image URL generated:', imageUrl);
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
