/**
 * Reels Content Generator
 *
 * Generates 10 Instagram/TikTok Reels scripts per blog article.
 * Each Reel covers a different angle of the article content.
 *
 * Output: data/reels/{slug}.json — ready-to-produce scripts with:
 * - Hook (first 3 seconds)
 * - Script (voiceover text, 30-60 seconds)
 * - On-screen text (key points shown as text overlays)
 * - CTA (call to action)
 * - Caption (Instagram caption with hashtags)
 * - Music suggestion
 *
 * The 10 Reel formats per article:
 * 1. 🪝 Hook/Curiosity — "Did you know AI can do this?"
 * 2. 🛠️ Tool Demo — Quick showcase of the main tool
 * 3. 📋 Step-by-Step — 3-5 step tutorial
 * 4. 🔄 Before/After — Life without vs with AI tool
 * 5. 💡 Value Breakdown — Cost vs time saved
 * 6. ⚔️ Comparison — Tool A vs Tool B in 30 seconds
 * 7. ⚡ Quick Tip — One actionable hack
 * 8. 🤯 Myth Buster — "People think X but actually Y"
 * 9. 📖 Story — Mini success story
 * 10. 📊 List/Ranking — "Top 3 tools for X"
 *
 * Uses Claude API to generate contextual scripts from article content.
 * Runs via GitHub Actions after article generation.
 */

import fs from "fs";
import path from "path";
import matter from "gray-matter";
import Anthropic from "@anthropic-ai/sdk";

const REELS_DIR = path.join(process.cwd(), "data/reels");
const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface ReelScript {
  id: number;
  format: string;
  hook: string; // First 3 seconds — attention grabber
  script: string; // Full voiceover (30-60 sec, ~80-150 words)
  onScreenText: string[]; // Text overlays shown during the reel
  cta: string; // Call to action
  caption: string; // Instagram caption with hashtags
  musicVibe: string; // Music mood suggestion
  duration: "15s" | "30s" | "60s";
}

interface ReelPack {
  slug: string;
  title: string;
  generatedAt: string;
  reels: ReelScript[];
}

// ─────────────────────────────────────────────
// Claude API
// ─────────────────────────────────────────────

function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  return match ? match[1].trim() : text.trim();
}

async function generateReelsWithClaude(
  title: string,
  description: string,
  content: string,
  tags: string[],
  tools: string[]
): Promise<ReelScript[]> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const toolList = tools.length > 0 ? tools.join(", ") : "AI tools";
  const articleExcerpt = content.slice(0, 3000); // Send first 3K chars for context

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 6000,
    messages: [
      {
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
2. 🛠️ TOOL DEMO — Quick showcase of the main tool (${tools[0] || "the AI tool"}) and what it does
3. 📋 STEP-BY-STEP — 3-5 step mini tutorial anyone can follow
4. 🔄 BEFORE/AFTER — Contrast life without vs with the AI tool
5. 💡 VALUE BREAKDOWN — Show what the tool costs vs time/effort saved
6. ⚔️ COMPARISON — ${tools.length >= 2 ? `${tools[0]} vs ${tools[1]}` : "Best free vs paid option"} in 30 seconds
7. ⚡ QUICK TIP — One specific, actionable hack from the article
8. 🤯 MYTH BUSTER — Debunk a common misconception about this topic
9. 📖 STORY — Mini success story of someone using these tools to level up
10. 📊 LIST/RANKING — "Top 3 ${tags[0]?.replace(/-/g, " ") || "AI tools"} to learn now"

RULES:
- Hook MUST grab attention in first 3 seconds (question, bold claim, or pattern interrupt)
- Script should be 80-150 words (30-60 second reel)
- Use conversational, energetic tone — like talking to a friend
- Include specific numbers (time saved, costs, productivity gains)
- Every reel ends with CTA to "Follow @zoltai.ai" or "Link in bio"
- On-screen text = 3-5 key phrases shown as text overlays
- Caption includes 5-8 relevant hashtags
- NO cringe. NO income promises. NO dollar amounts as earnings. Keep it educational but exciting.
- Music vibe = mood suggestion (e.g., "upbeat electronic", "inspiring ambient")

Return a JSON array of 10 objects:
[
  {
    "id": 1,
    "format": "Hook/Curiosity",
    "hook": "First 3 seconds text (spoken + shown on screen)",
    "script": "Full voiceover script (80-150 words)",
    "onScreenText": ["Key phrase 1", "Key phrase 2", "Key phrase 3"],
    "cta": "Call to action text",
    "caption": "Instagram caption with hashtags",
    "musicVibe": "Music mood suggestion",
    "duration": "30s"
  }
]

Return ONLY the JSON array.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text));
}

// ─────────────────────────────────────────────
// Fallback: Template-Based Generation (no API needed)
// ─────────────────────────────────────────────

function generateReelsFromTemplate(
  title: string,
  description: string,
  tools: string[],
  tags: string[]
): ReelScript[] {
  const mainTool = tools[0] || "AI";
  const secondTool = tools[1] || "ChatGPT";
  const topic = tags[0]?.replace(/-/g, " ") || "AI tools";
  const hashtags = `#AI #AITools #Productivity #${mainTool.replace(/[\s.]/g, "")} #AIWorkflow #LearnAI #Zoltai`;

  return [
    {
      id: 1,
      format: "Hook/Curiosity",
      hook: `People are transforming their workflow with ${mainTool}. Here's how.`,
      script: `Stop scrolling. This is important. ${mainTool} is helping regular people — not tech experts — level up their skills and productivity. And the best part? Most of these tools have free tiers. You don't need to invest anything to start. In the next 30 seconds, I'll show you exactly how to get started. No coding. No experience needed.`,
      onScreenText: [`Level up with ${mainTool}`, "Free to start", "No coding needed", "Follow for more"],
      cta: "Follow @zoltai.ai for daily AI tips",
      caption: `${mainTool} is a game-changer if you know how to use it.\n\nFull guide in bio → zoltai.org\n\n${hashtags}`,
      musicVibe: "upbeat electronic, motivational",
      duration: "30s",
    },
    {
      id: 2,
      format: "Tool Demo",
      hook: `Let me show you what ${mainTool} can actually do.`,
      script: `Everyone talks about ${mainTool} but nobody shows you the best features. Watch this. First, you open ${mainTool}. Then you use it to create something valuable — whether that's content, code, designs, or analysis. The key is: you're using it to work smarter and deliver quality results faster. This one tool can replace hours of manual work. It's a real productivity multiplier.`,
      onScreenText: [`${mainTool} Demo`, "Create value in minutes", "Save hours of work", "Free tier available"],
      cta: "Link in bio for the full tool guide",
      caption: `🛠️ ${mainTool} walkthrough — the features nobody talks about\n\nFull review: link in bio\n\n${hashtags}`,
      musicVibe: "tech, futuristic beats",
      duration: "30s",
    },
    {
      id: 3,
      format: "Step-by-Step",
      hook: "3 steps to get started with AI today 👇",
      script: `Step 1: Sign up for ${mainTool}. It's free. Takes 2 minutes. Step 2: Use it to create 3 sample projects. If it's writing, create sample blog posts. If it's design, create sample graphics. Step 3: Build a portfolio showcasing what you can do with AI tools. Most people see real results within a week. Then you keep building from there. Simple as that.`,
      onScreenText: ["Step 1: Sign up (free)", "Step 2: Create 3 samples", "Step 3: Build your portfolio", "Start building today"],
      cta: "Save this. Follow @zoltai.ai for more",
      caption: `📋 Get started with AI tools — save this for later\n\nStep-by-step guide: link in bio\n\n${hashtags}`,
      musicVibe: "inspiring, building momentum",
      duration: "30s",
    },
    {
      id: 4,
      format: "Before/After",
      hook: "Working 8 hours vs working 1 hour with AI 🤯",
      script: `Before ${mainTool}: You spend 8 hours writing one blog post. After ${mainTool}: You spend 1 hour creating the same quality post. That means you can take on more projects, learn faster, and deliver better work. Same quality. 8x faster. This is why people who learn AI tools have a real advantage right now.`,
      onScreenText: ["Before: 8 hours per task", "After: 1 hour per task", "8x faster output", "Same quality"],
      cta: "Follow for AI tips @zoltai.ai",
      caption: `🔄 Before vs After using ${mainTool}\n\nThe productivity difference is real.\n\n${hashtags}`,
      musicVibe: "dramatic transition, cinematic",
      duration: "30s",
    },
    {
      id: 5,
      format: "Value Breakdown",
      hook: "Let's break down what AI tools actually cost vs what they save 💡",
      script: `Here's the real breakdown. ${mainTool} costs: $0 to $20 per month. What it saves you: hours of repetitive work every day. Time per project with AI: 30 minutes instead of 3-4 hours manually. That means you can take on more projects, learn new skills faster, and focus on creative work instead of busywork. The ROI on learning these tools is massive — even on the free tiers.`,
      onScreenText: [`${mainTool}: $0-20/mo`, "Hours saved daily", "Focus on creative work", "Free tiers available"],
      cta: "Want the full breakdown? Link in bio",
      caption: `💡 The real value of AI tools — it's about time saved\n\nFull guide: link in bio\n\n${hashtags}`,
      musicVibe: "upbeat, informative",
      duration: "30s",
    },
    {
      id: 6,
      format: "Comparison",
      hook: `${mainTool} vs ${secondTool} — which one should you learn first?`,
      script: `Quick comparison. ${mainTool}: great for ${topic}. Pricing starts free. Best if you want speed and ease of use. ${secondTool}: stronger for detailed analysis and complex tasks. Also has a free tier. My honest take? Start with ${mainTool} if you're a beginner. Switch to ${secondTool} once you're more advanced. Or use both — that's what the most productive people do.`,
      onScreenText: [`${mainTool}: Best for beginners`, `${secondTool}: Best for advanced`, "Both have free tiers", "Use both for best results"],
      cta: "Full comparison on zoltai.org — link in bio",
      caption: `⚔️ ${mainTool} vs ${secondTool} — honest comparison\n\nDetailed review: link in bio\n\n${hashtags}`,
      musicVibe: "competitive, energetic",
      duration: "30s",
    },
    {
      id: 7,
      format: "Quick Tip",
      hook: "One ${mainTool} hack that 10x'd my output ⚡",
      script: `Here's a hack most people don't know. When using ${mainTool}, don't just give it a simple prompt. Give it a ROLE first. Say: "Act as a professional copywriter with 10 years of experience." Then give your task. The quality difference is insane. This one trick dramatically improved my results because the output is SO much better. The quality rivals professional-level work.`,
      onScreenText: ["Give it a ROLE first", '"Act as a professional..."', "Quality = 10x better", "Better results instantly"],
      cta: "More hacks at @zoltai.ai",
      caption: `⚡ The #1 ${mainTool} hack nobody uses\n\nMore tips: follow @zoltai.ai\n\n${hashtags}`,
      musicVibe: "quick, snappy, electronic",
      duration: "15s",
    },
    {
      id: 8,
      format: "Myth Buster",
      hook: `"AI will replace all jobs" — here's the truth`,
      script: `Everyone says AI will replace jobs. Here's what's actually happening. AI is not replacing people. People who USE AI are replacing people who don't. The professionals who learn ${mainTool} aren't worried about AI taking their jobs. They're USING it to do 10x more work in less time. While others panic, they're building new skills. Don't fear AI. Learn to use it. That's the real opportunity.`,
      onScreenText: ["AI won't replace you", "People WITH AI will", "Use it = level up", "Fear it = fall behind"],
      cta: "Start learning at @zoltai.ai",
      caption: `🤯 The biggest myth about AI and jobs — debunked\n\nLearn AI tools: link in bio\n\n${hashtags}`,
      musicVibe: "dramatic reveal, documentary style",
      duration: "30s",
    },
    {
      id: 9,
      format: "Story",
      hook: "From zero AI skills to pro-level workflows in 3 months 📖",
      script: `Let me tell you about someone who started with nothing. No tech skills. No audience. No experience with AI. They signed up for ${mainTool} — free tier. Started learning and building projects. Month 1: learned the basics, created their first AI-assisted projects. Month 2: got confident, started helping others. Month 3: became the go-to person for AI workflows at their company. The secret? They didn't try to be perfect. They just started. Today they're leading AI initiatives and growing. Your story could be next.`,
      onScreenText: ["Month 1: Learn the basics", "Month 2: Build confidence", "Month 3: Become the expert", "Keep growing 🚀"],
      cta: "Your turn. Follow @zoltai.ai",
      caption: `📖 Real story: from AI beginner to expert with ${mainTool}\n\nStart your journey: link in bio\n\n${hashtags}`,
      musicVibe: "inspiring, emotional buildup",
      duration: "60s",
    },
    {
      id: 10,
      format: "List/Ranking",
      hook: `Top 3 ${topic} tools to learn right now 📊`,
      script: `Number 3: ${tools[2] || "Canva AI"} — perfect for beginners. Free tier. Easy to use. Number 2: ${secondTool} — more powerful features. Great for scaling your skills. Number 1: ${mainTool} — the best overall for productivity. It's versatile, widely adopted, and employers are actively looking for people who can use it. All three have free tiers. Start today. Zero excuses.`,
      onScreenText: [`#3: ${tools[2] || "Canva AI"}`, `#2: ${secondTool}`, `#1: ${mainTool} 🏆`, "All FREE to start"],
      cta: "Full ranking at zoltai.org — link in bio",
      caption: `📊 Top 3 ${topic} tools ranked by usefulness\n\nFull list: link in bio\n\n${hashtags}`,
      musicVibe: "countdown, building anticipation",
      duration: "30s",
    },
  ];
}

// ─────────────────────────────────────────────
// Tool Extraction (same as image-prompts.ts)
// ─────────────────────────────────────────────

const KNOWN_TOOLS = [
  "ChatGPT", "Claude", "Midjourney", "Jasper", "Copy.ai", "Cursor",
  "GitHub Copilot", "Bolt.new", "Canva AI", "ElevenLabs", "Runway",
  "Leonardo AI", "Perplexity", "Notion AI", "Zapier", "Semrush",
  "Surfer SEO", "Writesonic", "Grammarly",
];

function extractTools(content: string): string[] {
  const lower = content.toLowerCase();
  return KNOWN_TOOLS.filter((t) => lower.includes(t.toLowerCase()));
}

// ─────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────

async function main() {
  console.log("🎬 Reels Content Generator");
  console.log("==========================\n");

  if (!fs.existsSync(REELS_DIR)) fs.mkdirSync(REELS_DIR, { recursive: true });
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error("❌ No content directory found");
    process.exit(1);
  }

  const useClaude = !!process.env.ANTHROPIC_API_KEY;
  console.log(`🤖 Mode: ${useClaude ? "Claude API (smart generation)" : "Template-based (no API key)"}\n`);

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  console.log(`📚 Found ${files.length} articles\n`);

  let generated = 0;
  const MAX_PER_RUN = 3; // Generate for max 3 articles per run (API cost control)

  for (const file of files) {
    if (generated >= MAX_PER_RUN) break;

    const slug = file.replace(".mdx", "");
    const reelsFile = path.join(REELS_DIR, `${slug}.json`);

    // Skip if already generated
    if (fs.existsSync(reelsFile)) {
      console.log(`⏭️  ${slug} — already has reels`);
      continue;
    }

    console.log(`\n🎬 Generating reels for: ${slug}`);

    // Read article
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const title = data.title || slug;
    const description = data.description || "";
    const tags: string[] = data.tags || [];
    const tools = extractTools(`${title} ${content}`);

    console.log(`   Title: ${title}`);
    console.log(`   Tools: ${tools.join(", ") || "general"}`);
    console.log(`   Tags: ${tags.slice(0, 3).join(", ")}`);

    let reels: ReelScript[];

    if (useClaude) {
      try {
        console.log("   🤖 Generating with Claude API...");
        reels = await generateReelsWithClaude(title, description, content, tags, tools);
        console.log(`   ✅ Got ${reels.length} reels from Claude`);
      } catch (err) {
        console.warn(`   ⚠️ Claude failed: ${(err as Error).message}`);
        console.log("   📝 Falling back to templates...");
        reels = generateReelsFromTemplate(title, description, tools, tags);
      }
    } else {
      console.log("   📝 Using templates...");
      reels = generateReelsFromTemplate(title, description, tools, tags);
    }

    // Save
    const pack: ReelPack = {
      slug,
      title,
      generatedAt: new Date().toISOString(),
      reels,
    };

    fs.writeFileSync(reelsFile, JSON.stringify(pack, null, 2));
    console.log(`   💾 Saved to data/reels/${slug}.json (${reels.length} reels)`);
    generated++;

    // Delay between API calls
    if (useClaude && generated < MAX_PER_RUN) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n✅ Done! Generated reels for ${generated} articles.`);
  console.log(`📁 Reels saved in: data/reels/`);

  // Summary
  const totalReels = fs.readdirSync(REELS_DIR).filter((f) => f.endsWith(".json")).length;
  console.log(`📊 Total articles with reels: ${totalReels}/${files.length}`);
  console.log(`🎬 Total reel scripts: ${totalReels * 10}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
