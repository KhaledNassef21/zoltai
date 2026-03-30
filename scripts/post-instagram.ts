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

// Free AI/tech themed images - direct JPEG URLs that Instagram accepts
const AI_IMAGES = [
  "https://picsum.photos/seed/zoltai1/1080/1080.jpg",
  "https://picsum.photos/seed/zoltai2/1080/1080.jpg",
  "https://picsum.photos/seed/zoltai3/1080/1080.jpg",
  "https://picsum.photos/seed/zoltai4/1080/1080.jpg",
  "https://picsum.photos/seed/zoltai5/1080/1080.jpg",
  "https://picsum.photos/seed/zoltai6/1080/1080.jpg",
  "https://picsum.photos/seed/aitools1/1080/1080.jpg",
  "https://picsum.photos/seed/aitools2/1080/1080.jpg",
];

async function resolveRedirect(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  return res.url;
}

async function getRandomImages(count: number): Promise<string[]> {
  const shuffled = [...AI_IMAGES].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);
  // Resolve redirects - Instagram needs direct image URLs
  const resolved: string[] = [];
  for (const url of selected) {
    try {
      const direct = await resolveRedirect(url);
      resolved.push(direct);
      console.log(`   🔗 Resolved: ${direct.slice(0, 80)}...`);
    } catch {
      console.warn(`   ⚠️ Failed to resolve: ${url}`);
    }
  }
  return resolved;
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

  // Get random images (4 slides) - resolve redirects for Instagram
  const imageUrls = await getRandomImages(4);
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
      console.warn(
        `   ⚠️ Container ${i + 1} failed, skipping: ${containerData.error?.message || "Unknown error"}`
      );
      continue;
    }

    containerIds.push(containerData.id);
    console.log(`   ✅ Container ID: ${containerData.id}`);
  }

  console.log(`\n📦 Containers created: ${containerIds.length}`);

  if (containerIds.length < 2) {
    throw new Error("Need at least 2 images for a carousel. Only got " + containerIds.length);
  }

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
