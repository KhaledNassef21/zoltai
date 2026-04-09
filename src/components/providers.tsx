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

  // Recent Activity notifications
  "activity.1": { en: "Someone from Cairo just subscribed to the newsletter", ar: "حد من القاهرة لسه اشترك في النشرة البريدية" },
  "activity.2": { en: "A reader just downloaded the free AI tools guide", ar: "قارئ لسه حمّل دليل أدوات AI المجاني" },
  "activity.3": { en: "Someone from London just explored the tools directory", ar: "حد من لندن لسه استكشف دليل الأدوات" },
  "activity.4": { en: "A new reader just joined from a Google search", ar: "قارئ جديد لسه انضم من بحث جوجل" },
  "activity.5": { en: "Someone just bookmarked the ChatGPT guide", ar: "حد لسه حفظ دليل ChatGPT" },
  "activity.justNow": { en: "Just now", ar: "الآن" },
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
