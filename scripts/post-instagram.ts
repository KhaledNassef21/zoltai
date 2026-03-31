import fs from "fs";
import path from "path";
import matter from "gray-matter";
import {
  buildArticleContext,
  generateImagePrompts,
  validatePrompts,
} from "../src/lib/image-prompts";
import { generateInstagramImageWithPollinations } from "../src/lib/pollinations-image";

/**
 * Instagram + Facebook Unified Social Pipeline
 *
 * Flow:
 * 1. Read latest blog article
 * 2. Extract context (topic, tools, intent)
 * 3. Generate context-aware image prompts
 * 4. Use pre-generated caption from frontmatter OR build smart caption
 * 5. Create Instagram carousel with relevant images
 * 6. Cross-post to Facebook Page
 *
 * OLD: Random picsum.photos images (DEPRECATED)
 * NEW: AI-generated images matching article content via Pollinations
 */

// ==================== IMAGE GENERATION ====================

async function generateContextAwareImages(
  prompts: string[],
  count: number
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < Math.min(prompts.length, count); i++) {
    try {
      console.log(`   🎨 Generating slide ${i + 1}/${count}...`);
      const url = await generateInstagramImageWithPollinations(prompts[i]);
      if (url) {
        urls.push(url);
        console.log(`   ✅ Slide ${i + 1} ready`);
      }
    } catch (err) {
      console.warn(
        `   ⚠️ Slide ${i + 1} failed: ${(err as Error).message}`
      );
    }
  }

  return urls;
}

// ==================== CAPTION GENERATION ====================

function buildSmartCaption(
  title: string,
  description: string,
  slug: string,
  tags: string[],
  toolsMentioned: string[],
  hook?: string
): string {
  const articleUrl = slug
    ? `https://zoltai.org/blog/${slug}`
    : "https://zoltai.org";

  // Default hooks if none from Claude
  const defaultHooks = [
    `💰 ${toolsMentioned.length > 0 ? `${toolsMentioned.slice(0, 2).join(" & ")} can make you money` : "These AI tools can make you money"}`,
    `🚀 Stop scrolling. Start earning with AI`,
    `💸 People are making $1000+/month with ${toolsMentioned[0] || "AI tools"}`,
    `🔥 AI tools you NEED to know about in 2026`,
    `💡 Your AI side hustle starts HERE`,
  ];

  const selectedHook =
    hook || defaultHooks[Math.floor(Math.random() * defaultHooks.length)];

  // Build tool mentions
  const toolList =
    toolsMentioned.length > 0
      ? `\n\n🔧 Tools covered:\n${toolsMentioned.slice(0, 5).map((t) => `• ${t}`).join("\n")}`
      : "";

  // Build hashtags from tags
  const hashTags = tags
    .slice(0, 5)
    .map((t: string) => `#${t.replace(/\s+/g, "")}`)
    .join(" ");

  return `${selectedHook}

🤖 ${title}

${description}
${toolList}

💡 Key takeaways:
• No coding skills needed
• Free tools available to start today
• Real earning potential

📖 Read full guide:
👉 ${articleUrl}

🔗 Browse 24+ AI tools: zoltai.org/tools
📩 Free AI money guide: zoltai.org

${hashTags} #AI #AITools #MakeMoneyOnline #SideHustle #PassiveIncome #Zoltai #AIToolsReview #EarnOnline

Follow @zoltai.ai for daily AI money tips 💰`;
}

// ==================== VALIDATION ====================

function validateBeforePublish(
  imageUrls: string[],
  caption: string,
  articleTitle: string
): { pass: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check: Is image related to topic?
  if (imageUrls.length === 0) {
    issues.push("NO images generated");
  }

  // Check: Does caption push to article?
  if (!caption.includes("zoltai.org")) {
    issues.push("Caption missing article link");
  }

  // Check: Does it include AI context?
  const captionLower = caption.toLowerCase();
  if (
    !captionLower.includes("ai") &&
    !captionLower.includes("tool")
  ) {
    issues.push("Caption missing AI context");
  }

  return {
    pass: issues.length === 0,
    issues,
  };
}

// ==================== INSTAGRAM PUBLISHING ====================

async function publishToInstagram(
  imageUrls: string[],
  caption: string
): Promise<string | null> {
  const instagramUserId = process.env.INSTAGRAM_USER_ID;
  const instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!instagramUserId || !instagramAccessToken) {
    throw new Error("Instagram credentials not configured");
  }

  // Create media containers
  const containerIds: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const imageUrl = imageUrls[i];
    console.log(`📤 Creating container ${i + 1}/${imageUrls.length}...`);

    const containerUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/media`;
    const containerParams = new URLSearchParams({
      image_url: imageUrl,
      is_carousel_item: "true",
      access_token: instagramAccessToken,
    });

    const containerResponse = await fetch(
      `${containerUrl}?${containerParams}`,
      { method: "POST" }
    );

    const containerData = await containerResponse.json();

    if (!containerResponse.ok || containerData.error) {
      console.warn(
        `   ⚠️ Container ${i + 1} failed: ${containerData.error?.message || "Unknown error"}`
      );
      continue;
    }

    containerIds.push(containerData.id);
    console.log(`   ✅ Container ID: ${containerData.id}`);
  }

  console.log(`\n📦 Containers created: ${containerIds.length}`);

  if (containerIds.length < 2) {
    throw new Error(
      "Need at least 2 images for a carousel. Only got " + containerIds.length
    );
  }

  // Create carousel
  console.log(`\n🔄 Creating carousel...`);
  const carouselUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/media`;
  const carouselParams = new URLSearchParams({
    media_type: "CAROUSEL",
    children: containerIds.join(","),
    caption,
    access_token: instagramAccessToken,
  });

  const carouselResponse = await fetch(`${carouselUrl}?${carouselParams}`, {
    method: "POST",
  });

  const carouselData = await carouselResponse.json();

  if (!carouselResponse.ok || carouselData.error) {
    throw new Error(
      `Failed to create carousel: ${JSON.stringify(carouselData.error || carouselData)}`
    );
  }

  const creationId = carouselData.id;
  console.log(`   ✅ Creation ID: ${creationId}`);

  // Publish with retry
  console.log(`\n📢 Publishing post...`);
  const publishUrl = `https://graph.facebook.com/v18.0/${instagramUserId}/media_publish`;
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: instagramAccessToken,
  });

  let postId: string | null = null;
  for (let attempt = 1; attempt <= 5; attempt++) {
    const waitSeconds = attempt * 10;
    console.log(
      `   ⏳ Waiting ${waitSeconds}s before attempt ${attempt}/5...`
    );
    await new Promise((r) => setTimeout(r, waitSeconds * 1000));

    const publishResponse = await fetch(`${publishUrl}?${publishParams}`, {
      method: "POST",
    });

    const publishData = await publishResponse.json();

    if (publishResponse.ok && !publishData.error) {
      console.log("\n✅ Instagram post published successfully!");
      console.log("🔗 Post ID:", publishData.id);
      postId = publishData.id;
      break;
    }

    if (publishData.error?.error_subcode === 2207027) {
      console.log(`   ⚠️ Media not ready yet, retrying...`);
      continue;
    }

    throw new Error(
      `Failed to publish: ${JSON.stringify(publishData.error || publishData)}`
    );
  }

  if (!postId) {
    throw new Error(
      "Failed to publish after 5 attempts - media never became ready"
    );
  }

  return postId;
}

// ==================== FACEBOOK CROSS-POSTING ====================

async function crossPostToFacebook(
  imageUrls: string[],
  caption: string,
  articleUrl: string
): Promise<void> {
  const facebookPageId = process.env.FACEBOOK_PAGE_ID;
  const facebookAccessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

  if (!facebookPageId || !facebookAccessToken) {
    console.log("ℹ️ Facebook credentials not configured — skipping cross-post");
    return;
  }

  console.log("\n📘 Cross-posting to Facebook Page...");

  try {
    // Option 1: Post with link (better for driving traffic)
    const fbUrl = `https://graph.facebook.com/v18.0/${facebookPageId}/feed`;
    const fbResponse = await fetch(fbUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: caption,
        link: articleUrl,
        access_token: facebookAccessToken,
      }),
    });

    const fbData = await fbResponse.json();

    if (fbResponse.ok && !fbData.error) {
      console.log("✅ Facebook post published!");
      console.log("🔗 Post ID:", fbData.id);
    } else {
      console.warn(
        `⚠️ Facebook post failed: ${fbData.error?.message || "Unknown error"}`
      );

      // Option 2: Try posting with photo instead
      if (imageUrls.length > 0) {
        console.log("🔄 Trying photo post instead...");
        const photoUrl = `https://graph.facebook.com/v18.0/${facebookPageId}/photos`;
        const photoResponse = await fetch(photoUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: imageUrls[0],
            caption: caption,
            access_token: facebookAccessToken,
          }),
        });

        const photoData = await photoResponse.json();
        if (photoResponse.ok && !photoData.error) {
          console.log("✅ Facebook photo post published!");
          console.log("🔗 Post ID:", photoData.id);
        } else {
          console.warn(
            `⚠️ Facebook photo post also failed: ${photoData.error?.message || "Unknown"}`
          );
        }
      }
    }
  } catch (err) {
    console.error("❌ Facebook cross-post error:", (err as Error).message);
  }
}

// ==================== MAIN ====================

async function main() {
  console.log("📸 Creating context-aware Instagram + Facebook post...\n");

  const instagramUserId = process.env.INSTAGRAM_USER_ID;
  const instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

  console.log(
    "🔑 Instagram User ID:",
    instagramUserId ? "✅ Exists" : "❌ Missing"
  );
  console.log(
    "🔑 Instagram Access Token:",
    instagramAccessToken ? "✅ Exists" : "❌ Missing"
  );
  console.log(
    "🔑 Facebook Page ID:",
    process.env.FACEBOOK_PAGE_ID ? "✅ Exists" : "ℹ️ Not configured"
  );

  if (!instagramUserId || !instagramAccessToken) {
    throw new Error("Instagram credentials not configured");
  }

  // ===== STEP 1: Read latest article =====
  const contentDir = path.join(process.cwd(), "src/content/blog");
  let articleTitle = "AI Tools & Money Making Tips";
  let articleDescription =
    "Discover the best AI tools to start earning money today.";
  let articleSlug = "";
  let articleTags: string[] = [];
  let articleContent = "";
  let savedImagePrompt = "";
  let savedInstagramCaption = "";
  let savedInstagramHook = "";

  if (fs.existsSync(contentDir)) {
    const files = fs
      .readdirSync(contentDir)
      .filter((f) => f.endsWith(".mdx"))
      .sort()
      .reverse();

    if (files.length > 0) {
      const latestFile = files[0];
      const fileContent = fs.readFileSync(
        path.join(contentDir, latestFile),
        "utf-8"
      );
      const { data, content } = matter(fileContent);
      articleTitle = data.title || articleTitle;
      articleDescription = data.description || articleDescription;
      articleSlug = latestFile.replace(".mdx", "");
      articleTags = data.tags || [];
      articleContent = content;
      savedImagePrompt = data.imagePrompt || "";
      savedInstagramCaption = data.instagramCaption || "";
      savedInstagramHook = data.instagramHook || "";
      console.log(`📰 Latest article: ${articleTitle}`);
    }
  }

  // ===== STEP 2: Build context =====
  console.log("\n🧠 Analyzing article context...");
  const ctx = buildArticleContext(
    articleTitle,
    articleDescription,
    articleContent,
    articleTags
  );
  console.log(`   📋 Intent: ${ctx.intent}`);
  console.log(
    `   🔧 Tools: ${ctx.toolsMentioned.join(", ") || "general"}`
  );

  // ===== STEP 3: Generate context-aware images =====
  console.log("\n🎨 Generating context-aware images...");

  // Check for saved prompts first
  const promptsFile = path.join(
    process.cwd(),
    `data/image-prompts/${articleSlug}.json`
  );
  let slidePrompts: string[];

  if (fs.existsSync(promptsFile)) {
    const saved = JSON.parse(fs.readFileSync(promptsFile, "utf-8"));
    slidePrompts = saved.instagramSlides || [];
    console.log(`   📂 Using saved image prompts from generate-article`);
  } else {
    // Generate fresh prompts
    const imagePrompts = generateImagePrompts(ctx);
    slidePrompts = imagePrompts.instagramSlides;
    console.log(`   🆕 Generated fresh image prompts`);
  }

  // Ensure we have enough slide prompts
  while (slidePrompts.length < 4) {
    slidePrompts.push(
      `Modern AI tools dashboard on laptop, ${ctx.toolsMentioned[0] || "productivity"} interface, dark theme, purple accents, clean SaaS design, square 1:1, professional`
    );
  }

  const imageUrls = await generateContextAwareImages(slidePrompts, 4);
  console.log(`📋 Total images generated: ${imageUrls.length}`);

  // ===== STEP 4: Build caption =====
  const articleUrl = articleSlug
    ? `https://zoltai.org/blog/${articleSlug}`
    : "https://zoltai.org";

  let caption: string;
  if (savedInstagramCaption) {
    // Use Claude-generated caption but append our standard footer
    caption = `${savedInstagramHook || "💰 Make money with AI"}\n\n${savedInstagramCaption}\n\n📖 Full guide: ${articleUrl}\n🔗 Browse tools: zoltai.org/tools\n\n#AI #AITools #MakeMoneyOnline #SideHustle #PassiveIncome #Zoltai\n\nFollow @zoltai.ai for daily AI money tips 💰`;
  } else {
    caption = buildSmartCaption(
      articleTitle,
      articleDescription,
      articleSlug,
      articleTags,
      ctx.toolsMentioned,
      savedInstagramHook
    );
  }

  // ===== STEP 5: Validate before publishing =====
  console.log("\n✅ Running pre-publish validation...");
  const validation = validateBeforePublish(
    imageUrls,
    caption,
    articleTitle
  );

  if (!validation.pass) {
    console.warn(`⚠️ Validation issues: ${validation.issues.join(", ")}`);
    // Continue anyway but log the issues
  } else {
    console.log("   ✅ All checks passed!");
  }

  // ===== STEP 6: Publish to Instagram =====
  const postId = await publishToInstagram(imageUrls, caption);

  // ===== STEP 7: Cross-post to Facebook =====
  if (postId) {
    await crossPostToFacebook(imageUrls, caption, articleUrl);
  }

  console.log("\n🎉 Social pipeline complete!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
