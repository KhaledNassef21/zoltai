// src/lib/claude.ts
// 🔄 مؤقت: استخدام OpenAI بدلاً من Anthropic للتجربة المجانية

import OpenAI from "openai";

// تهيئة عميل OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// تحديد الموديل (نستخدم GPT-4o-mini لأنه رخيص وسريع وجيد)
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// =====================================================
// 🤖 Helper: دالة مساعدة لإرسال الطلبات لـ OpenAI
// =====================================================
async function callOpenAI(prompt: string, maxTokens: number = 4000): Promise<string> {
  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: "system",
        content: "You are a helpful AI assistant. Return responses in the exact format requested. Return ONLY the requested JSON, no extra text, no markdown code blocks."
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: maxTokens,
    temperature: 0.7,
  });

  let content = response.choices[0]?.message?.content || "";
  
  // تنظيف المخرج: إزالة أي markdown code blocks إذا وجدت
  content = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  
  return content;
}

// =====================================================
// 📝 الدوال الرئيسية (نفس الـ Signature الأصلي)
// =====================================================

export async function generateArticle(topic: string): Promise<{
  title: string;
  description: string;
  content: string;
  tags: string[];
}> {
  console.log(`[OpenAI] Generating article for topic: "${topic}"`);

  const prompt = `You are an expert AI & technology writer for "Zoltai", a website about AI tools and productivity.

Write a comprehensive, SEO-optimized blog article about: "${topic}"

Requirements:
- Write in an engaging, educational tone
- Target both beginners and professionals
- Include practical examples and actionable tips
- Use proper markdown formatting with headers (##, ###)
- Include a compelling introduction and conclusion
- Length: 1500-2500 words
- Naturally include relevant keywords for SEO

Return your response in this exact JSON format (NO markdown, NO extra text):
{
  "title": "Article title (60 chars max, SEO-friendly)",
  "description": "Meta description (155 chars max)",
  "content": "Full article in markdown",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  try {
    const text = await callOpenAI(prompt, 4000);
    const result = JSON.parse(text);
    
    // تحقق من صحة المخرجات
    if (!result.title || !result.content) {
      throw new Error('Invalid response format from OpenAI');
    }
    
    console.log('✅ [OpenAI] Article generated successfully');
    return result;
    
  } catch (error: any) {
    console.error('❌ [OpenAI] Error generating article:', error.message);
    throw error;
  }
}

export async function researchTrendingTopics(): Promise<string[]> {
  console.log('[OpenAI] Researching trending AI topics...');

  const prompt = `You are an AI content strategist for "Zoltai", a website about AI tools and productivity.

Suggest 5 trending, high-search-volume article topics about AI tools and productivity that would perform well in search engines right now.

Focus on:
- New AI tools and updates
- AI productivity workflows
- AI for specific professions
- AI comparisons and reviews
- How-to guides for AI tools

Return ONLY a JSON array of 5 topic strings, like this:
["Topic 1", "Topic 2", "Topic 3", "Topic 4", "Topic 5"]

NO extra text, NO markdown, NO explanation.`;

  try {
    const text = await callOpenAI(prompt, 1000);
    const topics = JSON.parse(text);
    
    if (!Array.isArray(topics) || topics.length === 0) {
      throw new Error('Invalid topics format');
    }
    
    console.log('✅ [OpenAI] Found topics:', topics);
    return topics.slice(0, 5);
    
  } catch (error: any) {
    console.error('❌ [OpenAI] Error researching topics:', error.message);
    throw error;
  }
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
  console.log('[OpenAI] Optimizing content for SEO...');

  const prompt = `You are an SEO expert. Optimize this blog article for search engines.

Current title: "${currentTitle}"

Article content:
${content}

Tasks:
1. Optimize the title for SEO (keep under 60 chars)
2. Write an optimized meta description (under 155 chars)
3. Improve the content for better keyword density and readability
4. Suggest target keywords

Return ONLY this JSON format (NO markdown, NO extra text):
{
  "title": "optimized title",
  "description": "optimized meta description",
  "content": "optimized markdown content",
  "keywords": ["keyword1", "keyword2"]
}`;

  try {
    const text = await callOpenAI(prompt, 4000);
    const result = JSON.parse(text);
    
    if (!result.title || !result.description) {
      throw new Error('Invalid SEO response format');
    }
    
    console.log('✅ [OpenAI] SEO optimization complete');
    return result;
    
  } catch (error: any) {
    console.error('❌ [OpenAI] Error optimizing SEO:', error.message);
    throw error;
  }
}
