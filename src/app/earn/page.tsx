import type { Metadata } from "next";
import { tools } from "@/data/tools";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Top AI Tools — Curated Picks to Boost Your Productivity",
  description:
    "Discover our top 10 curated AI tools for productivity, creativity, and professional growth. No coding required.",
  openGraph: {
    title: "Top AI Tools — Curated Picks to Boost Your Productivity",
    description:
      "Discover our top 10 curated AI tools for productivity, creativity, and professional growth. No coding required.",
  },
};

// Pick top 10 tools - prioritize featured + highest rated
const topTools = [...tools]
  .sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (b.rating || 0) - (a.rating || 0);
  })
  .slice(0, 10);

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= rating ? "text-yellow-400" : "text-zinc-700"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function PricingBadge({ pricing }: { pricing: string }) {
  const colors: Record<string, string> = {
    Free: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    Freemium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    Paid: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    "Free Trial": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  };

  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full border ${colors[pricing] || colors["Paid"]}`}
    >
      {pricing}
    </span>
  );
}

export default function EarnPage() {
  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <Breadcrumbs items={[{ label: "Top AI Tools" }]} />
      </div>
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/10 via-transparent to-transparent" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-block px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6">
            🚀 Curated Picks
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            <span className="gradient-text">Level Up</span> with AI Tools
          </h1>
          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-8">
            These 10 AI tools are helping thousands of people work smarter and build new skills.
            No coding required. Explore each tool and find your perfect match.
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="#tools"
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              See the Top 10 →
            </a>
            <Link
              href="/blog"
              className="px-6 py-3 rounded-lg border border-card-border text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Read Guides
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 border-t border-card-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            How to Get Started with AI
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                icon: "🎯",
                title: "Pick a Tool",
                desc: "Choose an AI tool that fits your skills. Writing, design, coding — there's something for everyone.",
              },
              {
                icon: "📚",
                title: "Learn the Skill",
                desc: "Follow our free guides to master the tool. Most people get started in under an hour.",
              },
              {
                icon: "💰",
                title: "Start Creating",
                desc: "Create content, build projects, automate tasks, or explore freelancing. The possibilities are endless.",
              },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl mb-4">{step.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-zinc-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top 10 Tools */}
      <section id="tools" className="py-16 px-4 border-t border-card-border">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Top 10 AI Tools for <span className="gradient-text">Productivity & Growth</span>
          </h2>
          <p className="text-zinc-400 text-center mb-12 max-w-2xl mx-auto">
            Hand-picked and tested. These tools offer the best value for beginners and professionals alike.
          </p>

          <div className="space-y-6">
            {topTools.map((tool, index) => (
              <div
                key={tool.slug}
                className="group p-6 rounded-2xl border border-card-border bg-card-bg hover:border-purple-500/30 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Rank */}
                  <div className="flex items-center gap-4 sm:w-16">
                    <span className="text-3xl font-bold text-zinc-700 group-hover:text-purple-500 transition-colors">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-xl font-bold text-foreground">
                        {tool.name}
                      </h3>
                      <PricingBadge pricing={tool.pricing} />
                      {tool.featured && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">
                      {tool.description}
                    </p>
                    <div className="flex items-center gap-4">
                      <StarRating rating={tool.rating || 0} />
                      <span className="text-xs text-zinc-600">
                        {tool.category}
                      </span>
                      {tool.pricingDetail && (
                        <span className="text-xs text-zinc-500">
                          {tool.pricingDetail}
                        </span>
                      )}
                    </div>
                    {tool.useCase && (
                      <p className="text-xs text-cyan-400/80 mt-2">
                        💡 Best for: {tool.useCase}
                      </p>
                    )}
                  </div>

                  {/* CTA */}
                  <div className="sm:w-48 flex flex-col gap-2">
                    <a
                      href={tool.affiliateUrl || tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center px-5 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      Try It Free →
                    </a>
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Visit Website
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-card-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to <span className="gradient-text">Get Started</span>?
          </h2>
          <p className="text-zinc-400 mb-8">
            Join thousands who are already boosting their productivity with AI. Get our weekly tips and tool reviews.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/blog"
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition-opacity"
            >
              Read Free Guides
            </Link>
            <Link
              href="/tools"
              className="px-8 py-3 rounded-lg border border-card-border text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
            >
              Browse All Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Disclaimers */}
      <section className="py-8 px-4 border-t border-card-border">
        <div className="max-w-3xl mx-auto space-y-3">
          <p className="text-xs text-zinc-600 text-center">
            <strong className="text-zinc-500">Affiliate Disclosure:</strong> Some
            links on this page are affiliate links. We may earn a commission if
            you sign up through our link, at no extra cost to you. We only
            recommend tools we have personally reviewed and believe provide value.
          </p>
          <p className="text-xs text-zinc-600 text-center">
            <strong className="text-zinc-500">Disclaimer:</strong> Results vary
            based on individual effort, experience, and market conditions. This
            content is educational and does not guarantee any specific outcomes.
          </p>
        </div>
      </section>
    </div>
  );
}
