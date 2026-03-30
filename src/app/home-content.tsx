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

      {/* Newsletter Section */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-16">
        <NewsletterSignup />
      </section>
    </>
  );
}
