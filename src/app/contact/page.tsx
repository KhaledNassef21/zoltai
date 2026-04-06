import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with the Zoltai team. Suggest AI tools, report issues, or collaborate with us.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumbs items={[{ label: "Contact" }]} />
      <h1 className="text-3xl sm:text-4xl font-bold mb-3">
        Contact <span className="gradient-text">Us</span>
      </h1>
      <p className="text-zinc-400 mb-10 max-w-xl">
        Have a question, suggestion, or want to collaborate? We&apos;d love to
        hear from you.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {/* Email */}
        <a
          href="mailto:info.zoltai@gmail.com"
          className="p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all group"
        >
          <div className="text-3xl mb-3">✉️</div>
          <h3 className="font-semibold text-lg group-hover:text-accent-light transition-colors">
            Email
          </h3>
          <p className="text-sm text-zinc-500 mt-1">info.zoltai@gmail.com</p>
          <p className="text-xs text-zinc-600 mt-2">
            Best for partnerships, affiliate inquiries, and detailed questions.
          </p>
        </a>

        {/* Instagram */}
        <a
          href="https://www.instagram.com/zoltai.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all group"
        >
          <div className="text-3xl mb-3">📸</div>
          <h3 className="font-semibold text-lg group-hover:text-accent-light transition-colors">
            Instagram
          </h3>
          <p className="text-sm text-zinc-500 mt-1">@zoltai.ai</p>
          <p className="text-xs text-zinc-600 mt-2">
            Daily AI tips, tool highlights, and quick interactions.
          </p>
        </a>

        {/* Facebook */}
        <a
          href="https://www.facebook.com/zoltai.community"
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all group"
        >
          <div className="text-3xl mb-3">👥</div>
          <h3 className="font-semibold text-lg group-hover:text-accent-light transition-colors">
            Facebook
          </h3>
          <p className="text-sm text-zinc-500 mt-1">Zoltai Community</p>
          <p className="text-xs text-zinc-600 mt-2">
            Join our community for discussions and updates.
          </p>
        </a>

        {/* Suggest a Tool */}
        <a
          href="mailto:info.zoltai@gmail.com?subject=Tool%20Suggestion%20for%20Zoltai"
          className="p-6 rounded-xl border border-card-border bg-card-bg hover:border-accent/40 transition-all group"
        >
          <div className="text-3xl mb-3">🛠️</div>
          <h3 className="font-semibold text-lg group-hover:text-accent-light transition-colors">
            Suggest a Tool
          </h3>
          <p className="text-sm text-zinc-500 mt-1">Know a great AI tool?</p>
          <p className="text-xs text-zinc-600 mt-2">
            Email us and we&apos;ll review it for our tools directory.
          </p>
        </a>
      </div>

      {/* FAQ Section */}
      <section>
        <h2 className="text-2xl font-bold mb-6">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {[
            {
              q: "How can AI tools help me in my work?",
              a: "Check out our blog for detailed guides. Popular use cases include AI-assisted freelancing (writing, design, coding), creating content with AI, building AI-powered products, and streamlining workflows.",
            },
            {
              q: "Are the tools on Zoltai really free?",
              a: "Many tools have generous free tiers. We clearly list pricing for each tool — look for 'Freemium' or 'Free Trial' badges in our tools directory.",
            },
            {
              q: "Do I need coding skills?",
              a: "No! Most of our guides are beginner-friendly and require zero coding knowledge. We focus on no-code and low-code AI tools.",
            },
            {
              q: "How often do you publish new content?",
              a: "We publish a new AI article every day, automatically generated and optimized by our AI pipeline.",
            },
            {
              q: "Can I write for Zoltai?",
              a: "Yes! If you're an AI enthusiast or expert, email us at info.zoltai@gmail.com with your article idea.",
            },
          ].map((faq) => (
            <details
              key={faq.q}
              className="p-5 rounded-xl border border-card-border bg-card-bg group"
            >
              <summary className="font-semibold cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <span className="text-zinc-500 group-open:rotate-180 transition-transform">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
