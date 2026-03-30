import fs from "fs";
import path from "path";
import matter from "gray-matter";

/**
 * Instagram Carousel Post Script
 *
 * Reads the latest blog article and posts a carousel to Instagram
 * using free Unsplash images (no OpenAI needed).
 *
 * Funnel: Instagram → Article on Website → Affiliate CTAs
 */

// Free AI/tech themed images from Unsplash (no API key needed)
const AI_IMAGES = [
  "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1080&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1677756119517-756a188d2d94?w=1080&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=1080&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1677442135137-4cd0e49a0e92?w=1080&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1684163762442-59931e5aa3a3?w=1080&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1696446702183-cbd13d78e1e7?w=1080&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1675271591211-126ad94e495d?w=1080&h=1080&fit=crop",
  "https://images.unsplash.com/photo-1686191128892-3b37add4c844?w=1080&h=1080&fit=crop",
];

function getRandomImages(count: number): string[] {
  const shuffled = [...AI_IMAGES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function main() {
  console.log("📸 Creating Instagram carousel...");

  const instagramUserId = process.env.INSTAGRAM_USER_ID;
  const instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  console.log(
    "🔑 Instagram User ID:",
    instagramUserId ? "✅ Exists" : "❌ Missing"
  );
  console.log(
    "🔑 Instagram Access Token:",
    instagramAccessToken ? "✅ Exists" : "❌ Missing"
  );

  if (!instagramUserId || !instagramAccessToken) {
    throw new Error("Instagram credentials not configured");
  }

  // Read latest article for the caption
  const contentDir = path.join(process.cwd(), "src/content/blog");
  let articleTitle = "AI Tools & Productivity Tips";
  let articleDescription = "Discover the best AI tools to boost your workflow.";
  let articleSlug = "";
  let articleTags: string[] = [];

  if (fs.existsSync(contentDir)) {
    const files = fs
      .readdirSync(contentDir)
      .filter((f) => f.endsWith(".mdx"))
      .sort()
      .reverse();

    if (files.length > 0) {
      const latestFile = files[0];
      const fileContent = fs.readFileSync(
        path.join(contentDir, latestFile),
        "utf-8"
      );
      const { data } = matter(fileContent);
      articleTitle = data.title || articleTitle;
      articleDescription = data.description || articleDescription;
      articleSlug = latestFile.replace(".mdx", "");
      articleTags = data.tags || [];
      console.log(`📰 Latest article: ${articleTitle}`);
    }
  }

  // Build caption with website funnel
  const tags = articleTags
    .map((t: string) => `#${t.replace(/\s+/g, "")}`)
    .join(" ");

  const articleUrl = articleSlug
    ? `https://zoltai.vercel.app/blog/${articleSlug}`
    : "https://zoltai.vercel.app";

  const caption = `🤖 ${articleTitle}

${articleDescription}

💡 Swipe to learn more!

📖 Read the full guide with tool links & free trials:
👉 ${articleUrl}

🔗 Explore all AI tools: zoltai.vercel.app/tools

${tags} #AI #ArtificialIntelligence #AITools #Productivity #Zoltai #AIToolsReview #TechTips`;

  // Get random images (4 slides)
  const imageUrls = getRandomImages(4);
  console.log(`📋 Total images: ${imageUrls.length}`);

  // Create media containers
  const containerIds: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    console.log(`📤 Creating container ${i + 1}/${imageUrls.length}...`);

    const containerUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/media`;
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      is_carousel_item: "true",
      access_token: instagramAccessToken,
    });

    const containerResponse = await fetch(`${containerUrl}?${containerParams}`, {
      method: "POST",
    });

    const containerData = await containerResponse.json();

    if (!containerResponse.ok || containerData.error) {
      throw new Error(
        `Failed to create media container ${i + 1}: ${JSON.stringify(containerData.error || containerData)}`
      );
    }

    containerIds.push(containerData.id);
    console.log(`   ✅ Container ID: ${containerData.id}`);
  }

  console.log(`\n📦 All containers created: ${containerIds.length}`);

  // Create carousel
  console.log(`\n🔄 Creating carousel...`);
  const carouselUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/media`;
  const carouselParams = new URLSearchParams({
    media_type: "CAROUSEL",
    children: containerIds.join(","),
    caption,
    access_token: instagramAccessToken,
  });

  const carouselResponse = await fetch(`${carouselUrl}?${carouselParams}`, {
    method: "POST",
  });

  const carouselData = await carouselResponse.json();

  if (!carouselResponse.ok || carouselData.error) {
    throw new Error(
      `Failed to create carousel: ${JSON.stringify(carouselData.error || carouselData)}`
    );
  }

  const creationId = carouselData.id;
  console.log(`   ✅ Creation ID: ${creationId}`);

  // Publish
  console.log(`\n📢 Publishing post...`);
  const publishUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/media_publish`;
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: instagramAccessToken,
  });

  const publishResponse = await fetch(`${publishUrl}?${publishParams}`, {
    method: "POST",
  });

  const publishData = await publishResponse.json();

  if (!publishResponse.ok || publishData.error) {
    throw new Error(
      `Failed to publish: ${JSON.stringify(publishData.error || publishData)}`
    );
  }

  console.log("\n✅ Instagram post published successfully!");
  console.log("🔗 Post ID:", publishData.id);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
