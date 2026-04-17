import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  buildArticleContext,
  generateImagePrompts,
} from "../src/lib/image-prompts";
import { getHostedImageUrl } from "../src/lib/image-host";

/**
 * Instagram + Facebook Unified Social Pipeline v5
 *
 * FIXES from v4:
 * - Sort articles by DATE (not alphabetically) to pick the LATEST one
 * - Validate CDN image URLs with HEAD request before sending to Instagram
 * - Generate images with DALL-E 3 if none exist or CDN returns 404
 * - Compliant captions, random seeds, no income claims
 */

const SITE_URL = "https://zoltai.org";

// ==================== IMAGE VALIDATION + GENERATION ====================

/**
 * Validate that a URL actually returns an image (not a 404 page).
 * Instagram rejects non-image content with "Only photo or video can be accepted".
 */
async function isValidImageUrl(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") || "";
    return contentType.startsWith("image/");
  } catch {
    return false;
  }
}

/**
 * Generate fresh images with DALL-E 3 (or Pollinations fallback),
 * then upload to a host that gives direct URLs for Instagram.
 */
async function generateAndHostImages(
  slug: string,
  prompts: string[]
): Promise<string[]> {
  const urls: string[] = [];

  // Try DALL-E 3 first
  let useDallE = false;
  try {
    const { isDallEAvailable, generateInstagramSlide, downloadImageToBuffer } =
      await import("../src/lib/openai-image");
    useDallE = isDallEAvailable();

    if (useDallE) {
      console.log("   🎨 Generating with DALL-E 3...");
      for (let i = 0; i < Math.min(prompts.length, 4); i++) {
        try {
          const result = await generateInstagramSlide(prompts[i]);
          if (result.provider === "openai") {
            // DALL-E URLs expire — download and re-host
            const buffer = await downloadImageToBuffer(result.url);
            const { uploadImageBuffer } = await import("../src/lib/image-host");
            const hostedUrl = await uploadImageBuffer(buffer, `${slug}-dalle-${i}`);
            if (hostedUrl) {
              urls.push(hostedUrl);
              console.log(`   ✅ DALL-E slide ${i + 1} hosted: ${hostedUrl.slice(0, 70)}...`);
              continue;
            }
          }
          // Pollinations fallback from generateInstagramSlide
          const hostedUrl = await getHostedImageUrl(result.url, `${slug}-s${i}`, i);
          if (hostedUrl) urls.push(hostedUrl);
        } catch (err) {
          console.warn(`   ⚠️ DALL-E slide ${i + 1} failed: ${(err as Error).message}`);
        }
      }
      if (urls.length >= 2) return urls;
    }
  } catch (err) {
    console.warn(`   ⚠️ DALL-E import failed: ${(err as Error).message}`);
  }

  // Fallback: Pollinations + image host
  console.log("   🎨 Generating with Pollinations (fallback)...");
  for (let i = urls.length; i < Math.min(prompts.length, 4); i++) {
    try {
      const prompt = prompts[i].slice(0, 120);
      const seed = Math.floor(Math.random() * 999999);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true&seed=${seed}`;
      console.log(`   🎨 Slide ${i + 1} (seed=${seed}): "${prompt.slice(0, 50)}..."`);
      const hostedUrl = await getHostedImageUrl(pollinationsUrl, `${slug}-s${i}`, i);
      if (hostedUrl) urls.push(hostedUrl);
    } catch (err) {
      console.warn(`   ⚠️ Slide ${i + 1} failed: ${(err as Error).message}`);
    }
  }

  return urls;
}

/**
 * Get Instagram image URLs for an article.
 * Priority:
 * 1. Pre-saved images on Vercel CDN — VALIDATE each URL first
 * 2. Generate fresh with DALL-E 3 / Pollinations → host externally
 */
async function getImageUrls(
  slug: string,
  prompts: string[],
  savedSlides: string[]
): Promise<string[]> {
  const validUrls: string[] = [];

  // Step 1: Try pre-saved CDN slides from frontmatter
  if (savedSlides.length > 0) {
    console.log(`📂 Checking ${savedSlides.length} pre-saved CDN images...`);
    for (let i = 0; i < savedSlides.length; i++) {
      const cdnUrl = savedSlides[i].startsWith("http")
        ? savedSlides[i]
        : `${SITE_URL}${savedSlides[i]}`;
      const valid = await isValidImageUrl(cdnUrl);
      if (valid) {
        validUrls.push(cdnUrl);
        console.log(`   ✅ [${i + 1}] Valid: ${cdnUrl.slice(0, 70)}...`);
      } else {
        console.log(`   ❌ [${i + 1}] Invalid/404: ${cdnUrl.slice(0, 70)}...`);
      }
    }
    if (validUrls.length >= 2) {
      console.log(`📂 Using ${validUrls.length} validated CDN images`);
      return validUrls;
    }
    console.log(`⚠️ Only ${validUrls.length} valid CDN images — need at least 2`);
  }

  // Step 2: Check local filesystem images
  const instaDir = path.join(process.cwd(), "public/images/instagram", slug);
  if (fs.existsSync(instaDir)) {
    for (let i = 1; i <= 4; i++) {
      for (const ext of ["jpg", "png"]) {
        const file = path.join(instaDir, `slide-${i}.${ext}`);
        if (fs.existsSync(file)) {
          const stat = fs.statSync(file);
          if (stat.size > 5000) {
            const cdnUrl = `${SITE_URL}/images/instagram/${slug}/slide-${i}.${ext}`;
            const valid = await isValidImageUrl(cdnUrl);
            if (valid) {
              validUrls.push(cdnUrl);
              console.log(`   ✅ Local slide ${i}: ${cdnUrl} (${(stat.size / 1024).toFixed(0)}KB)`);
            }
          }
        }
      }
    }
    if (validUrls.length >= 2) {
      console.log(`📂 Using ${validUrls.length} validated local images`);
      return validUrls;
    }
  }

  // Step 3: Generate fresh images with DALL-E 3 or Pollinations
  console.log("🖼️ Not enough valid images — generating fresh...");
  const freshUrls = await generateAndHostImages(slug, prompts);
  return [...validUrls, ...freshUrls].slice(0, 4);
}

// ==================== CAPTION ====================

function buildCaption(
  title: string,
  description: string,
  slug: string,
  tags: string[],
  tools: string[],
  savedCaption?: string,
  savedHook?: string
): string {
  const articleUrl = slug ? `${SITE_URL}/blog/${slug}` : SITE_URL;

  if (savedCaption) {
    const cleanCaption = savedCaption
      .replace(/make money/gi, "boost productivity")
      .replace(/earn money/gi, "save time")
      .replace(/passive income/gi, "workflow automation")
      .replace(/side hustle/gi, "AI skills")
      .replace(/\$\d+[\+\/]?/g, "");

    const hook = savedHook
      ? savedHook.replace(/make money/gi, "boost productivity").replace(/\$/g, "")
      : "Discover powerful AI tools";

    return `${hook}\n\n${cleanCaption}\n\n Full guide: ${articleUrl}\n Browse tools: zoltai.org/tools\n\n#AI #AITools #Productivity #TechTips #AIAutomation #Zoltai\n\nFollow @zoltai.ai for daily AI tips`;
  }

  const hooks = [
    `${tools.length > 0 ? `${tools.slice(0, 2).join(" & ")} — tools you need to know` : "AI tools that will change your workflow"}`,
    `Stop scrolling. Start learning AI tools that actually work`,
    `These AI tools are transforming how people work in 2026`,
    `AI tools you NEED to know about in 2026`,
    `Work smarter, not harder — with these AI tools`,
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];

  const toolList =
    tools.length > 0
      ? `\n\nTools:\n${tools.slice(0, 5).map((t) => `- ${t}`).join("\n")}`
      : "";

  const hashTags = tags
    .slice(0, 5)
    .map((t: string) => `#${t.replace(/\s+/g, "")}`)
    .join(" ");

  return `${hook}

${title}

${description}${toolList}

Read full guide:
${articleUrl}

Browse 24+ AI tools: zoltai.org/tools

${hashTags} #AI #AITools #Productivity #TechTips #LearnAI #Zoltai

Follow @zoltai.ai for daily AI tips`;
}

// ==================== INSTAGRAM ====================

async function publishToInstagram(
  imageUrls: string[],
  caption: string
): Promise<string | null> {
  const userId = process.env.INSTAGRAM_USER_ID!;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN!;

  const containerIds: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    console.log(
      `📤 Container ${i + 1}/${imageUrls.length}: ${imageUrls[i].slice(0, 70)}...`
    );

    const res = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media?` +
        new URLSearchParams({
          image_url: imageUrls[i],
          is_carousel_item: "true",
          access_token: token,
        }),
      { method: "POST" }
    );
    const data = await res.json();

    if (!res.ok || data.error) {
      console.warn(`   ⚠️ Failed: ${data.error?.message || "Unknown"}`);
      continue;
    }
    containerIds.push(data.id);
    console.log(`   ✅ ID: ${data.id}`);
  }

  if (containerIds.length < 2) {
    throw new Error(`Need >=2 containers, got ${containerIds.length}`);
  }

  // Create carousel
  console.log(`\n🔄 Creating carousel (${containerIds.length} slides)...`);
  const carouselRes = await fetch(
    `https://graph.facebook.com/v18.0/${userId}/media?` +
      new URLSearchParams({
        media_type: "CAROUSEL",
        children: containerIds.join(","),
        caption,
        access_token: token,
      }),
    { method: "POST" }
  );
  const carouselData = await carouselRes.json();
  if (!carouselRes.ok || carouselData.error) {
    throw new Error(
      `Carousel failed: ${JSON.stringify(carouselData.error || carouselData)}`
    );
  }

  // Publish with retry
  console.log(`📢 Publishing...`);
  for (let attempt = 1; attempt <= 5; attempt++) {
    const wait = attempt * 10;
    console.log(`   Attempt ${attempt}/5 (wait ${wait}s)...`);
    await new Promise((r) => setTimeout(r, wait * 1000));

    const pubRes = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media_publish?` +
        new URLSearchParams({
          creation_id: carouselData.id,
          access_token: token,
        }),
      { method: "POST" }
    );
    const pubData = await pubRes.json();

    if (pubRes.ok && !pubData.error) {
      console.log(`\n✅ Instagram published! Post ID: ${pubData.id}`);
      return pubData.id;
    }
    if (pubData.error?.error_subcode === 2207027) continue;
    throw new Error(
      `Publish failed: ${JSON.stringify(pubData.error || pubData)}`
    );
  }

  throw new Error("Failed after 5 attempts");
}

// ==================== FACEBOOK ====================

async function crossPostToFacebook(
  imageUrls: string[],
  caption: string,
  articleUrl: string
): Promise<void> {
  const pageId = process.env.FACEBOOK_PAGE_ID;
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!pageId || !pageToken) {
    console.log("Facebook not configured — skipping");
    return;
  }

  console.log("\nCross-posting to Facebook with images...");

  try {
    const photoIds: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      console.log(
        `   Uploading photo ${i + 1}/${imageUrls.length}: ${imageUrls[i].slice(0, 70)}...`
      );

      const photoRes = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/photos`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imageUrls[i],
            published: false,
            access_token: pageToken,
          }),
        }
      );
      const photoData = await photoRes.json();

      if (photoRes.ok && !photoData.error && photoData.id) {
        photoIds.push(photoData.id);
        console.log(`   ✅ Photo ${i + 1} uploaded: ${photoData.id}`);
      } else {
        console.warn(
          `   ⚠️ Photo ${i + 1} failed: ${photoData.error?.message || "Unknown"}`
        );
      }
    }

    if (photoIds.length > 0) {
      console.log(`\nCreating feed post with ${photoIds.length} photos...`);

      const attachedMedia: Record<string, string> = {};
      photoIds.forEach((id, i) => {
        attachedMedia[`attached_media[${i}]`] = JSON.stringify({
          media_fbid: id,
        });
      });

      const feedRes = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            message: caption,
            link: articleUrl,
            ...attachedMedia,
            access_token: pageToken,
          }),
        }
      );
      const feedData = await feedRes.json();

      if (feedRes.ok && !feedData.error) {
        console.log(
          `✅ Facebook posted with ${photoIds.length} photos! ID: ${feedData.id}`
        );
        return;
      }
      console.warn(
        `⚠️ Multi-photo post failed: ${feedData.error?.message || "Unknown"}`
      );

      // Retry without link
      console.log("Retrying without link...");
      const retryRes = await fetch(
        `https://graph.facebook.com/v18.0/${pageId}/feed`,
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            message: `${caption}\n\n${articleUrl}`,
            ...attachedMedia,
            access_token: pageToken,
          }),
        }
      );
      const retryData = await retryRes.json();

      if (retryRes.ok && !retryData.error) {
        console.log(
          `✅ Facebook posted with ${photoIds.length} photos! ID: ${retryData.id}`
        );
        return;
      }
      console.warn(
        `⚠️ Retry failed: ${retryData.error?.message || "Unknown"}`
      );
    }

    // Final fallback: simple link post
    console.log("Final fallback: link post...");
    const linkRes = await fetch(
      `https://graph.facebook.com/v18.0/${pageId}/feed`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: caption,
          link: articleUrl,
          access_token: pageToken,
        }),
      }
    );
    const linkData = await linkRes.json();

    if (linkRes.ok && !linkData.error) {
      console.log(`✅ Facebook link posted! ID: ${linkData.id}`);
    } else {
      console.warn(
        `⚠️ Link post failed: ${linkData.error?.message || "Unknown"}`
      );
    }
  } catch (err) {
    console.error(`❌ Facebook error: ${(err as Error).message}`);
  }
}

// ==================== MAIN ====================

async function main() {
  console.log("Instagram + Facebook Social Pipeline v5\n");

  const userId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  console.log("Instagram:", userId ? "✅" : "❌", token ? "✅" : "❌");
  console.log(
    "Facebook:",
    process.env.FACEBOOK_PAGE_ID ? "✅" : "Not set"
  );
  console.log(
    "DALL-E 3:",
    process.env.OPENAI_API_KEY ? "✅" : "Not set (Pollinations fallback)"
  );

  if (!userId || !token) throw new Error("Instagram credentials missing");

  // --- Duplicate check ---
  const logFile = path.join(process.cwd(), "data/posted-slugs.json");
  let posted: string[] = [];
  try {
    if (fs.existsSync(logFile))
      posted = JSON.parse(fs.readFileSync(logFile, "utf-8"));
  } catch {
    posted = [];
  }

  // --- Read articles, SORT BY DATE (newest first) ---
  const contentDir = path.join(process.cwd(), "src/content/blog");
  if (!fs.existsSync(contentDir)) throw new Error("No blog content directory");

  const files = fs
    .readdirSync(contentDir)
    .filter((f) => f.endsWith(".mdx"));

  if (files.length === 0) throw new Error("No articles found");

  // Parse all articles and sort by date (newest first)
  interface ArticleMeta {
    file: string;
    slug: string;
    date: string;
  }

  const articleMetas: ArticleMeta[] = [];
  for (const file of files) {
    const slug = file.replace(".mdx", "");
    try {
      const raw = fs.readFileSync(path.join(contentDir, file), "utf-8");
      const { data } = matter(raw);
      articleMetas.push({
        file,
        slug,
        date: data.date || "1970-01-01",
      });
    } catch {
      articleMetas.push({ file, slug, date: "1970-01-01" });
    }
  }

  // Sort by date descending (newest first)
  articleMetas.sort((a, b) => b.date.localeCompare(a.date));

  console.log(`\nFound ${articleMetas.length} articles (sorted by date)`);
  console.log(
    `Latest: "${articleMetas[0]?.slug}" (${articleMetas[0]?.date})`
  );
  console.log(`Already posted: ${posted.length} articles\n`);

  // Find first unposted article (newest first)
  let articleFile = "";
  let articleSlug = "";
  for (const meta of articleMetas) {
    if (!posted.includes(meta.slug)) {
      articleFile = meta.file;
      articleSlug = meta.slug;
      break;
    }
  }

  if (!articleSlug) {
    console.log("✅ All articles already posted. Nothing to do.");
    process.exit(0);
  }

  // Parse article
  const raw = fs.readFileSync(path.join(contentDir, articleFile), "utf-8");
  const { data, content } = matter(raw);
  const title = data.title || "AI Tools Guide";
  const description = data.description || "";
  const tags: string[] = data.tags || [];
  const savedSlides: string[] = data.instagramSlides || [];
  const savedCaption: string = data.instagramCaption || "";
  const savedHook: string = data.instagramHook || "";

  console.log(`Article: ${title}`);
  console.log(`   Slug: ${articleSlug}`);
  console.log(`   Date: ${data.date || "unknown"}`);
  console.log(`   Pre-saved slides: ${savedSlides.length}`);

  // --- Build context ---
  const ctx = buildArticleContext(title, description, content, tags);
  console.log(`   Intent: ${ctx.intent}`);
  console.log(`   Tools: ${ctx.toolsMentioned.join(", ") || "general"}`);

  // --- Get images (with validation + DALL-E fallback) ---
  console.log("\nResolving images...");
  const imagePrompts = generateImagePrompts(ctx);
  const imageUrls = await getImageUrls(
    articleSlug,
    imagePrompts.instagramSlides,
    savedSlides
  );

  if (imageUrls.length < 2) {
    throw new Error(`Only ${imageUrls.length} images available, need >=2`);
  }

  console.log(`\n✅ Got ${imageUrls.length} valid images for posting`);

  // --- Build caption (COMPLIANT - no income claims) ---
  const articleUrl = `${SITE_URL}/blog/${articleSlug}`;
  const caption = buildCaption(
    title,
    description,
    articleSlug,
    tags,
    ctx.toolsMentioned,
    savedCaption,
    savedHook
  );

  // --- Publish Instagram ---
  const postId = await publishToInstagram(imageUrls, caption);

  // --- Cross-post Facebook ---
  if (postId) {
    await crossPostToFacebook(imageUrls, caption, articleUrl);
  }

  // --- Log posted slug ---
  if (postId) {
    try {
      posted.push(articleSlug);
      const dir = path.dirname(logFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(logFile, JSON.stringify(posted, null, 2));
      console.log(`Logged: ${articleSlug}`);
    } catch (err) {
      console.warn(
        `⚠️ Log save failed: ${(err as Error).message}`
      );
    }
  }

  console.log("\nDone!");
}

main().catch((err) => {
  const msg = (err as Error).message || String(err);
  // Meta rate-limit / action-block errors aren't our bug — log and exit 0
  // so GitHub Actions doesn't mark the run as failed every day while Meta
  // throttles us or while App Review is pending.
  const transient =
    msg.includes("Application request limit reached") ||
    msg.includes("error_subcode\":2207051") ||
    msg.includes("#4") ||
    msg.includes("rate limit") ||
    msg.includes("temporarily blocked");
  if (transient) {
    console.warn(`⚠️  Transient Meta error — skipping today:\n   ${msg}`);
    process.exit(0);
  }
  console.error("❌ Error:", err);
  process.exit(1);
});
