"use client";

import { useState } from "react";
import { tools, toolCategories } from "@/data/tools";
import { ToolCard } from "@/components/tool-card";

export function ToolsDirectory() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filtered =
    activeCategory === "All"
      ? tools
      : tools.filter((t) => t.category === activeCategory);

  // Sort: featured first, then by rating
  const sorted = [...filtered].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return (b.rating || 0) - (a.rating || 0);
  });

  return (
    <>
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {toolCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeCategory === cat
                ? "bg-accent text-white shadow-md shadow-accent/20"
                : "bg-card-bg border border-card-border text-zinc-400 hover:text-white hover:border-accent/30"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className="text-sm text-zinc-600 mb-6">
        Showing {sorted.length} tool{sorted.length !== 1 ? "s" : ""}
        {activeCategory !== "All" ? ` in ${activeCategory}` : ""}
      </p>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map((tool) => (
          <ToolCard key={tool.slug} tool={tool} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 text-center p-8 rounded-xl border border-card-border bg-card-bg">
        <h3 className="text-xl font-bold mb-2">
          Want us to review a specific tool?
        </h3>
        <p className="text-zinc-500 text-sm mb-4">
          We add new AI tools every week. Let us know what you&apos;d like to
          see next.
        </p>
        <a
          href="mailto:info.zoltai@gmail.com"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-accent text-accent-light hover:bg-accent/10 font-medium text-sm transition-all"
        >
          Suggest a Tool
        </a>
      </div>
    </>
  );
}
