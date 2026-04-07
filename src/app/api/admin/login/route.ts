import { NextRequest, NextResponse } from "next/server";
import {
  getAdminPassword,
  createAdminSession,
  checkAdminRateLimit,
  resetAdminRateLimit,
} from "@/lib/admin-auth";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit check
    const rateLimitResult = checkAdminRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: 429 }
      );
    }

    const { password } = await req.json();

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    let adminPassword: string;
    try {
      adminPassword = getAdminPassword();
    } catch {
      return NextResponse.json(
        { error: "Admin login is not configured. Set ADMIN_PASSWORD env variable." },
        { status: 503 }
      );
    }

    // Timing-safe comparison to prevent timing attacks
    const inputBuf = Buffer.from(password.padEnd(256, "\0"));
    const correctBuf = Buffer.from(adminPassword.padEnd(256, "\0"));
    const isValid = crypto.timingSafeEqual(inputBuf, correctBuf);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Reset rate limit on successful login
    resetAdminRateLimit(ip);

    // Create secure session
    const token = createAdminSession();

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
