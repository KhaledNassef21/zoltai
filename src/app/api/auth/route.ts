import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";
import { readFile, writeFile, isGitHubAvailable } from "@/lib/github";

const USERS_FILE = path.join(process.cwd(), "data/users.json");
const GITHUB_USERS_PATH = "data/users.json";

// Rate limiting: max 10 login attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  salt: string;
  premium: boolean;
  createdAt: string;
  lastLogin: string;
  stripeCustomerId?: string;
  premiumSince?: string;
}

/**
 * Secure password hashing using scrypt (Node.js built-in).
 * scrypt is memory-hard and resistant to brute-force attacks.
 */
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(32).toString("hex");
  const hash = crypto.scryptSync(password, useSalt, 64).toString("hex");
  return { hash, salt: useSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  // Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, "hex"),
    Buffer.from(hash, "hex")
  );
}

/**
 * Generate a cryptographically secure session token.
 * Format: randomBytes(32) — no user data embedded.
 */
function generateToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

// In-memory session store (maps token → userId)
// In production you'd use Redis. For this project, this works.
const sessions = new Map<string, { userId: string; expiresAt: number }>();
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

function createSession(userId: string): string {
  const token = generateToken();
  sessions.set(token, {
    userId,
    expiresAt: Date.now() + SESSION_MAX_AGE,
  });
  // Clean expired sessions periodically
  if (sessions.size > 100) {
    const now = Date.now();
    for (const [key, session] of sessions) {
      if (session.expiresAt < now) sessions.delete(key);
    }
  }
  return token;
}

function getSessionUserId(token: string): string | null {
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  return session.userId;
}

function destroySession(token: string): void {
  sessions.delete(token);
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || record.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

async function loadUsers(): Promise<User[]> {
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

async function saveUsers(users: User[]): Promise<void> {
  const json = JSON.stringify(users, null, 2);

  try {
    const dir = path.dirname(USERS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(USERS_FILE, json);
    return;
  } catch {}

  if (isGitHubAvailable()) {
    await writeFile(GITHUB_USERS_PATH, json, "Update users data");
    return;
  }

  throw new Error("Cannot save users. Configure GITHUB_TOKEN for Vercel.");
}

// Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

// Validate password strength
function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password is too long";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

// Sanitize user name
function sanitizeName(name: string): string {
  return name.replace(/[<>&"'\/\\]/g, "").trim().slice(0, 100);
}

// POST: Register, Login, or Logout
export async function POST(req: NextRequest) {
  try {
    const { action, name, email, password } = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // Logout
    if (action === "logout") {
      const cookieStore = await cookies();
      const token = cookieStore.get("user_token")?.value;
      if (token) destroySession(token);
      cookieStore.set("user_token", "", { maxAge: 0, path: "/" });
      return NextResponse.json({ success: true });
    }

    // Rate limit check for login/register
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in 15 minutes." },
        { status: 429 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const users = await loadUsers();

    // ========== REGISTER ==========
    if (action === "register") {
      if (!name || !name.trim()) {
        return NextResponse.json(
          { error: "Name is required" },
          { status: 400 }
        );
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        return NextResponse.json(
          { error: passwordError },
          { status: 400 }
        );
      }

      const normalizedEmail = email.toLowerCase().trim();
      if (users.find((u) => u.email === normalizedEmail)) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const { hash, salt } = hashPassword(password);
      const user: User = {
        id: `u_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
        name: sanitizeName(name),
        email: normalizedEmail,
        passwordHash: hash,
        salt,
        premium: false,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };

      users.push(user);
      await saveUsers(users);

      const token = createSession(user.id);
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

    // ========== LOGIN ==========
    if (action === "login") {
      const normalizedEmail = email.toLowerCase().trim();
      const user = users.find((u) => u.email === normalizedEmail);

      if (!user) {
        // Generic error to prevent email enumeration
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      // Support both old (SHA256) and new (scrypt) password hashes
      let isValid = false;
      if (user.salt) {
        // New scrypt hash
        isValid = verifyPassword(password, user.passwordHash, user.salt);
      } else {
        // Legacy SHA256 hash — verify and upgrade
        const legacyHash = crypto
          .createHash("sha256")
          .update(password + "zoltai-salt-2026")
          .digest("hex");
        if (legacyHash === user.passwordHash) {
          isValid = true;
          // Upgrade to scrypt
          const { hash, salt } = hashPassword(password);
          user.passwordHash = hash;
          user.salt = salt;
        }
      }

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      user.lastLogin = new Date().toISOString();
      await saveUsers(users);

      const token = createSession(user.id);
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
    console.error("Auth error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// GET: Get current user from session
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const userId = getSessionUserId(token);
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
