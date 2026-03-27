import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog-card";

export default function Home() {
  const posts = getAllPosts().slice(0, 6);

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
                href="/blog"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-accent hover:bg-accent/90 text-white font-medium transition-colors"
              >
                Read the Blog
              </Link>
              <Link
                href="/tools"
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-card-border text-zinc-300 hover:bg-card-bg transition-colors"
              >
                Explore AI Tools
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
              icon: "📡",
            },
            {
              title: "Tool Reviews",
              description:
                "Honest, in-depth reviews of AI tools to help you pick the right one for your workflow.",
              icon: "🔍",
            },
            {
              title: "Productivity Hacks",
              description:
                "Actionable tips to automate your work and 10x your output with AI.",
              icon: "⚡",
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
    </>
  );
}
