// src/lib/image-prompts.ts
/**
 * Context-Aware Image Prompt Generator
 *
 * Analyzes article content and generates specific, relevant image prompts
 * instead of random stock photos. Every image must:
 * - Be directly related to the article topic
 * - Show AI tools, dashboards, or SaaS interfaces
 * - Use clean, modern tech aesthetic
 * - Drive clicks and build trust
 */

export interface ImagePromptSet {
  featured: string; // 16:9 blog cover
  inline: string[]; // 16:9 in-article images
  instagram: string; // 1:1 square with text overlay concept
  instagramSlides: string[]; // 1:1 carousel slides
}

interface ArticleContext {
  title: string;
  description: string;
  content: string;
  tags: string[];
  toolsMentioned: string[];
  intent: "make-money" | "productivity" | "comparison" | "tutorial" | "review";
}

// Known AI tools and their visual associations
const TOOL_VISUALS: Record<string, string> = {
  chatgpt: "OpenAI ChatGPT interface with dark sidebar and conversation view",
  claude: "Anthropic Claude AI chat interface with clean minimal design",
  midjourney: "Midjourney Discord interface showing AI-generated artwork grid",
  jasper: "Jasper AI marketing dashboard with content templates",
  "copy.ai": "Copy.ai writing assistant with marketing copy generation",
  cursor: "Cursor AI code editor with autocomplete suggestions",
  "github copilot": "VS Code editor with GitHub Copilot inline suggestions",
  "bolt.new": "Bolt.new browser IDE with live preview of web application",
  "canva ai": "Canva design editor with AI-powered design suggestions",
  elevenlabs: "ElevenLabs voice synthesis dashboard with waveform visualization",
  runway: "Runway ML video editor with AI generation timeline",
  "leonardo ai": "Leonardo AI image generation interface with style controls",
  perplexity: "Perplexity AI search interface with cited sources",
  "notion ai": "Notion workspace with AI writing assistant sidebar",
  zapier: "Zapier automation workflow builder with connected app nodes",
  semrush: "Semrush SEO dashboard with keyword rankings and traffic graphs",
  "surfer seo": "Surfer SEO content editor with optimization score",
  writesonic: "Writesonic AI writer dashboard with article templates",
  grammarly: "Grammarly editor with AI writing suggestions highlighted",
  descript: "Descript audio/video editor with AI transcription",
  synthesia: "Synthesia AI avatar video creation interface",
  pictory: "Pictory AI video editor turning blog posts into videos",
  "murf ai": "Murf AI voiceover studio with voice selection panel",
  "otter.ai": "Otter.ai meeting transcription with highlighted key points",
};

// Intent-based visual themes
const INTENT_SCENES: Record<string, string[]> = {
  "make-money": [
    "laptop showing earnings dashboard with growing revenue chart, dollar signs",
    "freelancer workspace with multiple screens showing AI tools and payment notifications",
    "modern home office setup with laptop showing passive income analytics",
    "split screen: AI tool interface on left, payment/earnings on right",
  ],
  productivity: [
    "clean desk setup with laptop showing AI-powered workflow automation",
    "multiple browser tabs with AI tools boosting productivity",
    "time-saved visualization with AI automating repetitive tasks",
    "organized digital workspace with AI assistant helping manage tasks",
  ],
  comparison: [
    "side-by-side comparison of two AI tool interfaces on split screen",
    "laptop showing comparison table of AI tools with ratings",
    "multiple AI tool logos arranged on screen with versus/comparison layout",
    "dashboard showing feature comparison matrix of AI platforms",
  ],
  tutorial: [
    "step-by-step tutorial interface on laptop screen with numbered steps",
    "hands on keyboard following AI tool tutorial on screen",
    "screen recording style view of AI tool being configured step by step",
    "beginner-friendly setup guide displayed on modern laptop",
  ],
  review: [
    "single AI tool interface in focus with rating stars overlay",
    "detailed tool dashboard being reviewed on ultrawide monitor",
    "pros and cons layout of AI tool on sleek laptop display",
    "AI tool pricing page and features on screen with review notes",
  ],
};

const STYLE_BASE =
  "photorealistic, modern tech aesthetic, clean and minimal, soft ambient lighting, shallow depth of field, 8K quality, professional photography";

const STYLE_INSTAGRAM =
  "bold modern graphic design, dark background (#0a0a0a), purple (#7c3aed) and cyan accents, high contrast, clean typography, Instagram-optimized";

/**
 * Extract tools mentioned in article content
 */
export function extractToolsMentioned(content: string): string[] {
  const contentLower = content.toLowerCase();
  const found: string[] = [];

  for (const tool of Object.keys(TOOL_VISUALS)) {
    if (contentLower.includes(tool)) {
      found.push(tool);
    }
  }

  return found;
}

/**
 * Detect article intent from content and tags
 */
export function detectIntent(
  title: string,
  tags: string[],
  content: string
): ArticleContext["intent"] {
  const text = `${title} ${tags.join(" ")} ${content.slice(0, 500)}`.toLowerCase();

  if (text.includes(" vs ") || text.includes("comparison") || text.includes("compared"))
    return "comparison";
  if (text.includes("review") || text.includes("honest look") || text.includes("worth it"))
    return "review";
  if (text.includes("how to") || text.includes("step-by-step") || text.includes("tutorial") || text.includes("guide"))
    return "tutorial";
  if (text.includes("productivity") || text.includes("workflow") || text.includes("automate") || text.includes("save time"))
    return "productivity";

  return "make-money"; // Default: money-making angle
}

/**
 * Build full article context for image generation
 */
export function buildArticleContext(
  title: string,
  description: string,
  content: string,
  tags: string[]
): ArticleContext {
  return {
    title,
    description,
    content,
    tags,
    toolsMentioned: extractToolsMentioned(content),
    intent: detectIntent(title, tags, content),
  };
}

/**
 * Generate context-aware image prompts for an article
 */
export function generateImagePrompts(ctx: ArticleContext): ImagePromptSet {
  const toolVisuals = ctx.toolsMentioned
    .slice(0, 3)
    .map((t) => TOOL_VISUALS[t])
    .filter(Boolean);

  const intentScenes = INTENT_SCENES[ctx.intent] || INTENT_SCENES["make-money"];
  const randomScene = intentScenes[Math.floor(Math.random() * intentScenes.length)];

  // Primary tool visual (if tools are mentioned)
  const primaryToolVisual = toolVisuals[0] || "";

  // === FEATURED IMAGE (16:9) ===
  const featured = buildFeaturedPrompt(ctx, primaryToolVisual, randomScene);

  // === INLINE IMAGES (16:9) ===
  const inline = buildInlinePrompts(ctx, toolVisuals, intentScenes);

  // === INSTAGRAM POST (1:1) ===
  const instagram = buildInstagramPrompt(ctx);

  // === INSTAGRAM SLIDES (1:1) ===
  const instagramSlides = buildInstagramSlides(ctx, toolVisuals);

  return { featured, inline, instagram, instagramSlides };
}

function buildFeaturedPrompt(
  ctx: ArticleContext,
  toolVisual: string,
  scene: string
): string {
  const toolContext = toolVisual
    ? `showing ${toolVisual}`
    : `showing AI tools dashboard with analytics`;

  return `${scene}, ${toolContext}, related to "${ctx.title}". ${STYLE_BASE}, 16:9 aspect ratio, no text overlay, cinematic composition, hero image quality`;
}

function buildInlinePrompts(
  ctx: ArticleContext,
  toolVisuals: string[],
  intentScenes: string[]
): string[] {
  const prompts: string[] = [];

  // Inline 1: Tool-specific or intent-based
  if (toolVisuals.length > 0) {
    prompts.push(
      `Close-up of laptop screen ${toolVisuals[0]}, in modern workspace setting. ${STYLE_BASE}, 16:9 aspect ratio, detail shot`
    );
  } else {
    const scene = intentScenes[1] || intentScenes[0];
    prompts.push(
      `${scene}, related to ${ctx.tags.slice(0, 2).join(" and ")}. ${STYLE_BASE}, 16:9 aspect ratio`
    );
  }

  // Inline 2: Earnings/results or secondary tool
  if (ctx.intent === "make-money") {
    prompts.push(
      `Laptop screen showing earnings analytics dashboard with growing revenue graph, modern home office, ${STYLE_BASE}, 16:9 aspect ratio`
    );
  } else if (toolVisuals.length > 1) {
    prompts.push(
      `Close-up of screen ${toolVisuals[1]}, modern desk setup. ${STYLE_BASE}, 16:9 aspect ratio`
    );
  } else {
    prompts.push(
      `Person using AI tools on laptop in professional workspace, results visible on screen. ${STYLE_BASE}, 16:9 aspect ratio`
    );
  }

  return prompts;
}

function buildInstagramPrompt(ctx: ArticleContext): string {
  // Extract a short hook from the title
  const shortTitle = ctx.title.length > 40 ? ctx.title.slice(0, 37) + "..." : ctx.title;

  return `${STYLE_INSTAGRAM}, square format 1:1. Bold text overlay: "${shortTitle}". Background: abstract tech grid with glowing nodes, subtle AI circuit pattern. Purple gradient accent bar at bottom. Zoltai branding. High contrast, Instagram-optimized, eye-catching`;
}

function buildInstagramSlides(
  ctx: ArticleContext,
  toolVisuals: string[]
): string[] {
  const slides: string[] = [];

  // Slide 1: Title card
  slides.push(
    `${STYLE_INSTAGRAM}, square 1:1. Title card with bold text: "${ctx.title.slice(0, 50)}". Dark tech background with purple glow accents. Zoltai logo. Hook style, attention-grabbing`
  );

  // Slide 2-4: Content slides based on tools or intent
  if (toolVisuals.length > 0) {
    for (const visual of toolVisuals.slice(0, 2)) {
      slides.push(
        `Clean mockup of ${visual}, square 1:1 format, dark background, purple accent highlights on key features, modern UI screenshot style, ${STYLE_BASE}`
      );
    }
  }

  // Always add a CTA slide
  slides.push(
    `${STYLE_INSTAGRAM}, square 1:1. Call-to-action card: "Read Full Guide → zoltai.org". Arrow pointing right. Dark background with purple gradient. Bold, clear text. Swipe-up energy`
  );

  // Ensure at least 3 slides
  while (slides.length < 3) {
    slides.push(
      `AI tools productivity setup on laptop, square 1:1, ${STYLE_BASE}, showing dashboard with analytics`
    );
  }

  return slides;
}

/**
 * Validate that generated prompts are relevant
 */
export function validatePrompts(
  prompts: ImagePromptSet,
  ctx: ArticleContext
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check featured image relevance
  if (!prompts.featured.toLowerCase().includes("ai") &&
      !prompts.featured.toLowerCase().includes("tool") &&
      !prompts.featured.toLowerCase().includes("dashboard")) {
    issues.push("Featured image missing AI context");
  }

  // Check if any tool is referenced
  const hasToolRef = ctx.toolsMentioned.some(
    (t) =>
      prompts.featured.toLowerCase().includes(t) ||
      prompts.inline.some((p) => p.toLowerCase().includes(t))
  );
  if (ctx.toolsMentioned.length > 0 && !hasToolRef) {
    issues.push("No tool-specific visuals in prompts");
  }

  // Check Instagram has CTA
  const hasInstaCta = prompts.instagramSlides.some(
    (s) => s.toLowerCase().includes("cta") || s.toLowerCase().includes("zoltai")
  );
  if (!hasInstaCta) {
    issues.push("Instagram slides missing CTA");
  }

  return {
    valid: issues.length === 0,
    issues,
  };
}
