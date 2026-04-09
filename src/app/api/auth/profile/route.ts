import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";
import { readFile, writeFile, isGitHubAvailable } from "@/lib/github";

const USERS_FILE = path.join(process.cwd(), "data/users.json");
const GITHUB_USERS_PATH = "data/users.json";

const TOKEN_SECRET = process.env.ADMIN_PASSWORD
  ? crypto.createHash("sha256").update("user-token-secret:" + process.env.ADMIN_PASSWORD).digest("hex")
  : crypto.createHash("sha256").update("user-token-secret:zoltai-default-key-change-me").digest("hex");

function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;
    const [userId, expiryStr, signature] = parts;
    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || expiry < Date.now()) return null;
    const payload = `${userId}.${expiryStr}`;
    const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(payload).digest("hex");
    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;
    return userId;
  } catch {
    return null;
  }
}

async function loadUsers(): Promise<any[]> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }
  } catch {}
  if (isGitHubAvailable()) {
    try {
      const file = await readFile(GITHUB_USERS_PATH);
      if (file) return JSON.parse(file.content);
    } catch {}
  }
  return [];
}

async function saveUsers(users: any[]): Promise<void> {
  const json = JSON.stringify(users, null, 2);
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, json);
    return;
  } catch {}
  if (isGitHubAvailable()) {
    await writeFile(GITHUB_USERS_PATH, json, "Update user profile");
    return;
  }
  throw new Error("Cannot save users");
}

// PUT: Update profile (name, password)
export async function PUT(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    if (!token) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const userId = verifyToken(token);
    if (!userId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const { name, currentPassword, newPassword } = await req.json();
    const users = await loadUsers();
    const user = users.find((u: any) => u.id === userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let changed = false;

    // Update name
    if (name && name.trim()) {
      const sanitized = name.replace(/[<>&"'\/\\]/g, "").trim().slice(0, 100);
      if (sanitized !== user.name) {
        user.name = sanitized;
        changed = true;
      }
    }

    // Change password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }

      // Verify current password
      const computedHash = crypto.scryptSync(currentPassword, user.salt, 64).toString("hex");
      const isValid = crypto.timingSafeEqual(
        Buffer.from(computedHash, "hex"),
        Buffer.from(user.passwordHash, "hex")
      );
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      // Validate new password
      if (newPassword.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
      if (!/[A-Z]/.test(newPassword)) return NextResponse.json({ error: "New password must contain an uppercase letter" }, { status: 400 });
      if (!/[a-z]/.test(newPassword)) return NextResponse.json({ error: "New password must contain a lowercase letter" }, { status: 400 });
      if (!/[0-9]/.test(newPassword)) return NextResponse.json({ error: "New password must contain a number" }, { status: 400 });

      const salt = crypto.randomBytes(32).toString("hex");
      const hash = crypto.scryptSync(newPassword, salt, 64).toString("hex");
      user.passwordHash = hash;
      user.salt = salt;
      changed = true;
    }

    if (!changed) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
    }

    await saveUsers(users);

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, premium: user.premium },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
