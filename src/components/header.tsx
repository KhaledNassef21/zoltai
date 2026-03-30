"use client";

import Link from "next/link";
import { useTheme, useLang } from "./providers";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLang();

  return (
    <header className="border-b border-card-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold gradient-text">
          Zoltai
        </Link>

        <div className="flex items-center gap-4 sm:gap-6 text-sm">
          <Link
            href="/blog"
            className="text-zinc-400 hover:text-foreground transition-colors"
          >
            {t("nav.blog")}
          </Link>
          <Link
            href="/tools"
            className="text-zinc-400 hover:text-foreground transition-colors"
          >
            {t("nav.tools")}
          </Link>
          <Link
            href="/about"
            className="text-zinc-400 hover:text-foreground transition-colors hidden sm:block"
          >
            {t("nav.about")}
          </Link>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="px-2 py-1 rounded-md text-xs font-medium border border-card-border text-zinc-400 hover:text-foreground hover:border-accent/30 transition-colors"
            title={lang === "en" ? "Switch to Arabic" : "Switch to English"}
          >
            {lang === "en" ? "AR" : "EN"}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md border border-card-border text-zinc-400 hover:text-foreground hover:border-accent/30 transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
