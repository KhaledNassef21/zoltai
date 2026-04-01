import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateArticle, researchTrendingTopics } from "../src/lib/claude";
import {
  buildArticleContext,
  generateImagePrompts,
} from "../src/lib/image-prompts";

/**
 * Download image from URL and save to disk.
 * For Pollinations: the URL triggers generation, so we wait up to 90s.
 */
async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    console.log(`   📥 Downloading: ${url.slice(0, 80)}...`);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(90000), // 90s for AI generation
    });
    if (!response.ok) {
      console.warn(`   ⚠️ Download failed: ${response.status}`);
      return false;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 5000) {
      console.warn(`   ⚠️ Image too small (${buffer.length} bytes), skipping`);
      return false;
    }
    fs.writeFileSync(filepath, buffer);
    console.log(`   ✅ Saved: ${filepath} (${(buffer.length / 1024).toFixed(0)}KB)`);
    return true;
  } catch (err) {
    console.warn(`   ⚠️ Download error: ${(err as Error).message}`);
    return false;
  }
}

function getExistingArticles(): string[] {
  const contentDir = path.join(process.cwd(), "src/content/blog");
  if (!fs.existsSync(contentDir)) return [];

  return fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const content = fs.readFileSync(path.join(contentDir, f), "utf-8");
      const { data } = matter(content);
      return (data.title || f).toLowerCase();
    });
}

async function main() {
  // Get existing articles to avoid duplicates
  const existing = getExistingArticles();
  console.log(`📚 Existing articles: ${existing.length}`);

  console.log("🔍 Researching trending AI topics...");
  const topics = await researchTrendingTopics(existing);

  // Pick a topic that's not too similar to existing articles
  let selectedTopic = topics[0];
  for (const topic of topics) {
    const topicLower = topic.toLowerCase();
    const isDuplicate = existing.some((title) => {
      const topicWords = topicLower.split(/\s+/).filter((w) => w.length > 3);
      const matchCount = topicWords.filter((w) => title.includes(w)).length;
      return matchCount / topicWords.length > 0.6;
    });

    if (!isDuplicate) {
      selectedTopic = topic;
      break;
    }
    console.log(`   ⏭️ Skipping similar topic: ${topic}`);
  }

  console.log(`📝 Selected topic: ${selectedTopic}`);

  console.log("✍️ Generating article...");
  const article = await generateArticle(selectedTopic);
  console.log(`📰 Article: ${article.title}`);

  // Generate slug from title
  let slug = article.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  // Check if slug already exists
  const contentDir = path.join(process.cwd(), "src/content/blog");
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }

  const existingFile = path.join(contentDir, `${slug}.mdx`);
  if (fs.existsSync(existingFile)) {
    const date = new Date().toISOString().split("T")[0];
    slug = `${slug}-${date}`;
    const newFile = path.join(contentDir, `${slug}.mdx`);

    if (fs.existsSync(newFile)) {
      console.log("⚠️ Today's article already generated. Skipping.");
      process.exit(0);
    }
  }

  const date = new Date().toISOString().split("T")[0];

  // ========================================
  // GENERATE & SAVE IMAGES (cover + 4 Instagram slides)
  // ========================================
  console.log("\n🎨 Generating images...");

  // Build context for image prompts
  const ctx = buildArticleContext(
    article.title,
    article.description,
    article.content,
    article.tags
  );
  const imagePrompts = generateImagePrompts(ctx);

  // Ensure directories exist
  const coverDir = path.join(process.cwd(), "public/images/blog");
  const instaDir = path.join(process.cwd(), "public/images/instagram", slug);
  if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });
  if (!fs.existsSync(instaDir)) fs.mkdirSync(instaDir, { recursive: true });

  // --- Cover image (16:9) ---
  let imagePath = "";
  const coverPrompt = article.imagePrompt || imagePrompts.featured;
  const coverSeed = 42000 + Math.floor(Math.random() * 1000);
  const coverUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(coverPrompt.slice(0, 150))}?width=1792&height=1024&nologo=true&seed=${coverSeed}`;
  const coverFile = path.join(coverDir, `${slug}.jpg`);

  console.log("🖼️ Cover image...");
  if (await downloadImage(coverUrl, coverFile)) {
    imagePath = `/images/blog/${slug}.jpg`;
  }

  // --- Instagram slides (1080x1080, 4 slides with DIFFERENT seeds) ---
  const slidePaths: string[] = [];
  const slideSeeds = [10000, 30000, 55000, 80000]; // Widely separated

  console.log("📸 Instagram slides...");
  for (let i = 0; i < 4; i++) {
    const prompt = imagePrompts.instagramSlides[i] || `AI tools on laptop, modern workspace, tech aesthetic`;
    const seed = slideSeeds[i];
    const slideUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.slice(0, 120))}?width=1080&height=1080&nologo=true&seed=${seed}`;
    const slideFile = path.join(instaDir, `slide-${i + 1}.jpg`);

    console.log(`   Slide ${i + 1} (seed=${seed}): "${prompt.slice(0, 60)}..."`);
    if (await downloadImage(slideUrl, slideFile)) {
      slidePaths.push(`/images/instagram/${slug}/slide-${i + 1}.jpg`);
    }
  }

  console.log(`✅ Saved ${slidePaths.length}/4 Instagram slides`);

  // Create MDX file with image paths + Instagram data in frontmatter
  const mdxContent = `---
title: "${article.title.replace(/"/g, '\\"')}"
description: "${article.description.replace(/"/g, '\\"')}"
date: "${date}"
author: "Zoltai AI"
tags: ${JSON.stringify(article.tags)}
image: "${imagePath}"
instagramSlides: ${JSON.stringify(slidePaths)}
instagramCaption: "${(article.instagramCaption || "").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"
instagramHook: "${(article.instagramHook || "").replace(/"/g, '\\"')}"
---

${article.content}
`;

  fs.writeFileSync(path.join(contentDir, `${slug}.mdx`), mdxContent);
  console.log(`\n✅ Article saved: ${slug}.mdx`);
  console.log(`   📷 Cover: ${imagePath || "none"}`);
  console.log(`   📸 Instagram: ${slidePaths.length} slides saved`);

  console.log(`::set-output name=slug::${slug}`);
  console.log(`::set-output name=title::${article.title}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
