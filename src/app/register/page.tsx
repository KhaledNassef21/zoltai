"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "register", name, email, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        router.push("/profile");
        router.refresh();
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Network error");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="gradient-text">Join Zoltai</span>
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Create your free account to unlock premium AI money-making guides
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl border border-card-border bg-card-bg space-y-4"
        >
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Min 6 characters"
              className="w-full px-4 py-3 rounded-lg bg-background border border-card-border text-foreground placeholder:text-zinc-600 focus:outline-none focus:border-accent/50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-semibold disabled:opacity-50 transition-colors hover:opacity-90"
          >
            {loading ? "Creating account..." : "Create Free Account"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-accent-light hover:underline">
              Sign in
            </Link>
          </p>
        </form>

        <p className="text-xs text-zinc-600 text-center mt-4">
          By creating an account you agree to our terms of service.
        </p>
      </div>
    </div>
  );
}
