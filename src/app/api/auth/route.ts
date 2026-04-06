import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";
import { readFile, writeFile, isGitHubAvailable } from "@/lib/github";

const USERS_FILE = path.join(process.cwd(), "data/users.json");
const GITHUB_USERS_PATH = "data/users.json";

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  premium: boolean;
  createdAt: string;
  lastLogin: string;
}

function hashPassword(password: string): string {
  return crypto
    .createHash("sha256")
    .update(password + "zoltai-salt-2026")
    .digest("hex");
}

async function loadUsers(): Promise<User[]> {
  // Try local
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }
  } catch {}

  // Try GitHub
  if (isGitHubAvailable()) {
    try {
      const file = await readFile(GITHUB_USERS_PATH);
      if (file) return JSON.parse(file.content);
    } catch {}
  }

  return [];
}

async function saveUsers(users: User[]): Promise<void> {
  const json = JSON.stringify(users, null, 2);

  // Try local
  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, json);
    return;
  } catch {}

  // Try GitHub
  if (isGitHubAvailable()) {
    await writeFile(GITHUB_USERS_PATH, json, "Update users data");
    return;
  }

  throw new Error("Cannot save users. Configure GITHUB_TOKEN for Vercel.");
}

function generateToken(userId: string): string {
  return Buffer.from(`${userId}:${Date.now()}:zoltai-user`).toString("base64");
}

function parseToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64").toString();
    const parts = decoded.split(":");
    if (parts.length >= 3 && parts[2] === "zoltai-user") {
      return parts[0];
    }
  } catch {}
  return null;
}

// POST: Register or Login
export async function POST(req: NextRequest) {
  try {
    const { action, name, email, password } = await req.json();

    if (action === "logout") {
      const cookieStore = await cookies();
      cookieStore.set("user_token", "", { maxAge: 0, path: "/" });
      return NextResponse.json({ success: true });
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const users = await loadUsers();

    if (action === "register") {
      if (!name) {
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 }
        );
      }

      if (password.length < 6) {
        return NextResponse.json(
          { error: "Password must be at least 6 characters" },
          { status: 400 }
        );
      }

      if (users.find((u) => u.email === email.toLowerCase())) {
        return NextResponse.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }

      const user: User = {
        id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: name.slice(0, 100),
        email: email.toLowerCase().slice(0, 200),
        passwordHash: hashPassword(password),
        premium: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      users.push(user);
      await saveUsers(users);

      const token = generateToken(user.id);
      const cookieStore = await cookies();
      cookieStore.set("user_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          premium: user.premium,
        },
      });
    }

    if (action === "login") {
      const user = users.find(
        (u) =>
          u.email === email.toLowerCase() &&
          u.passwordHash === hashPassword(password)
      );

      if (!user) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      user.lastLogin = new Date().toISOString();
      await saveUsers(users);

      const token = generateToken(user.id);
      const cookieStore = await cookies();
      cookieStore.set("user_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          premium: user.premium,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: `Server error: ${(err as Error).message}` },
      { status: 500 }
    );
  }
}

// GET: Get current user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token");
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const userId = parseToken(token.value);
    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const users = await loadUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        premium: user.premium,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
