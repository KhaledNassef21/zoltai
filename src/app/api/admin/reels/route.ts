import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isAuthenticated } from "@/lib/admin-auth";

const REELS_DIR = path.join(process.cwd(), "data/reels");
const TMP_REELS_DIR = "/tmp/reels";
const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

/** Check if reels file exists in primary or tmp location */
function getReelsFile(slug: string): string | null {
  const primary = path.join(REELS_DIR, `${slug}.json`);
  if (fs.existsSync(primary)) return primary;
  const tmp = path.join(TMP_REELS_DIR, `${slug}.json`);
  if (fs.existsSync(tmp)) return tmp;
  return null;
}

// ==================== GET: List all reels ====================
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get ALL articles (with or without reels)
    const articles: any[] = [];

    if (fs.existsSync(CONTENT_DIR)) {
      const mdxFiles = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

      for (const file of mdxFiles) {
        const slug = file.replace(".mdx", "");
        const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
        const { data } = matter(raw);

        // Check if reels exist (primary + /tmp)
        let reelCount = 0;
        let generatedAt = "";
        const reelsFile = getReelsFile(slug);

        if (reelsFile) {
          try {
            const reelsData = JSON.parse(fs.readFileSync(reelsFile, "utf-8"));
            reelCount = reelsData.reels?.length || 0;
            generatedAt = reelsData.generatedAt || "";
          } catch {}
        }

        articles.push({
          slug,
          title: data.title || slug,
          date: data.date || "",
          hasReels: reelCount > 0,
          reelCount,
          generatedAt,
        });
      }
    }

    // Sort: articles without reels first, then by date
    articles.sort((a, b) => {
      if (a.hasReels !== b.hasReels) return a.hasReels ? 1 : -1;
      return (b.date || "").localeCompare(a.date || "");
    });

    const totalReels = articles.reduce((sum, a) => sum + a.reelCount, 0);

    return NextResponse.json({ articles, total: totalReels });
  } catch (err) {
    console.error("Failed to load reels:", err);
    return NextResponse.json({ error: "Failed to load reels" }, { status: 500 });
  }
}

// ==================== POST: Get specific article's reels ====================
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const file = getReelsFile(slug);
    if (!file) {
      return NextResponse.json({ error: "No reels for this article" }, { status: 404 });
    }

    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Failed to load reels" }, { status: 500 });
  }
}

// ==================== PUT: Generate reels for an article ====================
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

    // Extract tools
    const KNOWN_TOOLS = [
      "ChatGPT", "Claude", "Midjourney", "Jasper", "Copy.ai", "Cursor",
      "GitHub Copilot", "Bolt.new", "Canva AI", "ElevenLabs", "Runway",
      "Leonardo AI", "Perplexity", "Notion AI", "Zapier", "Semrush",
      "Surfer SEO", "Writesonic", "Grammarly",
    ];
    const lower = `${title} ${content}`.toLowerCase();
    const tools = KNOWN_TOOLS.filter((t) => lower.includes(t.toLowerCase()));

    let reels;

    // Try Claude API
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const Anthropic = (await import("@anthropic-ai/sdk")).default;
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

        const toolList = tools.length > 0 ? tools.join(", ") : "AI tools";
        const articleExcerpt = content.slice(0, 3000);

        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 6000,
          messages: [{
            role: "user",
            content: `You are a viral short-form video scriptwriter for "Zoltai" (@zoltai.ai), a brand about discovering and using AI tools for productivity.

Generate 10 Instagram Reels scripts based on this article:

TITLE: "${title}"
DESCRIPTION: "${description}"
TOOLS MENTIONED: ${toolList}
TAGS: ${tags.join(", ")}

ARTICLE CONTENT (excerpt):
${articleExcerpt}

Each Reel must be a DIFFERENT format:
1. 🪝 HOOK/CURIOSITY — Open with a shocking stat or question about AI productivity
2. 🛠️ TOOL DEMO — Quick showcase of the main tool (${tools[0] || "the AI tool"})
3. 📋 STEP-BY-STEP — 3-5 step mini tutorial
4. 🔄 BEFORE/AFTER — Contrast life without vs with the AI tool
5. 💡 VALUE BREAKDOWN — Show what the tool costs vs time saved
6. ⚔️ COMPARISON — ${tools.length >= 2 ? `${tools[0]} vs ${tools[1]}` : "Best free vs paid option"} in 30 seconds
7. ⚡ QUICK TIP — One specific, actionable hack
8. 🤯 MYTH BUSTER — Debunk a common misconception
9. 📖 STORY — Mini success story of someone using these tools
10. 📊 LIST/RANKING — "Top 3 ${tags[0]?.replace(/-/g, " ") || "AI tools"}"

RULES:
- Hook MUST grab attention in first 3 seconds
- Script: 80-150 words (30-60 sec reel)
- Conversational, energetic tone
- Include specific numbers (time saved, costs)
- Every reel ends with CTA to "Follow @zoltai.ai" or "Link in bio"
- On-screen text = 3-5 key phrases
- Caption: 5-8 relevant hashtags
- NO income promises. NO dollar amounts as earnings. Educational but exciting.
- Music vibe = mood suggestion

Return a JSON array of 10 objects:
[{"id":1,"format":"Hook/Curiosity","hook":"...","script":"...","onScreenText":["..."],"cta":"...","caption":"...","musicVibe":"...","duration":"30s"}]

Return ONLY the JSON array.`,
          }],
        });

        const text = response.content[0].type === "text" ? response.content[0].text : "";
        const match = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
        reels = JSON.parse(match ? match[1].trim() : text.trim());
      } catch (err) {
        console.error("Claude API failed for reels:", err);
        // Fall through to template
      }
    }

    // Fallback: Template-based
    if (!reels) {
      const mainTool = tools[0] || "AI";
      const secondTool = tools[1] || "ChatGPT";
      const topic = tags[0]?.replace(/-/g, " ") || "AI tools";
      const hashtags = `#AI #AITools #Productivity #${mainTool.replace(/[\s.]/g, "")} #Zoltai`;

      reels = [
        { id: 1, format: "Hook/Curiosity", hook: `${mainTool} is changing everything. Here's how.`, script: `Stop scrolling. ${mainTool} is helping regular people level up their workflow. The best part? Most features are free. In 30 seconds, I'll show you how to get started.`, onScreenText: [`Level up with ${mainTool}`, "Free to start", "No coding needed"], cta: "Follow @zoltai.ai", caption: `${mainTool} tips 🔥 ${hashtags}`, musicVibe: "upbeat electronic", duration: "30s" },
        { id: 2, format: "Tool Demo", hook: `Let me show you what ${mainTool} can do.`, script: `Everyone talks about ${mainTool} but nobody shows the best features. Watch this. Open it up, use it to create something valuable. One tool, hours saved. It's that simple.`, onScreenText: [`${mainTool} Demo`, "Save hours daily", "Free tier available"], cta: "Link in bio for full guide", caption: `🛠️ ${mainTool} walkthrough ${hashtags}`, musicVibe: "tech beats", duration: "30s" },
        { id: 3, format: "Step-by-Step", hook: "3 steps to get started today 👇", script: `Step 1: Sign up for ${mainTool}. Free. 2 minutes. Step 2: Create 3 sample projects. Step 3: Share your results. Most people see real improvement within a week.`, onScreenText: ["Step 1: Sign up", "Step 2: Create samples", "Step 3: Share results"], cta: "Save this. Follow @zoltai.ai", caption: `📋 Get started with ${mainTool} ${hashtags}`, musicVibe: "inspiring", duration: "30s" },
        { id: 4, format: "Before/After", hook: "Working 8 hours vs 1 hour with AI 🤯", script: `Before ${mainTool}: 8 hours on one task. After: 1 hour, same quality. That's 8x faster. This is why learning AI tools is essential right now.`, onScreenText: ["Before: 8 hours", "After: 1 hour", "8x faster", "Same quality"], cta: "Follow for AI tips", caption: `🔄 Before vs After ${mainTool} ${hashtags}`, musicVibe: "dramatic", duration: "30s" },
        { id: 5, format: "Value Breakdown", hook: "What AI tools actually cost vs save 💡", script: `${mainTool} costs $0-20/month. What it saves: hours of work daily. That means more time for creative work and learning. The ROI is massive, even on free tiers.`, onScreenText: ["Cost: $0-20/mo", "Hours saved daily", "Focus on creative work"], cta: "Full breakdown: link in bio", caption: `💡 AI tools value breakdown ${hashtags}`, musicVibe: "informative", duration: "30s" },
        { id: 6, format: "Comparison", hook: `${mainTool} vs ${secondTool} — which one?`, script: `${mainTool}: great for speed. ${secondTool}: better for deep work. Both free. Start with ${mainTool} as a beginner, use both as you grow.`, onScreenText: [`${mainTool}: Speed`, `${secondTool}: Depth`, "Both free", "Use both"], cta: "Full comparison: link in bio", caption: `⚔️ ${mainTool} vs ${secondTool} ${hashtags}`, musicVibe: "competitive", duration: "30s" },
        { id: 7, format: "Quick Tip", hook: `One ${mainTool} hack that changes everything ⚡`, script: `Don't just give simple prompts. Give it a ROLE first: "Act as a professional..." The quality difference is massive. Try it now.`, onScreenText: ["Give it a ROLE", "Quality = 10x better", "Try it now"], cta: "More hacks @zoltai.ai", caption: `⚡ Best ${mainTool} hack ${hashtags}`, musicVibe: "snappy electronic", duration: "15s" },
        { id: 8, format: "Myth Buster", hook: `"AI will replace all jobs" — truth:`, script: `AI isn't replacing people. People who USE AI are replacing people who don't. Learn ${mainTool} and stay ahead. Don't fear it — learn it.`, onScreenText: ["AI won't replace you", "People WITH AI will", "Learn it now"], cta: "Start learning @zoltai.ai", caption: `🤯 AI myth busted ${hashtags}`, musicVibe: "dramatic reveal", duration: "30s" },
        { id: 9, format: "Story", hook: "Zero AI skills to pro in 3 months 📖", script: `Someone started with no experience. Signed up for ${mainTool}. Month 1: basics. Month 2: confidence. Month 3: leading AI projects at work. The secret? They just started.`, onScreenText: ["Month 1: Learn", "Month 2: Build", "Month 3: Lead", "Just start"], cta: "Your turn. Follow @zoltai.ai", caption: `📖 AI success story ${hashtags}`, musicVibe: "inspiring buildup", duration: "60s" },
        { id: 10, format: "List/Ranking", hook: `Top 3 ${topic} tools right now 📊`, script: `#3: ${tools[2] || "Canva AI"} — beginner friendly. #2: ${secondTool} — powerful features. #1: ${mainTool} — best overall. All free to start. No excuses.`, onScreenText: [`#3: ${tools[2] || "Canva AI"}`, `#2: ${secondTool}`, `#1: ${mainTool} 🏆`, "All FREE"], cta: "Full ranking: link in bio", caption: `📊 Top ${topic} tools ${hashtags}`, musicVibe: "countdown", duration: "30s" },
      ];
    }

    // Save to data/reels/ (try primary dir, fallback to /tmp on Vercel)
    const pack = {
      slug,
      title,
      generatedAt: new Date().toISOString(),
      reels,
    };

    const packJson = JSON.stringify(pack, null, 2);
    let saved = false;

    // Try primary location
    try {
      if (!fs.existsSync(REELS_DIR)) fs.mkdirSync(REELS_DIR, { recursive: true });
      fs.writeFileSync(path.join(REELS_DIR, `${slug}.json`), packJson);
      saved = true;
    } catch (writeErr) {
      console.warn("Primary reels dir write failed, trying /tmp:", writeErr);
    }

    // Fallback: /tmp on Vercel
    if (!saved) {
      try {
        const tmpReelsDir = "/tmp/reels";
        if (!fs.existsSync(tmpReelsDir)) fs.mkdirSync(tmpReelsDir, { recursive: true });
        fs.writeFileSync(path.join(tmpReelsDir, `${slug}.json`), packJson);
        saved = true;
      } catch (tmpErr) {
        console.error("Failed to save reels to /tmp:", tmpErr);
      }
    }

    if (!saved) {
      return NextResponse.json({ error: "Failed to save reels — filesystem is read-only" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      slug,
      title,
      reelCount: reels.length,
      usedClaude: !!process.env.ANTHROPIC_API_KEY,
    });
  } catch (err) {
    console.error("Generate reels error:", err);
    return NextResponse.json({ error: "Failed to generate reels" }, { status: 500 });
  }
}
