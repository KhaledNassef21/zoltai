import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { AffiliateCTA } from "@/components/affiliate-cta";
import { LeadMagnet } from "@/components/lead-magnet";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { Comments } from "@/components/comments";
import { MidArticleCTA, BottomArticleCTA } from "@/components/article-cta";
import { NewsletterPopup } from "@/components/newsletter-popup";
import { getFeaturedTools, tools } from "@/data/tools";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      images: post.image ? [{ url: post.image }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

function getRelevantTools(title: string, tags: string[]) {
  const text = `${title} ${tags.join(" ")}`.toLowerCase();
  const matched = tools.filter((tool) => {
    const keywords = [
      tool.name.toLowerCase(),
      tool.category.toLowerCase(),
      ...tool.description.toLowerCase().split(/\s+/).slice(0, 5),
    ];
    return keywords.some((k) => text.includes(k));
  });

  if (matched.length >= 3) return matched.slice(0, 3);
  const featured = getFeaturedTools();
  const combined = [
    ...matched,
    ...featured.filter((f) => !matched.includes(f)),
  ];
  return combined.slice(0, 3);
}

function getRelatedPosts(currentSlug: string, currentTags: string[]) {
  const allPosts = getAllPosts().filter((p) => p.slug !== currentSlug);
  const scored = allPosts.map((post) => {
    const overlap = post.tags.filter((t) => currentTags.includes(t)).length;
    return { post, score: overlap };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => s.post);
}

// JSON-LD for article
function getJsonLd(post: any, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    image: post.image ? `https://zoltai.org${post.image}` : undefined,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: post.author || "Zoltai",
      url: "https://zoltai.org",
    },
    publisher: {
      "@type": "Organization",
      name: "Zoltai",
      url: "https://zoltai.org",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://zoltai.org/blog/${slug}`,
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const relevantTools = getRelevantTools(post.title, post.tags);
  const relatedPosts = getRelatedPosts(slug, post.tags);
  const jsonLd = getJsonLd(post, slug);

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* === HEADER === */}
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          {post.tags.map((tag: string) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-light"
            >
              {tag}
            </span>
          ))}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
          {post.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 text-sm text-zinc-500">
          <span>{post.author}</span>
          <span>&middot;</span>
          <time>
            {new Date(post.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </time>
          <span>&middot;</span>
          <span>{post.readingTime}</span>
        </div>
      </header>

      {post.image && (
        <div className="aspect-video rounded-xl overflow-hidden mb-10">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
          />
        </div>
      )}

      {/* === LEAD FLOW POSITION 1: Top CTA (Affiliate) === */}
      {relevantTools[0] && (
        <AffiliateCTA
          toolName={relevantTools[0].name}
          description={relevantTools[0].description}
          ctaText={`Try ${relevantTools[0].name} Free →`}
          ctaUrl={relevantTools[0].affiliateUrl || relevantTools[0].url}
          variant="banner"
          badge="Top Pick for This Topic"
        />
      )}

      {/* === LEAD FLOW POSITION 2: Top Newsletter Bar === */}
      <NewsletterSignup
        variant="banner"
        title="Free AI Money Guide"
        description="Get the top 10 AI tools that can earn you $1,000/month. Free weekly tips."
      />

      {/* === ARTICLE CONTENT === */}
      <div className="prose">
        <MDXRemote source={post.content} />
      </div>

      {/* === LEAD FLOW POSITION 3: Mid-Article CTA === */}
      {relevantTools[0] && (
        <MidArticleCTA
          toolName={relevantTools[0].name}
          toolUrl={relevantTools[0].affiliateUrl || relevantTools[0].url}
          slug={slug}
        />
      )}

      {/* === Top Tools for This Topic === */}
      {relevantTools.length > 1 && (
        <div className="my-10 p-6 rounded-xl border border-accent/20 bg-gradient-to-br from-accent/5 via-card-bg to-card-bg">
          <h3 className="font-bold text-lg mb-4">
            🛠️ Top Tools for This Topic
          </h3>
          <div className="space-y-3">
            {relevantTools.map((tool) => (
              <a
                key={tool.slug}
                href={tool.affiliateUrl || tool.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="flex items-center justify-between p-4 rounded-lg border border-card-border bg-card-bg hover:border-accent/30 transition-all group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold group-hover:text-accent-light transition-colors">
                      {tool.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent-light">
                      {tool.pricing}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 truncate">
                    {tool.description}
                  </p>
                </div>
                <span className="text-accent-light text-sm font-medium whitespace-nowrap ml-4">
                  Try Free →
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* === LEAD FLOW POSITION 4: Bottom Article CTA === */}
      <BottomArticleCTA slug={slug} />

      {/* === LEAD FLOW POSITION 5: Lead Magnet (Email Capture) === */}
      <div className="mt-8">
        <LeadMagnet />
      </div>

      {/* === Related Articles === */}
      {relatedPosts.length > 0 && (
        <div className="mt-12">
          <h3 className="font-bold text-xl mb-6">📖 Related Articles</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/blog/${related.slug}`}
                className="p-4 rounded-xl border border-card-border bg-card-bg hover:border-accent/30 transition-all group"
              >
                <h4 className="font-semibold text-sm leading-snug group-hover:text-accent-light transition-colors line-clamp-2">
                  {related.title}
                </h4>
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-600">
                  <time>
                    {new Date(related.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                  <span>&middot;</span>
                  <span>{related.readingTime}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* === Explore All Tools === */}
      <div className="mt-10 p-6 rounded-xl border border-card-border bg-card-bg">
        <h3 className="font-bold text-lg mb-2">Explore All AI Tools</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Discover {tools.length}+ curated AI tools to help you earn money
          online.
        </p>
        <a
          href="/tools"
          className="inline-flex items-center gap-2 text-accent-light text-sm font-medium hover:underline"
        >
          Browse Tools Directory →
        </a>
      </div>

      {/* === Comments === */}
      <Comments slug={slug} />

      {/* === LEAD FLOW POSITION 6: Newsletter Popup (timed + exit intent) === */}
      <NewsletterPopup />
    </article>
  );
}
