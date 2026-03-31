"use client";

import Link from "next/link";
import { useLang } from "@/components/providers";
import { BlogCard } from "@/components/blog-card";
import { NewsletterSignup } from "@/components/newsletter-signup";
import type { Post } from "@/lib/blog";

interface Tool {
  slug: string;
  name: string;
  description: string;
  category: string;
  rating?: number;
  url: string;
  affiliateUrl?: string;
}

export function HomeContent({
  posts,
  featured,
}: {
  posts: Post[];
  featured: Tool[];
}) {
  const { t, dir } = useLang();

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight tracking-tight">
              {t("hero.title1")}{" "}
              <span className="gradient-text">{t("hero.title2")}</span>
              <br />
              {t("hero.title3")}
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-medium transition-colors"
              >
                {t("hero.cta1")}
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-card-border text-zinc-300 hover:bg-card-bg transition-colors"
              >
                {t("hero.cta2")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              titleKey: "feat.daily.title",
              descKey: "feat.daily.desc",
              icon: "📡",
            },
            {
              titleKey: "feat.reviews.title",
              descKey: "feat.reviews.desc",
              icon: "🔍",
            },
            {
              titleKey: "feat.hacks.title",
              descKey: "feat.hacks.desc",
              icon: "⚡",
            },
          ].map((feature) => (
            <div
              key={feature.titleKey}
              className="p-6 rounded-xl border border-card-border bg-card-bg glow"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-lg mb-2">
                {t(feature.titleKey)}
              </h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                {t(feature.descKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Tools */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold">
              {t("section.topTools").split(" ")[0]}{" "}
              <span className="gradient-text">
                {t("section.topTools").split(" ").slice(1).join(" ")}
              </span>
            </h2>
            <Link
              href="/tools"
              className="text-accent-light text-sm hover:underline"
            >
              {t("section.viewAll")} &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {featured.map((tool) => (
              <a
                key={tool.slug}
                href={tool.affiliateUrl || tool.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-light">
                    {tool.category}
                  </span>
                  {tool.rating && (
                    <span className="text-xs text-amber-400">
                      {"★".repeat(tool.rating)}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg group-hover:text-accent-light transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 line-clamp-2">
                  {tool.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-accent-light text-sm font-medium">
                  {t("section.tryNow")}
                  <svg
                    className={`w-4 h-4 group-hover:translate-x-1 transition-transform ${dir === "rtl" ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Latest Posts */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">
            {t("section.latest")}
          </h2>
          <Link
            href="/blog"
            className="text-accent-light text-sm hover:underline"
          >
            {t("section.viewAll")} &rarr;
          </Link>
        </div>
        {posts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-500">
            <p className="text-lg">{t("section.comingSoon")}</p>
          </div>
        )}
      </section>

      {/* Testimonials / Social Proof */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">
          {t("testimonials.title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              name: "Sarah M.",
              role: "Freelance Writer",
              text: "Zoltai helped me discover AI writing tools that tripled my freelance income. The guides are super practical!",
              avatar: "S",
            },
            {
              name: "Ahmed K.",
              role: "Digital Marketer",
              text: "I found the best AI tools for my marketing agency through Zoltai. The comparison articles saved me hours of research.",
              avatar: "A",
            },
            {
              name: "Lisa T.",
              role: "Content Creator",
              text: "Started earning from AI art after reading the Midjourney guide. Zoltai is my go-to resource for AI money tips.",
              avatar: "L",
            },
          ].map((review) => (
            <div
              key={review.name}
              className="p-6 rounded-xl border border-card-border bg-card-bg"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent-light font-bold text-sm">
                  {review.avatar}
                </div>
                <div>
                  <p className="font-semibold text-sm">{review.name}</p>
                  <p className="text-xs text-zinc-500">{review.role}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-3 text-amber-400 text-xs">★★★★★</div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="p-8 rounded-2xl border border-card-border bg-gradient-to-br from-accent/5 via-card-bg to-cyan-500/5 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            {t("community.title")}
          </h2>
          <p className="text-zinc-400 mb-8 max-w-lg mx-auto">
            {t("community.desc")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://t.me/zoltai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#0088cc] hover:bg-[#0088cc]/90 text-white font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.484-.428-.009-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.333-1.386 4.025-1.627 4.477-1.635.099-.002.321.023.465.141.12.098.153.229.168.326.016.098.036.315.02.487z" />
              </svg>
              Telegram
            </a>
            <a
              href="https://discord.gg/zoltai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#5865F2] hover:bg-[#5865F2]/90 text-white font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
              </svg>
              Discord
            </a>
            <a
              href="https://instagram.com/zoltai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-card-border text-zinc-300 hover:bg-card-bg transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <NewsletterSignup />
      </section>
    </>
  );
}
