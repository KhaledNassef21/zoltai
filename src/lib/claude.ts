import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractJSON(text: string): string {
  const match = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  return match ? match[1].trim() : text.trim();
}

export async function generateArticle(topic: string): Promise<{
  title: string;
  description: string;
  content: string;
  tags: string[];
  imagePrompt: string;
  instagramCaption: string;
  instagramHook: string;
}> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 5000,
    messages: [
      {
        role: "user",
        content: `You are an expert AI tools writer for "Zoltai" (zoltai.org), a website that helps people discover and use AI tools effectively — no coding required.

Write a comprehensive, SEO-optimized blog article about: "${topic}"

CRITICAL REQUIREMENTS:
- Every article MUST have a PRACTICAL VALUE ANGLE — show readers how to USE AI effectively
- Write in an engaging, motivating tone — make readers feel they can start TODAY
- Include practical use cases and real-world applications
- NEVER include income claims, dollar amounts, or "make money" language
- Focus on productivity, learning, and skill development
- Include practical, step-by-step examples anyone can follow
- Use proper markdown formatting with headers (##, ###)
- Length: 1500-2500 words
- Naturally include relevant keywords for SEO
- When mentioning AI tools, recommend them with helpful, recommendation-style language:
  - "I highly recommend X" / "The best tool for this is X" / "Start with X (it's free)"
- Include a "Quick Summary" section at the top with key takeaways
- Include a "What Can You Achieve?" section
- End with a clear "Which Tool Should You Start With?" recommendation section
- ALWAYS mention pricing (free tier, paid plans) when discussing tools
- Include a call-to-action: "Check out our full tools directory at zoltai.org/tools"

Available tools to recommend (use these names exactly):
ChatGPT, Claude, Midjourney, Jasper, Copy.ai, Cursor, GitHub Copilot, Bolt.new, Canva AI, ElevenLabs, Runway, Leonardo AI, Perplexity, Notion AI, Zapier, Semrush, Surfer SEO, Writesonic

ALSO GENERATE:
1. A featured image prompt for AI image generation — must be DIRECTLY related to the article topic. Style: modern tech, SaaS dashboard, laptop scene, AI tools interface. 16:9 aspect ratio. NO random stock photos.
2. An Instagram caption (short, value-driven, ends with CTA to read the full article. NO income claims or dollar amounts.)
3. An Instagram hook (first line that grabs attention, about AI tools and productivity. NO "make money" or income language.)

Return your response in this exact JSON format:
{
  "title": "Article title (60 chars max, SEO-friendly, include year)",
  "description": "Meta description (155 chars max, include value proposition)",
  "content": "Full article in markdown",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "imagePrompt": "Detailed image generation prompt, photorealistic, modern tech, SaaS UI, 16:9, related to article topic",
  "instagramCaption": "Short engaging caption with emoji, value bullets, CTA to article link",
  "instagramHook": "Attention-grabbing first line for Instagram post"
}

Return ONLY the JSON, no other text.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text));
}

export async function researchTrendingTopics(existingTitles: string[] = []): Promise<string[]> {
  const existingList = existingTitles.length > 0
    ? `\n\nIMPORTANT - These articles ALREADY EXIST on the site. Do NOT suggest similar topics:\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nYour suggestions must cover COMPLETELY DIFFERENT tools, niches, or angles than the above.`
    : "";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are an SEO content strategist for "Zoltai", a website about using AI tools effectively (no coding required).

Suggest 5 HIGH-CONVERSION article topics that would:
1. Rank well in search engines (target long-tail keywords)
2. Drive engagement and tool exploration
3. Answer high-intent search queries
4. Help people USE AI tools effectively

Article types to rotate between:
- "Best X tools for Y" (e.g., "Best AI tools for freelancers to boost workflow")
- "X vs Y" comparisons (e.g., "Jasper vs Copy.ai: Which is better for content?")
- "How to use X" tutorials (e.g., "How to create AI art with Midjourney")
- "Top free X tools" listicles (e.g., "Top 10 free AI tools to improve productivity")
- Review articles (e.g., "Midjourney review: Is it worth learning in 2026?")
- Workflow guides (e.g., "5 ways to save time with ChatGPT")

Cover DIVERSE niches: writing, design, video, coding, marketing, SEO, social media, e-commerce, freelancing, education, music, data analysis.

Tools to cover: ChatGPT, Claude, Midjourney, Cursor, Jasper, Copy.ai, Notion AI, Perplexity, Bolt.new, GitHub Copilot, Semrush, Leonardo AI, Runway, ElevenLabs, Canva AI, Descript, Synthesia, Pictory, Writesonic, Grammarly AI, Otter.ai, Murf AI.
${existingList}

Return a JSON array of 5 topic strings. Each topic MUST be unique and different from the others AND from existing articles. Return ONLY the JSON array, no other text.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text));
}

export async function optimizeForSEO(
  content: string,
  currentTitle: string
): Promise<{
  title: string;
  description: string;
  content: string;
  keywords: string[];
}> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are an SEO expert. Optimize this blog article for search engines.

Current title: "${currentTitle}"

Article content:
${content}

Tasks:
1. Optimize the title for SEO (keep under 60 chars)
2. Write an optimized meta description (under 155 chars)
3. Improve the content for better keyword density and readability
4. Suggest target keywords

Return in JSON format:
{
  "title": "optimized title",
  "description": "optimized meta description",
  "content": "optimized markdown content",
  "keywords": ["keyword1", "keyword2"]
}

Return ONLY the JSON.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(extractJSON(text));
}
