import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { cookies } from "next/headers";
import { readFile, writeFile, isGitHubAvailable } from "@/lib/github";

const USERS_FILE = path.join(process.cwd(), "data/users.json");
const GITHUB_USERS_PATH = "data/users.json";

// Secret key for signing tokens — derived from ADMIN_PASSWORD or fallback
const TOKEN_SECRET = process.env.ADMIN_PASSWORD
  ? crypto.createHash("sha256").update("user-token-secret:" + process.env.ADMIN_PASSWORD).digest("hex")
  : crypto.createHash("sha256").update("user-token-secret:zoltai-default-key-change-me").digest("hex");

// Rate limiting: max 10 login attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

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
 */
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const useSalt = salt || crypto.randomBytes(32).toString("hex");
  const hash = crypto.scryptSync(password, useSalt, 64).toString("hex");
  return { hash, salt: useSalt };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const { hash: computedHash } = hashPassword(password, salt);
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, "hex"),
    Buffer.from(hash, "hex")
  );
}

/**
 * Create a signed token: userId.expiry.signature
 * No server-side storage needed — survives restarts and serverless.
 */
function createToken(userId: string): string {
  const expiry = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${userId}.${expiry}`;
  const signature = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

/**
 * Verify and decode a signed token.
 * Returns userId if valid, null otherwise.
 */
function verifyToken(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;

    const [userId, expiryStr, signature] = parts;
    const expiry = parseInt(expiryStr, 10);

    // Check expiry
    if (isNaN(expiry) || expiry < Date.now()) return null;

    // Verify signature
    const payload = `${userId}.${expiryStr}`;
    const expectedSignature = crypto
      .createHmac("sha256", TOKEN_SECRET)
      .update(payload)
      .digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expectedSignature, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    return userId;
  } catch {
    return null;
  }
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || record.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) return false;
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password is too long";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a number";
  return null;
}

function sanitizeName(name: string): string {
  return name.replace(/[<>&"'\/\\]/g, "").trim().slice(0, 100);
}

// POST: Register, Login, or Logout
export async function POST(req: NextRequest) {
  try {
    const { action, name, email, password } = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    if (action === "logout") {
      const cookieStore = await cookies();
      cookieStore.set("user_token", "", { maxAge: 0, path: "/" });
      return NextResponse.json({ success: true });
    }

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
        return NextResponse.json({ error: "Name is required" }, { status: 400 });
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        return NextResponse.json({ error: passwordError }, { status: 400 });
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

      const token = createToken(user.id);
      const cookieStore = await cookies();
      cookieStore.set("user_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: "/",
      });

      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, premium: user.premium },
      });
    }

    // ========== LOGIN ==========
    if (action === "login") {
      const normalizedEmail = email.toLowerCase().trim();
      const user = users.find((u) => u.email === normalizedEmail);

      if (!user) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      let isValid = false;
      if (user.salt) {
        isValid = verifyPassword(password, user.passwordHash, user.salt);
      } else {
        // Legacy SHA256 hash — verify and upgrade
        const legacyHash = crypto
          .createHash("sha256")
          .update(password + "zoltai-salt-2026")
          .digest("hex");
        if (legacyHash === user.passwordHash) {
          isValid = true;
          const { hash, salt } = hashPassword(password);
          user.passwordHash = hash;
          user.salt = salt;
        }
      }

      if (!isValid) {
        return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
      }

      user.lastLogin = new Date().toISOString();
      await saveUsers(users);

      const token = createToken(user.id);
      const cookieStore = await cookies();
      cookieStore.set("user_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: "/",
      });

      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, premium: user.premium },
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

// GET: Get current user from signed token
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("user_token")?.value;
    if (!token) return NextResponse.json({ user: null });

    const userId = verifyToken(token);
    if (!userId) return NextResponse.json({ user: null });

    const users = await loadUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, premium: user.premium },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
