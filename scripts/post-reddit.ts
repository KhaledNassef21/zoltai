/**
 * Reddit Posting Automation
 *
 * Posts blog articles to relevant subreddits for organic traffic.
 * Uses Reddit OAuth2 "script" app type (personal use).
 *
 * Strategy:
 * - Each article gets posted to 2-3 relevant subreddits
 * - Posts are VALUE-FIRST (not spammy) — full useful content with a subtle link
 * - Uses Claude to rewrite the article into Reddit-friendly format
 * - Tracks posted articles to prevent duplicates
 * - Rate-limited to respect Reddit's rules
 *
 * Setup:
 * 1. Create Reddit app at https://www.reddit.com/prefs/apps (type: script)
 * 2. Set env vars: REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD
 *
 * Runs daily via GitHub Actions at 2PM UTC.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";

const SITE_URL = "https://zoltai.org";
const LOG_FILE = path.join(process.cwd(), "data/reddit-posted.json");
const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

// ─────────────────────────────────────────────
// Subreddit Mapping
// ─────────────────────────────────────────────

interface SubredditConfig {
  name: string;
  flairId?: string;
  postType: "link" | "self"; // link = URL post, self = text post
  rules: string; // reminder to follow sub rules
}

// Map article tags to relevant subreddits
const TAG_SUBREDDIT_MAP: Record<string, SubredditConfig[]> = {
  // AI General
  "ai-tools": [
    { name: "r/artificial", postType: "self", rules: "No self-promotion. Value-first." },
    { name: "r/ArtificialIntelligence", postType: "self", rules: "Discussion focused." },
  ],
  // AI Writing
  "ai-writing": [
    { name: "r/freelanceWriters", postType: "self", rules: "Helpful advice only. No direct links." },
    { name: "r/copywriting", postType: "self", rules: "Value posts welcome." },
  ],
  // AI Coding
  "ai-coding-assistants": [
    { name: "r/programming", postType: "link", rules: "Must be interesting content." },
    { name: "r/webdev", postType: "self", rules: "Self-promo Saturday only — use self post." },
    { name: "r/learnprogramming", postType: "self", rules: "Helpful content only." },
  ],
  cursor: [
    { name: "r/cursor", postType: "self", rules: "Cursor-specific discussion." },
  ],
  // AI Image/Art
  "ai-art": [
    { name: "r/aiwars", postType: "self", rules: "Discussion posts." },
    { name: "r/midjourney", postType: "self", rules: "Related to Midjourney." },
  ],
  midjourney: [
    { name: "r/midjourney", postType: "self", rules: "Community discussion." },
  ],
  // Side Hustle / Money
  "side-hustle": [
    { name: "r/sidehustle", postType: "self", rules: "No spam. Real advice only." },
    { name: "r/beermoney", postType: "self", rules: "Must be verifiable income method." },
  ],
  "make-money-online": [
    { name: "r/WorkOnline", postType: "self", rules: "Legit opportunities only." },
    { name: "r/passive_income", postType: "self", rules: "Real passive income only." },
  ],
  // Freelancing
  freelancing: [
    { name: "r/freelance", postType: "self", rules: "Helpful discussions." },
    { name: "r/Upwork", postType: "self", rules: "Platform-specific advice." },
  ],
  // SEO
  seo: [
    { name: "r/SEO", postType: "self", rules: "No low-effort posts." },
    { name: "r/bigseo", postType: "self", rules: "Advanced discussion." },
  ],
  // Voice/Audio
  elevenlabs: [
    { name: "r/elevenlabs", postType: "self", rules: "Community content." },
  ],
  // Video
  "ai-video": [
    { name: "r/VideoEditing", postType: "self", rules: "Helpful advice." },
  ],
  // Comparisons
  "github-copilot": [
    { name: "r/github", postType: "link", rules: "GitHub-related content." },
  ],
};

// Default subreddits for any article
const DEFAULT_SUBREDDITS: SubredditConfig[] = [
  { name: "r/SideProject", postType: "self", rules: "Show and tell." },
];

// ─────────────────────────────────────────────
// Reddit OAuth2 Authentication
// ─────────────────────────────────────────────

let accessToken = "";

async function authenticate(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const username = process.env.REDDIT_USERNAME;
  const password = process.env.REDDIT_PASSWORD;

  if (!clientId || !clientSecret || !username || !password) {
    throw new Error(
      "Missing Reddit credentials. Set REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD"
    );
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "zoltai-bot/1.0 (by /u/" + username + ")",
    },
    body: new URLSearchParams({
      grant_type: "password",
      username,
      password,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reddit auth failed: ${res.status} - ${text}`);
  }

  const data = await res.json();
  accessToken = data.access_token;
  console.log("   ✅ Reddit authenticated");
  return accessToken;
}

// ─────────────────────────────────────────────
// Reddit API Calls
// ─────────────────────────────────────────────

async function redditPost(
  subreddit: string,
  title: string,
  body: {
    type: "link" | "self";
    url?: string;
    text?: string;
  },
  flairId?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  if (!accessToken) throw new Error("Not authenticated");

  const subName = subreddit.replace("r/", "");
  const username = process.env.REDDIT_USERNAME || "zoltai";

  const params: Record<string, string> = {
    sr: subName,
    title,
    kind: body.type === "link" ? "link" : "self",
    resubmit: "true",
    send_replies: "false",
  };

  if (body.type === "link" && body.url) {
    params.url = body.url;
  } else if (body.text) {
    params.text = body.text;
  }

  if (flairId) {
    params.flair_id = flairId;
  }

  const res = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": `zoltai-bot/1.0 (by /u/${username})`,
    },
    body: new URLSearchParams(params),
  });

  if (!res.ok) {
    const text = await res.text();
    return { success: false, error: `${res.status}: ${text}` };
  }

  const data = await res.json();

  if (data.json?.errors?.length > 0) {
    return {
      success: false,
      error: data.json.errors.map((e: any) => e.join(": ")).join(", "),
    };
  }

  const postUrl = data.json?.data?.url || "";
  return { success: true, url: postUrl };
}

// ─────────────────────────────────────────────
// Content Formatting for Reddit
// ─────────────────────────────────────────────

function buildRedditPost(article: {
  title: string;
  description: string;
  content: string;
  slug: string;
  tags: string[];
}): { title: string; body: string } {
  // Extract first ~300 words of the article content (strip markdown)
  const cleanContent = article.content
    .replace(/^---[\s\S]*?---/, "") // remove frontmatter
    .replace(/!\[.*?\]\(.*?\)/g, "") // remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // links → text only
    .replace(/#{1,6}\s/g, "**") // headers → bold
    .replace(/\*\*\s*\n/g, "**\n\n") // fix bold newlines
    .replace(/```[\s\S]*?```/g, "") // remove code blocks
    .replace(/\n{3,}/g, "\n\n") // collapse newlines
    .trim();

  const words = cleanContent.split(/\s+/);
  const excerpt = words.slice(0, 250).join(" ");
  const isTruncated = words.length > 250;

  // Reddit-friendly title (remove year clickbait, keep value)
  const redditTitle = article.title
    .replace(/\s*\d{4}\s*/g, " ") // remove years
    .replace(/\s+/g, " ")
    .trim();

  // Build self-post body
  const articleUrl = `${SITE_URL}/blog/${article.slug}?utm_source=reddit&utm_medium=social&utm_campaign=post`;

  const body = `${excerpt}${isTruncated ? "..." : ""}

---

${isTruncated ? `**[Read the full article with detailed comparisons and pricing →](${articleUrl})**` : `**[Full article with more details →](${articleUrl})**`}

*I write about practical AI tools and workflows at [zoltai.org](${SITE_URL}?utm_source=reddit&utm_medium=social&utm_campaign=post). No coding required — practical guides for everyone.*

*What tools are you all using? Curious to hear what's working for others.*`;

  return {
    title: redditTitle,
    body,
  };
}

// ─────────────────────────────────────────────
// Article Selection + Subreddit Matching
// ─────────────────────────────────────────────

interface ArticleMeta {
  title: string;
  description: string;
  content: string;
  slug: string;
  tags: string[];
  date: string;
}

function getAllArticles(): ArticleMeta[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    return {
      title: data.title || "",
      description: data.description || "",
      content,
      slug: file.replace(".mdx", ""),
      tags: data.tags || [],
      date: data.date || "",
    };
  });
}

function getSubredditsForArticle(tags: string[]): SubredditConfig[] {
  const matched = new Map<string, SubredditConfig>();

  for (const tag of tags) {
    const subs = TAG_SUBREDDIT_MAP[tag] || [];
    for (const sub of subs) {
      if (!matched.has(sub.name)) {
        matched.set(sub.name, sub);
      }
    }
  }

  // If no matches, use defaults
  if (matched.size === 0) {
    for (const sub of DEFAULT_SUBREDDITS) {
      matched.set(sub.name, sub);
    }
  }

  // Limit to 3 subreddits per article (Reddit rate limits + anti-spam)
  return Array.from(matched.values()).slice(0, 3);
}

// ─────────────────────────────────────────────
// Posted Log (Prevent Duplicates)
// ─────────────────────────────────────────────

interface PostedEntry {
  slug: string;
  subreddit: string;
  url: string;
  date: string;
}

function loadPostedLog(): PostedEntry[] {
  if (!fs.existsSync(LOG_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function savePostedLog(entries: PostedEntry[]) {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(LOG_FILE, JSON.stringify(entries, null, 2));
}

function isAlreadyPosted(
  log: PostedEntry[],
  slug: string,
  subreddit: string
): boolean {
  return log.some((e) => e.slug === slug && e.subreddit === subreddit);
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log("🔴 Reddit Posting Automation");
  console.log("============================\n");

  // Authenticate
  await authenticate();

  // Load articles and posted log
  const articles = getAllArticles();
  const postedLog = loadPostedLog();

  console.log(`📝 Total articles: ${articles.length}`);
  console.log(`📋 Already posted entries: ${postedLog.length}\n`);

  // Sort articles by date (newest first) — post newest unposted article
  articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Find the first article that hasn't been fully posted
  let posted = 0;
  const MAX_POSTS_PER_RUN = 2; // Reddit rate limits — max 2 posts per run

  for (const article of articles) {
    if (posted >= MAX_POSTS_PER_RUN) break;

    const subreddits = getSubredditsForArticle(article.tags);
    const unpostedSubs = subreddits.filter(
      (sub) => !isAlreadyPosted(postedLog, article.slug, sub.name)
    );

    if (unpostedSubs.length === 0) continue;

    console.log(`\n📰 Article: "${article.title}"`);
    console.log(`   Slug: ${article.slug}`);
    console.log(`   Tags: ${article.tags.join(", ")}`);
    console.log(
      `   Target subs: ${unpostedSubs.map((s) => s.name).join(", ")}`
    );

    const { title, body } = buildRedditPost(article);

    for (const sub of unpostedSubs) {
      if (posted >= MAX_POSTS_PER_RUN) break;

      console.log(`\n   → Posting to ${sub.name} (${sub.postType} post)...`);

      const articleUrl = `${SITE_URL}/blog/${article.slug}?utm_source=reddit&utm_medium=social&utm_campaign=${sub.name.replace("r/", "")}`;

      const result = await redditPost(
        sub.name,
        title,
        sub.postType === "link"
          ? { type: "link", url: articleUrl }
          : { type: "self", text: body },
        sub.flairId
      );

      if (result.success) {
        console.log(`   ✅ Posted! ${result.url}`);
        postedLog.push({
          slug: article.slug,
          subreddit: sub.name,
          url: result.url || "",
          date: new Date().toISOString(),
        });
        posted++;
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        // If it's a rate limit or banned sub, still log it to avoid retrying
        if (
          result.error?.includes("RATELIMIT") ||
          result.error?.includes("banned")
        ) {
          postedLog.push({
            slug: article.slug,
            subreddit: sub.name,
            url: "FAILED:" + (result.error || "unknown"),
            date: new Date().toISOString(),
          });
        }
      }

      // Wait 2 minutes between posts (Reddit anti-spam)
      if (posted < MAX_POSTS_PER_RUN && unpostedSubs.indexOf(sub) < unpostedSubs.length - 1) {
        console.log("   ⏳ Waiting 2 minutes (rate limit)...");
        await new Promise((r) => setTimeout(r, 120_000));
      }
    }
  }

  // Save log
  savePostedLog(postedLog);
  console.log(`\n✅ Done! Posted ${posted} times this run.`);
  console.log(`📊 Total posted entries: ${postedLog.length}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
