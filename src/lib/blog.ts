// Blog post utilities — reads MDX frontmatter including affiliateLinks
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

export interface AffiliateLink {
  name: string;
  url: string;
}

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image: string;
  readingTime: string;
  content: string;
  affiliateLinks: AffiliateLink[];
}

export function getAllPosts(): Post[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));

  const posts = files.map((file) => getPostBySlug(file.replace(".mdx", "")));

  return posts
    .filter((p): p is Post => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);
  const stats = readingTime(content);

  return {
    slug,
    title: data.title || "Untitled",
    description: data.description || "",
    date: data.date || new Date().toISOString(),
    author: data.author || "Zoltai",
    tags: data.tags || [],
    image: data.image || "/images/default-cover.jpg",
    readingTime: stats.text,
    content,
    affiliateLinks: data.affiliateLinks || [],
  };
}

export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tags.add(tag)));
  return Array.from(tags).sort();
}
