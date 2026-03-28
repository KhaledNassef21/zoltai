import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPostBySlug } from "@/lib/blog";
import { AffiliateCTA } from "@/components/affiliate-cta";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { getFeaturedTools } from "@/data/tools";

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

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Pick 2 random featured tools for inline CTAs
  const featured = getFeaturedTools();
  const shuffled = [...featured].sort(() => Math.random() - 0.5);
  const topPick = shuffled[0];
  const secondPick = shuffled[1];

  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <header className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          {post.tags.map((tag) => (
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
          />
        </div>
      )}

      {/* Mid-article CTA */}
      {topPick && (
        <AffiliateCTA
          toolName={topPick.name}
          description={topPick.description}
          ctaText="Try Now — Free"
          ctaUrl={topPick.affiliateUrl || topPick.url}
          variant="banner"
          badge="Editor's Pick"
        />
      )}

      <div className="prose">
        <MDXRemote source={post.content} />
      </div>

      {/* Post-article CTA */}
      {secondPick && (
        <AffiliateCTA
          toolName={secondPick.name}
          description={secondPick.description}
          ctaText="Start Free Trial"
          ctaUrl={secondPick.affiliateUrl || secondPick.url}
          variant="default"
          badge="Recommended"
        />
      )}

      {/* Newsletter CTA */}
      <div className="mt-12">
        <NewsletterSignup
          variant="card"
          title="Enjoyed this article?"
          description="Get more AI insights, tool reviews, and productivity hacks delivered to your inbox every week."
        />
      </div>

      {/* Related tools suggestion */}
      <div className="mt-10 p-6 rounded-xl border border-card-border bg-card-bg">
        <h3 className="font-bold text-lg mb-2">Explore More AI Tools</h3>
        <p className="text-sm text-zinc-500 mb-4">
          Discover {featured.length}+ curated AI tools in our directory.
        </p>
        <a
          href="/tools"
          className="inline-flex items-center gap-2 text-accent-light text-sm font-medium hover:underline"
        >
          Browse Tools Directory
          <svg
            className="w-4 h-4"
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
        </a>
      </div>
    </article>
  );
}
