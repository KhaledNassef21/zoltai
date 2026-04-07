"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passedChecks = Object.values(passwordChecks).filter(Boolean).length;

  if (!token || !email) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-3">Invalid Reset Link</h1>
          <p className="text-sm text-zinc-400 mb-6">
            This password reset link is invalid or has expired.
          </p>
          <Link
            href="/forgot-password"
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">Password Reset!</h1>
          <p className="text-sm text-zinc-400 mb-6">
            Your password has been successfully reset. You can now log in.
          </p>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", token, email, newPassword: password }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Reset failed");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold gradient-text">Zoltai</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Set New Password</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Enter a new password for <strong className="text-zinc-300">{email}</strong>
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 sm:p-8 rounded-2xl border border-card-border bg-card-bg space-y-5"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
                placeholder="Min 8 chars, uppercase, lowercase, number"
                className="w-full px-4 py-3 pr-12 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>

            {password.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
                {[
                  { label: "8+ characters", ok: passwordChecks.length },
                  { label: "Uppercase letter", ok: passwordChecks.uppercase },
                  { label: "Lowercase letter", ok: passwordChecks.lowercase },
                  { label: "Number", ok: passwordChecks.number },
                ].map((check) => (
                  <span
                    key={check.label}
                    className={`flex items-center gap-1 ${check.ok ? "text-emerald-400" : "text-zinc-600"}`}
                  >
                    {check.ok ? "✓" : "○"} {check.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || passedChecks < 4}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <p className="text-zinc-500">Loading...</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
