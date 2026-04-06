import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/admin-auth";

// GET: Return current settings (masked tokens)
export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = {
    INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN
      ? "***" + process.env.INSTAGRAM_ACCESS_TOKEN.slice(-8)
      : "Not set",
    INSTAGRAM_USER_ID: process.env.INSTAGRAM_USER_ID || "Not set",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
      ? "***" + process.env.ANTHROPIC_API_KEY.slice(-8)
      : "Not set",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY
      ? "***" + process.env.OPENAI_API_KEY.slice(-8)
      : "Not set",
    RESEND_API_KEY: process.env.RESEND_API_KEY
      ? "***" + process.env.RESEND_API_KEY.slice(-8)
      : "Not set",
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || "Not set",
    REPORT_EMAIL_TO: process.env.REPORT_EMAIL_TO || "Not set",
    IMAGE_PROVIDER: process.env.IMAGE_PROVIDER || "mock",
    GITHUB_TOKEN: process.env.GITHUB_TOKEN
      ? "***" + process.env.GITHUB_TOKEN.slice(-8)
      : "Not set",
    FACEBOOK_PAGE_ID: process.env.FACEBOOK_PAGE_ID || "Not set",
    FACEBOOK_PAGE_ACCESS_TOKEN: process.env.FACEBOOK_PAGE_ACCESS_TOKEN
      ? "***" + process.env.FACEBOOK_PAGE_ACCESS_TOKEN.slice(-8)
      : "Not set",
  };

  return NextResponse.json({ settings });
}

// POST: Update setting — on Vercel we update process.env (runtime only)
// For persistent changes, use Vercel Dashboard > Environment Variables
export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key, value } = await req.json();

    const allowedKeys = [
      "INSTAGRAM_ACCESS_TOKEN",
      "INSTAGRAM_USER_ID",
      "ANTHROPIC_API_KEY",
      "OPENAI_API_KEY",
      "RESEND_API_KEY",
      "RESEND_FROM_EMAIL",
      "REPORT_EMAIL_TO",
      "IMAGE_PROVIDER",
      "ADMIN_PASSWORD",
      "GITHUB_TOKEN",
      "FACEBOOK_PAGE_ID",
      "FACEBOOK_PAGE_ACCESS_TOKEN",
    ];

    if (!allowedKeys.includes(key)) {
      return NextResponse.json(
        { error: "Invalid setting key" },
        { status: 400 }
      );
    }

    // Update process.env for runtime effect
    process.env[key] = value;

    // Try to update .env.local for local development
    try {
      const fs = await import("fs");
      const path = await import("path");
      const envFile = path.join(process.cwd(), ".env.local");
      let envContent = "";
      if (fs.existsSync(envFile)) {
        envContent = fs.readFileSync(envFile, "utf-8");
      }
      const regex = new RegExp(`^${key}=.*$`, "m");
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
      fs.writeFileSync(envFile, envContent.trim() + "\n");
    } catch {
      // Filesystem write failed (Vercel) — runtime update still worked
    }

    return NextResponse.json({
      success: true,
      message: `${key} updated for this session. For permanent changes on Vercel, update via Vercel Dashboard > Environment Variables.`,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to update setting" },
      { status: 500 }
    );
  }
}
