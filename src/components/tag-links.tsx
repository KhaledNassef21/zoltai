import Link from "next/link";

interface TagLinksProps {
  tags: string[];
  currentTag?: string;
}

/**
 * Renders clickable tag pills that link to blog filtered by tag.
 * Improves internal linking for SEO and user navigation.
 */
export function TagLinks({ tags, currentTag }: TagLinksProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Link
          key={tag}
          href={`/blog?tag=${encodeURIComponent(tag)}`}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            tag === currentTag
              ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
              : "bg-card-bg border-card-border text-zinc-400 hover:border-purple-500/30 hover:text-zinc-200"
          }`}
        >
          {tag}
        </Link>
      ))}
    </div>
  );
}
