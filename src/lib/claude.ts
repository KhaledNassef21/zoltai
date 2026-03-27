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
        content: `You are an expert AI & technology writer for "Zoltai", a website about AI tools and productivity.

Write a comprehensive, SEO-optimized blog article about: "${topic}"

Requirements:
- Write in an engaging, educational tone
- Target both beginners and professionals
- Include practical examples and actionable tips
- Use proper markdown formatting with headers (##, ###)
- Include a compelling introduction and conclusion
- Length: 1500-2500 words
- Naturally include relevant keywords for SEO

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
        content: `You are an AI content strategist for "Zoltai", a website about AI tools and productivity.

Suggest 5 trending, high-search-volume article topics about AI tools and productivity that would perform well in search engines right now.

Focus on:
- New AI tools and updates
- AI productivity workflows
- AI for specific professions
- AI comparisons and reviews
- How-to guides for AI tools

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
