import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateArticle, researchTrendingTopics } from "../src/lib/claude";
import {
  buildArticleContext,
  generateImagePrompts,
} from "../src/lib/image-prompts";
import {
  generateCoverImage,
  generateInstagramSlide,
  downloadImageToBuffer,
  isDallEAvailable,
} from "../src/lib/openai-image";

/**
 * Download image from URL and save to disk.
 * For DALL-E: direct CDN URL (fast).
 * For Pollinations: URL triggers generation (slow, up to 90s).
 */
async function downloadImage(url: string, filepath: string): Promise<boolean> {
  try {
    console.log(`   📥 Downloading: ${url.slice(0, 80)}...`);
    const buffer = await downloadImageToBuffer(url);
    fs.writeFileSync(filepath, buffer);
    console.log(`   ✅ Saved: ${filepath} (${(buffer.length / 1024).toFixed(0)}KB)`);
    return true;
  } catch (err) {
    console.warn(`   ⚠️ Download error: ${(err as Error).message}`);
    return false;
  }
}

function getExistingArticles(): { titles: string[]; slugs: string[] } {
  const contentDir = path.join(process.cwd(), "src/content/blog");
  if (!fs.existsSync(contentDir)) return { titles: [], slugs: [] };

  const titles: string[] = [];
  const slugs: string[] = [];

  fs.readdirSync(contentDir)
    .filter((f) => f.endsWith(".mdx"))
    .forEach((f) => {
      const content = fs.readFileSync(path.join(contentDir, f), "utf-8");
      const { data } = matter(content);
      titles.push((data.title || f).toLowerCase());
      slugs.push(f.replace(".mdx", ""));
    });

  return { titles, slugs };
}

/**
 * Check if a topic is too similar to existing articles.
 * Uses word overlap AND slug similarity.
 */
function isDuplicateTopic(topic: string, existing: { titles: string[]; slugs: string[] }): boolean {
  const topicLower = topic.toLowerCase();
  const topicWords = topicLower.split(/\s+/).filter((w) => w.length > 3);

  // Check title word overlap (>50% = duplicate)
  for (const title of existing.titles) {
    const matchCount = topicWords.filter((w) => title.includes(w)).length;
    if (topicWords.length > 0 && matchCount / topicWords.length > 0.5) {
      return true;
    }
  }

  // Check slug similarity
  const topicSlug = topicLower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  for (const slug of existing.slugs) {
    // If the slug is contained in or contains the topic slug
    if (slug.includes(topicSlug.slice(0, 30)) || topicSlug.includes(slug.slice(0, 30))) {
      return true;
    }
  }

  return false;
}

async function main() {
  console.log(`🎨 Image provider: ${isDallEAvailable() ? "OpenAI DALL-E 3" : "Pollinations.ai (free)"}`);

  // Get existing articles to avoid duplicates
  const existing = getExistingArticles();
  console.log(`📚 Existing articles: ${existing.titles.length}`);

  console.log("🔍 Researching trending AI topics...");
  const topics = await researchTrendingTopics(existing.titles);

  // Pick a topic that's not too similar to existing articles
  let selectedTopic = "";
  for (const topic of topics) {
    if (!isDuplicateTopic(topic, existing)) {
      selectedTopic = topic;
      break;
    }
    console.log(`   ⏭️ Skipping similar topic: ${topic}`);
  }

  if (!selectedTopic) {
    // If all topics are duplicates, use the first one but append date
    console.log("⚠️ All topics seem similar to existing. Using first topic with date suffix.");
    selectedTopic = topics[0];
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

  // Double-check slug doesn't exist
  if (existing.slugs.includes(slug)) {
    const date = new Date().toISOString().split("T")[0];
    const rand = Math.floor(Math.random() * 1000);
    slug = `${slug}-${date}-${rand}`;
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
  console.log("🖼️ Cover image...");

  const coverResult = await generateCoverImage(coverPrompt);
  const coverFile = path.join(coverDir, `${slug}.jpg`);

  if (await downloadImage(coverResult.url, coverFile)) {
    imagePath = `/images/blog/${slug}.jpg`;
    console.log(`   Provider: ${coverResult.provider}`);
  }

  // --- Instagram slides (1:1, 4 slides with UNIQUE prompts) ---
  const slidePaths: string[] = [];

  console.log("📸 Instagram slides...");
  for (let i = 0; i < 4; i++) {
    const prompt = imagePrompts.instagramSlides[i] || `Modern AI workspace with laptop showing productivity dashboard, tech aesthetic, slide ${i + 1}`;

    console.log(`   Slide ${i + 1}: "${prompt.slice(0, 60)}..."`);
    const slideResult = await generateInstagramSlide(prompt);
    const slideFile = path.join(instaDir, `slide-${i + 1}.jpg`);

    if (await downloadImage(slideResult.url, slideFile)) {
      slidePaths.push(`/images/instagram/${slug}/slide-${i + 1}.jpg`);
      console.log(`   Provider: ${slideResult.provider}`);
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
  console.log(`   🎨 Provider: ${isDallEAvailable() ? "DALL-E 3" : "Pollinations"}`);

  console.log(`::set-output name=slug::${slug}`);
  console.log(`::set-output name=title::${article.title}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
