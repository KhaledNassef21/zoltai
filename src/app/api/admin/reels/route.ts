import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAuthenticated } from "@/lib/admin-auth";

const REELS_DIR = path.join(process.cwd(), "data/reels");

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!fs.existsSync(REELS_DIR)) {
      return NextResponse.json({ articles: [], total: 0 });
    }

    const files = fs
      .readdirSync(REELS_DIR)
      .filter((f) => f.endsWith(".json"));

    const articles = files.map((file) => {
      try {
        const data = JSON.parse(
          fs.readFileSync(path.join(REELS_DIR, file), "utf-8")
        );
        return {
          slug: data.slug,
          title: data.title,
          generatedAt: data.generatedAt,
          reelCount: data.reels?.length || 0,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({
      articles,
      total: articles.reduce((sum: number, a: any) => sum + a.reelCount, 0),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load reels" },
      { status: 500 }
    );
  }
}

// GET specific article's reels: /api/admin/reels?slug=xxx
export async function POST(req: Request) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "slug required" }, { status: 400 });
    }

    const file = path.join(REELS_DIR, `${slug}.json`);
    if (!fs.existsSync(file)) {
      return NextResponse.json({ error: "No reels for this article" }, { status: 404 });
    }

    const data = JSON.parse(fs.readFileSync(file, "utf-8"));
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load reels" },
      { status: 500 }
    );
  }
}
