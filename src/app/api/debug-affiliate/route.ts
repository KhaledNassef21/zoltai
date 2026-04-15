import { NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/blog";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || "automate-e-commerce-descriptions-semrush-vs-grammarly-2025";

  const post = getPostBySlug(slug);

  if (!post) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  return NextResponse.json({
    slug: post.slug,
    title: post.title,
    affiliateLinks: post.affiliateLinks,
    affiliateLinksCount: post.affiliateLinks.length,
    tagsCount: post.tags.length,
  });
}
