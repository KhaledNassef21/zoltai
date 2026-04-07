/**
 * Admin Authentication Utility
 *
 * Uses HMAC-signed tokens — no server-side storage needed.
 * Survives Vercel cold starts and serverless restarts.
 * Rate-limited to prevent brute-force attacks.
 */

import crypto from "crypto";
import { cookies } from "next/headers";

const ADMIN_SESSION_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

// Derive signing key from ADMIN_PASSWORD
function getSigningKey(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return "";
  return crypto.createHash("sha256").update("admin-token-key:" + password).digest("hex");
}

// Rate limiting for admin login
const adminLoginAttempts = new Map<string, { count: number; resetAt: number; lockedUntil: number }>();
const ADMIN_MAX_ATTEMPTS = 5;
const ADMIN_WINDOW_MS = 15 * 60 * 1000;
const ADMIN_LOCKOUT_MS = 30 * 60 * 1000;

export function checkAdminRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const record = adminLoginAttempts.get(ip);

  if (!record || record.resetAt < now) {
    adminLoginAttempts.set(ip, { count: 1, resetAt: now + ADMIN_WINDOW_MS, lockedUntil: 0 });
    return { allowed: true };
  }

  if (record.lockedUntil > now) {
    const minsLeft = Math.ceil((record.lockedUntil - now) / 60000);
    return { allowed: false, message: `Account locked. Try again in ${minsLeft} minutes.` };
  }

  if (record.count >= ADMIN_MAX_ATTEMPTS) {
    record.lockedUntil = now + ADMIN_LOCKOUT_MS;
    return { allowed: false, message: "Too many failed attempts. Locked for 30 minutes." };
  }

  record.count++;
  return { allowed: true };
}

export function resetAdminRateLimit(ip: string): void {
  adminLoginAttempts.delete(ip);
}

/**
 * Create a signed admin token: "admin".expiry.hmac_signature
 */
export function createAdminSession(): string {
  const key = getSigningKey();
  if (!key) return "";
  const expiry = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = `admin.${expiry}`;
  const signature = crypto.createHmac("sha256", key).update(payload).digest("hex");
  return Buffer.from(`${payload}.${signature}`).toString("base64url");
}

/**
 * Verify admin token — checks signature and expiry.
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");
    if (!token?.value) return false;

    const key = getSigningKey();
    if (!key) return false;

    const decoded = Buffer.from(token.value, "base64url").toString();
    const parts = decoded.split(".");
    if (parts.length !== 3) return false;

    const [prefix, expiryStr, signature] = parts;
    if (prefix !== "admin") return false;

    const expiry = parseInt(expiryStr, 10);
    if (isNaN(expiry) || expiry < Date.now()) return false;

    // Verify signature
    const payload = `${prefix}.${expiryStr}`;
    const expectedSignature = crypto.createHmac("sha256", key).update(payload).digest("hex");

    const sigBuf = Buffer.from(signature, "hex");
    const expectedBuf = Buffer.from(expectedSignature, "hex");
    if (sigBuf.length !== expectedBuf.length) return false;

    return crypto.timingSafeEqual(sigBuf, expectedBuf);
  } catch {
    return false;
  }
}

export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_PASSWORD environment variable is not set. Admin login is disabled.");
  }
  return password;
}
