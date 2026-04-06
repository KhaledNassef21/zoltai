import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAuthenticated } from "@/lib/admin-auth";
import { readFile, writeFile, isGitHubAvailable } from "@/lib/github";

const TOOLS_JSON = path.join(process.cwd(), "src/data/tools.json");
const GITHUB_TOOLS_PATH = "src/data/tools.json";

interface Tool {
  name: string;
  slug: string;
  description: string;
  category: string;
  useCase?: string;
  pricing: string;
  pricingDetail?: string;
  url: string;
  affiliateUrl?: string;
  featured?: boolean;
  rating?: number;
}

async function loadTools(): Promise<Tool[]> {
  // Try local JSON file first
  try {
    if (fs.existsSync(TOOLS_JSON)) {
      return JSON.parse(fs.readFileSync(TOOLS_JSON, "utf-8"));
    }
  } catch {}

  // Fallback: try GitHub
  if (isGitHubAvailable()) {
    try {
      const file = await readFile(GITHUB_TOOLS_PATH);
      if (file) return JSON.parse(file.content);
    } catch {}
  }

  // Fallback: import from tools.ts (read-only, always works)
  try {
    const { tools } = await import("@/data/tools");
    return tools as Tool[];
  } catch {
    return [];
  }
}

async function saveTools(tools: Tool[]): Promise<{ success: boolean; note?: string }> {
  const json = JSON.stringify(tools, null, 2);

  // Try local filesystem first
  try {
    fs.writeFileSync(TOOLS_JSON, json);
    return { success: true };
  } catch {
    // Filesystem write failed (Vercel), try GitHub
  }

  if (isGitHubAvailable()) {
    await writeFile(GITHUB_TOOLS_PATH, json, "Update tools data");
    return { success: true, note: "Saved to GitHub. Site will redeploy shortly." };
  }

  throw new Error("Cannot write files. Configure GITHUB_TOKEN for Vercel.");
}

// GET: List all tools
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tools = await loadTools();
    return NextResponse.json({ tools });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to load tools: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

// POST: Add new tool
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tool: Tool = await req.json();

    if (!tool.name || !tool.url) {
      return NextResponse.json(
        { error: "Name and URL are required" },
        { status: 400 }
      );
    }

    if (!tool.slug) {
      tool.slug = tool.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    const tools = await loadTools();

    if (tools.some((t) => t.slug === tool.slug)) {
      return NextResponse.json(
        { error: "Tool with this slug already exists" },
        { status: 409 }
      );
    }

    tools.push(tool);
    const result = await saveTools(tools);

    return NextResponse.json({ success: true, slug: tool.slug, note: result.note });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to create tool: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

// PUT: Update tool
export async function PUT(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug, ...updates } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const tools = await loadTools();
    const index = tools.findIndex((t) => t.slug === slug);

    if (index === -1) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    tools[index] = { ...tools[index], ...updates };
    const result = await saveTools(tools);

    return NextResponse.json({ success: true, note: result.note });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to update tool: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

// DELETE: Delete tool
export async function DELETE(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { slug } = await req.json();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const tools = await loadTools();
    const filtered = tools.filter((t) => t.slug !== slug);

    if (filtered.length === tools.length) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    const result = await saveTools(filtered);

    return NextResponse.json({ success: true, note: result.note });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to delete tool: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}
