import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateInstagramSlides } from "../src/lib/openai-image";
import { publishCarousel } from "../src/lib/instagram";

async function main() {
  const contentDir = path.join(process.cwd(), "src/content/blog");
  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".mdx"))
    .sort()
    .reverse();

  if (files.length === 0) {
    console.log("⚠️ No articles found");
    process.exit(0);
  }

  // Get the latest article
  const latestFile = files[0];
  const fileContent = fs.readFileSync(
    path.join(contentDir, latestFile),
    "utf-8"
  );
  const { data, content } = matter(fileContent);

  console.log(`📸 Creating Instagram carousel for: ${data.title}`);

  // Extract key points from the article
  const keyPoints = content
    .split("\n")
    .filter((line: string) => line.startsWith("## "))
    .map((line: string) => line.replace("## ", ""))
    .slice(0, 4);

  console.log(`📋 Key points: ${keyPoints.length}`);

  // Generate slide images
  console.log("🎨 Generating slide images...");
  const imageUrls = await generateInstagramSlides(data.title, keyPoints);

  // Build caption
  const tags = (data.tags || [])
    .map((t: string) => `#${t.replace(/\s+/g, "")}`)
    .join(" ");

  const caption = `🤖 ${data.title}

${data.description}

💡 Swipe to learn more!

${tags} #AI #ArtificialIntelligence #AITools #Productivity #Zoltai`;

  // Publish carousel
  console.log("📤 Publishing to Instagram...");
  const postId = await publishCarousel(imageUrls, caption);
  console.log(`✅ Published! Post ID: ${postId}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
