import type { Metadata } from "next";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "@/components/blog-card";
import { Breadcrumbs } from "@/components/breadcrumbs";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Latest articles on AI tools, productivity tips, and artificial intelligence guides.",
};

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
      <Breadcrumbs items={[{ label: "Blog" }]} />
      <div className="mb-12">
        <h1 className="text-3xl sm:text-4xl font-bold">
          <span className="gradient-text">Blog</span>
        </h1>
        <p className="mt-3 text-zinc-400 text-lg">
          Fresh AI insights, tool reviews, and productivity hacks — published
          daily.
        </p>
      </div>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-zinc-500">
          <p className="text-xl">No articles yet</p>
          <p className="text-sm mt-2">
            Our AI is researching and writing the first batch of articles.
            Check back soon!
          </p>
        </div>
      )}
    </div>
  );
}
