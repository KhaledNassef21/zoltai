import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/blog";

export function BlogCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <article className="rounded-xl border border-card-border bg-card-bg overflow-hidden transition-all hover:border-accent/40 hover:glow">
        {post.image && (
          <div className="aspect-video bg-zinc-800 overflow-hidden relative">
            <Image
              src={post.image}
              alt={post.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300"
              >
                {tag}
              </span>
            ))}
          </div>
          <h3 className="font-semibold text-lg leading-snug group-hover:text-accent-light transition-colors">
            {post.title}
          </h3>
          <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
            {post.description}
          </p>
          <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500">
            <time>{new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
            <span>&middot;</span>
            <span>{post.readingTime}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
