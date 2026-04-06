import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllPosts, getAllTags } from "@/lib/blog";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { BlogWithFilters } from "./blog-with-filters";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Latest articles on AI tools, productivity tips, and artificial intelligence guides.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const allTags = getAllTags();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumbs items={[{ label: "Blog" }]} />
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="gradient-text">Blog</span>
        </h1>
        <p className="mt-3 text-zinc-400 text-lg">
          Fresh AI insights, tool reviews, and productivity hacks — published
          daily.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl bg-card-bg border border-card-border animate-pulse"
              />
            ))}
          </div>
        }
      >
        <BlogWithFilters posts={posts} allTags={allTags} />
      </Suspense>
    </div>
  );
}
