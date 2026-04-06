"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BlogCard } from "@/components/blog-card";
import type { Post } from "@/lib/blog";

interface BlogWithFiltersProps {
  posts: Post[];
  allTags: string[];
}

export function BlogWithFilters({ posts, allTags }: BlogWithFiltersProps) {
  const searchParams = useSearchParams();
  const urlTag = searchParams.get("tag");
  const [activeTag, setActiveTag] = useState<string | null>(urlTag);

  const filteredPosts = useMemo(() => {
    if (!activeTag) return posts;
    return posts.filter((post) =>
      post.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase())
    );
  }, [posts, activeTag]);

  return (
    <>
      {/* Tag Filter Bar */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveTag(null)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !activeTag
              ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
              : "bg-card-bg border-card-border text-zinc-400 hover:border-purple-500/30 hover:text-zinc-200"
          }`}
        >
          All ({posts.length})
        </button>
        {allTags.map((tag) => {
          const count = posts.filter((p) =>
            p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
          ).length;
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? null : tag)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                tag === activeTag
                  ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                  : "bg-card-bg border-card-border text-zinc-400 hover:border-purple-500/30 hover:text-zinc-200"
              }`}
            >
              {tag} ({count})
            </button>
          );
        })}
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg">No articles found for &quot;{activeTag}&quot;</p>
          <button
            onClick={() => setActiveTag(null)}
            className="mt-3 text-sm text-purple-400 hover:underline"
          >
            Show all articles
          </button>
        </div>
      )}
    </>
  );
}
