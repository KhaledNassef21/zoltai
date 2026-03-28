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

export async function researchTrendingTopics(): Promise<string[]> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are an SEO content strategist for "Zoltai", an affiliate website about AI tools and productivity.

Suggest 5 HIGH-CONVERSION article topics that would:
1. Rank well in search engines (target long-tail keywords)
2. Drive affiliate clicks and signups
3. Answer buyer-intent search queries

Article types to rotate between:
- "Best X tools for Y" (e.g., "Best AI tools for students in 2026")
- "X vs Y" comparisons (e.g., "ChatGPT vs Claude: Which is better?")
- "How to use X for Y" tutorials (e.g., "How to use AI for SEO in 2026")
- "Top free X tools" listicles (e.g., "Top 10 free AI image generators")
- Review articles (e.g., "Cursor AI review: Is it worth it?")

Focus on tools like: ChatGPT, Claude, Midjourney, Cursor, Jasper, Notion AI, Perplexity, Bolt.new, GitHub Copilot, Semrush, Leonardo AI.

Return a JSON array of 5 topic strings. Return ONLY the JSON array, no other text.`,
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
