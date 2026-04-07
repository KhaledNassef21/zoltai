import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Resend } from "resend";

const USERS_FILE = path.join(process.cwd(), "data/users.json");
const RESET_TOKENS_FILE = path.join(process.cwd(), "data/reset-tokens.json");

interface ResetToken {
  email: string;
  token: string;
  expiresAt: number;
}

function loadResetTokens(): ResetToken[] {
  try {
    if (fs.existsSync(RESET_TOKENS_FILE)) {
      const tokens: ResetToken[] = JSON.parse(fs.readFileSync(RESET_TOKENS_FILE, "utf-8"));
      // Clean expired tokens
      const now = Date.now();
      return tokens.filter((t) => t.expiresAt > now);
    }
  } catch {}
  return [];
}

function saveResetTokens(tokens: ResetToken[]) {
  const dir = path.dirname(RESET_TOKENS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(RESET_TOKENS_FILE, JSON.stringify(tokens, null, 2));
}

function loadUsers(): any[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function saveUsers(users: any[]) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Rate limit: max 3 reset requests per email per hour
const resetAttempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { action, email, token, newPassword } = await req.json();

    // ========== REQUEST RESET ==========
    if (action === "request") {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const normalizedEmail = email.toLowerCase().trim();

      // Rate limit
      const now = Date.now();
      const attempts = resetAttempts.get(normalizedEmail);
      if (attempts && attempts.resetAt > now && attempts.count >= 3) {
        // Don't reveal rate limit — just say email sent
        return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
      }

      if (!attempts || attempts.resetAt < now) {
        resetAttempts.set(normalizedEmail, { count: 1, resetAt: now + 60 * 60 * 1000 });
      } else {
        attempts.count++;
      }

      const users = loadUsers();
      const user = users.find((u: any) => u.email === normalizedEmail);

      // Always return success to prevent email enumeration
      if (!user) {
        return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const tokens = loadResetTokens();

      // Remove any existing tokens for this email
      const filtered = tokens.filter((t) => t.email !== normalizedEmail);
      filtered.push({
        email: normalizedEmail,
        token: crypto.createHash("sha256").update(resetToken).digest("hex"), // Store hash, not plain token
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      });
      saveResetTokens(filtered);

      // Send email
      const baseUrl = req.headers.get("origin") || "https://zoltai.org";
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

      if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "noreply@zoltai.org",
          to: normalizedEmail,
          subject: "Reset Your Zoltai Password",
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #fff; font-size: 24px; margin-bottom: 16px;">Password Reset</h1>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">
                You requested a password reset for your Zoltai account. Click the button below to set a new password.
              </p>
              <a href="${resetUrl}" style="display: inline-block; margin: 24px 0; padding: 12px 32px; background: linear-gradient(135deg, #9333ea, #06b6d4); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Reset Password
              </a>
              <p style="color: #71717a; font-size: 12px; line-height: 1.6;">
                This link expires in 30 minutes. If you didn't request this, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #27272a; margin: 24px 0;">
              <p style="color: #52525b; font-size: 11px;">Zoltai — Discover the Best AI Tools</p>
            </div>
          `,
        });
      }

      return NextResponse.json({ success: true, message: "If an account exists, a reset link has been sent." });
    }

    // ========== RESET PASSWORD ==========
    if (action === "reset") {
      if (!token || !email || !newPassword) {
        return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
      }

      // Validate new password
      if (newPassword.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      if (!/[A-Z]/.test(newPassword)) return NextResponse.json({ error: "Password must contain an uppercase letter" }, { status: 400 });
      if (!/[a-z]/.test(newPassword)) return NextResponse.json({ error: "Password must contain a lowercase letter" }, { status: 400 });
      if (!/[0-9]/.test(newPassword)) return NextResponse.json({ error: "Password must contain a number" }, { status: 400 });

      const normalizedEmail = email.toLowerCase().trim();
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const tokens = loadResetTokens();
      const resetEntry = tokens.find(
        (t) => t.email === normalizedEmail && t.token === tokenHash && t.expiresAt > Date.now()
      );

      if (!resetEntry) {
        return NextResponse.json(
          { error: "Invalid or expired reset link. Please request a new one." },
          { status: 400 }
        );
      }

      // Update password
      const users = loadUsers();
      const user = users.find((u: any) => u.email === normalizedEmail);
      if (!user) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      const salt = crypto.randomBytes(32).toString("hex");
      const hash = crypto.scryptSync(newPassword, salt, 64).toString("hex");
      user.passwordHash = hash;
      user.salt = salt;
      saveUsers(users);

      // Remove used token
      const remainingTokens = tokens.filter((t) => t.email !== normalizedEmail);
      saveResetTokens(remainingTokens);

      return NextResponse.json({ success: true, message: "Password reset successfully. You can now log in." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Password reset error:", err);
    return NextResponse.json({ error: "An error occurred. Please try again." }, { status: 500 });
  }
}
