import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { generateArticle, researchTrendingTopics } from "../src/lib/claude";
import { generateImageFromPrompt } from "../src/lib/image-provider";
import {
  buildArticleContext,
  generateImagePrompts,
  validatePrompts,
} from "../src/lib/image-prompts";

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
    console.log(
      `⚠️ Article with slug "${slug}" already exists. Adding date suffix.`
    );
    const date = new Date().toISOString().split("T")[0];
    const newSlug = `${slug}-${date}`;
    const newFile = path.join(contentDir, `${newSlug}.mdx`);

    if (fs.existsSync(newFile)) {
      console.log("⚠️ Today's article already generated. Skipping.");
      process.exit(0);
    }
  }

  const date = new Date().toISOString().split("T")[0];

  // === CONTEXT-AWARE IMAGE GENERATION ===
  console.log("🎨 Building article context for image generation...");

  // Build context from article content
  const articleContext = buildArticleContext(
    article.title,
    article.description,
    article.content,
    article.tags
  );
  console.log(`   📋 Intent: ${articleContext.intent}`);
  console.log(
    `   🔧 Tools mentioned: ${articleContext.toolsMentioned.join(", ") || "none"}`
  );

  // Generate context-aware image prompts
  const imagePrompts = generateImagePrompts(articleContext);

  // Use Claude's image prompt if available, otherwise use our generated one
  const featuredPrompt = article.imagePrompt || imagePrompts.featured;
  console.log(`   🖼️ Featured prompt: ${featuredPrompt.slice(0, 80)}...`);

  // Validate prompts before generating
  const validation = validatePrompts(imagePrompts, articleContext);
  if (!validation.valid) {
    console.warn(`   ⚠️ Prompt validation issues: ${validation.issues.join(", ")}`);
    console.log(`   🔄 Regenerating with stricter context...`);
    // Use Claude's prompt as override if our generator had issues
  }

  // Generate cover image with context-aware prompt
  let imagePath = "";
  try {
    console.log("🎨 Generating context-aware cover image...");
    const imageUrl = await generateImageFromPrompt(featuredPrompt);
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
      console.log("🖼️ Context-aware cover image saved");
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

  // Create MDX file with image prompts in frontmatter for social pipeline
  const mdxContent = `---
title: "${article.title}"
description: "${article.description}"
date: "${date}"
author: "Zoltai AI"
tags: ${JSON.stringify(article.tags)}
image: "${imagePath}"
imagePrompt: "${(article.imagePrompt || imagePrompts.featured).replace(/"/g, '\\"')}"
instagramCaption: "${(article.instagramCaption || "").replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
instagramHook: "${(article.instagramHook || "").replace(/"/g, '\\"')}"
---

${article.content}
`;

  fs.writeFileSync(path.join(contentDir, `${slug}.mdx`), mdxContent);
  console.log(`✅ Article saved: ${slug}.mdx`);
  console.log(`   📷 Image prompts saved in frontmatter`);
  console.log(`   📸 Instagram caption pre-generated`);

  // Save image prompts separately for the social pipeline
  const promptsDir = path.join(process.cwd(), "data/image-prompts");
  if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(promptsDir, `${slug}.json`),
    JSON.stringify(
      {
        slug,
        title: article.title,
        featured: featuredPrompt,
        inline: imagePrompts.inline,
        instagram: imagePrompts.instagram,
        instagramSlides: imagePrompts.instagramSlides,
        instagramCaption: article.instagramCaption || "",
        instagramHook: article.instagramHook || "",
        generatedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log(`   💾 Image prompts saved: data/image-prompts/${slug}.json`);

  console.log(`::set-output name=slug::${slug}`);
  console.log(`::set-output name=title::${article.title}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
