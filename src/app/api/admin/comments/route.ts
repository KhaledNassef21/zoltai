import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";

const COMMENTS_DIR = path.join(process.cwd(), "data/comments");

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  if (!token) return false;
  const expected = Buffer.from(
    `${process.env.ADMIN_PASSWORD || "zoltai2026"}:zoltai-admin`
  ).toString("base64");
  return token.value === expected;
}

interface Comment {
  id: string;
  name: string;
  email: string;
  content: string;
  date: string;
  approved: boolean;
}

function getAllComments(): { slug: string; comments: Comment[] }[] {
  if (!fs.existsSync(COMMENTS_DIR)) return [];
  const files = fs.readdirSync(COMMENTS_DIR).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const slug = f.replace(".json", "");
    try {
      const comments = JSON.parse(fs.readFileSync(path.join(COMMENTS_DIR, f), "utf-8"));
      return { slug, comments };
    } catch {
      return { slug, comments: [] };
    }
  });
}

// GET: All comments (admin)
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allComments = getAllComments();
  const flat = allComments.flatMap(({ slug, comments }) =>
    comments.map((c: Comment) => ({ ...c, slug }))
  );
  flat.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({
    comments: flat,
    total: flat.length,
    pending: flat.filter((c) => !c.approved).length,
  });
}

// PUT: Approve/reject comment
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, commentId, approved } = await req.json();
  if (!slug || !commentId) {
    return NextResponse.json({ error: "Slug and commentId required" }, { status: 400 });
  }

  const file = path.join(COMMENTS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const comments: Comment[] = JSON.parse(fs.readFileSync(file, "utf-8"));
  const index = comments.findIndex((c) => c.id === commentId);
  if (index === -1) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  comments[index].approved = approved;
  fs.writeFileSync(file, JSON.stringify(comments, null, 2));

  return NextResponse.json({ success: true });
}

// DELETE: Delete comment
export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug, commentId } = await req.json();
  if (!slug || !commentId) {
    return NextResponse.json({ error: "Slug and commentId required" }, { status: 400 });
  }

  const file = path.join(COMMENTS_DIR, `${slug}.json`);
  if (!fs.existsSync(file)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let comments: Comment[] = JSON.parse(fs.readFileSync(file, "utf-8"));
  comments = comments.filter((c) => c.id !== commentId);
  fs.writeFileSync(file, JSON.stringify(comments, null, 2));

  return NextResponse.json({ success: true });
}
