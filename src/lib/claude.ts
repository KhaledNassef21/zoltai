// src/lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";

// ✅ تحقق من وضع التجربة أولاً
const MOCK_MODE = process.env.MOCK_MODE === 'true';

// تهيئة Anthropic فقط إذا لم نكن في وضع التجربة
const anthropic = !MOCK_MODE && process.env.ANTHROPIC_API_KEY 
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) 
  : null;

// =====================================================
// 🧪 MOCK DATA - للتجربة المجانية
// =====================================================

const MOCK_TOPICS = [
  "AI Agents in 2026: The Rise of Autonomous Workflows",
  "How Small Teams Are Using AI to Compete with Enterprises", 
  "The Hidden Costs of Free AI Tools (And How to Avoid Them)",
  "Prompt Engineering Is Dead? What's Next in AI Interaction",
  "Local AI Models: Running LLMs on Your Laptop in 2026"
];

const MOCK_ARTICLE = {
  title: "AI Productivity Hacks: 5 Tools to Save 10 Hours/Week [2026 Guide]",
  description: "Discover 5 powerful AI tools that automate repetitive tasks and boost your productivity. Practical guide for beginners and pros.",
  content: `## مقدمة

في عالم يتسارع فيه التطور التكنولوجي، أصبح الذكاء الاصطناعي حليفاً أساسياً لزيادة الإنتاجية.

## 🚀 الأداة الأولى: أدوات أتمتة المهام

أدوات مثل **Zapier** و **Make** تتيح لك ربط التطبيقات وأتمتة سير العمل دون كتابة سطر كود واحد.

### مثال عملي:
1. استقبال إيميل جديد → 2. استخراج المرفقات → 3. حفظها في Google Drive → 4. إرسال تنبيه في Slack

## 🧠 الأداة الثانية: مساعدو الكتابة بالذكاء الاصطناعي

أدوات مثل **Claude** و **Gemini** تساعدك في:
- كتابة المسودات الأولية
- تحسين النصوص للـ SEO
- توليد أفكار محتوى جديدة

## 🎨 الأداة الثالثة: توليد الصور والفيديو

منصات مثل **DALL-E 3** و **Midjourney** تمكنك من إنشاء محتوى بصري احترافي في ثوانٍ.

## 📊 الأداة الرابعة: تحليل البيانات بالذكاء الاصطناعي

أدوات مثل **Julius AI** و **Akkio** تحول البيانات المعقدة إلى رؤى قابلة للتنفيذ.

## 🔗 الأداة الخامسة: مساعدو البرمجة بالذكاء الاصطناعي

**GitHub Copilot** و **Cursor** يسرّعون عملية التطوير ويقللون الأخطاء.

## خاتمة

الذكاء الاصطناعي ليس مستقبل العمل فحسب، بل هو حاضرنا. ابدأ بتجربة أداة واحدة هذا الأسبوع وراقب الفرق.

> 💡 **نصيحة**: لا تحاول تبني كل الأدوات دفعة واحدة. اختر ما يناسب احتياجك وتعمق فيه.`,
  tags: ["AI Tools", "Productivity", "Automation", "2026 Guide", "Work Smarter"]
};

const MOCK_SEO = {
  title: "AI Productivity Hacks: 5 Tools to Save 10 Hours/Week",
  description: "Boost your workflow with these 5 AI-powered productivity tools. Tested, reviewed, and ready to implement in 2026.",
  content: MOCK_ARTICLE.content, // نرجع نفس المحتوى في الوضع التجريبي
  keywords: ["AI productivity", "automation tools", "AI workflow", "time saving", "AI for work"]
};

// =====================================================
// 🤖 الدوال الرئيسية (مع دعم Mock Mode)
// =====================================================

export async function generateArticle(topic: string): Promise<{
  title: string;
  description: string;
  content: string;
  tags: string[];
}> {
  // ✅ وضع التجربة
  if (MOCK_MODE) {
    console.log('🧪 [MOCK MODE] Generating sample article for:', topic);
    await new Promise(resolve => setTimeout(resolve, 1000)); // محاكاة تأخير الشبكة
    return MOCK_ARTICLE;
  }

  // 🔐 الكود الأصلي (Anthropic)
  if (!anthropic) {
    throw new Error('Anthropic API key not configured and MOCK_MODE is false');
  }

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

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}

export async function researchTrendingTopics(): Promise<string[]> {
  // ✅ وضع التجربة
  if (MOCK_MODE) {
    console.log('🧪 [MOCK MODE] Returning sample trending topics');
    await new Promise(resolve => setTimeout(resolve, 800));
    return MOCK_TOPICS;
  }

  // 🔐 الكود الأصلي
  if (!anthropic) {
    throw new Error('Anthropic API key not configured and MOCK_MODE is false');
  }

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

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
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
  // ✅ وضع التجربة
  if (MOCK_MODE) {
    console.log('🧪 [MOCK MODE] Returning mock SEO optimization');
    await new Promise(resolve => setTimeout(resolve, 600));
    return MOCK_SEO;
  }

  // 🔐 الكود الأصلي
  if (!anthropic) {
    throw new Error('Anthropic API key not configured and MOCK_MODE is false');
  }

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

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
