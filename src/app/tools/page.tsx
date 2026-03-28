import type { Metadata } from "next";
import { tools, toolCategories } from "@/data/tools";
import { ToolsDirectory } from "./tools-directory";

export const metadata: Metadata = {
  title: "Best AI Tools Directory 2026 — Curated & Reviewed",
  description:
    "Discover the best AI tools for writing, coding, image generation, SEO, and productivity. Curated reviews with pricing and free trials.",
  keywords: [
    "best AI tools",
    "AI tools directory",
    "AI writing tools",
    "AI image generators",
    "AI coding tools",
    "free AI tools",
  ],
};

export default function ToolsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-bold">
          Best <span className="gradient-text">AI Tools</span> in 2026
        </h1>
        <p className="mt-3 text-zinc-400 text-lg max-w-2xl">
          Hand-picked AI tools to supercharge your productivity. Honest reviews,
          real pricing, and free trials.
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 mb-10 text-sm text-zinc-500">
        <span>
          <strong className="text-white">{tools.length}</strong> tools listed
        </span>
        <span>
          <strong className="text-white">
            {tools.filter((t) => t.pricing === "Free" || t.pricing === "Freemium").length}
          </strong>{" "}
          with free plans
        </span>
        <span>
          <strong className="text-white">
            {toolCategories.length - 1}
          </strong>{" "}
          categories
        </span>
      </div>

      {/* Client-side filterable directory */}
      <ToolsDirectory />
    </div>
  );
}
