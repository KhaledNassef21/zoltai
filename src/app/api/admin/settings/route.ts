import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), ".env.local");

function isAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const adminPassword = process.env.ADMIN_PASSWORD || "zoltai2026";
    return decoded.includes(adminPassword);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Return current settings (masked tokens)
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
  };

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) {
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
    ];

    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: "Invalid setting key" }, { status: 400 });
    }

    // Update .env.local file
    let envContent = "";
    if (fs.existsSync(SETTINGS_FILE)) {
      envContent = fs.readFileSync(SETTINGS_FILE, "utf-8");
    }

    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }

    fs.writeFileSync(SETTINGS_FILE, envContent.trim() + "\n");

    // Also update process.env for immediate effect
    process.env[key] = value;

    return NextResponse.json({
      success: true,
      message: `${key} updated. Restart server for full effect.`,
    });
  } catch {
    return NextResponse.json({ error: "Failed to update setting" }, { status: 500 });
  }
}
