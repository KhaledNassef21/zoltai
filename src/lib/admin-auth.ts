/**
 * Admin Authentication Utility
 *
 * Uses cryptographically secure tokens stored in-memory.
 * Rate-limited to prevent brute-force attacks.
 */

import crypto from "crypto";
import { cookies } from "next/headers";

// In-memory admin session store
const adminSessions = new Map<string, { expiresAt: number }>();
const ADMIN_SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours (reduced from 7 days)

// Rate limiting for admin login
const adminLoginAttempts = new Map<string, { count: number; resetAt: number; lockedUntil: number }>();
const ADMIN_MAX_ATTEMPTS = 5;
const ADMIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ADMIN_LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes lockout after max attempts

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

export function createAdminSession(): string {
  const token = crypto.randomBytes(48).toString("hex");
  adminSessions.set(token, {
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE,
  });
  // Clean expired sessions
  if (adminSessions.size > 20) {
    const now = Date.now();
    for (const [key, session] of adminSessions) {
      if (session.expiresAt < now) adminSessions.delete(key);
    }
  }
  return token;
}

export function destroyAdminSession(token: string): void {
  adminSessions.delete(token);
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token");
    if (!token?.value) return false;

    const session = adminSessions.get(token.value);
    if (!session) return false;

    if (session.expiresAt < Date.now()) {
      adminSessions.delete(token.value);
      return false;
    }

    return true;
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
