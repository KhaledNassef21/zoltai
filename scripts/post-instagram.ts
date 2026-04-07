import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  buildArticleContext,
  generateImagePrompts,
} from "../src/lib/image-prompts";
import { getHostedImageUrl } from "../src/lib/image-host";

/**
 * Instagram + Facebook Unified Social Pipeline v4
 *
 * CHANGES from v3:
 * - Removed ALL income claims and non-compliant hashtags
 * - Random seeds for fallback image generation (no more duplicates)
 * - Better duplicate post prevention with posted-slugs.json
 * - Compliant captions focused on productivity and learning
 *
 * Images are PRE-GENERATED during article creation (generate-article.ts)
 * and served from Vercel CDN at zoltai.org/images/instagram/...
 */

const SITE_URL = "https://zoltai.org";

// ==================== IMAGE RESOLUTION ====================

/**
 * Get Instagram image URLs for an article.
 * Priority:
 * 1. Pre-saved images in public/images/instagram/{slug}/ -> Vercel CDN URLs
 * 2. Generate fresh with Pollinations -> catbox.moe hosting (fallback with RANDOM seeds)
 */
async function getImageUrls(
  slug: string,
  prompts: string[]
): Promise<string[]> {
  const urls: string[] = [];

  // Check for pre-saved images first
  const instaDir = path.join(process.cwd(), "public/images/instagram", slug);
  if (fs.existsSync(instaDir)) {
    for (let i = 1; i <= 4; i++) {
      const file = path.join(instaDir, `slide-${i}.jpg`);
      if (fs.existsSync(file)) {
        const stat = fs.statSync(file);
        if (stat.size > 5000) {
          const cdnUrl = `${SITE_URL}/images/instagram/${slug}/slide-${i}.jpg`;
          urls.push(cdnUrl);
          console.log(`   ✅ Slide ${i}: ${cdnUrl} (${(stat.size / 1024).toFixed(0)}KB)`);
        }
      }
    }
  }

  if (urls.length >= 2) {
    console.log(`📂 Using ${urls.length} pre-saved images from Vercel CDN`);
    return urls;
  }

  // Fallback: generate fresh with RANDOM seeds (no more fixed seeds!)
  console.log("⚠️ No pre-saved images found. Generating fresh...");

  for (let i = 0; i < Math.min(prompts.length, 4); i++) {
    try {
      const prompt = prompts[i].slice(0, 120);
      const seed = Math.floor(Math.random() * 999999); // RANDOM seed every time
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true&seed=${seed}`;

      console.log(`   🎨 Slide ${i + 1} (seed=${seed}): "${prompt.slice(0, 50)}..."`);
      const hostedUrl = await getHostedImageUrl(pollinationsUrl, `${slug}-s${i}`, i);
      if (hostedUrl) {
        urls.push(hostedUrl);
      }
    } catch (err) {
      console.warn(`   ⚠️ Slide ${i + 1} failed: ${(err as Error).message}`);
    }
  }

  return urls;
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
    // Clean any legacy income claims from saved captions
    const cleanCaption = savedCaption
      .replace(/make money/gi, "boost productivity")
      .replace(/earn money/gi, "save time")
      .replace(/passive income/gi, "workflow automation")
      .replace(/side hustle/gi, "AI skills")
      .replace(/\$\d+[\+\/]?/g, "");

    const hook = savedHook
      ? savedHook.replace(/make money/gi, "boost productivity").replace(/\$/g, "")
      : "🚀 Discover powerful AI tools";

    return `${hook}\n\n${cleanCaption}\n\n📖 Full guide: ${articleUrl}\n🔗 Browse tools: zoltai.org/tools\n\n#AI #AITools #Productivity #TechTips #AIAutomation #Zoltai\n\nFollow @zoltai.ai for daily AI tips 🚀`;
  }

  const hooks = [
    `🚀 ${tools.length > 0 ? `${tools.slice(0, 2).join(" & ")} — tools you need to know` : "AI tools that will change your workflow"}`,
    `🔥 Stop scrolling. Start learning AI tools that actually work`,
    `💡 These AI tools are transforming how people work in 2026`,
    `🤖 AI tools you NEED to know about in 2026`,
    `⚡ Work smarter, not harder — with these AI tools`,
  ];
  const hook = hooks[Math.floor(Math.random() * hooks.length)];

  const toolList = tools.length > 0
    ? `\n\n🔧 Tools:\n${tools.slice(0, 5).map((t) => `• ${t}`).join("\n")}`
    : "";

  const hashTags = tags.slice(0, 5).map((t: string) => `#${t.replace(/\s+/g, "")}`).join(" ");

  return `${hook}

🤖 ${title}

${description}${toolList}

📖 Read full guide:
👉 ${articleUrl}

🔗 Browse 24+ AI tools: zoltai.org/tools

${hashTags} #AI #AITools #Productivity #TechTips #LearnAI #Zoltai

Follow @zoltai.ai for daily AI tips 🚀`;
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
    console.log(`📤 Container ${i + 1}/${imageUrls.length}: ${imageUrls[i].slice(0, 70)}...`);

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
    throw new Error(`Carousel failed: ${JSON.stringify(carouselData.error || carouselData)}`);
  }

  // Publish with retry
  console.log(`📢 Publishing...`);
  for (let attempt = 1; attempt <= 5; attempt++) {
    const wait = attempt * 10;
    console.log(`   ⏳ Attempt ${attempt}/5 (wait ${wait}s)...`);
    await new Promise((r) => setTimeout(r, wait * 1000));

    const pubRes = await fetch(
      `https://graph.facebook.com/v18.0/${userId}/media_publish?` +
        new URLSearchParams({ creation_id: carouselData.id, access_token: token }),
      { method: "POST" }
    );
    const pubData = await pubRes.json();

    if (pubRes.ok && !pubData.error) {
      console.log(`\n✅ Instagram published! Post ID: ${pubData.id}`);
      return pubData.id;
    }
    if (pubData.error?.error_subcode === 2207027) continue;
    throw new Error(`Publish failed: ${JSON.stringify(pubData.error || pubData)}`);
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
    console.log("ℹ️ Facebook not configured — skipping");
    return;
  }

  console.log("\n📘 Cross-posting to Facebook with images...");

  try {
    // Step 1: Upload each image as unpublished photo
    const photoIds: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      console.log(`   📤 Uploading photo ${i + 1}/${imageUrls.length}: ${imageUrls[i].slice(0, 70)}...`);

      const photoRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imageUrls[i],
          published: false,
          access_token: pageToken,
        }),
      });
      const photoData = await photoRes.json();

      if (photoRes.ok && !photoData.error && photoData.id) {
        photoIds.push(photoData.id);
        console.log(`   ✅ Photo ${i + 1} uploaded: ${photoData.id}`);
      } else {
        console.warn(`   ⚠️ Photo ${i + 1} failed: ${photoData.error?.message || "Unknown"}`);
      }
    }

    // Step 2: Create feed post with attached photos
    if (photoIds.length > 0) {
      console.log(`\n📝 Creating feed post with ${photoIds.length} photos...`);

      const attachedMedia: Record<string, string> = {};
      photoIds.forEach((id, i) => {
        attachedMedia[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id });
      });

      const feedRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          message: caption,
          link: articleUrl,
          ...attachedMedia,
          access_token: pageToken,
        }),
      });
      const feedData = await feedRes.json();

      if (feedRes.ok && !feedData.error) {
        console.log(`✅ Facebook posted with ${photoIds.length} photos! ID: ${feedData.id}`);
        return;
      }
      console.warn(`⚠️ Multi-photo post failed: ${feedData.error?.message || "Unknown"}`);

      // Fallback: try without link
      console.log("🔄 Retrying without link...");
      const retryRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          message: `${caption}\n\n👉 ${articleUrl}`,
          ...attachedMedia,
          access_token: pageToken,
        }),
      });
      const retryData = await retryRes.json();

      if (retryRes.ok && !retryData.error) {
        console.log(`✅ Facebook posted with ${photoIds.length} photos! ID: ${retryData.id}`);
        return;
      }
      console.warn(`⚠️ Retry failed: ${retryData.error?.message || "Unknown"}`);
    }

    // Final fallback: simple link post
    console.log("🔄 Final fallback: link post...");
    const linkRes = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: caption, link: articleUrl, access_token: pageToken }),
    });
    const linkData = await linkRes.json();

    if (linkRes.ok && !linkData.error) {
      console.log(`✅ Facebook link posted! ID: ${linkData.id}`);
    } else {
      console.warn(`⚠️ Link post failed: ${linkData.error?.message || "Unknown"}`);
    }
  } catch (err) {
    console.error(`❌ Facebook error: ${(err as Error).message}`);
  }
}

// ==================== MAIN ====================

async function main() {
  console.log("📸 Instagram + Facebook Social Pipeline v4\n");

  const userId = process.env.INSTAGRAM_USER_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  console.log("🔑 Instagram:", userId ? "✅" : "❌", token ? "✅" : "❌");
  console.log("🔑 Facebook:", process.env.FACEBOOK_PAGE_ID ? "✅" : "ℹ️ Not set");

  if (!userId || !token) throw new Error("Instagram credentials missing");

  // --- Duplicate check ---
  const logFile = path.join(process.cwd(), "data/posted-slugs.json");
  let posted: string[] = [];
  try {
    if (fs.existsSync(logFile)) posted = JSON.parse(fs.readFileSync(logFile, "utf-8"));
  } catch { posted = []; }

  // --- Read articles ---
  const contentDir = path.join(process.cwd(), "src/content/blog");
  if (!fs.existsSync(contentDir)) throw new Error("No blog content directory");

  const files = fs.readdirSync(contentDir).filter((f) => f.endsWith(".mdx")).sort().reverse();
  if (files.length === 0) throw new Error("No articles found");

  // Find first unposted article (newest first)
  let articleFile = "";
  let articleSlug = "";
  for (const file of files) {
    const slug = file.replace(".mdx", "");
    if (!posted.includes(slug)) {
      articleFile = file;
      articleSlug = slug;
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

  console.log(`📰 Article: ${title}`);
  console.log(`   Slug: ${articleSlug}`);
  console.log(`   Pre-saved slides: ${savedSlides.length}`);

  // --- Build context ---
  const ctx = buildArticleContext(title, description, content, tags);
  console.log(`   Intent: ${ctx.intent}`);
  console.log(`   Tools: ${ctx.toolsMentioned.join(", ") || "general"}`);

  // --- Get images ---
  console.log("\n🖼️ Resolving images...");

  // First try: pre-saved slides from frontmatter -> Vercel CDN
  let imageUrls: string[] = [];

  if (savedSlides.length >= 2) {
    imageUrls = savedSlides.map((p) => `${SITE_URL}${p}`);
    console.log(`📂 Using ${imageUrls.length} pre-saved Vercel CDN images:`);
    imageUrls.forEach((u, i) => console.log(`   [${i + 1}] ${u}`));
  }

  // Fallback: check local files or generate fresh
  if (imageUrls.length < 2) {
    const imagePrompts = generateImagePrompts(ctx);
    imageUrls = await getImageUrls(articleSlug, imagePrompts.instagramSlides);
  }

  if (imageUrls.length < 2) {
    throw new Error(`Only ${imageUrls.length} images available, need >=2`);
  }

  // --- Build caption (COMPLIANT - no income claims) ---
  const articleUrl = `${SITE_URL}/blog/${articleSlug}`;
  const caption = buildCaption(title, description, articleSlug, tags, ctx.toolsMentioned, savedCaption, savedHook);

  // --- Publish Instagram ---
  const postId = await publishToInstagram(imageUrls, caption);

  // --- Cross-post Facebook ---
  if (postId) {
    await crossPostToFacebook(imageUrls, caption, articleUrl);
  }

  // --- Log posted slug (prevent duplicates) ---
  if (postId) {
    try {
      posted.push(articleSlug);
      const dir = path.dirname(logFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(logFile, JSON.stringify(posted, null, 2));
      console.log(`📝 Logged: ${articleSlug}`);
    } catch (err) {
      console.warn(`⚠️ Log save failed: ${(err as Error).message}`);
    }
  }

  console.log("\n🎉 Done!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
