import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";

const TOOLS_FILE = path.join(process.cwd(), "src/data/tools.ts");

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  if (!token) return false;
  const expected = Buffer.from(
    `${process.env.ADMIN_PASSWORD || "zoltai2026"}:zoltai-admin`
  ).toString("base64");
  return token.value === expected;
}

function parseToolsFile(): any[] {
  const content = fs.readFileSync(TOOLS_FILE, "utf-8");
  // Extract the array between "export const tools: Tool[] = [" and the closing "];"
  const match = content.match(/export const tools:\s*Tool\[\]\s*=\s*\[([\s\S]*?)\];\s*\n\nexport function/);
  if (!match) return [];

  try {
    // Parse each tool object - they're JS objects, not JSON
    const toolsStr = `[${match[1]}]`;
    // Use Function constructor to evaluate the JS array safely
    const fn = new Function(`return ${toolsStr}`);
    return fn();
  } catch {
    return [];
  }
}

function writeToolsFile(tools: any[]): void {
  const content = fs.readFileSync(TOOLS_FILE, "utf-8");

  // Build the tools array string
  const toolsStr = tools.map(tool => {
    const lines = [
      `  {`,
      `    name: ${JSON.stringify(tool.name)},`,
      `    slug: ${JSON.stringify(tool.slug)},`,
      `    description: ${JSON.stringify(tool.description)},`,
      `    category: ${JSON.stringify(tool.category)},`,
      `    useCase: ${JSON.stringify(tool.useCase || "")},`,
      `    pricing: ${JSON.stringify(tool.pricing)},`,
      `    pricingDetail: ${JSON.stringify(tool.pricingDetail || "")},`,
      `    url: ${JSON.stringify(tool.url)},`,
      `    affiliateUrl: ${JSON.stringify(tool.affiliateUrl || "")},`,
      tool.featured ? `    featured: true,` : null,
      `    rating: ${tool.rating},`,
      `  }`,
    ].filter(Boolean);
    return lines.join("\n");
  }).join(",\n");

  // Replace the tools array in the file
  const newContent = content.replace(
    /export const tools:\s*Tool\[\]\s*=\s*\[[\s\S]*?\];\s*\n\nexport function/,
    `export const tools: Tool[] = [\n${toolsStr},\n];\n\nexport function`
  );

  fs.writeFileSync(TOOLS_FILE, newContent);
}

// GET: List all tools
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tools } = await import("@/data/tools");
    return NextResponse.json({ tools });
  } catch {
    return NextResponse.json({ error: "Failed to load tools" }, { status: 500 });
  }
}

// POST: Add new tool
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tool = await req.json();

    if (!tool.name || !tool.url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    // Generate slug if not provided
    if (!tool.slug) {
      tool.slug = tool.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }

    const tools = parseToolsFile();

    // Check duplicate slug
    if (tools.some((t: any) => t.slug === tool.slug)) {
      return NextResponse.json({ error: "Tool with this slug already exists" }, { status: 409 });
    }

    tools.push(tool);
    writeToolsFile(tools);

    return NextResponse.json({ success: true, slug: tool.slug });
  } catch (err) {
    return NextResponse.json({ error: "Failed to create tool" }, { status: 500 });
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

    const tools = parseToolsFile();
    const index = tools.findIndex((t: any) => t.slug === slug);

    if (index === -1) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    tools[index] = { ...tools[index], ...updates };
    writeToolsFile(tools);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update tool" }, { status: 500 });
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

    const tools = parseToolsFile();
    const filtered = tools.filter((t: any) => t.slug !== slug);

    if (filtered.length === tools.length) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    writeToolsFile(filtered);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete tool" }, { status: 500 });
  }
}
