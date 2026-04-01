import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const COMMENTS_DIR = path.join(process.cwd(), "data/comments");

interface Comment {
  id: string;
  name: string;
  email: string;
  content: string;
  date: string;
  approved: boolean;
}

function getCommentsFile(slug: string): string {
  return path.join(COMMENTS_DIR, `${slug}.json`);
}

function loadComments(slug: string): Comment[] {
  const file = getCommentsFile(slug);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

function saveComments(slug: string, comments: Comment[]): void {
  if (!fs.existsSync(COMMENTS_DIR)) {
    fs.mkdirSync(COMMENTS_DIR, { recursive: true });
  }
  fs.writeFileSync(getCommentsFile(slug), JSON.stringify(comments, null, 2));
}

// GET: Get approved comments for a post
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "Slug required" }, { status: 400 });
  }

  const comments = loadComments(slug).filter((c) => c.approved);
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
    const spamWords = ["buy now", "click here", "free money", "casino", "viagra"];
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

    const comments = loadComments(slug);
    comments.push(comment);
    saveComments(slug, comments);

    return NextResponse.json({ success: true, comment });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit comment" },
      { status: 500 }
    );
  }
}
