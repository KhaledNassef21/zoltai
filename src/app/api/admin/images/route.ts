import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { cookies } from "next/headers";

async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  if (!token) return false;
  const expected = Buffer.from(
    `${process.env.ADMIN_PASSWORD || "zoltai2026"}:zoltai-admin`
  ).toString("base64");
  return token.value === expected;
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const images: { name: string; path: string; url: string; size: string }[] = [];
  const publicDir = path.join(process.cwd(), "public/images");

  function scanDir(dir: string, urlPrefix: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath, `${urlPrefix}/${entry.name}`);
      } else if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(entry.name)) {
        const stat = fs.statSync(fullPath);
        const sizeKB = (stat.size / 1024).toFixed(0);
        images.push({
          name: entry.name,
          path: `${urlPrefix}/${entry.name}`,
          url: `${urlPrefix}/${entry.name}`,
          size: `${sizeKB} KB`,
        });
      }
    }
  }

  scanDir(publicDir, "/images");

  // Sort newest first
  images.sort((a, b) => b.name.localeCompare(a.name));

  return NextResponse.json({ images });
}
