import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { readFile, writeFile, isGitHubAvailable } from "@/lib/github";

const COMMENTS_DIR = path.join(process.cwd(), "data/comments");
const GITHUB_COMMENTS_DIR = "data/comments";

interface Comment {
  id: string;
  name: string;
  email: string;
  content: string;
  date: string;
  approved: boolean;
}

async function loadComments(slug: string): Promise<Comment[]> {
  // Try local filesystem
  const file = path.join(COMMENTS_DIR, `${slug}.json`);
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    }
  } catch {}

  // Try GitHub
  if (isGitHubAvailable()) {
    try {
      const ghFile = await readFile(`${GITHUB_COMMENTS_DIR}/${slug}.json`);
      if (ghFile) return JSON.parse(ghFile.content);
    } catch {}
  }

  return [];
}

async function saveComments(slug: string, comments: Comment[]): Promise<void> {
  const json = JSON.stringify(comments, null, 2);

  // Try local filesystem first
  try {
    if (!fs.existsSync(COMMENTS_DIR)) {
      fs.mkdirSync(COMMENTS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(COMMENTS_DIR, `${slug}.json`), json);
    return;
  } catch {
    // Filesystem write failed (Vercel), try GitHub
  }

  if (isGitHubAvailable()) {
    await writeFile(
      `${GITHUB_COMMENTS_DIR}/${slug}.json`,
      json,
      `Update comments for: ${slug}`
    );
    return;
  }

  throw new Error("Cannot save comments. Configure GITHUB_TOKEN for Vercel.");
}

// GET: Get approved comments for a post
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const comments = (await loadComments(slug)).filter((c) => c.approved);
  return NextResponse.json({ comments });
}

// POST: Submit a new comment
export async function POST(req: NextRequest) {
  try {
    const { slug, name, email, content } = await req.json();

    if (!slug || !name || !content) {
      return NextResponse.json(
        { error: "Name and comment are required" },
        { status: 400 }
      );
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Comment too long (max 2000 chars)" },
        { status: 400 }
      );
    }

    // Basic spam check
    const spamWords = [
      "buy now",
      "click here",
      "free money",
      "casino",
      "viagra",
    ];
    const contentLower = content.toLowerCase();
    if (spamWords.some((w) => contentLower.includes(w))) {
      return NextResponse.json(
        { error: "Comment flagged as spam" },
        { status: 400 }
      );
    }

    const comment: Comment = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.slice(0, 100),
      email: email ? email.slice(0, 200) : "",
      content: content.slice(0, 2000),
      date: new Date().toISOString(),
      approved: true,
    };

    const comments = await loadComments(slug);
    comments.push(comment);
    await saveComments(slug, comments);

    return NextResponse.json({ success: true, comment });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to submit comment: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
