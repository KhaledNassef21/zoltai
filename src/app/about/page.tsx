import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About Zoltai - Learn and Master AI Tools",
  description:
    "Zoltai helps you discover the best AI tools to boost productivity, learn new skills, and work smarter. No coding required.",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Zoltai",
  url: "https://zoltai.org",
  description:
    "Discover the best AI tools to boost productivity and work smarter. No coding required.",
  sameAs: [
    "https://www.instagram.com/zoltai.ai/",
    "https://www.facebook.com/zoltai.community",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    email: "info.zoltai@gmail.com",
    contactType: "customer service",
  },
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1 className="text-3xl sm:text-4xl font-bold mb-6">
        About <span className="gradient-text">Zoltai</span>
      </h1>

      <div className="prose">
        <p>
          Zoltai is your guide to <strong>mastering AI tools</strong> —
          no coding required. We publish daily articles, honest reviews, and
          step-by-step tutorials to help you work smarter using the best
          artificial intelligence tools available today.
        </p>

        <h2>Our Mission</h2>
        <p>
          We believe everyone can benefit from AI — whether you&apos;re a complete
          beginner or a seasoned professional. Our mission is to bridge the gap
          between powerful AI technology and everyday workflows, making it
          accessible to anyone with an internet connection.
        </p>

        <h2>What We Cover</h2>
        <ul>
          <li>
            <strong>AI Tool Reviews &amp; Comparisons</strong> — Honest, in-depth
            reviews with free trials and deals
          </li>
          <li>
            <strong>Practical AI Strategies</strong> — Step-by-step guides to
            leverage AI for freelancing, content creation, and automation
          </li>
          <li>
            <strong>Productivity Hacks</strong> — Automate your work and 10x
            your output using AI
          </li>
          <li>
            <strong>Beginner-Friendly Tutorials</strong> — Start from zero, no
            technical skills needed
          </li>
          <li>
            <strong>Weekly Newsletter</strong> — The best AI tools and strategies
            delivered to your inbox
          </li>
        </ul>

        <h2>How It Works</h2>
        <p>
          Our content pipeline is powered by AI itself. We use Claude to research
          trending topics and generate high-quality articles, optimize for SEO
          automatically, and publish daily — ensuring you always have fresh,
          actionable content to learn from.
        </p>

        <h2>Join the Community</h2>
        <p>
          Follow us on{" "}
          <a
            href="https://www.instagram.com/zoltai.ai/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram (@zoltai.ai)
          </a>{" "}
          and{" "}
          <a
            href="https://www.facebook.com/zoltai.community"
            target="_blank"
            rel="noopener noreferrer"
          >
            Facebook
          </a>{" "}
          for daily AI tips. Have a question? Email us at{" "}
          <a href="mailto:info.zoltai@gmail.com">info.zoltai@gmail.com</a>.
        </p>
      </div>

      <div className="mt-12 flex flex-col sm:flex-row gap-4">
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
        <Link
          href="/contact"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-card-border text-zinc-300 hover:bg-card-bg transition-colors"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
