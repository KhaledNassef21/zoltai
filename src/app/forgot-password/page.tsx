"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const data = await res.json();

      if (data.success) {
        setSent(true);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch {
      setError("Network error. Please try again.");
    }

    setLoading(false);
  }

  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-3">Check Your Email</h1>
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            If an account exists for <strong className="text-zinc-300">{email}</strong>,
            we&apos;ve sent a password reset link. It expires in 30 minutes.
          </p>
          <p className="text-xs text-zinc-600 mb-8">
            Didn&apos;t receive it? Check your spam folder or try again.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="px-5 py-2.5 rounded-lg border border-card-border text-zinc-400 text-sm hover:text-white hover:border-zinc-600 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-bold gradient-text">Zoltai</span>
          </Link>
          <h1 className="text-2xl font-bold mt-4">Forgot Password?</h1>
          <p className="text-sm text-zinc-500 mt-2">
            Enter your email and we&apos;ll send you a reset link
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
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold disabled:opacity-50 hover:opacity-90 transition-all"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Remember your password?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
