import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const decoded = Buffer.from(token, "base64").toString();
    const adminPassword = process.env.ADMIN_PASSWORD || "zoltai2026";
    if (decoded.includes(adminPassword)) {
      return NextResponse.json({ authenticated: true });
    }
  } catch {}

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
