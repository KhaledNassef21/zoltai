"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

// ============ THEME ============
type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

// ============ LANGUAGE ============
type Lang = "en" | "ar";

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
}

const translations: Record<string, Record<Lang, string>> = {
  // Nav
  "nav.blog": { en: "Blog", ar: "\u0645\u062f\u0648\u0646\u0629" },
  "nav.tools": { en: "Tools", ar: "\u0623\u062f\u0648\u0627\u062a" },
  "nav.about": { en: "About", ar: "عنا" },
  "nav.contact": { en: "Contact", ar: "تواصل" },

  // Hero
  "hero.title1": { en: "Discover the Best", ar: "\u0627\u0643\u062a\u0634\u0641 \u0623\u0641\u0636\u0644" },
  "hero.title2": { en: "AI Tools", ar: "\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a" },
  "hero.title3": { en: "(No Coding Required)", ar: "(\u0628\u062f\u0648\u0646 \u0628\u0631\u0645\u062c\u0629)" },
  "hero.subtitle": {
    en: "Discover the best AI tools to boost productivity, streamline your work, and learn new skills \u2014 even if you're a complete beginner.",
    ar: "\u0627\u0643\u062a\u0634\u0641 \u0623\u0641\u0636\u0644 \u0623\u062f\u0648\u0627\u062a AI \u0644\u0632\u064a\u0627\u062f\u0629 \u0627\u0644\u0625\u0646\u062a\u0627\u062c\u064a\u0629 \u0648\u062a\u0637\u0648\u064a\u0631 \u0645\u0647\u0627\u0631\u0627\u062a\u0643 \u2014 \u062d\u062a\u0649 \u0644\u0648 \u0645\u0628\u062a\u062f\u0626.",
  },
  "hero.cta1": { en: "Get Free AI Tools List", ar: "\u062d\u0645\u0644 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u062f\u0648\u0627\u062a \u0645\u062c\u0627\u0646\u0627\u064b" },
  "hero.cta2": { en: "Explore AI Tools", ar: "\u0627\u0633\u062a\u0643\u0634\u0641 \u0627\u0644\u0623\u062f\u0648\u0627\u062a" },

  // Features
  "feat.daily.title": { en: "Daily AI Insights", ar: "\u0646\u0635\u0627\u0626\u062d AI \u064a\u0648\u0645\u064a\u0629" },
  "feat.daily.desc": {
    en: "Fresh articles on how to use AI tools to work smarter \u2014 published every day.",
    ar: "\u0645\u0642\u0627\u0644\u0627\u062a \u062c\u062f\u064a\u062f\u0629 \u064a\u0648\u0645\u064a\u0627\u064b \u0639\u0646 \u0643\u064a\u0641\u064a\u0629 \u0627\u0633\u062a\u062e\u062f\u0627\u0645 AI \u0644\u0644\u0639\u0645\u0644 \u0628\u0630\u0643\u0627\u0621.",
  },
  "feat.reviews.title": { en: "Tool Reviews & Deals", ar: "\u0645\u0631\u0627\u062c\u0639\u0627\u062a \u0648\u0639\u0631\u0648\u0636" },
  "feat.reviews.desc": {
    en: "Honest reviews with free trials and exclusive deals on the best AI tools.",
    ar: "\u0645\u0631\u0627\u062c\u0639\u0627\u062a \u0635\u0627\u062f\u0642\u0629 \u0645\u0639 \u062a\u062c\u0627\u0631\u0628 \u0645\u062c\u0627\u0646\u064a\u0629 \u0648\u0639\u0631\u0648\u0636 \u062d\u0635\u0631\u064a\u0629.",
  },
  "feat.hacks.title": { en: "Productivity Hacks", ar: "\u062d\u064a\u0644 \u0625\u0646\u062a\u0627\u062c\u064a\u0629" },
  "feat.hacks.desc": {
    en: "Actionable tips to automate your work and 10x your output with AI.",
    ar: "\u0646\u0635\u0627\u0626\u062d \u0639\u0645\u0644\u064a\u0629 \u0644\u0623\u062a\u0645\u062a\u0629 \u0634\u063a\u0644\u0643 \u0648\u0645\u0636\u0627\u0639\u0641\u0629 \u0625\u0646\u062a\u0627\u062c\u064a\u062a\u0643.",
  },

  // Sections
  "section.topTools": { en: "Top AI Tools", ar: "\u0623\u0641\u0636\u0644 \u0627\u0644\u0623\u062f\u0648\u0627\u062a" },
  "section.latest": { en: "Latest Articles", ar: "\u0623\u062d\u062f\u062b \u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062a" },
  "section.viewAll": { en: "View all", ar: "\u0639\u0631\u0636 \u0627\u0644\u0643\u0644" },
  "section.tryNow": { en: "Try Now", ar: "\u062c\u0631\u0628 \u0627\u0644\u0622\u0646" },
  "section.comingSoon": { en: "First articles coming soon...", ar: "\u0627\u0644\u0645\u0642\u0627\u0644\u0627\u062a \u0627\u0644\u0623\u0648\u0644\u0649 \u0642\u0631\u064a\u0628\u0627\u064b..." },

  // Newsletter
  "newsletter.title": { en: "Get Weekly AI Insights", ar: "\u0646\u0635\u0627\u0626\u062d AI \u0623\u0633\u0628\u0648\u0639\u064a\u0629" },
  "newsletter.desc": {
    en: "The best AI tools, productivity strategies, and guides \u2014 delivered to your inbox every week. Free.",
    ar: "\u0623\u0641\u0636\u0644 \u0623\u062f\u0648\u0627\u062a AI \u0648\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0627\u062a \u0627\u0644\u0625\u0646\u062a\u0627\u062c\u064a\u0629 \u2014 \u062a\u0648\u0635\u0644\u0643 \u0643\u0644 \u0623\u0633\u0628\u0648\u0639 \u0645\u062c\u0627\u0646\u0627\u064b.",
  },

  // Testimonials
  "testimonials.title": { en: "What Our Readers Say", ar: "ماذا يقول قراؤنا" },

  // Community
  "community.title": { en: "Join Our Community", ar: "انضم لمجتمعنا" },
  "community.desc": {
    en: "Connect with thousands of AI enthusiasts learning AI skills.",
    ar: "\u062a\u0648\u0627\u0635\u0644 \u0645\u0639 \u0622\u0644\u0627\u0641 \u0627\u0644\u0645\u0647\u062a\u0645\u064a\u0646 \u0628\u062a\u0639\u0644\u0645 \u0645\u0647\u0627\u0631\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a.",
  },

  // Footer
  "footer.community": { en: "Community", ar: "المجتمع" },
  "footer.desc": {
    en: "Your guide to mastering AI tools. Smart content, daily.",
    ar: "دليلك لإتقان أدوات الذكاء الاصطناعي. محتوى ذكي يومياً.",
  },
  "footer.links": { en: "Links", ar: "روابط" },
  "footer.follow": { en: "Follow Us", ar: "تابعنا" },
  "footer.privacy": { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  "footer.terms": { en: "Terms of Service", ar: "شروط الاستخدام" },
  "footer.rights": { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },

  // Nav extra
  "nav.earn": { en: "Earn", ar: "اربح" },

  // Community buttons
  "community.facebook": { en: "Facebook Community", ar: "مجتمع فيسبوك" },
  "community.instagram": { en: "Instagram", ar: "انستجرام" },
  "community.email": { en: "Email Us", ar: "راسلنا" },

  // Lead Magnet
  "lead.badge": { en: "FREE RESOURCE", ar: "مورد مجاني" },
  "lead.title1": { en: "Get the Ultimate", ar: "احصل على الدليل" },
  "lead.title2": { en: "AI Tools Guide", ar: "الشامل لأدوات AI" },
  "lead.desc": {
    en: "Download our curated list of the best AI tools — with tips, use cases, and exclusive deals.",
    ar: "حمّل قائمتنا المختارة لأفضل أدوات AI — مع نصائح وحالات استخدام وعروض حصرية.",
  },
  "lead.check1": { en: "24+ AI Tools", ar: "24+ أداة AI" },
  "lead.check2": { en: "Free Trials Listed", ar: "تجارب مجانية" },
  "lead.check3": { en: "Updated Weekly", ar: "تحديث أسبوعي" },
  "lead.namePlaceholder": { en: "Your name", ar: "اسمك" },
  "lead.emailPlaceholder": { en: "Your email", ar: "بريدك الإلكتروني" },
  "lead.cta": { en: "Get Free Access", ar: "احصل على الدليل مجاناً" },
  "lead.success.title": { en: "You're In!", ar: "تم التسجيل!" },
  "lead.success.desc": {
    en: "Check your inbox for the AI Tools Guide. Welcome to the Zoltai community!",
    ar: "تفقد بريدك للحصول على دليل أدوات AI. أهلاً بك في مجتمع Zoltai!",
  },
  "lead.joinCount": {
    en: "Join 2,000+ readers already learning AI skills",
    ar: "انضم لأكثر من 2,000 قارئ يتعلمون مهارات AI",
  },

  // Stats
  "stats.tools": { en: "AI Tools Reviewed", ar: "أداة AI تم مراجعتها" },
  "stats.guides": { en: "In-Depth Guides", ar: "دليل متعمق" },
  "stats.readers": { en: "Monthly Readers", ar: "قارئ شهرياً" },
  "stats.rating": { en: "Average Rating", ar: "متوسط التقييم" },

  // Testimonials
  "testimonial.1.name": { en: "Sarah M.", ar: "سارة م." },
  "testimonial.1.role": { en: "Freelance Writer", ar: "كاتبة مستقلة" },
  "testimonial.1.text": {
    en: "Zoltai helped me discover AI writing tools I didn't know existed. My workflow is completely different now — I'm more productive than ever.",
    ar: "Zoltai ساعدني أكتشف أدوات كتابة بالذكاء الاصطناعي ما كنتش أعرفها. شغلي اتغير تماماً — إنتاجيتي زادت جداً.",
  },
  "testimonial.2.name": { en: "Ahmed K.", ar: "أحمد ك." },
  "testimonial.2.role": { en: "Marketing Specialist", ar: "متخصص تسويق" },
  "testimonial.2.text": {
    en: "The tool comparisons are genuinely helpful. Instead of spending hours researching, I found exactly what I needed for my team in minutes.",
    ar: "مقارنات الأدوات مفيدة فعلاً. بدل ما أقعد ساعات أبحث، لقيت اللي محتاجه لفريقي في دقائق.",
  },
  "testimonial.3.name": { en: "Jessica L.", ar: "جيسيكا ل." },
  "testimonial.3.role": { en: "Content Creator", ar: "صانعة محتوى" },
  "testimonial.3.text": {
    en: "Finally a site that reviews AI tools honestly without the hype. The guides are practical and beginner-friendly. Highly recommend.",
    ar: "أخيراً موقع بيراجع أدوات AI بصدق من غير مبالغة. الأدلة عملية وسهلة للمبتدئين. أنصح بيه جداً.",
  },

  // Testimonials (extended)
  "testimonial.user": { en: "user", ar: "مستخدم" },
  "testimonial.4.name": { en: "Mohamed H.", ar: "محمد ح." },
  "testimonial.4.role": { en: "Product Manager", ar: "مدير منتج" },
  "testimonial.4.text": {
    en: "I found Claude through Zoltai's comparison guide. The pricing breakdown and real use cases saved me weeks of trial-and-error for my team.",
    ar: "لقيت Claude عن طريق دليل المقارنة في Zoltai. مقارنة الأسعار وحالات الاستخدام الحقيقية وفرتلي أسابيع من التجربة والخطأ لفريقي.",
  },
  "testimonial.5.name": { en: "Omar F.", ar: "عمر ف." },
  "testimonial.5.role": { en: "Indie Developer", ar: "مطور مستقل" },
  "testimonial.5.text": {
    en: "The Cursor vs Copilot guide was exactly what I needed. Made my decision in 10 minutes and I've been shipping faster ever since.",
    ar: "مقارنة Cursor مع Copilot كانت بالظبط اللي محتاجه. اتخذت قراري في 10 دقايق وبقى شغلي أسرع من ساعتها.",
  },

  // How It Works (Phase 2)
  "how.badge": { en: "GET STARTED IN MINUTES", ar: "ابدأ في دقائق" },
  "how.title": {
    en: "How Zoltai Works",
    ar: "كيف يعمل Zoltai",
  },
  "how.desc": {
    en: "Your shortcut to the right AI tool — no coding, no overwhelm. Just practical guidance that gets you working smarter in four simple steps.",
    ar: "اختصارك للأداة الصح — بدون برمجة أو حيرة. إرشاد عملي يخليك تشتغل بذكاء في 4 خطوات بسيطة.",
  },
  "how.s1.title": { en: "Discover Tools", ar: "اكتشف الأدوات" },
  "how.s1.desc": {
    en: "Browse 24+ curated AI tools across writing, design, code, marketing, and more — each tested and reviewed.",
    ar: "تصفح أكثر من 24 أداة AI مختارة في الكتابة، التصميم، البرمجة، التسويق وغيرها — كلها متجربة ومُراجعة.",
  },
  "how.s2.title": { en: "Compare Fairly", ar: "قارن بحياد" },
  "how.s2.desc": {
    en: "Side-by-side comparisons with pricing, use cases, and honest pros/cons — no hype, just clarity.",
    ar: "مقارنات جنب بعض بالأسعار وحالات الاستخدام والمميزات والعيوب — بدون مبالغة، مجرد وضوح.",
  },
  "how.s3.title": { en: "Pick Your Winner", ar: "اختار الأنسب" },
  "how.s3.desc": {
    en: "Follow our recommendations tailored to your use case — freelancer, agency, solo creator, or team.",
    ar: "اتبع ترشيحاتنا المناسبة لحالتك — فريلانسر، وكالة، صانع محتوى، أو فريق.",
  },
  "how.s4.title": { en: "Master & Grow", ar: "أتقن وتطور" },
  "how.s4.desc": {
    en: "Follow our step-by-step tutorials and weekly hacks to get 10x more done with your new toolkit.",
    ar: "اتبع شرحنا خطوة بخطوة والحيل الأسبوعية علشان تنجز 10 أضعاف بأدواتك الجديدة.",
  },
  "how.cta": { en: "Explore the Tools Directory", ar: "استكشف دليل الأدوات" },

  // FAQ (Phase 2)
  "faq.badge": { en: "FREQUENTLY ASKED", ar: "أسئلة شائعة" },
  "faq.title": {
    en: "Questions? We've Got Answers",
    ar: "أسئلتك... عندنا إجاباتها",
  },
  "faq.desc": {
    en: "Everything you need to know before diving in. Can't find what you need? Reach out anytime.",
    ar: "كل اللي محتاج تعرفه قبل ما تبدأ. مش لاقي سؤالك؟ تواصل معانا في أي وقت.",
  },
  "faq.q1": {
    en: "Is Zoltai really free to use?",
    ar: "هل Zoltai مجاني فعلاً؟",
  },
  "faq.a1": {
    en: "Yes, 100%. All our guides, comparisons, and tool recommendations are completely free. We earn a small commission when you sign up for certain tools through our affiliate links — at no extra cost to you.",
    ar: "أيوه، 100%. كل الأدلة والمقارنات والترشيحات مجانية تماماً. إحنا بنكسب عمولة بسيطة لما تسجل في أدوات معينة من خلال روابطنا — بدون أي تكلفة إضافية عليك.",
  },
  "faq.q2": {
    en: "Do I need coding skills to use these AI tools?",
    ar: "هل محتاج أعرف برمجة علشان أستخدم الأدوات دي؟",
  },
  "faq.a2": {
    en: "Not at all. Zoltai focuses on no-code AI tools that anyone can use — from writers and designers to marketers and students. Every guide is written for beginners.",
    ar: "مش محتاج خالص. Zoltai بيركز على أدوات بدون برمجة يقدر أي حد يستخدمها — من الكتّاب والمصممين للمسوقين والطلاب. كل دليل مكتوب للمبتدئين.",
  },
  "faq.q3": {
    en: "How often is the content updated?",
    ar: "كل قد إيه بيتم تحديث المحتوى؟",
  },
  "faq.a3": {
    en: "We publish new articles daily and re-optimize existing guides every week to keep pricing, features, and recommendations accurate as tools evolve.",
    ar: "بنضيف مقالات جديدة كل يوم وبنحدّث الأدلة القديمة أسبوعياً علشان الأسعار والمميزات تفضل دقيقة مع تطور الأدوات.",
  },
  "faq.q4": {
    en: "Which AI tool should I start with as a beginner?",
    ar: "أي أداة AI أبدأ بيها كمبتدئ؟",
  },
  "faq.a4": {
    en: "For most beginners, we recommend starting with ChatGPT (free tier) for general tasks and Canva AI for visual work. Both are free, intuitive, and great for learning how AI can help you. See our Beginner's Guide for a complete roadmap.",
    ar: "لمعظم المبتدئين، بننصح بـ ChatGPT (الإصدار المجاني) للمهام العامة و Canva AI للتصميم. الاتنين مجانيين وسهلين ومناسبين لفهم AI. شوف دليل المبتدئين علشان خريطة كاملة.",
  },
  "faq.q5": {
    en: "Are your reviews really honest? You use affiliate links.",
    ar: "مراجعاتكم صادقة فعلاً رغم استخدام روابط إحالة؟",
  },
  "faq.a5": {
    en: "100%. Our reputation depends on honest reviews — misleading readers would kill the site. We call out weaknesses, skip tools that don't deliver, and recommend free alternatives whenever possible. Affiliate income never changes our opinion.",
    ar: "100%. سمعتنا متوقفة على المصداقية — خداع القراء هيقضي على الموقع. بنوضح العيوب، وبنتجاهل الأدوات الضعيفة، وبننصح بالبدائل المجانية كل ما قدرنا. العمولات مش بتغير رأينا أبداً.",
  },
  "faq.q6": {
    en: "Can I suggest a tool or topic for you to review?",
    ar: "ممكن أقترح أداة أو موضوع لمراجعته؟",
  },
  "faq.a6": {
    en: "Absolutely! Our best content comes from reader requests. Email us at info.zoltai@gmail.com or message us on Instagram — we read every suggestion.",
    ar: "طبعاً! أحسن محتوانا بييجي من طلبات القراء. ابعتلنا على info.zoltai@gmail.com أو راسلنا على انستجرام — بنقرأ كل اقتراح.",
  },

  // Featured Experts (Phase 3)
  "experts.badge": { en: "MEET THE POWER USERS", ar: "تعرف على المحترفين" },
  "experts.title": {
    en: "Real People Using AI Tools",
    ar: "ناس حقيقيين بيستخدموا الأدوات",
  },
  "experts.desc": {
    en: "Learn from creators, marketers, and developers who use these AI tools daily to 10x their output.",
    ar: "تعلم من صُنّاع محتوى ومسوقين ومطورين بيستخدموا الأدوات دي يومياً لمضاعفة إنتاجيتهم.",
  },
  "experts.cta": { en: "Read Their Stories", ar: "اقرأ قصصهم" },
  "expert.yearsExp": { en: "Years exp.", ar: "سنوات خبرة" },
  "expert.tools": { en: "AI tools", ar: "أداة AI" },
  "expert.1.name": { en: "Aisha M.", ar: "عائشة م." },
  "expert.1.role": { en: "Senior Content Writer", ar: "كاتبة محتوى أولى" },
  "expert.1.expertise": {
    en: "Uses Jasper & Claude daily to ship 50+ articles/month for SaaS clients.",
    ar: "بتستخدم Jasper و Claude يومياً علشان تنجز 50+ مقالة شهرياً لعملاء SaaS.",
  },
  "expert.2.name": { en: "Ryan K.", ar: "ريان ك." },
  "expert.2.role": { en: "Freelance Designer", ar: "مصمم مستقل" },
  "expert.2.expertise": {
    en: "Midjourney + Canva AI power-user — cut client turnaround time by 60%.",
    ar: "محترف Midjourney و Canva AI — قلّل وقت تسليم العملاء بنسبة 60%.",
  },
  "expert.3.name": { en: "Leo S.", ar: "ليو س." },
  "expert.3.role": { en: "Indie SaaS Builder", ar: "مطور SaaS مستقل" },
  "expert.3.expertise": {
    en: "Ships full MVPs in a weekend using Cursor, Bolt.new, and Copilot together.",
    ar: "بيطلق منتجات MVP كاملة في ويكند باستخدام Cursor و Bolt.new و Copilot مع بعض.",
  },

  // Newsletter Hero (Phase 3)
  "newsletterHero.badge": { en: "WEEKLY AI INSIGHTS", ar: "نشرة أسبوعية" },
  "newsletterHero.title1": { en: "Stay Ahead of the", ar: "اتقدم على" },
  "newsletterHero.title2": { en: "AI Curve", ar: "موجة الذكاء الاصطناعي" },
  "newsletterHero.desc": {
    en: "Join 2,000+ readers getting the best new AI tools, honest reviews, and productivity hacks every week. No spam, unsubscribe anytime.",
    ar: "انضم لأكثر من 2,000 قارئ بيوصلهم أحسن الأدوات الجديدة ومراجعات صادقة وحيل إنتاجية كل أسبوع. بدون سبام، اشتراكك يمكن إلغاؤه في أي وقت.",
  },
  "newsletterHero.benefit1": {
    en: "Top 3 AI tool picks every Monday",
    ar: "أفضل 3 أدوات كل يوم إثنين",
  },
  "newsletterHero.benefit2": {
    en: "Free playbooks and in-depth comparisons",
    ar: "أدلة مجانية ومقارنات متعمقة",
  },
  "newsletterHero.benefit3": {
    en: "Exclusive deals + early access tips",
    ar: "عروض حصرية + نصائح وصول مبكر",
  },
  "newsletterHero.formLabel": { en: "Get the newsletter", ar: "احصل على النشرة" },
  "newsletterHero.placeholder": { en: "you@example.com", ar: "بريدك الإلكتروني" },
  "newsletterHero.cta": { en: "Subscribe Free", ar: "اشترك مجاناً" },
  "newsletterHero.privacy": {
    en: "Free forever. We respect your inbox.",
    ar: "مجاني للأبد. نحترم بريدك.",
  },
  "newsletterHero.error": {
    en: "Something went wrong. Try again.",
    ar: "حدث خطأ ما. حاول مرة أخرى.",
  },
  "newsletterHero.successTitle": { en: "You're in!", ar: "تم الاشتراك!" },
  "newsletterHero.successDesc": {
    en: "Check your inbox in the next few minutes for a welcome email.",
    ar: "تفقد بريدك خلال دقائق للحصول على رسالة الترحيب.",
  },

  // Recent Activity notifications
  "activity.1": { en: "Someone from Cairo just subscribed to the newsletter", ar: "حد من القاهرة لسه اشترك في النشرة البريدية" },
  "activity.2": { en: "A reader just downloaded the free AI tools guide", ar: "قارئ لسه حمّل دليل أدوات AI المجاني" },
  "activity.3": { en: "Someone from London just explored the tools directory", ar: "حد من لندن لسه استكشف دليل الأدوات" },
  "activity.4": { en: "A new reader just joined from a Google search", ar: "قارئ جديد لسه انضم من بحث جوجل" },
  "activity.5": { en: "Someone just bookmarked the ChatGPT guide", ar: "حد لسه حفظ دليل ChatGPT" },
  "activity.justNow": { en: "Just now", ar: "الآن" },

  // Trust Signals (Monetization Phase 4)
  "trust.secure.title": { en: "Secure & Private", ar: "آمن ومحمي" },
  "trust.secure.desc": {
    en: "SSL-encrypted. We never share your email with third parties.",
    ar: "تشفير SSL. إيميلك مش بيتشارك مع أي طرف تاني.",
  },
  "trust.guarantee.title": { en: "Risk-Free Trial", ar: "تجربة بدون مخاطرة" },
  "trust.guarantee.desc": {
    en: "Every tool we recommend comes with a free trial or money-back guarantee.",
    ar: "كل أداة بنرشحها ليها تجربة مجانية أو ضمان استرداد فلوسك.",
  },
  "trust.instant.title": { en: "Instant Access", ar: "وصول فوري" },
  "trust.instant.desc": {
    en: "No waitlists. Start using these AI tools in under 60 seconds.",
    ar: "بدون قوائم انتظار. ابدأ تستخدم الأدوات في أقل من 60 ثانية.",
  },
  "trust.trusted.title": { en: "Trusted by 10,000+", ar: "اعتمد عليه 10,000+" },
  "trust.trusted.desc": {
    en: "Join thousands of creators, marketers, and developers leveling up with AI.",
    ar: "انضم لآلاف صُنّاع المحتوى والمسوقين والمطورين اللي بيطوروا شغلهم بالذكاء الاصطناعي.",
  },
  "trust.badge.ssl": { en: "SSL Secured", ar: "محمي بـ SSL" },
  "trust.badge.verified": { en: "Verified Reviews", ar: "مراجعات موثقة" },
  "trust.badge.moneyback": { en: "Money-Back Guarantee", ar: "ضمان استرداد" },
  "trust.badge.rated": { en: "4.8/5 Rated", ar: "تقييم 4.8/5" },
};

const LangContext = createContext<LangContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
  dir: "ltr",
});

export function useLang() {
  return useContext(LangContext);
}

// ============ PROVIDER ============
export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const savedTheme = localStorage.getItem("zoltai-theme") as Theme;
    const savedLang = localStorage.getItem("zoltai-lang") as Lang;
    if (savedTheme) setTheme(savedTheme);
    if (savedLang) setLangState(savedLang);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("zoltai-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    document.documentElement.setAttribute("lang", lang);
    localStorage.setItem("zoltai-lang", lang);
  }, [lang]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }

  function setLang(l: Lang) {
    setLangState(l);
  }

  function t(key: string): string {
    return translations[key]?.[lang] || key;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <LangContext.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
        {children}
      </LangContext.Provider>
    </ThemeContext.Provider>
  );
}
