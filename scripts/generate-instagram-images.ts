import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  buildArticleContext,
  generateImagePrompts,
} from "../src/lib/image-prompts";

/**
 * One-time script: Generate Instagram slide images for ALL existing articles
 * that don't have them yet.
 *
 * Downloads from Pollinations.ai and saves to public/images/instagram/{slug}/
 * These get deployed to Vercel CDN and used by post-instagram.ts
 *
 * Run: npx tsx scripts/generate-instagram-images.ts
 */

async function downloadImage(
  url: string,
  filepath: string
): Promise<boolean> {
  try {
    console.log(`   📥 Downloading...`);
    const response = await fetch(url, {
      signal: AbortSignal.timeout(90000),
    });
    if (!response.ok) return false;
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length < 5000) return false;
    fs.writeFileSync(filepath, buffer);
    console.log(
      `   ✅ ${(buffer.length / 1024).toFixed(0)}KB`
    );
    return true;
  } catch (err) {
    console.warn(`   ⚠️ ${(err as Error).message}`);
    return false;
  }
}

async function main() {
  const contentDir = path.join(process.cwd(), "src/content/blog");
  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".mdx"));

  console.log(`📚 Found ${files.length} articles\n`);

  for (const file of files) {
    const slug = file.replace(".mdx", "");
    const instaDir = path.join(
      process.cwd(),
      "public/images/instagram",
      slug
    );

    // Skip if already has 4 slides
    if (fs.existsSync(instaDir)) {
      const existing = fs
        .readdirSync(instaDir)
        .filter((f) => f.startsWith("slide-") && f.endsWith(".jpg"));
      if (existing.length >= 4) {
        console.log(`⏭️ ${slug} — already has ${existing.length} slides`);
        continue;
      }
    }

    console.log(`\n🎨 ${slug}`);

    // Read article
    const raw = fs.readFileSync(path.join(contentDir, file), "utf-8");
    const { data, content } = matter(raw);

    // Build context
    const ctx = buildArticleContext(
      data.title || slug,
      data.description || "",
      content,
      data.tags || []
    );
    const prompts = generateImagePrompts(ctx);

    // Create directory
    if (!fs.existsSync(instaDir)) fs.mkdirSync(instaDir, { recursive: true });

    // Generate 4 slides
    const slideSeeds = [10000, 30000, 55000, 80000];
    let saved = 0;

    for (let i = 0; i < 4; i++) {
      const slideFile = path.join(instaDir, `slide-${i + 1}.jpg`);
      if (fs.existsSync(slideFile) && fs.statSync(slideFile).size > 5000) {
        console.log(`   ✅ Slide ${i + 1} already exists`);
        saved++;
        continue;
      }

      const prompt = (prompts.instagramSlides[i] || "AI tools workspace").slice(0, 120);
      const seed = slideSeeds[i];
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true&seed=${seed}`;

      console.log(`   Slide ${i + 1} (seed=${seed}): "${prompt.slice(0, 50)}..."`);
      if (await downloadImage(url, slideFile)) {
        saved++;
      }

      // Small delay between requests
      await new Promise((r) => setTimeout(r, 2000));
    }

    console.log(`   ✅ ${saved}/4 slides saved`);

    // Update frontmatter with slide paths if not already there
    if (!data.instagramSlides || data.instagramSlides.length === 0) {
      const slidePaths = [];
      for (let i = 1; i <= 4; i++) {
        const f = path.join(instaDir, `slide-${i}.jpg`);
        if (fs.existsSync(f) && fs.statSync(f).size > 5000) {
          slidePaths.push(`/images/instagram/${slug}/slide-${i}.jpg`);
        }
      }
      if (slidePaths.length > 0) {
        data.instagramSlides = slidePaths;
        const updated = matter.stringify(content, data);
        fs.writeFileSync(path.join(contentDir, file), updated);
        console.log(`   📝 Updated frontmatter with ${slidePaths.length} slide paths`);
      }
    }
  }

  console.log("\n🎉 Done! All articles now have Instagram images.");
  console.log("Run: git add public/images/instagram/ src/content/blog/ && git commit && git push");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
