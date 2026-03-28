import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog-card";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { getFeaturedTools } from "@/data/tools";

export default function Home() {
  const posts = getAllPosts().slice(0, 6);
  const featured = getFeaturedTools().slice(0, 3);

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 relative">
          <div className="max-w-3xl">
            <h1 className="text-4xl sm:text-6xl font-bold leading-tight tracking-tight">
              Master{" "}
              <span className="gradient-text">AI Tools</span>
              <br />& Boost Your Productivity
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-2xl">
              Daily articles, tool reviews, and actionable tips to help you
              leverage artificial intelligence — whether you&apos;re just starting
              or already a pro.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/tools"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-medium transition-colors"
              >
                Explore AI Tools
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-card-border text-zinc-300 hover:bg-card-bg transition-colors"
              >
                Read the Blog
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
              title: "Daily AI Insights",
              description:
                "Fresh, research-backed articles on the latest AI tools and trends — published every day.",
              icon: "\uD83D\uDCE1",
            },
            {
              title: "Tool Reviews & Deals",
              description:
                "Honest, in-depth reviews with free trials and exclusive deals on the best AI tools.",
              icon: "\uD83D\uDD0D",
            },
            {
              title: "Productivity Hacks",
              description:
                "Actionable tips to automate your work and 10x your output with AI.",
              icon: "\u26A1",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border border-card-border bg-card-bg glow"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                {feature.description}
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
              Top <span className="gradient-text">AI Tools</span>
            </h2>
            <Link
              href="/tools"
              className="text-accent-light text-sm hover:underline"
            >
              View all &rarr;
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
                  Try Now
                  <svg
                    className="w-4 h-4 group-hover:translate-x-1 transition-transform"
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
          <h2 className="text-2xl sm:text-3xl font-bold">Latest Articles</h2>
          <Link
            href="/blog"
            className="text-accent-light text-sm hover:underline"
          >
            View all &rarr;
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
            <p className="text-lg">First articles coming soon...</p>
            <p className="text-sm mt-2">
              Our AI is researching and writing fresh content daily.
            </p>
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
