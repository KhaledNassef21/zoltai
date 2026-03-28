import type { Tool } from "@/components/tool-card";

export const toolCategories = [
  "All",
  "AI Writing",
  "AI Image",
  "AI Chatbot",
  "AI Coding",
  "SEO",
  "Productivity",
  "Hosting",
  "Research",
] as const;

export type ToolCategory = (typeof toolCategories)[number];

export const tools: Tool[] = [
  // === AI CHATBOTS ===
  {
    name: "ChatGPT Plus",
    slug: "chatgpt",
    description:
      "The most popular AI chatbot. Writing, coding, analysis, image generation, and browsing — all in one.",
    category: "AI Chatbot",
    useCase: "General-purpose AI assistant for any task",
    pricing: "Freemium",
    pricingDetail: "Free tier available. Plus plan $20/month.",
    url: "https://chat.openai.com",
    affiliateUrl: "https://chat.openai.com",
    featured: true,
    rating: 5,
  },
  {
    name: "Claude",
    slug: "claude",
    description:
      "Anthropic's AI assistant. Excels at long documents, coding, and nuanced analysis with 200K context.",
    category: "AI Chatbot",
    useCase: "Long-form analysis, coding, and research",
    pricing: "Freemium",
    pricingDetail: "Free tier available. Pro plan $20/month.",
    url: "https://claude.ai",
    affiliateUrl: "https://claude.ai",
    featured: true,
    rating: 5,
  },
  {
    name: "Google Gemini",
    slug: "gemini",
    description:
      "Google's multimodal AI with deep Google ecosystem integration, web access, and 1M token context.",
    category: "AI Chatbot",
    useCase: "Research with real-time web access",
    pricing: "Freemium",
    pricingDetail: "Free tier available. Advanced $20/month.",
    url: "https://gemini.google.com",
    affiliateUrl: "https://gemini.google.com",
    rating: 4,
  },

  // === AI WRITING ===
  {
    name: "Jasper",
    slug: "jasper",
    description:
      "Enterprise-grade AI writing platform for marketing teams. Blog posts, ads, emails, and social media.",
    category: "AI Writing",
    useCase: "Marketing content at scale",
    pricing: "Free Trial",
    pricingDetail: "7-day free trial. Plans from $49/month.",
    url: "https://jasper.ai",
    affiliateUrl: "https://jasper.ai",
    rating: 4,
  },
  {
    name: "Copy.ai",
    slug: "copyai",
    description:
      "AI copywriting tool for sales and marketing. Generate emails, product descriptions, and ad copy.",
    category: "AI Writing",
    useCase: "Sales copy and email campaigns",
    pricing: "Freemium",
    pricingDetail: "Free plan with 2000 words/month. Pro from $49/month.",
    url: "https://copy.ai",
    affiliateUrl: "https://copy.ai",
    rating: 4,
  },
  {
    name: "Writesonic",
    slug: "writesonic",
    description:
      "AI writer with SEO optimization, fact-checking, and brand voice. Supports 25+ languages.",
    category: "AI Writing",
    useCase: "SEO blog posts and multilingual content",
    pricing: "Freemium",
    pricingDetail: "Free trial available. Plans from $16/month.",
    url: "https://writesonic.com",
    affiliateUrl: "https://writesonic.com",
    rating: 4,
  },

  // === AI IMAGE ===
  {
    name: "Midjourney",
    slug: "midjourney",
    description:
      "Premium AI art generator creating stunning, artistic visuals from text prompts via Discord.",
    category: "AI Image",
    useCase: "Artistic illustrations and concept art",
    pricing: "Paid",
    pricingDetail: "Plans from $10/month.",
    url: "https://midjourney.com",
    affiliateUrl: "https://midjourney.com",
    featured: true,
    rating: 5,
  },
  {
    name: "Leonardo AI",
    slug: "leonardo-ai",
    description:
      "AI image generation platform with fine-tuned models, real-time canvas, and motion generation.",
    category: "AI Image",
    useCase: "Game assets, marketing visuals, and product design",
    pricing: "Freemium",
    pricingDetail: "150 free tokens/day. Plans from $12/month.",
    url: "https://leonardo.ai",
    affiliateUrl: "https://leonardo.ai",
    rating: 4,
  },
  {
    name: "Ideogram",
    slug: "ideogram",
    description:
      "AI image generator that excels at text rendering in images. Great for logos and posters.",
    category: "AI Image",
    useCase: "Images with accurate text and typography",
    pricing: "Freemium",
    pricingDetail: "Free tier with daily generations. Plus from $8/month.",
    url: "https://ideogram.ai",
    affiliateUrl: "https://ideogram.ai",
    rating: 4,
  },

  // === AI CODING ===
  {
    name: "Cursor",
    slug: "cursor",
    description:
      "AI-first code editor built on VS Code. Tab completion, inline editing, and chat-driven development.",
    category: "AI Coding",
    useCase: "Full-stack development with AI pair programming",
    pricing: "Freemium",
    pricingDetail: "Free hobby plan. Pro $20/month.",
    url: "https://cursor.sh",
    affiliateUrl: "https://cursor.sh",
    featured: true,
    rating: 5,
  },
  {
    name: "GitHub Copilot",
    slug: "github-copilot",
    description:
      "AI pair programmer by GitHub. Code suggestions, chat, and CLI assistance in your favorite editor.",
    category: "AI Coding",
    useCase: "Code completion and generation in any IDE",
    pricing: "Freemium",
    pricingDetail: "Free for students/OSS. Individual $10/month.",
    url: "https://github.com/features/copilot",
    affiliateUrl: "https://github.com/features/copilot",
    rating: 5,
  },
  {
    name: "Bolt.new",
    slug: "bolt-new",
    description:
      "AI full-stack web app builder. Describe your app and get a working prototype in minutes.",
    category: "AI Coding",
    useCase: "Rapid prototyping and MVPs",
    pricing: "Freemium",
    pricingDetail: "Free tier available. Pro from $20/month.",
    url: "https://bolt.new",
    affiliateUrl: "https://bolt.new",
    rating: 4,
  },

  // === SEO TOOLS ===
  {
    name: "Surfer SEO",
    slug: "surfer-seo",
    description:
      "AI-powered SEO tool for content optimization. Real-time scoring, keyword research, and SERP analysis.",
    category: "SEO",
    useCase: "Blog post SEO optimization",
    pricing: "Free Trial",
    pricingDetail: "7-day trial. Plans from $89/month.",
    url: "https://surferseo.com",
    affiliateUrl: "https://surferseo.com",
    rating: 4,
  },
  {
    name: "Semrush",
    slug: "semrush",
    description:
      "All-in-one SEO platform. Keyword research, site audit, competitor analysis, and rank tracking.",
    category: "SEO",
    useCase: "Comprehensive SEO and competitor research",
    pricing: "Free Trial",
    pricingDetail: "7-day free trial. Plans from $129/month.",
    url: "https://semrush.com",
    affiliateUrl: "https://semrush.com",
    rating: 5,
  },

  // === PRODUCTIVITY ===
  {
    name: "Notion AI",
    slug: "notion-ai",
    description:
      "AI-enhanced workspace for notes, docs, wikis, and projects. Summarize, write, and brainstorm with AI.",
    category: "Productivity",
    useCase: "Knowledge management and team collaboration",
    pricing: "Freemium",
    pricingDetail: "Free plan available. AI add-on $10/member/month.",
    url: "https://notion.so",
    affiliateUrl: "https://notion.so",
    rating: 5,
  },
  {
    name: "Zapier",
    slug: "zapier",
    description:
      "No-code automation platform connecting 6000+ apps. Automate workflows with AI-powered suggestions.",
    category: "Productivity",
    useCase: "Automating repetitive tasks between apps",
    pricing: "Freemium",
    pricingDetail: "Free plan with 100 tasks/month. Starter $19.99/month.",
    url: "https://zapier.com",
    affiliateUrl: "https://zapier.com",
    rating: 4,
  },

  // === RESEARCH ===
  {
    name: "Perplexity",
    slug: "perplexity",
    description:
      "AI-powered research engine with real-time web citations. Ask anything, get sourced answers.",
    category: "Research",
    useCase: "Research with verified sources and citations",
    pricing: "Freemium",
    pricingDetail: "Free tier available. Pro $20/month.",
    url: "https://perplexity.ai",
    affiliateUrl: "https://perplexity.ai",
    featured: true,
    rating: 5,
  },

  // === HOSTING ===
  {
    name: "Vercel",
    slug: "vercel",
    description:
      "Frontend cloud platform for deploying Next.js and React apps. Global CDN, serverless functions.",
    category: "Hosting",
    useCase: "Deploying modern web applications",
    pricing: "Freemium",
    pricingDetail: "Generous free tier. Pro $20/month.",
    url: "https://vercel.com",
    affiliateUrl: "https://vercel.com",
    rating: 5,
  },
];

export function getToolsByCategory(category: string): Tool[] {
  if (category === "All") return tools;
  return tools.filter((t) => t.category === category);
}

export function getFeaturedTools(): Tool[] {
  return tools.filter((t) => t.featured);
}

export function getToolBySlug(slug: string): Tool | undefined {
  return tools.find((t) => t.slug === slug);
}
