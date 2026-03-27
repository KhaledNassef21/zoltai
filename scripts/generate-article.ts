import fs from "fs";
import path from "path";
import { generateArticle, researchTrendingTopics } from "../src/lib/claude";
import { generateCoverImage } from "../src/lib/openai-image";

async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
}

async function main() {
  console.log("🔍 Researching trending AI topics...");
  const topics = await researchTrendingTopics();
  const topic = topics[0];
  console.log(`📝 Selected topic: ${topic}`);

  console.log("✍️ Generating article...");
  const article = await generateArticle(topic);
  console.log(`📰 Article: ${article.title}`);

  // Generate slug from title
  const slug = article.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const date = new Date().toISOString().split("T")[0];

  console.log("🎨 Generating cover image...");
  const imageUrl = await generateCoverImage(article.title, article.description);

  // Download image
  const imagesDir = path.join(process.cwd(), "public/images/blog");
  if (!fs.existsSync(imagesDir)) {
    fs.mkdirSync(imagesDir, { recursive: true });
  }
  const imagePath = `/images/blog/${slug}.png`;
  await downloadImage(imageUrl, path.join(process.cwd(), "public", imagePath));
  console.log("🖼️ Cover image saved");

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

  const contentDir = path.join(process.cwd(), "src/content/blog");
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }

  fs.writeFileSync(path.join(contentDir, `${slug}.mdx`), mdxContent);
  console.log(`✅ Article saved: ${slug}.mdx`);

  // Output for GitHub Actions
  console.log(`::set-output name=slug::${slug}`);
  console.log(`::set-output name=title::${article.title}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
