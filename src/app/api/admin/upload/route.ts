import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { isAuthenticated } from "@/lib/admin-auth";
import { writeBinaryFile, isGitHubAvailable } from "@/lib/github";

/**
 * Image Upload API for Admin Article Editor
 * Accepts base64-encoded image data and saves to public/images/blog/
 * Falls back to GitHub API on Vercel (read-only filesystem)
 */

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, data, folder } = await req.json();

    if (!filename || !data) {
      return NextResponse.json({ error: "filename and data required" }, { status: 400 });
    }

    // Sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
    const ext = path.extname(safeName);
    if (![".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(ext)) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    // Max 5MB
    const buffer = Buffer.from(data, "base64");
    if (buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });
    }

    const subFolder = folder || "blog";
    const relativePath = `public/images/${subFolder}/${safeName}`;
    const publicUrl = `/images/${subFolder}/${safeName}`;

    // Try local filesystem
    try {
      const fullPath = path.join(process.cwd(), relativePath);
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(fullPath, buffer);
      return NextResponse.json({ success: true, url: publicUrl, path: relativePath });
    } catch {}

    // Fallback: GitHub API
    if (isGitHubAvailable()) {
      await writeBinaryFile(relativePath, data, `Upload image: ${safeName}`);
      return NextResponse.json({
        success: true,
        url: publicUrl,
        path: relativePath,
        note: "Image uploaded to GitHub. Will be available after redeploy.",
      });
    }

    return NextResponse.json({ error: "Cannot save image" }, { status: 500 });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
