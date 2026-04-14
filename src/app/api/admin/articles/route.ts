import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { isAuthenticated } from "@/lib/admin-auth";
import {
  readFile,
  writeFile,
  deleteFile,
  listFiles,
  isGitHubAvailable,
} from "@/lib/github";

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");
const GITHUB_CONTENT_DIR = "src/content/blog";

// GET: List all articles, or get single article content
export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  // --- Single article fetch ---
  if (slug) {
    // Try local filesystem first
    const localPath = path.join(CONTENT_DIR, `${slug}.mdx`);
    let raw: string | null = null;

    if (fs.existsSync(localPath)) {
      raw = fs.readFileSync(localPath, "utf-8");
    } else if (isGitHubAvailable()) {
      const file = await readFile(`${GITHUB_CONTENT_DIR}/${slug}.mdx`);
      if (file) raw = file.content;
    }

    if (!raw) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { data, content: body } = matter(raw);
    return NextResponse.json({
      slug,
      title: data.title || "Untitled",
      description: data.description || "",
      date: data.date || "",
      author: data.author || "Zoltai AI",
      tags: data.tags || [],
      image: data.image || "",
      content: body.trim(),
      affiliateLinks: data.affiliateLinks || [],
    });
  }

  // --- List all articles ---
  let articles: any[] = [];

  // Try local filesystem
  if (fs.existsSync(CONTENT_DIR)) {
    const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
    articles = files.map((file) => {
      const fileSlug = file.replace(".mdx", "");
      const content = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
      const { data, content: body } = matter(content);
      return {
        slug: fileSlug,
        title: data.title || "Untitled",
        description: data.description || "",
        date: data.date || "",
        author: data.author || "Zoltai AI",
        tags: data.tags || [],
        image: data.image || "",
        wordCount: body.split(/\s+/).length,
        affiliateLinks: data.affiliateLinks || [],
      };
    });
  }

  // If no local articles and GitHub is available, try GitHub
  if (articles.length === 0 && isGitHubAvailable()) {
    try {
      const files = await listFiles(GITHUB_CONTENT_DIR);
      const mdxFiles = files.filter((f) => f.name.endsWith(".mdx"));

      for (const file of mdxFiles) {
        const fileData = await readFile(file.path);
        if (fileData) {
          const fileSlug = file.name.replace(".mdx", "");
          const { data, content: body } = matter(fileData.content);
          articles.push({
            slug: fileSlug,
            title: data.title || "Untitled",
            description: data.description || "",
            date: data.date || "",
            author: data.author || "Zoltai AI",
            tags: data.tags || [],
            image: data.image || "",
            wordCount: body.split(/\s+/).length,
            affiliateLinks: data.affiliateLinks || [],
          });
        }
      }
    } catch {
      // GitHub API failed, return empty
    }
  }

  articles.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return NextResponse.json({ articles });
}

// POST: Create new article
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, content, tags, author, image, affiliateLinks } =
      await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const date = new Date().toISOString().split("T")[0];
    const validLinks = (affiliateLinks || []).filter((l: any) => l.name && l.url);

    const mdxContent = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${(description || "").replace(/"/g, '\\"')}"
date: "${date}"
author: "${author || "Zoltai"}"
tags: ${JSON.stringify(tags || [])}
image: "${image || ""}"
affiliateLinks: ${JSON.stringify(validLinks)}
---

${content}
`;

    // Try local filesystem first
    try {
      if (!fs.existsSync(CONTENT_DIR)) {
        fs.mkdirSync(CONTENT_DIR, { recursive: true });
      }
      const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
      if (fs.existsSync(filePath)) {
        return NextResponse.json(
          { error: "Article with this slug already exists" },
          { status: 409 }
        );
      }
      fs.writeFileSync(filePath, mdxContent);
      return NextResponse.json({ success: true, slug });
    } catch {
      // Filesystem write failed (probably Vercel), try GitHub API
    }

    if (isGitHubAvailable()) {
      // Check if already exists on GitHub
      const existing = await readFile(`${GITHUB_CONTENT_DIR}/${slug}.mdx`);
      if (existing) {
        return NextResponse.json(
          { error: "Article with this slug already exists" },
          { status: 409 }
        );
      }

      await writeFile(
        `${GITHUB_CONTENT_DIR}/${slug}.mdx`,
        mdxContent,
        `Add article: ${title}`
      );
      return NextResponse.json({
        success: true,
        slug,
        note: "Article committed to GitHub. Site will redeploy shortly.",
      });
    }

    return NextResponse.json(
      { error: "Cannot write files. Configure GITHUB_TOKEN for Vercel." },
      { status: 500 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to create article: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

// PUT: Update existing article
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug, title, description, content, tags, author, image, date, affiliateLinks } =
      await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Read existing article (local or GitHub)
    let existingRaw: string | null = null;
    const localPath = path.join(CONTENT_DIR, `${slug}.mdx`);

    if (fs.existsSync(localPath)) {
      existingRaw = fs.readFileSync(localPath, "utf-8");
    } else if (isGitHubAvailable()) {
      const file = await readFile(`${GITHUB_CONTENT_DIR}/${slug}.mdx`);
      if (file) existingRaw = file.content;
    }

    if (!existingRaw) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const { data: existingData, content: existingBody } = matter(existingRaw);
    const finalLinks = affiliateLinks !== undefined
      ? (affiliateLinks || []).filter((l: any) => l.name && l.url)
      : (existingData.affiliateLinks || []);

    const mdxContent = `---
title: "${(title || existingData.title || "").replace(/"/g, '\\"')}"
description: "${(description || existingData.description || "").replace(/"/g, '\\"')}"
date: "${date || existingData.date || new Date().toISOString().split("T")[0]}"
author: "${author || existingData.author || "Zoltai AI"}"
tags: ${JSON.stringify(tags || existingData.tags || [])}
image: "${image || existingData.image || ""}"
affiliateLinks: ${JSON.stringify(finalLinks)}
---

${content !== undefined ? content : existingBody}
`;

    // Try local filesystem first
    try {
      fs.writeFileSync(localPath, mdxContent);
      return NextResponse.json({ success: true, slug });
    } catch {
      // Filesystem write failed, try GitHub
    }

    if (isGitHubAvailable()) {
      await writeFile(
        `${GITHUB_CONTENT_DIR}/${slug}.mdx`,
        mdxContent,
        `Update article: ${title || slug}`
      );
      return NextResponse.json({
        success: true,
        slug,
        note: "Article updated on GitHub. Site will redeploy shortly.",
      });
    }

    return NextResponse.json(
      { error: "Cannot write files. Configure GITHUB_TOKEN for Vercel." },
      { status: 500 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to update article: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

// DELETE: Delete article
export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    // Try local filesystem first
    const localPath = path.join(CONTENT_DIR, `${slug}.mdx`);
    let deletedLocally = false;

    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
        deletedLocally = true;
      }
      // Also try to delete associated image
      const imagePath = path.join(
        process.cwd(),
        `public/images/blog/${slug}.png`
      );
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch {
      // Filesystem failed, try GitHub
    }

    if (!deletedLocally && isGitHubAvailable()) {
      const deleted = await deleteFile(
        `${GITHUB_CONTENT_DIR}/${slug}.mdx`,
        `Delete article: ${slug}`
      );
      if (!deleted) {
        return NextResponse.json(
          { error: "Article not found" },
          { status: 404 }
        );
      }

      // Try to delete image too
      try {
        await deleteFile(
          `public/images/blog/${slug}.png`,
          `Delete image for: ${slug}`
        );
      } catch {
        // Image may not exist
      }

      return NextResponse.json({
        success: true,
        note: "Article deleted from GitHub. Site will redeploy shortly.",
      });
    }

    if (deletedLocally) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Cannot delete files. Configure GITHUB_TOKEN for Vercel." },
      { status: 500 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to delete article: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
