import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { cookies } from "next/headers";

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  if (!token) return false;
  const expected = Buffer.from(
    `${process.env.ADMIN_PASSWORD || "zoltai2026"}:zoltai-admin`
  ).toString("base64");
  return token.value === expected;
}

// GET: List all articles
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!fs.existsSync(CONTENT_DIR)) {
    return NextResponse.json({ articles: [] });
  }

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"));

  const articles = files.map((file) => {
    const slug = file.replace(".mdx", "");
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content: body } = matter(content);
    return {
      slug,
      title: data.title || "Untitled",
      description: data.description || "",
      date: data.date || "",
      author: data.author || "Zoltai AI",
      tags: data.tags || [],
      image: data.image || "",
      wordCount: body.split(/\s+/).length,
    };
  });

  articles.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ articles });
}

// POST: Create new article
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description, content, tags, author, image } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    if (!fs.existsSync(CONTENT_DIR)) {
      fs.mkdirSync(CONTENT_DIR, { recursive: true });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const date = new Date().toISOString().split("T")[0];

    const mdxContent = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${(description || "").replace(/"/g, '\\"')}"
date: "${date}"
author: "${author || "Zoltai"}"
tags: ${JSON.stringify(tags || [])}
image: "${image || ""}"
---

${content}
`;

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
    return NextResponse.json(
      { error: "Failed to create article" },
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
    const { slug, title, description, content, tags, author, image, date } =
      await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    const existing = fs.readFileSync(filePath, "utf-8");
    const { data: existingData, content: existingBody } = matter(existing);

    const mdxContent = `---
title: "${(title || existingData.title || "").replace(/"/g, '\\"')}"
description: "${(description || existingData.description || "").replace(/"/g, '\\"')}"
date: "${date || existingData.date || new Date().toISOString().split("T")[0]}"
author: "${author || existingData.author || "Zoltai AI"}"
tags: ${JSON.stringify(tags || existingData.tags || [])}
image: "${image || existingData.image || ""}"
---

${content !== undefined ? content : existingBody}
`;

    fs.writeFileSync(filePath, mdxContent);

    return NextResponse.json({ success: true, slug });
  } catch {
    return NextResponse.json(
      { error: "Failed to update article" },
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

    const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: "Article not found" },
        { status: 404 }
      );
    }

    fs.unlinkSync(filePath);

    const imagePath = path.join(process.cwd(), `public/images/blog/${slug}.png`);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete article" },
      { status: 500 }
    );
  }
}
