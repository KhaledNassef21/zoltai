import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isAuthenticated } from "@/lib/admin-auth";
import {
  buildArticleContext,
  generateImagePrompts,
} from "@/lib/image-prompts";
import {
  generateCoverImage,
  generateInstagramSlide,
  downloadImageToBuffer,
  isDallEAvailable,
} from "@/lib/openai-image";

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

/**
 * PUT: Regenerate images for an article
 * Body: { slug: string }
 *
 * Regenerates cover image + 4 Instagram slides using
 * DALL-E 3 (if available) or Pollinations with random seeds.
 * Replaces old images in public/images/
 */
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    // Read article
    const articleFile = path.join(CONTENT_DIR, `${slug}.mdx`);
    if (!fs.existsSync(articleFile)) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const raw = fs.readFileSync(articleFile, "utf-8");
    const { data, content } = matter(raw);
    const title = data.title || slug;
    const description = data.description || "";
    const tags: string[] = data.tags || [];

    console.log(`🎨 Regenerating images for: ${title}`);
    console.log(`   Provider: ${isDallEAvailable() ? "DALL-E 3" : "Pollinations (random seeds)"}`);

    // Build context for image prompts
    const ctx = buildArticleContext(title, description, content, tags);
    const imagePrompts = generateImagePrompts(ctx);

    // Ensure directories exist
    const coverDir = path.join(process.cwd(), "public/images/blog");
    const instaDir = path.join(process.cwd(), "public/images/instagram", slug);
    if (!fs.existsSync(coverDir)) fs.mkdirSync(coverDir, { recursive: true });
    if (!fs.existsSync(instaDir)) fs.mkdirSync(instaDir, { recursive: true });

    // Clean old images from Instagram dir
    if (fs.existsSync(instaDir)) {
      const oldFiles = fs.readdirSync(instaDir);
      for (const f of oldFiles) {
        fs.unlinkSync(path.join(instaDir, f));
      }
    }

    const results: { type: string; success: boolean; provider: string }[] = [];

    // --- Cover image (16:9) ---
    const coverPrompt = data.imagePrompt || imagePrompts.featured;
    try {
      const coverResult = await generateCoverImage(coverPrompt);
      const buffer = await downloadImageToBuffer(coverResult.url);
      const coverFile = path.join(coverDir, `${slug}.jpg`);
      fs.writeFileSync(coverFile, buffer);
      results.push({ type: "cover", success: true, provider: coverResult.provider });

      // Update frontmatter
      data.image = `/images/blog/${slug}.jpg`;
    } catch (err) {
      console.error("Cover image failed:", err);
      results.push({ type: "cover", success: false, provider: "none" });
    }

    // --- Instagram slides (1:1, 4 slides) ---
    const slidePaths: string[] = [];
    for (let i = 0; i < 4; i++) {
      const prompt = imagePrompts.instagramSlides[i] || `Modern AI workspace, tech aesthetic, slide ${i + 1}`;
      try {
        const slideResult = await generateInstagramSlide(prompt);
        const buffer = await downloadImageToBuffer(slideResult.url);
        const slideFile = path.join(instaDir, `slide-${i + 1}.jpg`);
        fs.writeFileSync(slideFile, buffer);
        slidePaths.push(`/images/instagram/${slug}/slide-${i + 1}.jpg`);
        results.push({ type: `slide-${i + 1}`, success: true, provider: slideResult.provider });
      } catch (err) {
        console.error(`Slide ${i + 1} failed:`, err);
        results.push({ type: `slide-${i + 1}`, success: false, provider: "none" });
      }
    }

    // Update frontmatter with new slide paths
    data.instagramSlides = slidePaths;

    // Rewrite the MDX file with updated frontmatter
    const updatedMdx = matter.stringify(content, data);
    fs.writeFileSync(articleFile, updatedMdx);

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      slug,
      title,
      provider: isDallEAvailable() ? "DALL-E 3" : "Pollinations",
      results,
      summary: `${successCount}/${results.length} images generated`,
    });
  } catch (err) {
    console.error("Regenerate images error:", err);
    return NextResponse.json({ error: "Failed to regenerate images" }, { status: 500 });
  }
}
