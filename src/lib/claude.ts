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
}> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are an expert AI & technology writer for "Zoltai", an affiliate website about AI tools and productivity.

Write a comprehensive, SEO-optimized blog article about: "${topic}"

Requirements:
- Write in an engaging, educational tone
- Target both beginners and professionals
- Include practical examples and actionable tips
- Use proper markdown formatting with headers (##, ###)
- Include a compelling introduction and conclusion
- Length: 1500-2500 words
- Naturally include relevant keywords for SEO
- When mentioning AI tools, naturally recommend them with enthusiasm
- Include a "Key Takeaways" or "Quick Summary" section at the top
- End with a clear recommendation or "Which tool should you pick?" section
- Mention pricing (free tier, paid plans) when discussing tools

Return your response in this exact JSON format:
{
  "title": "Article title (60 chars max, SEO-friendly)",
  "description": "Meta description (155 chars max)",
  "content": "Full article in markdown",
  "tags": ["tag1", "tag2", "tag3"]
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
        content: `You are an SEO content strategist for "Zoltai", a website about making money using AI tools (no coding required).

Suggest 5 HIGH-CONVERSION article topics that would:
1. Rank well in search engines (target long-tail keywords)
2. Drive affiliate clicks and signups
3. Answer buyer-intent search queries
4. Help people MAKE MONEY using AI tools

Article types to rotate between:
- "Best X tools for Y" (e.g., "Best AI tools for freelancers to earn $5K/month")
- "X vs Y" comparisons (e.g., "Jasper vs Copy.ai: Which makes you more money?")
- "How to make money with X" tutorials (e.g., "How to make $1000/month with AI art")
- "Top free X tools" listicles (e.g., "Top 10 free AI tools to start earning today")
- Review articles (e.g., "Midjourney review: Can you really sell AI art?")
- Income guides (e.g., "5 ways to earn passive income with ChatGPT")

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
