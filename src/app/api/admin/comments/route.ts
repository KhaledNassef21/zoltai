import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAuthenticated } from "@/lib/admin-auth";
import {
  readFile,
  writeFile,
  listFiles,
  isGitHubAvailable,
} from "@/lib/github";

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

async function loadAllComments(): Promise<
  { slug: string; comments: Comment[] }[]
> {
  const result: { slug: string; comments: Comment[] }[] = [];

  // Try local filesystem
  try {
    if (fs.existsSync(COMMENTS_DIR)) {
      const files = fs
        .readdirSync(COMMENTS_DIR)
        .filter((f) => f.endsWith(".json"));
      for (const f of files) {
        const slug = f.replace(".json", "");
        try {
          const data = JSON.parse(
            fs.readFileSync(path.join(COMMENTS_DIR, f), "utf-8")
          );
          result.push({ slug, comments: data });
        } catch {}
      }
      if (result.length > 0) return result;
    }
  } catch {}

  // Try GitHub
  if (isGitHubAvailable()) {
    try {
      const files = await listFiles(GITHUB_COMMENTS_DIR);
      for (const f of files.filter((f) => f.name.endsWith(".json"))) {
        const slug = f.name.replace(".json", "");
        const fileData = await readFile(f.path);
        if (fileData) {
          try {
            result.push({ slug, comments: JSON.parse(fileData.content) });
          } catch {}
        }
      }
    } catch {}
  }

  return result;
}

async function loadSlugComments(slug: string): Promise<Comment[]> {
  // Try local
  const localFile = path.join(COMMENTS_DIR, `${slug}.json`);
  try {
    if (fs.existsSync(localFile)) {
      return JSON.parse(fs.readFileSync(localFile, "utf-8"));
    }
  } catch {}

  // Try GitHub
  if (isGitHubAvailable()) {
    try {
      const file = await readFile(`${GITHUB_COMMENTS_DIR}/${slug}.json`);
      if (file) return JSON.parse(file.content);
    } catch {}
  }

  return [];
}

async function saveSlugComments(
  slug: string,
  comments: Comment[]
): Promise<void> {
  const json = JSON.stringify(comments, null, 2);

  // Try local
  try {
    if (!fs.existsSync(COMMENTS_DIR)) {
      fs.mkdirSync(COMMENTS_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(COMMENTS_DIR, `${slug}.json`), json);
    return;
  } catch {}

  // Try GitHub
  if (isGitHubAvailable()) {
    await writeFile(
      `${GITHUB_COMMENTS_DIR}/${slug}.json`,
      json,
      `Update comments for: ${slug}`
    );
    return;
  }

  throw new Error("Cannot save. Configure GITHUB_TOKEN for Vercel.");
}

// GET: All comments (admin)
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allComments = await loadAllComments();
  const flat = allComments.flatMap(({ slug, comments }) =>
    comments.map((c: Comment) => ({ ...c, slug }))
  );
  flat.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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

  try {
    const { slug, commentId, approved } = await req.json();
    if (!slug || !commentId) {
      return NextResponse.json(
        { error: "Slug and commentId required" },
        { status: 400 }
      );
    }

    const comments = await loadSlugComments(slug);
    const index = comments.findIndex((c) => c.id === commentId);
    if (index === -1) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    comments[index].approved = approved;
    await saveSlugComments(slug, comments);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

// DELETE: Delete comment
export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug, commentId } = await req.json();
    if (!slug || !commentId) {
      return NextResponse.json(
        { error: "Slug and commentId required" },
        { status: 400 }
      );
    }

    const comments = await loadSlugComments(slug);
    const filtered = comments.filter((c) => c.id !== commentId);
    await saveSlugComments(slug, filtered);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
