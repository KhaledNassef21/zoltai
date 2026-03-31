import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateArticle, researchTrendingTopics } from "../src/lib/claude";
import { generateImage } from "../src/lib/image-provider";

async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
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
      // Check for high overlap
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
  const slug = article.title
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
    console.log(`⚠️ Article with slug "${slug}" already exists. Adding date suffix.`);
    const date = new Date().toISOString().split("T")[0];
    const newSlug = `${slug}-${date}`;
    const newFile = path.join(contentDir, `${newSlug}.mdx`);

    if (fs.existsSync(newFile)) {
      console.log("⚠️ Today's article already generated. Skipping.");
      process.exit(0);
    }
  }

  const date = new Date().toISOString().split("T")[0];

  // Generate cover image
  let imagePath = "";
  try {
    console.log("🎨 Generating cover image...");
    const imageUrl = await generateImage(article.title, article.description);
    if (imageUrl && !imageUrl.startsWith("data:")) {
      const imagesDir = path.join(process.cwd(), "public/images/blog");
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      imagePath = `/images/blog/${slug}.png`;
      await downloadImage(
        imageUrl,
        path.join(process.cwd(), "public", imagePath)
      );
      console.log("🖼️ Cover image saved");
    } else if (imageUrl) {
      const imagesDir = path.join(process.cwd(), "public/images/blog");
      if (!fs.existsSync(imagesDir)) {
        fs.mkdirSync(imagesDir, { recursive: true });
      }
      imagePath = `/images/blog/${slug}.png`;
      const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(
        path.join(process.cwd(), "public", imagePath),
        Buffer.from(base64Data, "base64")
      );
      console.log("🖼️ Cover image saved (base64)");
    }
  } catch (err) {
    console.warn(
      "⚠️ Cover image generation failed, continuing without image:",
      (err as Error).message
    );
  }

  // Create MDX file
  const mdxContent = `---
title: "${article.title}"
description: "${article.description}"
date: "${date}"
author: "Zoltai AI"
tags: ${JSON.stringify(article.tags)}
image: "${imagePath}"
---

${article.content}
`;

  fs.writeFileSync(path.join(contentDir, `${slug}.mdx`), mdxContent);
  console.log(`✅ Article saved: ${slug}.mdx`);

  console.log(`::set-output name=slug::${slug}`);
  console.log(`::set-output name=title::${article.title}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
