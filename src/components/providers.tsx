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
  "hero.title1": { en: "Make Money Using", ar: "\u0627\u0631\u0628\u062d \u0641\u0644\u0648\u0633 \u0628\u0627\u0633\u062a\u062e\u062f\u0627\u0645" },
  "hero.title2": { en: "AI Tools", ar: "\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a" },
  "hero.title3": { en: "(No Coding Required)", ar: "(\u0628\u062f\u0648\u0646 \u0628\u0631\u0645\u062c\u0629)" },
  "hero.subtitle": {
    en: "Discover the best AI tools to earn online, boost productivity, and build your side hustle \u2014 even if you're a complete beginner.",
    ar: "\u0627\u0643\u062a\u0634\u0641 \u0623\u0641\u0636\u0644 \u0623\u062f\u0648\u0627\u062a AI \u0644\u0644\u0631\u0628\u062d \u0645\u0646 \u0627\u0644\u0625\u0646\u062a\u0631\u0646\u062a \u0648\u0632\u064a\u0627\u062f\u0629 \u0627\u0644\u0625\u0646\u062a\u0627\u062c\u064a\u0629 \u2014 \u062d\u062a\u0649 \u0644\u0648 \u0645\u0628\u062a\u062f\u0626.",
  },
  "hero.cta1": { en: "Get Free AI Tools List", ar: "\u062d\u0645\u0644 \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0623\u062f\u0648\u0627\u062a \u0645\u062c\u0627\u0646\u0627\u064b" },
  "hero.cta2": { en: "Explore AI Tools", ar: "\u0627\u0633\u062a\u0643\u0634\u0641 \u0627\u0644\u0623\u062f\u0648\u0627\u062a" },

  // Features
  "feat.daily.title": { en: "Daily Money-Making Tips", ar: "نصائح ربح يومية" },
  "feat.daily.desc": {
    en: "Fresh articles on how to use AI tools to earn money online \u2014 published every day.",
    ar: "\u0645\u0642\u0627\u0644\u0627\u062a \u062c\u062f\u064a\u062f\u0629 \u064a\u0648\u0645\u064a\u0627\u064b \u0639\u0646 \u0643\u064a\u0641\u064a\u0629 \u0627\u0633\u062a\u062e\u062f\u0627\u0645 AI \u0644\u0644\u0631\u0628\u062d.",
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
  "newsletter.title": { en: "Get Weekly AI Money Tips", ar: "\u0646\u0635\u0627\u0626\u062d \u0631\u0628\u062d \u0623\u0633\u0628\u0648\u0639\u064a\u0629" },
  "newsletter.desc": {
    en: "The best AI tools, money-making strategies, and guides \u2014 delivered to your inbox every week. Free.",
    ar: "\u0623\u0641\u0636\u0644 \u0623\u062f\u0648\u0627\u062a AI \u0648\u0627\u0633\u062a\u0631\u0627\u062a\u064a\u062c\u064a\u0627\u062a \u0627\u0644\u0631\u0628\u062d \u2014 \u062a\u0648\u0635\u0644\u0643 \u0643\u0644 \u0623\u0633\u0628\u0648\u0639 \u0645\u062c\u0627\u0646\u0627\u064b.",
  },

  // Testimonials
  "testimonials.title": { en: "What Our Readers Say", ar: "ماذا يقول قراؤنا" },

  // Community
  "community.title": { en: "Join Our Community", ar: "انضم لمجتمعنا" },
  "community.desc": {
    en: "Connect with thousands of AI enthusiasts making money online.",
    ar: "تواصل مع آلاف المهتمين بالذكاء الاصطناعي والربح من الإنترنت.",
  },

  // Footer
  "footer.community": { en: "Community", ar: "المجتمع" },
  "footer.desc": {
    en: "Your guide to making money with AI tools. Smart content, daily.",
    ar: "\u062f\u0644\u064a\u0644\u0643 \u0644\u0644\u0631\u0628\u062d \u0645\u0646 \u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a. \u0645\u062d\u062a\u0648\u0649 \u0630\u0643\u064a \u064a\u0648\u0645\u064a\u0627\u064b.",
  },
  "footer.links": { en: "Links", ar: "\u0631\u0648\u0627\u0628\u0637" },
  "footer.follow": { en: "Follow Us", ar: "\u062a\u0627\u0628\u0639\u0646\u0627" },
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
